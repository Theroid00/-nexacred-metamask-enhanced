import express from "express";
import supabase from "../config/supabaseClient.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Seed data for the RAG guidelines table
const SEED_GUIDELINES = [
  {
    title: "What is a Credit Score?",
    content: "A credit score is a numerical representation of your creditworthiness, typically ranging from 300 to 850. It is calculated based on: payment history (35%), credit utilization (30%), length of credit history (15%), types of credit accounts (10%), and recent credit inquiries (10%). Scores above 750 are considered excellent, 700-749 good, 650-699 fair, and below 650 poor.",
    category: "credit_basics"
  },
  {
    title: "How to Improve Your Credit Score",
    content: "To improve your credit score: 1) Pay all bills on time consistently — payment history is the most influential factor. 2) Keep credit utilization below 30% of your total limit. 3) Avoid closing old credit accounts as they contribute to your credit history length. 4) Limit new credit applications since each hard inquiry can lower your score temporarily. 5) Monitor your credit report regularly for errors and dispute any inaccuracies. 6) Diversify your credit mix with different types of accounts.",
    category: "credit_improvement"
  },
  {
    title: "How NexaCred Lending Works",
    content: "NexaCred is a peer-to-peer lending platform that combines blockchain technology with traditional credit scoring. Borrowers connect their MetaMask wallet and apply for a loan by specifying amount, purpose, and duration. Their credit score and wallet transaction history are analyzed to determine risk. Approved loans are funded directly by lenders via smart contracts on the Ethereum blockchain. All transactions are recorded immutably on-chain for full transparency.",
    category: "platform"
  },
  {
    title: "Blockchain Security in DeFi Lending",
    content: "Blockchain technology provides several security benefits in DeFi lending: 1) Immutability — loan agreements recorded on-chain cannot be altered. 2) Transparency — all transactions are publicly verifiable. 3) Smart contracts — code-enforced agreements execute automatically without intermediaries. 4) Decentralization — no single point of failure. 5) Wallet-based identity — MetaMask authentication uses cryptographic signatures, proving wallet ownership without passwords.",
    category: "blockchain"
  },
  {
    title: "Loan Application Requirements",
    content: "For a loan application on NexaCred you need: 1) A MetaMask wallet with a verified cryptographic signature. 2) Government-issued ID (PAN, Aadhaar) for KYC compliance. 3) Proof of income or ITR filings for the past 2 years. 4) Bank account statements for the past 6 months. 5) A minimum credit score of 600. 6) Purpose of loan documentation. Applications are reviewed using blockchain on-chain activity and traditional credit metrics.",
    category: "loan_application"
  },
  {
    title: "Understanding Loan Interest Rates",
    content: "Interest rates on NexaCred are dynamic and based on your risk profile. Low-risk borrowers (credit score >750) typically receive rates between 8-12% APR. Medium-risk (650-750) receive 12-18% APR. High-risk borrowers (below 650) may not qualify or face rates above 18%. Rates are locked into the smart contract at the time of loan funding and cannot change during the loan term.",
    category: "interest_rates"
  },
  {
    title: "DeFi Risk and Financial Health",
    content: "Financial health in DeFi refers to the stability of your on-chain activity and traditional metrics. Key DeFi risk indicators include: wallet age (older is more trusted), transaction volume, interactions with reputable protocols (Uniswap, Aave, Compound), and absence of interactions with flagged addresses. A healthy financial profile also includes positive cash flow, emergency savings of 3-6 months' expenses, and a debt-to-income ratio below 36%.",
    category: "financial_health"
  },
  {
    title: "What Happens When a Loan Defaults",
    content: "If a borrower fails to repay a NexaCred loan by the due date, the loan is marked as 'defaulted' on the smart contract. This triggers: 1) A significant negative impact on the borrower's on-chain credit score. 2) The lender is notified and may seek recovery through dispute resolution. 3) The borrower is flagged in the NexaCred risk system and may be barred from future loans. 4) The default is permanently recorded on the blockchain, visible to all future lenders.",
    category: "loan_default"
  }
];

/**
 * POST /api/guidelines/seed
 * Seeds the guidelines table with RAG knowledge base entries.
 * Requires authentication. Skips rows with duplicate titles.
 */
router.post("/seed", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guidelines")
      .upsert(SEED_GUIDELINES, { onConflict: "title", ignoreDuplicates: true })
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Seeded ${data?.length ?? 0} guideline entries into the RAG knowledge base.`,
      inserted: data
    });
  } catch (err) {
    console.error("Guideline seed error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/guidelines
 * List all guidelines (authenticated)
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("guidelines")
      .select("id, title, category, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
