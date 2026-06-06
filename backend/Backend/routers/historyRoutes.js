import express from "express";
import {
  createRequest,
  getUserHistory,
  updateRequestStatus
} from "../controllers/historyController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All history routes require authentication
router.post("/", authenticateToken, createRequest);
router.get("/user/:userId", authenticateToken, getUserHistory);
router.patch("/:id/status", authenticateToken, updateRequestStatus);

export default router;
