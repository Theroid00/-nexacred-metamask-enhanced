import { ethers } from "ethers";
import dotenv from "dotenv";
import supabase from "../config/supabaseClient.js";

dotenv.config();

// Simplified ABI for the NexaCred contract events and state functions
const NEXACRED_ABI = [
  "event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, string purpose)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount)",
  "event LoanCompleted(uint256 indexed loanId, address indexed borrower)",
  "event LoanDefaulted(uint256 indexed loanId, uint256 lossAmount)",
  "function updateUserCreditScore(address user, uint256 newScore) external",
  "function getLoan(uint256 loanId) external view returns (tuple(uint256 id, address borrower, address lender, uint256 amount, uint256 interestRate, uint256 durationDays, uint256 creditScore, string purpose, uint8 status, uint256 createdAt, uint256 fundedAt, uint256 dueDate, uint256 totalOwed, uint256 amountRepaid))"
];

// Helper to get active ethers contract instance
const getContract = () => {
  const providerUrl = process.env.WEB3_PROVIDER_URL;
  const contractAddress = process.env.NEXACRED_CONTRACT_ADDRESS;

  if (!providerUrl || !contractAddress) {
    return { contract: null, provider: null };
  }

  try {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contract = new ethers.Contract(contractAddress, NEXACRED_ABI, provider);
    return { contract, provider };
  } catch (error) {
    console.error("Failed to initialize ethers provider/contract:", error.message);
    return { contract: null, provider: null };
  }
};

import mockStore from "../config/mockStore.js";

// Map blockchain numeric LoanStatus enum to database status string
const mapBlockchainStatus = (statusNum) => {
  const statusMap = {
    0: "pending",   // PENDING
    1: "approved",  // FUNDED
    2: "completed", // REPAID
    3: "defaulted", // DEFAULTED
    4: "rejected"   // CANCELLED
  };
  return statusMap[statusNum] || "pending";
};

/**
 * On-demand event syncer: queries smart contract events for a wallet
 * and synchronizes the Supabase 'history' table
 */
export const syncUserEvents = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address format" });
    }

    // Verify requesting user owns or matches the requested walletAddress (Authorization check)
    if (req.user && req.user.walletAddress && req.user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: "Access denied. You can only sync your own wallet events." });
    }

    const { contract } = getContract();
    if (!contract) {
      return res.status(503).json({ 
        success: false, 
        message: "Blockchain provider or contract address is not configured. Sync skipped." 
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    console.log(`Starting on-chain event sync for address: ${normalizedAddress}`);

    // Query active database users to fetch UUID mappings for borrower and lender
    const addressToIdMap = {};
    try {
      const { data: dbUsers, error: usersError } = await supabase
        .from('users')
        .select('id, wallet_address');
      if (usersError) throw usersError;
      dbUsers.forEach(u => {
        if (u.wallet_address) {
          addressToIdMap[u.wallet_address.toLowerCase()] = u.id;
        }
      });
    } catch (dbErr) {
      console.warn("Supabase unreachable. Fetching users from Local MockStore:", dbErr.message);
      Array.from(mockStore.users.values()).forEach(u => {
        if (u.wallet_address) {
          addressToIdMap[u.wallet_address.toLowerCase()] = u.id;
        }
      });
    }

    // 1. Fetch LoanRequested events where user is borrower
    const requestedFilter = contract.filters.LoanRequested(null, walletAddress);
    const requestedEvents = await contract.queryFilter(requestedFilter, -5000); // Scan last 5000 blocks

    for (const event of requestedEvents) {
      const loanId = Number(event.args[0]);
      const borrowerAddr = event.args[1].toLowerCase();
      const amount = parseFloat(ethers.formatEther(event.args[2]));
      const purpose = event.args[3];

      const borrowerId = addressToIdMap[borrowerAddr];
      if (!borrowerId) continue; // Borrower not registered in DB

      // Fetch actual current status from blockchain to capture funding/repayments
      const blockchainLoan = await contract.getLoan(loanId);
      const blockchainStatus = mapBlockchainStatus(Number(blockchainLoan.status));
      const lenderAddr = blockchainLoan.lender.toLowerCase();
      const lenderId = addressToIdMap[lenderAddr] || null;

      // Check if record exists
      const { data: existingRecord } = await supabase
        .from('history')
        .select('id')
        .eq('blockchain_loan_id', loanId)
        .maybeSingle();

      if (!existingRecord) {
        // Insert new synced record
        const { error: insertError } = await supabase
          .from('history')
          .insert([{
            borrower: borrowerId,
            lender: lenderId || null, // Null if unfunded on-chain yet
            amount: amount,
            type: 'borrow',
            status: blockchainStatus,
            message: purpose,
            blockchain_loan_id: loanId
          }]);

        if (insertError) console.error(`Failed to insert synced loan ${loanId}:`, insertError.message);
      } else {
        // Update existing status
        const updateData = { status: blockchainStatus };
        if (lenderId) {
          updateData.lender = lenderId;
        }
        
        await supabase
          .from('history')
          .update(updateData)
          .eq('blockchain_loan_id', loanId);
      }
    }

    // 2. Fetch LoanFunded events where user is lender
    const fundedFilter = contract.filters.LoanFunded(null, walletAddress);
    const fundedEvents = await contract.queryFilter(fundedFilter, -5000);

    for (const event of fundedEvents) {
      const loanId = Number(event.args[0]);
      const lenderAddr = event.args[1].toLowerCase();
      const borrowerAddr = event.args[2].toLowerCase();

      const lenderId = addressToIdMap[lenderAddr];
      const borrowerId = addressToIdMap[borrowerAddr];

      if (!lenderId || !borrowerId) continue;

      const blockchainLoan = await contract.getLoan(loanId);
      const blockchainStatus = mapBlockchainStatus(Number(blockchainLoan.status));

      await supabase
        .from('history')
        .update({
          lender: lenderId,
          status: blockchainStatus
        })
        .eq('blockchain_loan_id', loanId);
    }

    res.json({ success: true, message: "On-chain transaction events synchronized successfully." });
  } catch (error) {
    console.error("Blockchain sync error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Oracle Helper: signs and broadcasts a transaction to push 
 * recalculated credit scores to the smart contract registry
 */
export const pushScoreToChain = async (userWalletAddress, score) => {
  const providerUrl = process.env.WEB3_PROVIDER_URL;
  const contractAddress = process.env.NEXACRED_CONTRACT_ADDRESS;
  const adminPrivateKey = process.env.PRIVATE_KEY;

  if (!providerUrl || !contractAddress || !adminPrivateKey) {
    console.log("On-chain Oracle details not configured. Score update kept in DB.");
    return { success: false, reason: "Unconfigured Oracle environment" };
  }

  try {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, NEXACRED_ABI, wallet);

    console.log(`Oracle pushing credit score update: ${userWalletAddress} -> ${score}`);
    const tx = await contract.updateUserCreditScore(userWalletAddress, score);
    const receipt = await tx.wait();
    
    console.log(`Score update confirmed on-chain. TxHash: ${receipt.hash}`);
    return { success: true, txHash: receipt.hash };
  } catch (error) {
    console.error("Failed to push credit score to blockchain:", error.message);
    return { success: false, error: error.message };
  }
};
