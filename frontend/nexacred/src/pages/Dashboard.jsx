import React, { useState, useEffect } from "react";
import bgImg from "../assets/20250829_0408_NexaCred Logo Design_remix_01k3sd5z5medt9v3dy7fhwq7pv.png";
import { MessageCircle, X } from "lucide-react";

export default function Dashboard({ user, onUserUpdate }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(user || {});
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Borrow modal state
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowModal, setBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({ lenderUsername: '', amount: '' });
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState('');
  const [borrowError, setBorrowError] = useState('');

  // Lender notification state
  const [pendingRequests, setPendingRequests] = useState(0);
  const [lendingRequests, setLendingRequests] = useState([]);
  const [showLendingModal, setShowLendingModal] = useState(false);


  // Fetch pending requests for lender notification
  useEffect(() => {
    if (!user) return;
    fetch(`/api/history/user/${user._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const pending = data.history.filter(h => h.lender && h.lender._id === user._id && h.status === 'pending');
          setPendingRequests(pending.length);
          setLendingRequests(pending);
        }
      });
  }, [user, borrowSuccess]);

  if (!user) return <div className="text-center p-8 font-inter">Loading...</div>;

  // Open edit modal and prefill form
  const handleEdit = () => {
    setEditForm(user);
    setEditOpen(true);
    setTimeout(() => setShowModal(true), 10); // trigger animation
  };

  // Handle form changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Save changes
  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setTimeout(() => setEditOpen(false), 200);
        if (onUserUpdate) onUserUpdate(data.user);
        window.location.reload(); // quick update for now
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Update error');
    } finally {
      setSaving(false);
    }
  };

  // Close modal with animation
  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setEditOpen(false), 200);
  };

  // Borrow modal handlers
  const handleBorrow = () => {
    setBorrowForm({ lenderUsername: '', amount: '' });
    setBorrowOpen(true);
    setTimeout(() => setBorrowModal(true), 10);
    setBorrowSuccess('');
    setBorrowError('');
  };
  const handleBorrowChange = (e) => {
    const { name, value } = e.target;
    setBorrowForm(f => ({ ...f, [name]: value }));
  };
  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setBorrowLoading(true);
    setBorrowSuccess('');
    setBorrowError('');
    try {
      // Find lender by username (simple fetch)
      const resLender = await fetch(`/api/users?username=${borrowForm.lenderUsername}`);
      const dataLender = await resLender.json();
      if (!resLender.ok || !dataLender.user) {
        setBorrowError('Lender not found');
        setBorrowLoading(false);
        return;
      }
      const lenderId = dataLender.user._id;
      // Create borrow request
      const res = await fetch('/api/history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower: user._id,
          lender: lenderId,
          amount: borrowForm.amount,
          type: 'borrow',
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBorrowSuccess('Request sent!');
        setBorrowOpen(false);
        setTimeout(() => setBorrowModal(false), 200);
      } else {
        setBorrowError(data.error || 'Request failed');
      }
    } catch (err) {
      setBorrowError('Error sending request');
    } finally {
      setBorrowLoading(false);
    }
  };
  const handleCloseBorrow = () => {
    setBorrowModal(false);
    setTimeout(() => setBorrowOpen(false), 200);
  };

  // Lending requests modal
  const handleShowLendingModal = () => setShowLendingModal(true);
  const handleCloseLendingModal = () => setShowLendingModal(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-inter">
      {/* Left Sidebar */}
      <aside className="w-[30%] bg-gray-900/80 backdrop-blur-lg p-10 flex flex-col gap-6 border-r border-gray-800 min-h-screen shadow-xl relative z-10">
        <h2 className="text-4xl font-extrabold mb-6 tracking-wide bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          User Profile
        </h2>

        <div className="space-y-4 text-lg leading-relaxed text-gray-200">
          <div><span className="font-semibold text-indigo-300">👤 Username:</span> {user.username}</div>
          <div><span className="font-semibold text-indigo-300">📝 Name:</span> {user.firstName} {user.middleName} {user.lastName}</div>
          <div><span className="font-semibold text-indigo-300">🌍 Country:</span> {user.country}</div>
          <div><span className="font-semibold text-indigo-300">💼 Employment:</span> {user.employmentStatus}</div>
          <div><span className="font-semibold text-indigo-300">💰 Income:</span> {user.monthlyIncomeRange}</div>
          <div><span className="font-semibold text-indigo-300">🏦 Bank Account:</span> {user.hasBankAccount ? "Yes ✅" : "No ❌"}</div>
          <div><span className="font-semibold text-indigo-300">💳 Credit Account:</span> {user.hasCreditAccounts ? "Yes ✅" : "No ❌"}</div>
          <div><span className="font-semibold text-indigo-300">🏛 Bank:</span> {user.primaryBankName}</div>
          <div><span className="font-semibold text-indigo-300">🧾 ITR:</span> {user.itrStatus}</div>
          <div><span className="font-semibold text-indigo-300">📬 Communication:</span> {user.communicationMethod}</div>
        </div>

        {/* Edit Button */}
        <button
          onClick={handleEdit}
          className="absolute top-8 right-8 px-5 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900 font-bold rounded-lg shadow transition z-20 cursor-pointer"
        >
          Edit
        </button>
      </aside>

      {/* Right Main Content with background image */}
      <main
        className="w-[40%] flex flex-col items-center justify-center gap-8 text-center relative overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(0.5px) brightness(0.7)',
            opacity: 0.85,
          }}
        />
        {/* Subtle dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-20 w-full flex flex-col items-center justify-center gap-8">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
            Dashboard
          </h1>
          <div className="flex flex-col gap-6 items-center">
            <button
              className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-lg font-semibold shadow-lg transition cursor-pointer transform hover:scale-105"
              onClick={handleShowLendingModal}
            >
              Lending Request's
              {pendingRequests > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 rounded-full px-2 py-1 text-xs font-bold border-2 border-white">{pendingRequests}</span>
              )}
            </button>
            <button
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl text-lg font-semibold shadow-lg transition cursor-pointer transform hover:scale-105"
              onClick={handleBorrow}
            >
              Borrow
            </button>
          </div>
        </div>
      </main>

      {/* Right Sidebar: History */}
      <aside className="w-[30%] bg-gray-900/80 backdrop-blur-lg p-10 flex flex-col gap-6 border-l border-gray-800 min-h-screen shadow-xl">
        <h2 className="text-3xl font-bold mb-6 tracking-wide bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          History
        </h2>
        <div className="space-y-4 text-lg leading-relaxed text-gray-200">
          <div className="font-semibold text-gray-400 mb-2">Lending History</div>
          {lendingRequests.filter(r => r.status === 'approved').length === 0 ? (
            <div className="bg-gray-800/70 rounded-lg p-4">No lending history yet.</div>
          ) : (
            <ul className="space-y-2">
              {lendingRequests.filter(r => r.status === 'approved').map(r => (
                <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                  <span className="font-semibold text-indigo-300">Borrower:</span> {r.borrower?.username || 'N/A'}<br />
                  <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                </li>
              ))}
            </ul>
          )}
          <div className="font-semibold text-gray-400 mt-6 mb-2">Borrowing History</div>
          {/* You can add borrowing history here similarly if needed */}
          <div className="bg-gray-800/70 rounded-lg p-4">No borrowing history yet.</div>
        </div>
      </aside>

      {/* Edit Modal (single version) */}
      {editOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200 ${showModal ? 'opacity-100' : 'opacity-0'}`}
          style={{ pointerEvents: 'auto' }}>
          <form
            onSubmit={handleEditSave}
            className={`bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col gap-4 border border-yellow-400 ring-4 ring-yellow-300/60 ring-offset-2 ring-offset-yellow-100 relative transform transition-all duration-200 ${showModal ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}
            style={{ zIndex: 100 }}
          >
            <button type="button" onClick={handleCloseModal} className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            <h3 className="text-2xl font-bold mb-2 text-center">Edit Profile</h3>
            {/* ...existing code... */}
            <input
              name="fullName"
              value={`${editForm.firstName || ''} ${editForm.middleName || ''} ${editForm.lastName || ''}`.replace(/ +/g, ' ').trim()}
              onChange={e => {
                const [firstName = '', middleName = '', ...lastArr] = e.target.value.split(' ');
                setEditForm(f => ({
                  ...f,
                  firstName,
                  middleName,
                  lastName: lastArr.join(' ')
                }));
              }}
              placeholder="Full Name (First Middle Last)"
              className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
              required
            />
            {/* ...existing code... */}
          </form>
        </div>
      )}

      {/* Borrow Modal */}
      {borrowOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200 ${borrowModal ? 'opacity-100' : 'opacity-0'}`}
          style={{ pointerEvents: 'auto' }}>
          <form
            onSubmit={handleBorrowSubmit}
            className={`bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col gap-4 border border-green-400 ring-4 ring-green-300/60 ring-offset-2 ring-offset-green-100 relative transform transition-all duration-200 ${borrowModal ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}
            style={{ zIndex: 100 }}
          >
            <button type="button" onClick={handleCloseBorrow} className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            <h3 className="text-2xl font-bold mb-2 text-center">Borrow Request</h3>
            <input
              name="lenderUsername"
              value={borrowForm.lenderUsername}
              onChange={handleBorrowChange}
              placeholder="Lender Username"
              className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
              required
            />
            <input
              name="amount"
              type="number"
              value={borrowForm.amount}
              onChange={handleBorrowChange}
              placeholder="Amount"
              className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
              required
              min="1"
            />
            {borrowError && <div className="text-red-400 text-center">{borrowError}</div>}
            {borrowSuccess && <div className="text-green-400 text-center">{borrowSuccess}</div>}
            <button
              type="submit"
              className="w-full py-3 mt-2 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-300 hover:to-green-400 text-gray-900 font-bold rounded-lg shadow-lg text-lg transition disabled:opacity-60"
              disabled={borrowLoading}
            >
              {borrowLoading ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        </div>
      )}

      {/* Lending Requests Modal */}
      {showLendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200 opacity-100" style={{ pointerEvents: 'auto' }}>
          <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 border border-blue-400 ring-4 ring-blue-300/60 ring-offset-2 ring-offset-blue-100 relative transform transition-all duration-200 scale-100">
            <button type="button" onClick={handleCloseLendingModal} className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            <h3 className="text-2xl font-bold mb-2 text-center">Lending Requests</h3>
            {lendingRequests.length === 0 ? (
              <div className="text-gray-400 text-center">No pending requests.</div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {lendingRequests.map(req => (
                  <li key={req._id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <span className="font-semibold text-indigo-300">Borrower:</span> {req.borrower?.username || 'N/A'}<br />
                      <span className="font-semibold text-indigo-300">Amount:</span> ₹{req.amount}
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                      <a
                        href={`/profile/${req.borrower?._id}`}
                        className="text-blue-400 font-semibold underline hover:text-blue-300 transition text-lg"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Details
                      </a>
                      {req.status === 'pending' && (
                        <button
                          className="py-1 px-3 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold rounded-md shadow text-sm transition transform hover:scale-105 border border-green-300 cursor-pointer"
                          style={{ minWidth: 70 }}
                          onClick={async () => {
                            await fetch(`/api/history/${req._id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'approved' })
                            });
                            // Refresh requests
                            fetch(`/api/history/user/${user._id}`)
                              .then(res => res.json())
                              .then(data => {
                                if (data.success) {
                                  const pending = data.history.filter(h => h.lender && h.lender._id === user._id && h.status === 'pending');
                                  setPendingRequests(pending.length);
                                  setLendingRequests(pending);
                                }
                              });
                          }}
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
