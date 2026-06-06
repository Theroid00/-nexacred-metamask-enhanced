// /routes/userRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  walletAuth,
  getCurrentUser
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public auth routes (no token required)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/wallet-auth", walletAuth);

// Protected user data routes
router.get("/", authenticateToken, getUsers);
router.get("/me", authenticateToken, getCurrentUser);
router.get("/:id", authenticateToken, getUserById);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, deleteUser);

export default router;
