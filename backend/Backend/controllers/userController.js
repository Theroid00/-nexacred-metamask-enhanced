// /controllers/userController.js
import User from '../modals/User.js';
import bcrypt from "bcryptjs";  
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

// 1️⃣ Register a new user
export async function registerUser(req, res) {
  try {
    const {
      username, email, password, firstName, middleName, lastName, fatherOrSpouseName, dateOfBirth, phoneNumber, pan, aadhaar,
      streetAddress, areaLocality, city, state, pinCode, country,
      employmentStatus, occupationCategory, companyName, yearsOfExperience, monthlyIncomeRange,
      hasCreditAccounts, creditPurpose, hasBankAccount, primaryBankName, existingCreditScore,
      termsAccepted, privacyPolicyAccepted, consentCreditBureau, ageVerified, itrStatus,
      educationalQualification, languagePreference, communicationMethod, maritalStatus, numberOfDependents
    } = req.body;

    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: "Username or Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const user = await User.create({
      username, email, passwordHash,
      firstName, middleName, lastName, fatherOrSpouseName, dateOfBirth, phoneNumber, pan, aadhaar,
      streetAddress, areaLocality, city, state, pinCode, country,
      employmentStatus, occupationCategory, companyName, yearsOfExperience, monthlyIncomeRange,
      hasCreditAccounts, creditPurpose, hasBankAccount, primaryBankName, existingCreditScore,
      termsAccepted, privacyPolicyAccepted, consentCreditBureau, ageVerified, itrStatus,
      educationalQualification, languagePreference, communicationMethod, maritalStatus, numberOfDependents
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 2️⃣ Login user
export async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Optionally, save the token in the database if you want to track logins
    // user.token = token;
    // await user.save();

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// 3️⃣ Get all users
export async function getUsers(req, res) {
  try {
    const { username } = req.query;
    if (username) {
      const user = await User.findOne({ username }).select("-passwordHash");
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user });
    }
    const users = await User.find().select("-passwordHash"); // hide password
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// 4️⃣ Get user by ID
export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// 5️⃣ Update user
export async function updateUser(req, res) {
  try {
    const { username, email, aadhaarNumber } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, aadhaarNumber },
      { new: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// 6️⃣ Delete user
export async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// 7️⃣ Wallet Authentication
export async function walletAuth(req, res) {
  try {
    const { walletAddress, message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({ error: "Wallet address, message, and signature are required" });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Verify signature (in production, you'd implement proper signature verification)
    // For now, we'll use a basic verification
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    } catch (signatureError) {
      // Fallback: accept the signature for development (remove in production)
      console.warn('Signature verification failed, accepting for development:', signatureError.message);
    }

    // Check if user exists with this wallet address
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      // Create new user with wallet authentication
      const defaultPassword = Math.random().toString(36).substring(7);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      
      user = await User.create({
        username: `wallet_${walletAddress.slice(-8).toLowerCase()}`,
        email: `${walletAddress.toLowerCase()}@nexacred.wallet`,
        passwordHash,
        walletAddress: walletAddress.toLowerCase(),
        walletConnectedAt: new Date(),
        lastWalletActivity: new Date(),
        
        // Default values for required fields
        firstName: 'Wallet',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '+919999999999',
        pan: 'AAAAA0000A',
        aadhaar: '999999999999',
        streetAddress: 'Web3 Address',
        areaLocality: 'Blockchain',
        city: 'Crypto',
        state: 'Decentralized',
        pinCode: '000000',
        country: 'Global',
        employmentStatus: 'Self-employed Professional',
        occupationCategory: 'Other Professional',
        companyName: 'Decentralized Autonomous',
        yearsOfExperience: 1,
        monthlyIncomeRange: '₹50,000 - ₹1,00,000',
        hasCreditAccounts: false,
        creditPurpose: 'Personal Loan',
        hasBankAccount: true,
        primaryBankName: 'Crypto Bank',
        existingCreditScore: 650,
        termsAccepted: true,
        privacyPolicyAccepted: true,
        consentCreditBureau: true,
        ageVerified: true,
        itrStatus: 'Filed ITR in past 2 years'
      });
    } else {
      // Update last activity
      user.lastWalletActivity = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        email: user.email,
        walletAddress: user.walletAddress
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ 
      token, 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        walletConnectedAt: user.walletConnectedAt
      }
    });
  } catch (err) {
    console.error('Wallet auth error:', err);
    res.status(500).json({ error: "Server error during wallet authentication" });
  }
}
