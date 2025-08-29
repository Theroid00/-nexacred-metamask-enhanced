import React, { useState, useEffect } from "react";
import bgImg from "../assets/20250829_0408_NexaCred Logo Design_remix_01k3sd5z5medt9v3dy7fhwq7pv.png";
import { MessageCircle, X } from "lucide-react";
import WalletConnection from '../components/WalletConnection';
import RiskReport from '../components/RiskReport';

export default function Dashboard({ user, wallet, walletUser, token, onUserUpdate }) {
  // Chatbot state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: "Hello! I'm your NexaCred AI assistant powered by advanced RAG technology. I can help you with questions about credit scoring, lending, financial information, and more. How can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState('online'); // online, offline, processing
  const [showChatbotIndicator, setShowChatbotIndicator] = useState(true);
  
  // Borrower profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalHistory, setProfileModalHistory] = useState([]);
  const [profileModalHistoryLoading, setProfileModalHistoryLoading] = useState(false);
  // ...existing state...
  // For animated dropdowns in history
  const [showAllLending, setShowAllLending] = useState(false);
  const [showAllBorrowing, setShowAllBorrowing] = useState(false);
  // ...existing state...
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Edit form state
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
  const [userHistory, setUserHistory] = useState([]);
  const [showLendingModal, setShowLendingModal] = useState(false);


  // Fetch pending requests for lender notification
  useEffect(() => {
    if (!user) return;
    fetch(`/api/history/user/${user._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserHistory(data.history);
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

  // Chatbot functions
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    setChatStatus('processing');

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      // Call the RAG chatbot API
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: userMessage,
          userId: user._id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add bot response to chat
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: data.data.response,
          timestamp: data.data.timestamp,
          retrievedDocuments: data.data.retrievedDocuments,
          contextUsed: data.data.contextUsed,
          sources: data.data.sources
        };
        setChatMessages(prev => [...prev, botMessage]);
        setChatStatus('online');
      } else {
        // Handle error response
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: data.data?.response || "I apologize, but I'm experiencing technical difficulties. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true
        };
        setChatMessages(prev => [...prev, errorMessage]);
        setChatStatus('online');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: "I apologize, but I'm having trouble connecting to my AI brain right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setChatStatus('offline');
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatbotOpen = () => {
    setChatbotOpen(true);
    setShowChatbotIndicator(false);
  };

  const handleChatbotClose = () => {
    setChatbotOpen(false);
  };

  // Auto-scroll chat messages to bottom
  React.useEffect(() => {
    const chatContainer = document.getElementById('chatbot-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-inter">
      {/* Left Sidebar */}
      <aside className="w-[30%] bg-gray-900/80 backdrop-blur-lg p-10 flex flex-col gap-6 border-r border-gray-800 min-h-screen shadow-xl relative z-10">
        <h2 className="text-4xl font-extrabold mb-6 tracking-wide bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          User Profile
        </h2>

        <div className="space-y-4 text-lg leading-relaxed text-gray-200">
          {/* Credit Score Highlight */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Credit Score</div>
            <div className="relative flex items-center justify-center">
              <div className="bg-gradient-to-tr from-yellow-400 via-pink-400 to-purple-500 rounded-full p-1 shadow-lg">
                <div className="bg-gray-900 rounded-full px-8 py-4 flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-4xl font-extrabold text-yellow-400 drop-shadow-lg">{user.existingCreditScore ?? 'N/A'}</span>
                  <span className="text-xs text-gray-300 mt-1"></span>
                </div>
              </div>
              <svg className="absolute -top-3 -right-3 animate-pulse" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="2" fill="none" /></svg>
            </div>
          </div>
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

      {/* Enhanced Main Content with Web3 Features */}
      <main className="w-[40%] flex flex-col gap-6 p-8 relative overflow-hidden" style={{ minHeight: '100vh' }}>
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(0.5px) brightness(0.3)',
            opacity: 0.4,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/80 z-10" />
        
        <div className="relative z-20 flex flex-col gap-6">
          {/* Dashboard Header */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg mb-2">
              Dashboard
            </h1>
            {walletUser && (
              <p className="text-gray-300 text-sm">
                🔗 Connected with MetaMask
              </p>
            )}
          </div>

          {/* Wallet Connection Section */}
          <WalletConnection
            isConnected={wallet?.isConnected || false}
            account={wallet?.account}
            balance={wallet?.balance || '0.0000'}
            currentNetwork={wallet?.currentNetwork}
            isLoading={wallet?.isLoading || false}
            error={wallet?.error}
            onConnect={wallet?.connectWallet}
            onDisconnect={wallet?.disconnectWallet}
            onSwitchNetwork={wallet?.switchNetwork}
            networks={wallet?.networks || {}}
            isMetaMaskInstalled={wallet?.isMetaMaskInstalled || false}
          />

          {/* Traditional Actions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              💰 Financial Actions
            </h3>
            <div className="flex flex-col gap-4">
              <button
                className="relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-semibold shadow-lg transition cursor-pointer transform hover:scale-105"
                onClick={handleShowLendingModal}
              >
                Lending Requests
                {pendingRequests > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 rounded-full px-2 py-1 text-xs font-bold border-2 border-white">
                    {pendingRequests}
                  </span>
                )}
              </button>
              <button
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg text-white font-semibold shadow-lg transition cursor-pointer transform hover:scale-105"
                onClick={handleBorrow}
              >
                Borrow Funds
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Web3 Analytics & History */}
      <aside className="w-[30%] bg-gray-900/80 backdrop-blur-lg p-6 flex flex-col gap-6 border-l border-gray-800 min-h-screen shadow-xl overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 tracking-wide bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Analytics & History
        </h2>
        
        {/* Risk Analysis Section */}
        <div className="mb-6">
          <RiskReport 
            walletAddress={wallet?.account}
            balance={wallet?.balance || '0.0000'}
          />
        </div>
        
        {/* Traditional History Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
          <div className="space-y-4 text-sm leading-relaxed text-gray-200">
          <div className="font-semibold text-gray-400 mb-2">Lending History</div>
          {userHistory.filter(r => r.status === 'approved' && r.lender && r.lender._id === user._id).length === 0 ? (
            <div className="bg-gray-800/70 rounded-lg p-4">No lending history yet.</div>
          ) : (
            (() => {
              const lendingRows = userHistory.filter(r => r.status === 'approved' && r.lender && r.lender._id === user._id);
              const showDropdown = lendingRows.length > 2;
              return (
                <>
                  <ul className="space-y-2">
                    {lendingRows.slice(0, 2).map(r => (
                      <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                        <span className="font-semibold text-indigo-300">Borrower:</span> {r.borrower?.username || 'N/A'}<br />
                        <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                      </li>
                    ))}
                  </ul>
                  {showDropdown && (
                    <div className="mt-2">
                      <button
                        className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg shadow hover:from-blue-400 hover:to-purple-400 transition"
                        onClick={() => setShowAllLending(v => !v)}
                      >
                        {showAllLending ? 'Show Less' : `Show ${lendingRows.length - 2} More`}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-500 ${showAllLending ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
                        style={{ willChange: 'max-height, opacity' }}
                      >
                        <ul className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-2 scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-indigo-400/60 hover:scrollbar-track-gray-900 transition-all duration-200">
                          {lendingRows.slice(2).map(r => (
                            <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                              <span className="font-semibold text-indigo-300">Borrower:</span> {r.borrower?.username || 'N/A'}<br />
                              <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
          <div className="font-semibold text-gray-400 mt-6 mb-2">Borrowing History</div>
          {userHistory.filter(r => r.status === 'approved' && r.borrower && r.borrower._id === user._id).length === 0 ? (
            <div className="bg-gray-800/70 rounded-lg p-4">No borrowing history yet.</div>
          ) : (
            (() => {
              const borrowingRows = userHistory.filter(r => r.status === 'approved' && r.borrower && r.borrower._id === user._id);
              const showDropdown = borrowingRows.length > 2;
              return (
                <>
                  <ul className="space-y-2">
                    {borrowingRows.slice(0, 2).map(r => (
                      <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                        <span className="font-semibold text-indigo-300">Lender:</span> {r.lender?.username || 'N/A'}<br />
                        <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                      </li>
                    ))}
                  </ul>
                  {showDropdown && (
                    <div className="mt-2">
                      <button
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg shadow hover:from-purple-400 hover:to-blue-400 transition"
                        onClick={() => setShowAllBorrowing(v => !v)}
                      >
                        {showAllBorrowing ? 'Show Less' : `Show ${borrowingRows.length - 2} More`}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-500 ${showAllBorrowing ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
                        style={{ willChange: 'max-height, opacity' }}
                      >
                        <ul className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-2 scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-indigo-400/60 hover:scrollbar-track-gray-900 transition-all duration-200">
                          {borrowingRows.slice(2).map(r => (
                            <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                              <span className="font-semibold text-indigo-300">Lender:</span> {r.lender?.username || 'N/A'}<br />
                              <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
          </div>
        </div>
      </aside>

      {/* Edit Modal (single version) */}
      {editOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200 ${showModal ? 'opacity-100' : 'opacity-0'}`}
          style={{ pointerEvents: 'auto' }}>
          <form
            onSubmit={handleEditSave}
            className={`bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col gap-4 border border-yellow-400 ring-4 ring-yellow-300/60 ring-offset-2 ring-offset-yellow-100 relative transform transition-all duration-200 ${showModal ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'} scrollbar-hide`}
            style={{ zIndex: 100, maxHeight: '80vh', overflowY: 'auto' }}
          >
            <button type="button" onClick={handleCloseModal} className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            <h3 className="text-2xl font-bold mb-2 text-center">Edit Profile</h3>
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">First Name</label>
                <input name="firstName" value={editForm.firstName || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Middle Name</label>
                <input name="middleName" value={editForm.middleName || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Last Name</label>
                <input name="lastName" value={editForm.lastName || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Father/Spouse Name</label>
                <input name="fatherOrSpouseName" value={editForm.fatherOrSpouseName || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Date of Birth</label>
                <input name="dateOfBirth" type="date" value={editForm.dateOfBirth ? editForm.dateOfBirth.slice(0,10) : ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone Number</label>
                <input name="phoneNumber" value={editForm.phoneNumber || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">PAN</label>
                <input name="pan" value={editForm.pan || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Aadhaar</label>
                <input name="aadhaar" value={editForm.aadhaar || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
            </div>

            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Street Address</label>
                <input name="streetAddress" value={editForm.streetAddress || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Area/Locality</label>
                <input name="areaLocality" value={editForm.areaLocality || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">City</label>
                <input name="city" value={editForm.city || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">State</label>
                <input name="state" value={editForm.state || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Pin Code</label>
                <input name="pinCode" value={editForm.pinCode || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Country</label>
                <input name="country" value={editForm.country || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
            </div>

            {/* Employment & Occupation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Employment Status</label>
                <select name="employmentStatus" value={editForm.employmentStatus || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required>
                  <option value="">Select</option>
                  <option>Salaried Employee</option>
                  <option>Self-employed Professional</option>
                  <option>Business Owner</option>
                  <option>Farmer</option>
                  <option>Student</option>
                  <option>Housewife/Homemaker</option>
                  <option>Retired</option>
                  <option>Unemployed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Occupation Category</label>
                <select name="occupationCategory" value={editForm.occupationCategory || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required>
                  <option value="">Select</option>
                  <option>Government Employee</option>
                  <option>Private Sector Employee</option>
                  <option>Public Sector Employee</option>
                  <option>Doctor/Medical Professional</option>
                  <option>Engineer/IT Professional</option>
                  <option>Teacher/Professor</option>
                  <option>Lawyer/Legal Professional</option>
                  <option>Chartered Accountant/CA</option>
                  <option>Architect</option>
                  <option>Consultant</option>
                  <option>Trader/Merchant</option>
                  <option>Manufacturer</option>
                  <option>Contractor</option>
                  <option>Farmer/Agriculture</option>
                  <option>Driver/Transport</option>
                  <option>Shopkeeper/Retailer</option>
                  <option>Freelancer</option>
                  <option>Other Professional</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Company Name</label>
                <input name="companyName" value={editForm.companyName || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Years of Experience</label>
                <input name="yearsOfExperience" type="number" min="0" value={editForm.yearsOfExperience || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Monthly Income Range</label>
                <select name="monthlyIncomeRange" value={editForm.monthlyIncomeRange || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required>
                  <option value="">Select</option>
                  <option>Below ₹25,000</option>
                  <option>₹25,000 - ₹50,000</option>
                  <option>₹50,000 - ₹1,00,000</option>
                  <option>₹1,00,000 - ₹2,00,000</option>
                  <option>₹2,00,000 - ₹5,00,000</option>
                  <option>Above ₹5,00,000</option>
                </select>
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Has Credit Accounts?</label>
                <input name="hasCreditAccounts" type="checkbox" checked={!!editForm.hasCreditAccounts} onChange={handleEditChange} className="mr-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Credit Purpose</label>
                <select name="creditPurpose" value={editForm.creditPurpose || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required>
                  <option value="">Select</option>
                  <option>Personal Loan</option>
                  <option>Credit Card</option>
                  <option>Home Loan</option>
                  <option>Car Loan</option>
                  <option>Education Loan</option>
                  <option>Business Loan</option>
                  <option>Gold Loan</option>
                  <option>Two-Wheeler Loan</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Has Bank Account?</label>
                <input name="hasBankAccount" type="checkbox" checked={!!editForm.hasBankAccount} onChange={handleEditChange} className="mr-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Primary Bank Name</label>
                <input name="primaryBankName" value={editForm.primaryBankName || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Existing Credit Score</label>
                <input name="existingCreditScore" type="number" min="0" value={editForm.existingCreditScore || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required />
              </div>
            </div>

            {/* Legal & Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Terms Accepted</label>
                <input name="termsAccepted" type="checkbox" checked={!!editForm.termsAccepted} onChange={handleEditChange} className="mr-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Privacy Policy Accepted</label>
                <input name="privacyPolicyAccepted" type="checkbox" checked={!!editForm.privacyPolicyAccepted} onChange={handleEditChange} className="mr-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Consent Credit Bureau</label>
                <input name="consentCreditBureau" type="checkbox" checked={!!editForm.consentCreditBureau} onChange={handleEditChange} className="mr-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Age Verified</label>
                <input name="ageVerified" type="checkbox" checked={!!editForm.ageVerified} onChange={handleEditChange} className="mr-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">ITR Status</label>
                <select name="itrStatus" value={editForm.itrStatus || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" required>
                  <option value="">Select</option>
                  <option>Yes, regularly file ITR</option>
                  <option>Filed ITR in past 2 years</option>
                  <option>Never filed ITR</option>
                </select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Educational Qualification</label>
                <select name="educationalQualification" value={editForm.educationalQualification || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
                  <option value="">Select</option>
                  <option>Below 10th</option>
                  <option>10th Pass</option>
                  <option>12th Pass</option>
                  <option>Graduate</option>
                  <option>Post Graduate</option>
                  <option>Professional Degree</option>
                  <option>Doctorate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Language Preference</label>
                <select name="languagePreference" value={editForm.languagePreference || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
                  <option value="">Select</option>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Regional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Communication Method</label>
                <select name="communicationMethod" value={editForm.communicationMethod || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
                  <option value="">Select</option>
                  <option>SMS</option>
                  <option>Email</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Marital Status</label>
                <select name="maritalStatus" value={editForm.maritalStatus || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
                  <option value="">Select</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Number of Dependents</label>
                <input name="numberOfDependents" type="number" min="0" value={editForm.numberOfDependents || ''} onChange={handleEditChange} className="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 mt-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900 font-bold rounded-lg shadow-lg text-lg transition disabled:opacity-60" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
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
            <button type="button" onClick={handleCloseLendingModal} className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer">&times;</button>
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
                      <button
                        type="button"
                        className="text-blue-400 font-semibold underline hover:text-blue-300 transition text-lg"
                        onClick={async () => {
                          setProfileModalLoading(true);
                          setProfileModalOpen(true);
                          setProfileModalHistory([]);
                          setProfileModalHistoryLoading(true);
                          try {
                            const res = await fetch(`/api/users/${req.borrower?._id}`);
                            if (res.ok) {
                              const data = await res.json();
                              setProfileModalUser(data || null);
                              // Fetch history for this user
                              const hres = await fetch(`/api/history/user/${req.borrower?._id}`);
                              if (hres.ok) {
                                const hdata = await hres.json();
                                setProfileModalHistory(hdata.history || []);
                              } else {
                                setProfileModalHistory([]);
                              }
                            } else {
                              setProfileModalUser(null);
                              setProfileModalHistory([]);
                            }
                          } catch {
                            setProfileModalUser(null);
                            setProfileModalHistory([]);
                          } finally {
                            setProfileModalLoading(false);
                            setProfileModalHistoryLoading(false);
                          }
                        }}
                      >
                        Details
                      </button>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            className="py-1 px-3 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold rounded-md shadow text-sm transition transform hover:scale-105 border border-green-300 cursor-pointer"
                            style={{ minWidth: 70 }}
                            onClick={async () => {
                              await fetch(`/api/history/${req._id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'approved' })
                              });
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
                          <button
                            className="py-1 px-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold rounded-md shadow text-sm transition transform hover:scale-105 border border-red-300 cursor-pointer"
                            style={{ minWidth: 70 }}
                            onClick={async () => {
                              setLendingRequests(prev => prev.filter(r => r._id !== req._id));
                              await fetch(`/api/history/${req._id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'rejected' })
                              });
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
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    {/* Borrower Profile Modal */}
    {profileModalOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 transition-opacity duration-200">
  <div className="bg-gray-900 rounded-2xl shadow-2xl border border-yellow-400 ring-4 ring-yellow-300/60 ring-offset-2 ring-offset-yellow-100 p-8 max-w-2xl w-full min-h-[420px] max-h-[90vh] relative animate-fadeInUp flex flex-col overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setProfileModalOpen(false)} className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold cursor-pointer">&times;</button>
          <h3 className="text-2xl font-bold mb-4 text-center text-yellow-300">Borrower Profile</h3>
          {profileModalLoading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : profileModalUser ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold text-indigo-300">{profileModalUser.firstName} {profileModalUser.middleName} {profileModalUser.lastName}</div>
                <div className="text-gray-400 text-sm mb-2">@{profileModalUser.username}</div>
                <div className="flex flex-col items-center my-2">
                  <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Credit Score</div>
                  <div className="relative flex items-center justify-center">
                    <div className="bg-gradient-to-tr from-yellow-400 via-pink-400 to-purple-500 rounded-full p-1 shadow-lg">
                      <div className="bg-gray-900 rounded-full px-8 py-4 flex flex-col items-center justify-center min-w-[120px]">
                        <span className="text-4xl font-extrabold text-yellow-400 drop-shadow-lg">{profileModalUser.existingCreditScore ?? 'N/A'}</span>
                      </div>
                    </div>
                    <svg className="absolute -top-3 -right-3 animate-pulse" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="2" fill="none" /></svg>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full text-left mt-2">
                  <div><span className="font-semibold text-indigo-300">Email:</span> {profileModalUser.email}</div>
                  <div><span className="font-semibold text-indigo-300">Phone:</span> {profileModalUser.phoneNumber}</div>
                  <div><span className="font-semibold text-indigo-300">Country:</span> {profileModalUser.country}</div>
                  <div><span className="font-semibold text-indigo-300">Employment:</span> {profileModalUser.employmentStatus}</div>
                  <div><span className="font-semibold text-indigo-300">Monthly Income:</span> {profileModalUser.monthlyIncomeRange}</div>
                  <div><span className="font-semibold text-indigo-300">Bank:</span> {profileModalUser.primaryBankName}</div>
                </div>
              </div>
              {/* User History Section */}
              <div className="mt-8 w-full">
                <div className="text-lg font-bold text-indigo-300 mb-2">Transaction History</div>
                {profileModalHistoryLoading ? (
                  <div className="text-gray-400 text-sm">Loading history...</div>
                ) : profileModalHistory.length === 0 ? (
                  <div className="text-gray-500 text-sm">No history found.</div>
                ) : (
                  <ul className="space-y-2 pr-2 scrollbar-none transition-all duration-200">
                    {profileModalHistory.map((h, idx) => (
                      <li key={h._id || idx} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1 text-sm">
                        <span className="font-semibold text-indigo-300">Type:</span> {h.type}<br />
                        <span className="font-semibold text-indigo-300">Amount:</span> ₹{h.amount}<br />
                        <span className="font-semibold text-indigo-300">Status:</span> {h.status}<br />
                        <span className="font-semibold text-indigo-300">Date:</span> {h.requestDate ? new Date(h.requestDate).toLocaleDateString() : 'N/A'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-red-400 py-8">Unable to load profile.</div>
          )}
        </div>
      </div>
    )}

    {/* Chatbot Floating Button & Popup */}
    <div>
      {/* AI Feature Indicator */}
      {showChatbotIndicator && !chatbotOpen && (
        <div className="fixed bottom-20 right-6 z-[99] bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl shadow-lg animate-bounce">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            AI Assistant Available
          </div>
        </div>
      )}

      {/* Floating Button with Status Indicator */}
      {!chatbotOpen && (
        <button
          onClick={handleChatbotOpen}
          className="fixed bottom-8 right-8 z-[100] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl rounded-full p-0.5 hover:scale-105 transition-transform"
          style={{ width: 64, height: 64 }}
          aria-label="Open AI Chatbot"
        >
          <div className="flex items-center justify-center w-full h-full bg-gray-900 rounded-full">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {/* Status indicator */}
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
            chatStatus === 'online' ? 'bg-green-400' : 
            chatStatus === 'processing' ? 'bg-yellow-400 animate-pulse' : 
            'bg-red-400'
          }`}></div>
        </button>
      )}

      {/* Chatbot Popup */}
      {chatbotOpen && (
        <div className="fixed bottom-6 right-6 z-[101] w-full max-w-md md:max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-blue-400 ring-4 ring-blue-300/60 ring-offset-2 ring-offset-blue-100 flex flex-col" style={{ height: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl">
            <span className="font-bold text-white text-lg flex items-center gap-2">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364-.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              NexaCred AI Assistant
              <span className={`w-2 h-2 rounded-full ${
                chatStatus === 'online' ? 'bg-green-400' : 
                chatStatus === 'processing' ? 'bg-yellow-400 animate-pulse' : 
                'bg-red-400'
              }`}></span>
            </span>
            <button onClick={handleChatbotClose} className="text-white text-2xl font-bold hover:text-gray-200 transition" aria-label="Close Chatbot">&times;</button>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-950 scrollbar-hide" id="chatbot-messages">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] shadow ${
                  message.type === 'user' 
                    ? 'bg-gray-800 text-white rounded-br-none' 
                    : message.isError 
                      ? 'bg-red-600 text-white rounded-bl-none'
                      : 'bg-blue-600 text-white rounded-bl-none'
                }`}>
                  <div className="break-words">{message.message}</div>
                  {message.type === 'bot' && message.retrievedDocuments > 0 && (
                    <div className="text-xs text-blue-200 mt-1 opacity-75">
                      📚 Used {message.retrievedDocuments} knowledge sources
                    </div>
                  )}
                  <div className="text-xs opacity-50 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] shadow">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <form className="flex items-start gap-2 px-4 py-3 border-t border-gray-800 bg-gray-900 rounded-b-2xl" onSubmit={handleSendMessage}>
            <textarea
              placeholder="Ask me anything about credit, finance, or NexaCred..."
              className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 resize-none min-h-[44px] max-h-[120px] overflow-y-auto scrollbar-hide"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (chatInput.trim() && !chatLoading) {
                    handleSendMessage(e);
                  }
                }
              }}
              disabled={chatLoading}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '44px',
                maxHeight: '120px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onInput={(e) => {
                e.target.style.height = '44px';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button 
              type="submit" 
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg shadow transition flex items-center gap-2 mt-1" 
              disabled={!chatInput.trim() || chatLoading}
            >
              {chatLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              Send
            </button>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}
