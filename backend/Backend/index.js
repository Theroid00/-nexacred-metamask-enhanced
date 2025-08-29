import 'dotenv/config';
import connectDB from "./config/db.js";
import express from "express";
import userRoutes from "./routers/userRoutes.js";
import historyRoutes from "./routers/historyRoutes.js";
// import creditProfileRoutes from './routers/creditProfileRoutes.js';
import { authenticateToken } from './middleware/auth.js';
//import guidelineRoutes from "./routes/guidelineRoutes.js";


connectDB();

const app = express();

//app.use("/api/guidelines", guidelineRoutes);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/users", userRoutes);
app.use("/api/history", historyRoutes);
// app.use("/api/credit-profiles", authenticateToken, creditProfileRoutes);
const PORT =  5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
