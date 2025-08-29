import React, { useState } from "react";

const AuthModal = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fatherOrSpouseName: "",
    dateOfBirth: "",
    phoneNumber: "",
    pan: "",
    aadhaar: "",
    streetAddress: "",
    areaLocality: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    employmentStatus: "",
    occupationCategory: "",
    companyName: "",
    yearsOfExperience: "",
    monthlyIncomeRange: "",
    hasCreditAccounts: false,
    creditPurpose: "",
    hasBankAccount: false,
    primaryBankName: "",
    termsAccepted: false,
    privacyPolicyAccepted: false,
    consentCreditBureau: false,
    ageVerified: false,
    itrStatus: "",
    educationalQualification: "",
    languagePreference: "",
    communicationMethod: "",
    maritalStatus: "",
    numberOfDependents: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin({ username: form.username, password: form.password });
    } else {
      onRegister(form);
    }
  };

  if (!isOpen) return null;

  // Modal size and scroll logic
  const modalStyle = isLogin
    ? {
        background: '#18181b', color: '#fff', borderRadius: 16, padding: 32, minWidth: 360, maxWidth: 400, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', position: 'relative', border: 'none', transition: 'width 0.2s, height 0.2s', maxHeight: 540, overflow: 'hidden'
      }
    : {
        background: '#18181b', color: '#fff', borderRadius: 16, padding: 32, minWidth: 420, maxWidth: 620, width: 620, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', position: 'relative', border: 'none', transition: 'width 0.2s, height 0.2s', maxHeight: 720, overflow: 'hidden'
      };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={modalStyle}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', fontWeight: 700
        }}>&times;</button>
        <div style={{ display: 'flex', marginBottom: 24, background: '#23232b', borderRadius: 8, overflow: 'hidden', boxShadow: 'none', border: 'none' }}>
          <button onClick={() => setIsLogin(true)} style={{
            flex: 1, padding: 12, border: 'none', borderRadius: '8px 0 0 8px', background: isLogin ? '#2563eb' : 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 16, transition: 'background 0.2s'
          }}>Login</button>
          <button onClick={() => setIsLogin(false)} style={{
            flex: 1, padding: 12, border: 'none', borderRadius: '0 8px 8px 0', background: !isLogin ? '#2563eb' : 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 16, transition: 'background 0.2s'
          }}>Register</button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: isLogin ? 440 : 540,
            overflowY: isLogin ? 'unset' : 'auto',
            paddingRight: isLogin ? 0 : 8,
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
          }}
        >
          {isLogin ? (
            <>
              <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required style={{
                padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15
              }} />
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{
                padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15
              }} />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
                <input name="middleName" placeholder="Middle Name" value={form.middleName} onChange={handleChange} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
                <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              </div>
              <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="fatherOrSpouseName" placeholder="Father's/Spouse's Name" value={form.fatherOrSpouseName} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="dateOfBirth" type="date" placeholder="Date of Birth" value={form.dateOfBirth} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="phoneNumber" placeholder="Phone Number (+91...)" value={form.phoneNumber} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input name="pan" placeholder="PAN" value={form.pan} onChange={handleChange} required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
                <input name="aadhaar" placeholder="Aadhaar Number" value={form.aadhaar} onChange={handleChange} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              </div>

              <input name="streetAddress" placeholder="Street Address" value={form.streetAddress} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="areaLocality" placeholder="Area/Locality" value={form.areaLocality} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="city" placeholder="City" value={form.city} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="state" placeholder="State" value={form.state} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="pinCode" placeholder="PIN Code" value={form.pinCode} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="country" placeholder="Country" value={form.country} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ color: '#fff', fontSize: 15, marginBottom: 2 }}>Employment Status</label>
                  <select name="employmentStatus" value={form.employmentStatus} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                    <option value="">Select...</option>
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ color: '#fff', fontSize: 15, marginBottom: 2 }}>Occupation Category</label>
                  <select name="occupationCategory" value={form.occupationCategory} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                    <option value="">Select...</option>
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
              </div>
              <input name="companyName" placeholder="Company/Organization Name" value={form.companyName} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="yearsOfExperience" type="number" placeholder="Years of Experience" value={form.yearsOfExperience} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <select name="monthlyIncomeRange" value={form.monthlyIncomeRange} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">Monthly Income Range</option>
                <option>Below ₹25,000</option>
                <option>₹25,000 - ₹50,000</option>
                <option>₹50,000 - ₹1,00,000</option>
                <option>₹1,00,000 - ₹2,00,000</option>
                <option>₹2,00,000 - ₹5,00,000</option>
                <option>Above ₹5,00,000</option>
              </select>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ color: '#fff', fontSize: 15 }}>
                  <input name="hasCreditAccounts" type="checkbox" checked={form.hasCreditAccounts} onChange={e => setForm({ ...form, hasCreditAccounts: e.target.checked })} style={{ marginRight: 6 }} /> Has Credit Accounts
                </label>
                <label style={{ color: '#fff', fontSize: 15 }}>
                  <input name="hasBankAccount" type="checkbox" checked={form.hasBankAccount} onChange={e => setForm({ ...form, hasBankAccount: e.target.checked })} style={{ marginRight: 6 }} /> Has Bank Account
                </label>
              </div>
              <input name="primaryBankName" placeholder="Primary Bank Name" value={form.primaryBankName} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <input name="existingCreditScore" type="number" min="0" max="900" placeholder="Existing Credit Score" value={form.existingCreditScore || ''} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
              <select name="creditPurpose" value={form.creditPurpose} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">Credit Purpose</option>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ color: '#fff', fontSize: 15 }}>
                  <input name="termsAccepted" type="checkbox" checked={form.termsAccepted} onChange={e => setForm({ ...form, termsAccepted: e.target.checked })} required style={{ marginRight: 6 }} /> Accept Terms
                </label>
                <label style={{ color: '#fff', fontSize: 15 }}>
                  <input name="privacyPolicyAccepted" type="checkbox" checked={form.privacyPolicyAccepted} onChange={e => setForm({ ...form, privacyPolicyAccepted: e.target.checked })} required style={{ marginRight: 6 }} /> Accept Privacy Policy
                </label>
                <label style={{ color: '#fff', fontSize: 15 }}>
                  <input name="consentCreditBureau" type="checkbox" checked={form.consentCreditBureau} onChange={e => setForm({ ...form, consentCreditBureau: e.target.checked })} required style={{ marginRight: 6 }} /> Consent for Credit Bureau
                </label>
                <label style={{ color: '#fff', fontSize: 15 }}>
                  <input name="ageVerified" type="checkbox" checked={form.ageVerified} onChange={e => setForm({ ...form, ageVerified: e.target.checked })} required style={{ marginRight: 6 }} /> Age Verified (18+)
                </label>
              </div>
              <select name="itrStatus" value={form.itrStatus} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">ITR Status</option>
                <option>Yes, regularly file ITR</option>
                <option>Filed ITR in past 2 years</option>
                <option>Never filed ITR</option>
              </select>
              <select name="educationalQualification" value={form.educationalQualification} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">Educational Qualification</option>
                <option>Below 10th</option>
                <option>10th Pass</option>
                <option>12th Pass</option>
                <option>Graduate</option>
                <option>Post Graduate</option>
                <option>Professional Degree</option>
                <option>Doctorate</option>
              </select>
              <select name="languagePreference" value={form.languagePreference} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">Language Preference</option>
                <option>English</option>
                <option>Hindi</option>
                <option>Regional</option>
              </select>
              <select name="communicationMethod" value={form.communicationMethod} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">Preferred Communication Method</option>
                <option>SMS</option>
                <option>Email</option>
                <option>WhatsApp</option>
              </select>
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }}>
                <option value="">Marital Status</option>
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
              <input name="numberOfDependents" type="number" placeholder="Number of Dependents" value={form.numberOfDependents} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#23232b', color: '#fff', fontSize: 15 }} />
            </>
          )}
          <button type="submit" style={{
            marginTop: 8, padding: 12, borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#2563eb,#1e40af)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 1
          }}>{isLogin ? "Login" : "Register"}</button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
