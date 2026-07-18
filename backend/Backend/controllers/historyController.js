import supabase from '../config/supabaseClient.js';
import mockStore from '../config/mockStore.js';

// Helper to map DB history to Frontend format
const mapHistoryToCamelCase = (h) => {
  if (!h) return null;
  return {
    _id: h.id,
    borrower: h.borrower ? {
      _id: h.borrower.id,
      username: h.borrower.username,
      firstName: h.borrower.first_name,
      lastName: h.borrower.last_name
    } : null,
    lender: h.lender ? {
      _id: h.lender.id,
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

    let newHistory;
    try {
      const { data: created, error: insertError } = await supabase
        .from('history')
        .insert([{
          borrower,
          lender,
          amount: parseFloat(amount),
          type,
          message
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
      newHistory = mockStore.addHistory({
        borrower: borrowerUser ? { id: borrowerUser.id, username: borrowerUser.username, first_name: borrowerUser.first_name, last_name: borrowerUser.last_name } : null,
        user_id: borrower,
        amount: parseFloat(amount),
        type,
        status: 'pending',
        request_date: new Date().toISOString(),
        message
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

// Update request status (approve/reject/complete)
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: updatedHistory, error: updateError } = await supabase
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
    if (!updatedHistory) return res.status(404).json({ error: "History record not found" });

    res.json({ success: true, history: mapHistoryToCamelCase(updatedHistory) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
