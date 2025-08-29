import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  borrower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["borrow", "lend"], required: true }, // perspective of the user
  status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
  requestDate: { type: Date, default: Date.now },
  responseDate: { type: Date },
  // Optionally, you can add a message or notes field
  message: { type: String }
});

export default mongoose.model("History", historySchema);