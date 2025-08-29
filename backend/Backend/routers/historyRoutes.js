import express from "express";
import {
  createRequest,
  getUserHistory,
  updateRequestStatus
} from "../controllers/historyController.js";

const router = express.Router();

// Create a new borrow/lend request
router.post("/", createRequest);

// Get all history for a user (as lender or borrower)
router.get("/user/:userId", getUserHistory);

// Update request status (approve/reject/complete)
router.patch("/:id/status", updateRequestStatus);

export default router;
