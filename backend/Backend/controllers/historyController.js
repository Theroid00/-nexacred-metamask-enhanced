import History from "../modals/History.js";
import User from "../modals/User.js";

// Create a new borrow/lend request
export const createRequest = async (req, res) => {
  try {
    const { borrower, lender, amount, type, message } = req.body;
    if (!borrower || !lender || !amount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const history = new History({ borrower, lender, amount, type, message });
    await history.save();
    res.status(201).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all requests for a user (as lender or borrower)
export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await History.find({
      $or: [ { borrower: userId }, { lender: userId } ]
    })
      .populate('borrower', 'username firstName lastName')
      .populate('lender', 'username firstName lastName')
      .sort({ requestDate: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update request status (approve/reject/complete)
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const history = await History.findByIdAndUpdate(
      id,
      { status, responseDate: new Date() },
      { new: true }
    );
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
