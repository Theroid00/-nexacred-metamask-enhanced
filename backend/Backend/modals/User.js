import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
  // Account Creation
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, match: /.+@.+\..+/ },
  passwordHash: { type: String, required: true },
  
  // Web3 Wallet Integration
  walletAddress: { 
    type: String, 
    unique: true, 
    sparse: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  walletConnectedAt: { type: Date },
  lastWalletActivity: { type: Date },

  // Personal Information
  firstName: { type: String ,required: true},
  middleName: { type: String },
  lastName: { type: String ,required: true},
  fatherOrSpouseName: { type: String },
  dateOfBirth: { type: Date ,required: true},
  phoneNumber: { type: String, match: /^\+91[0-9]{10}$/ ,required: true},
  pan: { type: String, match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ ,required: true},
  aadhaar: { type: String, match: /^[0-9]{12}$/ ,required: true},

  // Address Information
  streetAddress: { type: String ,required: true},
  areaLocality: { type: String ,required: true},
  city: { type: String ,required: true},
  state: { type: String ,required: true},
  pinCode: { type: String, match: /^[0-9]{6}$/,required: true },
  country: { type: String, default: "India",required: true },

  // Employment & Occupation Details
  employmentStatus: { type: String,required: true ,enum: [
    "Salaried Employee", "Self-employed Professional", "Business Owner", "Farmer", "Student", "Housewife/Homemaker", "Retired", "Unemployed"
  ] },
  occupationCategory: { type: String, required: true, enum: [
    "Government Employee", "Private Sector Employee", "Public Sector Employee", "Doctor/Medical Professional", "Engineer/IT Professional", "Teacher/Professor", "Lawyer/Legal Professional", "Chartered Accountant/CA", "Architect", "Consultant", "Trader/Merchant", "Manufacturer", "Contractor", "Farmer/Agriculture", "Driver/Transport", "Shopkeeper/Retailer", "Freelancer", "Other Professional", "Other"
  ] },
  companyName: { type: String ,required: true},
  yearsOfExperience: { type: Number, min: 0 ,required: true},
  monthlyIncomeRange: { type: String, required: true, enum: [
    "Below ₹25,000", "₹25,000 - ₹50,000", "₹50,000 - ₹1,00,000", "₹1,00,000 - ₹2,00,000", "₹2,00,000 - ₹5,00,000", "Above ₹5,00,000"
  ] },

  // Basic Financial Information
  hasCreditAccounts: { type: Boolean ,required: true},
  creditPurpose: { type: String,required: true, enum: [
    "Personal Loan", "Credit Card", "Home Loan", "Car Loan", "Education Loan", "Business Loan", "Gold Loan", "Two-Wheeler Loan", "Other"
  ] },
  hasBankAccount: { type: Boolean ,required: true},
  primaryBankName: { type: String ,required: true},
  existingCreditScore: { type: Number, min: 0, required: true },

  // Legal & Compliance
  termsAccepted: { type: Boolean ,required: true},
  privacyPolicyAccepted: { type: Boolean ,required: true},
  consentCreditBureau: { type: Boolean ,required: true},
  ageVerified: { type: Boolean,required: true },
  itrStatus: { type: String, required: true, enum: [
    "Yes, regularly file ITR", "Filed ITR in past 2 years", "Never filed ITR"
  ] },

  // Optional
  educationalQualification: { type: String, enum: [
    "Below 10th", "10th Pass", "12th Pass", "Graduate", "Post Graduate", "Professional Degree", "Doctorate"
  ] },
  languagePreference: { type: String, enum: ["English", "Hindi", "Regional"] },
  communicationMethod: { type: String, enum: ["SMS", "Email", "WhatsApp"] },
  maritalStatus: { type: String, enum: ["Single", "Married", "Divorced", "Widowed"] },
  numberOfDependents: { type: Number, min: 0 },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);
