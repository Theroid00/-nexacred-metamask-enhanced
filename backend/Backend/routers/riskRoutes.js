import express from "express";
import { getRiskAnalysis } from "../controllers/riskAnalyzerController.js";
import { syncUserEvents } from "../controllers/blockchainSyncController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Both endpoints require a valid JWT
router.get("/:walletAddress", authenticateToken, getRiskAnalysis);
router.get("/sync/:walletAddress", authenticateToken, syncUserEvents);

export default router;
