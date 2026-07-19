import supabase from '../config/supabaseClient.js';
import mockStore from '../config/mockStore.js';

// Helper to map DB history to Frontend format
const mapHistoryToCamelCase = (h) => {
  if (!h) return null;
  const historyId = h.id || h._id;
  return {
    _id: historyId,
    borrower: h.borrower ? {
      _id: h.borrower.id || h.borrower._id,
      username: h.borrower.username,
      firstName: h.borrower.first_name,
      lastName: h.borrower.last_name
    } : null,
    lender: h.lender ? {
      _id: h.lender.id || h.lender._id,
      username: h.lender.username,
      firstName: h.lender.first_name,
      lastName: h.lender.last_name
    } : null,
    amount: parseFloat(h.amount),
    type: h.type,
    status: h.status,
    requestDate: h.request_date,
    responseDate: h.response_date,
    message: h.message
  };
};

// Create a new borrow/lend request
export const createRequest = async (req, res) => {
  try {
    const { borrower, lender, amount, type, message } = req.body;
    if (!borrower || !lender || !amount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (borrower === lender) {
      return res.status(400).json({ error: "Borrower and lender cannot be the same user." });
    }

    // Ensure the current user is actually one of the parties in the request (Spoofing Prevention)
    if (req.user.userId !== borrower && req.user.userId !== lender) {
      return res.status(403).json({ error: "You can only create loan requests where you are the borrower or lender." });
    }

    // Sanitize message string to prevent XSS injection
    const sanitizedMessage = typeof message === 'string' 
      ? message.replace(/</g, "&lt;").replace(/>/g, "&gt;") 
      : "";

    let newHistory;
    try {
      const { data: created, error: insertError } = await supabase
        .from('history')
        .insert([{
          borrower,
          lender,
          amount: parseFloat(amount),
          type,
          message: sanitizedMessage
        }])
        .select(`
          id, amount, type, status, request_date, response_date, message,
          borrower:users!borrower(id, username, first_name, last_name),
          lender:users!lender(id, username, first_name, last_name)
        `)
        .single();

      if (insertError) throw insertError;
      newHistory = created;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Creating history record in Local MockStore:", dbErr.message);
      const borrowerUser = mockStore.findUserById(borrower);
      const lenderUser = mockStore.findUserById(lender);
      newHistory = mockStore.addHistory({
        borrower: borrowerUser ? { id: borrowerUser.id, username: borrowerUser.username, first_name: borrowerUser.first_name, last_name: borrowerUser.last_name } : null,
        lender: lenderUser ? { id: lenderUser.id, username: lenderUser.username, first_name: lenderUser.first_name, last_name: lenderUser.last_name } : null,
        user_id: borrower,
        amount: parseFloat(amount),
        type,
        status: 'pending',
        request_date: new Date().toISOString(),
        message: sanitizedMessage
      });
    }

    res.status(201).json({ success: true, history: mapHistoryToCamelCase(newHistory) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get all requests for a user (as lender or borrower)
export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure users can only view their own history (IDOR Prevention)
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: "You are not authorized to view this user's history." });
    }

    let history;
    try {
      const { data: fetched, error: fetchError } = await supabase
        .from('history')
        .select(`
          id, amount, type, status, request_date, response_date, message,
          borrower:users!borrower(id, username, first_name, last_name),
          lender:users!lender(id, username, first_name, last_name)
        `)
        .or(`borrower.eq.${userId},lender.eq.${userId}`)
        .order('request_date', { ascending: false });

      if (fetchError) throw fetchError;
      history = fetched;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Fetching history from Local MockStore:", dbErr.message);
      history = mockStore.getHistoryByUserId(userId);
    }

    res.json({ success: true, history: history.map(mapHistoryToCamelCase) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Fetch existing record to verify authorization (IDOR Prevention)
    let existingRecord;
    try {
      const { data, error } = await supabase
        .from('history')
        .select('borrower, lender, status')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      existingRecord = data;
    } catch (dbErr) {
      existingRecord = mockStore.history.find(h => h.id === id || h._id === id);
    }

    if (!existingRecord) {
      return res.status(404).json({ error: "History record not found" });
    }
    
    // Normalize IDs for comparison
    const recordLenderId = existingRecord.lender?.id || existingRecord.lender?._id || existingRecord.lender;
    const recordBorrowerId = existingRecord.borrower?.id || existingRecord.borrower?._id || existingRecord.borrower;

    if (status === 'approved' || status === 'rejected') {
      if (req.user.userId !== recordLenderId) {
        return res.status(403).json({ error: "Only the lender can approve or reject the loan." });
      }
    } else if (status === 'cancelled') {
      if (req.user.userId !== recordBorrowerId) {
        return res.status(403).json({ error: "Only the borrower can cancel the loan request." });
      }
    } else if (status === 'completed') {
       // Completed is typically set by blockchain event sync, but we protect it just in case
       if (req.user.userId !== recordBorrowerId && req.user.userId !== recordLenderId) {
         return res.status(403).json({ error: "Not authorized to update status." });
       }
    }

    let updatedHistory;
    try {
      const { data: updated, error: updateError } = await supabase
        .from('history')
        .update({ status, response_date: new Date().toISOString() })
        .eq('id', id)
        .select(`
          id, amount, type, status, request_date, response_date, message,
          borrower:users!borrower(id, username, first_name, last_name),
          lender:users!lender(id, username, first_name, last_name)
        `)
        .maybeSingle();

      if (updateError) throw updateError;
      updatedHistory = updated;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Updating history record in Local MockStore:", dbErr.message);
      const item = mockStore.history.find(h => h.id === id || h._id === id);
      if (item) {
        item.status = status;
        item.response_date = new Date().toISOString();
        updatedHistory = item;
      }
    }

    if (!updatedHistory) return res.status(404).json({ error: "History record not found" });

    res.json({ success: true, history: mapHistoryToCamelCase(updatedHistory) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
