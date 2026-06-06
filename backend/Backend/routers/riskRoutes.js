import express from "express";
import { getRiskAnalysis } from "../controllers/riskAnalyzerController.js";

const router = express.Router();

router.get("/:walletAddress", getRiskAnalysis);

export default router;
