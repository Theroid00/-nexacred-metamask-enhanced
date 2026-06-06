import 'dotenv/config';
import express from "express";
import cors from "cors";
import userRoutes from "../backend/Backend/routers/userRoutes.js";
import historyRoutes from "../backend/Backend/routers/historyRoutes.js";
import chatbotRoutes from "../backend/Backend/routers/chatbotRoutes.js";
import riskRoutes from "../backend/Backend/routers/riskRoutes.js";
import guidelineRoutes from "../backend/Backend/routers/guidelineRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Main entry check
app.get("/api", (req, res) => {
  res.json({
    status: "online",
    service: "NexaCred Unified Serverless API",
    version: "2.0.0"
  });
});

// Register routers
app.use("/api/users", userRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/risk-analysis", riskRoutes);
app.use("/api/guidelines", guidelineRoutes);

// Export Express app for Vercel Serverless Functions
export default app;

