import express from "express";
import { getRiskAnalysis } from "../controllers/riskAnalyzerController.js";
import { syncUserEvents } from "../controllers/blockchainSyncController.js";

const router = express.Router();

router.get("/:walletAddress", getRiskAnalysis);
router.get("/sync/:walletAddress", syncUserEvents);

export default router;
