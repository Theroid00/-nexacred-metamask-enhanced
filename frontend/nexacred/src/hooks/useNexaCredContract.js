import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { NEXACRED_ABI, NEXACRED_CONTRACT_ADDRESSES } from '../contracts/NexaCredContract';

export const useNexaCredContract = (signer, chainId) => {
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  // Get contract address for current chainId
  const getContractAddress = useCallback(() => {
    return NEXACRED_CONTRACT_ADDRESSES[chainId] || NEXACRED_CONTRACT_ADDRESSES['default'];
  }, [chainId]);

  // Helper to instantiate contract with signer
  const getContract = useCallback(() => {
    if (!signer) throw new Error("Wallet not connected or signer unavailable");
    const address = getContractAddress();
    return new ethers.Contract(address, NEXACRED_ABI, signer);
  }, [signer, getContractAddress]);

  // Request Loan On-Chain
  const requestLoanOnChain = useCallback(async ({ amountETH, interestRatePercent, durationDays, purpose }) => {
    try {
      setTxLoading(true);
      setTxError(null);
      setTxHash(null);

      const contract = getContract();
      const amountWei = ethers.parseEther(String(amountETH));
      const rateBasisPoints = Math.round(parseFloat(interestRatePercent) * 100);

      const tx = await contract.requestLoan(
        amountWei,
        rateBasisPoints,
        durationDays || 30,
        purpose || 'Personal Loan'
      );

      setTxHash(tx.hash);
      const receipt = await tx.wait();
      setTxLoading(false);
      return { success: true, hash: tx.hash, receipt };
    } catch (err) {
      console.error("On-chain requestLoan error:", err);
      const msg = err.reason || err.message || "On-chain transaction failed";
      setTxError(msg);
      setTxLoading(false);
      return { success: false, error: msg };
    }
  }, [getContract]);

  // Fund Loan On-Chain (payable - transfers ETH to borrower)
  const fundLoanOnChain = useCallback(async ({ loanId, amountETH }) => {
    try {
      setTxLoading(true);
      setTxError(null);
      setTxHash(null);

      const contract = getContract();
      const amountWei = ethers.parseEther(String(amountETH));

      const tx = await contract.fundLoan(loanId, { value: amountWei });
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      setTxLoading(false);
      return { success: true, hash: tx.hash, receipt };
    } catch (err) {
      console.error("On-chain fundLoan error:", err);
      const msg = err.reason || err.message || "On-chain transaction failed";
      setTxError(msg);
      setTxLoading(false);
      return { success: false, error: msg };
    }
  }, [getContract]);

  // Repay Loan On-Chain (payable)
  const repayLoanOnChain = useCallback(async ({ loanId, amountETH }) => {
    try {
      setTxLoading(true);
      setTxError(null);
      setTxHash(null);

      const contract = getContract();
      const amountWei = ethers.parseEther(String(amountETH));

      const tx = await contract.repayLoan(loanId, { value: amountWei });
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      setTxLoading(false);
      return { success: true, hash: tx.hash, receipt };
    } catch (err) {
      console.error("On-chain repayLoan error:", err);
      const msg = err.reason || err.message || "On-chain transaction failed";
      setTxError(msg);
      setTxLoading(false);
      return { success: false, error: msg };
    }
  }, [getContract]);

  // Withdraw Lender Funds On-Chain
  const withdrawFundsOnChain = useCallback(async () => {
    try {
      setTxLoading(true);
      setTxError(null);
      setTxHash(null);

      const contract = getContract();
      const tx = await contract.withdrawFunds();
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      setTxLoading(false);
      return { success: true, hash: tx.hash, receipt };
    } catch (err) {
      console.error("On-chain withdrawFunds error:", err);
      const msg = err.reason || err.message || "On-chain transaction failed";
      setTxError(msg);
      setTxLoading(false);
      return { success: false, error: msg };
    }
  }, [getContract]);

  // Cancel Loan Request On-Chain
  const cancelLoanOnChain = useCallback(async (loanId) => {
    try {
      setTxLoading(true);
      setTxError(null);
      setTxHash(null);

      const contract = getContract();
      const tx = await contract.cancelLoan(loanId);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      setTxLoading(false);
      return { success: true, hash: tx.hash, receipt };
    } catch (err) {
      console.error("On-chain cancelLoan error:", err);
      const msg = err.reason || err.message || "On-chain transaction failed";
      setTxError(msg);
      setTxLoading(false);
      return { success: false, error: msg };
    }
  }, [getContract]);

  return {
    contractAddress: getContractAddress(),
    txLoading,
    txHash,
    txError,
    requestLoanOnChain,
    fundLoanOnChain,
    repayLoanOnChain,
    withdrawFundsOnChain,
    cancelLoanOnChain
  };
};

export default useNexaCredContract;
