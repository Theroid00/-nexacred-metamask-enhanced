import React, { useState, useEffect } from "react";
import bgImg from "../assets/20250829_0408_NexaCred Logo Design_remix_01k3sd5z5medt9v3dy7fhwq7pv.png";
import { MessageCircle, X } from "lucide-react";
import WalletConnection from '../components/WalletConnection';
import RiskReport from '../components/RiskReport';

export default function Dashboard({ user, wallet, walletUser, token, onUserUpdate }) {
  // ...existing state...
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Chatbot UI state
  const [chatbotOpen, setChatbotOpen] = useState(false);
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
            <ul className="space-y-2">
              {userHistory.filter(r => r.status === 'approved' && r.lender && r.lender._id === user._id).map(r => (
                <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                  <span className="font-semibold text-indigo-300">Borrower:</span> {r.borrower?.username || 'N/A'}<br />
                  <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                </li>
              ))}
            </ul>
          )}
          <div className="font-semibold text-gray-400 mt-6 mb-2">Borrowing History</div>
          {userHistory.filter(r => r.status === 'approved' && r.borrower && r.borrower._id === user._id).length === 0 ? (
            <div className="bg-gray-800/70 rounded-lg p-4">No borrowing history yet.</div>
          ) : (
            <ul className="space-y-2">
              {userHistory.filter(r => r.status === 'approved' && r.borrower && r.borrower._id === user._id).map(r => (
                <li key={r._id} className="bg-gray-800/70 rounded-lg p-3 flex flex-col gap-1">
                  <span className="font-semibold text-indigo-300">Lender:</span> {r.lender?.username || 'N/A'}<br />
                  <span className="font-semibold text-indigo-300">Amount:</span> ₹{r.amount}
                </li>
              ))}
            </ul>
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
            className={`bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col gap-4 border border-yellow-400 ring-4 ring-yellow-300/60 ring-offset-2 ring-offset-yellow-100 relative transform transition-all duration-200 ${showModal ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'} scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900`}
            style={{ zIndex: 100, maxHeight: '80vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#374151 #111827' }}
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
    {/* Chatbot Floating Button & Popup */}
    <div>
      {/* Floating Button */}
      {!chatbotOpen && (
        <button
          onClick={() => setChatbotOpen(true)}
          className="fixed bottom-8 right-8 z-[100] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl rounded-full p-0.5 hover:scale-105 transition-transform"
          style={{ width: 64, height: 64 }}
          aria-label="Open Chatbot"
        >
          <div className="flex items-center justify-center w-full h-full bg-gray-900 rounded-full">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </button>
      )}

      {/* Chatbot Popup */}
      {chatbotOpen && (
        <div className="fixed bottom-6 right-6 z-[101] w-full max-w-md md:max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-blue-400 ring-4 ring-blue-300/60 ring-offset-2 ring-offset-blue-100 flex flex-col" style={{ height: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl">
            <span className="font-bold text-white text-lg flex items-center gap-2">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              NexaCred Chatbot
            </span>
            <button onClick={() => setChatbotOpen(false)} className="text-white text-2xl font-bold hover:text-gray-200 transition" aria-label="Close Chatbot">&times;</button>
          </div>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-950 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-900" id="chatbot-messages">
            {/* Example messages, replace with real chat logic */}
            <div className="flex justify-start">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] shadow">Hi! How can I help you today?</div>
            </div>
            {/* User message example */}
            {/* <div className="flex justify-end">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%] shadow">I want to know my credit score.</div>
            </div> */}
          </div>
          {/* Input Area */}
          <form className="flex items-center gap-2 px-4 py-3 border-t border-gray-800 bg-gray-900 rounded-b-2xl">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              // value={chatInput}
              // onChange={e => setChatInput(e.target.value)}
              disabled
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow transition" disabled>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}
