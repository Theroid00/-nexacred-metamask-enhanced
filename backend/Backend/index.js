import 'dotenv/config';
import express from "express";
import cors from "cors";
import userRoutes from "./routers/userRoutes.js";
import historyRoutes from "./routers/historyRoutes.js";
import chatbotRoutes from "./routers/chatbotRoutes.js";
import riskRoutes from "./routers/riskRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/risk-analysis", riskRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
