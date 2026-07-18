import supabase from '../config/supabaseClient.js';
import mockStore from '../config/mockStore.js';
import bcrypt from "bcryptjs";  
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ethers } from "ethers";
import crypto from "crypto";

dotenv.config();

// PII Encryption Helper functions
const PII_ALGORITHM = 'aes-256-cbc';
const PII_ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || 'a_very_secret_32_byte_key_for_pii';
const IV_LENGTH = 16;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error("CRITICAL: JWT_SECRET environment variable is not set in production. Hard-failing startup.");
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set in production. Hard-failing startup.");
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev_jwt_secret_key';

export function encryptPII(text) {
  if (!text) return text;
  if (typeof text !== 'string') text = String(text);
  if (text.startsWith('enc:')) return text;
  
  const key = crypto.createHash('sha256').update(PII_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(PII_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `enc:${iv.toString('hex')}:${encrypted}`;
}

export function decryptPII(text) {
  if (!text || typeof text !== 'string' || !text.startsWith('enc:')) return text;
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');
    const key = crypto.createHash('sha256').update(PII_ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(PII_ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error("PII Decryption failed:", err.message);
    return text;
  }
}

// Helper to map DB snake_case structure to Frontend camelCase structure
const mapUserToCamelCase = (dbUser) => {
  if (!dbUser) return null;
  return {
    _id: dbUser.id, // Map Postgres id to Mongo _id for frontend compatibility
    username: dbUser.username,
    email: dbUser.email,
    walletAddress: dbUser.wallet_address,
    walletConnectedAt: dbUser.wallet_connected_at,
    lastWalletActivity: dbUser.last_wallet_activity,
    firstName: dbUser.first_name,
    middleName: dbUser.middle_name,
    lastName: dbUser.last_name,
    fatherOrSpouseName: dbUser.father_or_spouse_name,
    dateOfBirth: dbUser.date_of_birth,
    phoneNumber: dbUser.phone_number,
    pan: decryptPII(dbUser.pan),
    aadhaar: decryptPII(dbUser.aadhaar),
    streetAddress: dbUser.street_address,
    areaLocality: dbUser.area_locality,
    city: dbUser.city,
    state: dbUser.state,
    pinCode: dbUser.pin_code,
    country: dbUser.country,
    employmentStatus: dbUser.employment_status,
    occupationCategory: dbUser.occupation_category,
    companyName: dbUser.company_name,
    yearsOfExperience: dbUser.years_of_experience,
    monthlyIncomeRange: dbUser.monthly_income_range,
    hasCreditAccounts: dbUser.has_credit_accounts,
    creditPurpose: dbUser.credit_purpose,
    hasBankAccount: dbUser.has_bank_account,
    primaryBankName: dbUser.primary_bank_name,
    existingCreditScore: dbUser.existing_credit_score,
    termsAccepted: dbUser.terms_accepted,
    privacyPolicyAccepted: dbUser.privacy_policy_accepted,
    consentCreditBureau: dbUser.consent_credit_bureau,
    ageVerified: dbUser.age_verified,
    itrStatus: dbUser.itr_status,
    educationalQualification: dbUser.educational_qualification,
    languagePreference: dbUser.language_preference,
    communicationMethod: dbUser.communication_method,
    maritalStatus: dbUser.marital_status,
    numberOfDependents: dbUser.number_of_dependents,
    createdAt: dbUser.created_at
  };
};

const mapBodyToSnakeCase = (body) => {
  const mapping = {
    username: 'username',
    email: 'email',
    passwordHash: 'password_hash',
    walletAddress: 'wallet_address',
    walletConnectedAt: 'wallet_connected_at',
    lastWalletActivity: 'last_wallet_activity',
    firstName: 'first_name',
    middleName: 'middle_name',
    lastName: 'last_name',
    fatherOrSpouseName: 'father_or_spouse_name',
    dateOfBirth: 'date_of_birth',
    phoneNumber: 'phone_number',
    pan: 'pan',
    aadhaar: 'aadhaar',
    streetAddress: 'street_address',
    areaLocality: 'area_locality',
    city: 'city',
    state: 'state',
    pinCode: 'pin_code',
    country: 'country',
    employmentStatus: 'employment_status',
    occupationCategory: 'occupation_category',
    companyName: 'company_name',
    yearsOfExperience: 'years_of_experience',
    monthlyIncomeRange: 'monthly_income_range',
    hasCreditAccounts: 'has_credit_accounts',
    creditPurpose: 'credit_purpose',
    hasBankAccount: 'has_bank_account',
    primaryBankName: 'primary_bank_name',
    existingCreditScore: 'existing_credit_score',
    termsAccepted: 'terms_accepted',
    privacyPolicyAccepted: 'privacy_policy_accepted',
    consentCreditBureau: 'consent_credit_bureau',
    ageVerified: 'age_verified',
    itrStatus: 'itr_status',
    educationalQualification: 'educational_qualification',
    languagePreference: 'language_preference',
    communicationMethod: 'communication_method',
    maritalStatus: 'marital_status',
    numberOfDependents: 'number_of_dependents'
  };

  const result = {};
  for (const [key, value] of Object.entries(body)) {
    if (mapping[key] !== undefined && value !== undefined) {
      result[mapping[key]] = value;
    }
  }
  return result;
};

// 1️⃣ Register a new user
export async function registerUser(req, res) {
  try {
    const body = req.body;
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    if (body.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(body.pan.toUpperCase())) {
        return res.status(400).json({ error: "Invalid PAN format (expected ABCDE1234F)" });
      }
      body.pan = body.pan.toUpperCase();
    }

    if (body.aadhaar) {
      const cleanAadhaar = String(body.aadhaar).replace(/[\s-]/g, '');
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(cleanAadhaar)) {
        return res.status(400).json({ error: "Invalid Aadhaar format (expected 12 digits)" });
      }
      body.aadhaar = cleanAadhaar;
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username, email')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Prepare database fields
    const insertData = mapBodyToSnakeCase(body);
    insertData.password_hash = passwordHash;
    if (insertData.pan) insertData.pan = encryptPII(insertData.pan);
    if (insertData.aadhaar) insertData.aadhaar = encryptPII(insertData.aadhaar);

    // Attempt save user in Supabase with mockStore fallback
    let newUser;
    try {
      const { data: created, error: insertError } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();
      if (insertError) throw insertError;
      newUser = created;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Registering user in Local MockStore:", dbErr.message);
      newUser = mockStore.createUser(insertData);
    }

    res.status(201).json({ message: "User registered successfully", user: mapUserToCamelCase(newUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}

// 2️⃣ Login user
export async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    
    let user;
    try {
      const { data: fetched, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (fetchError) throw fetchError;
      user = fetched;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Authenticating via Local MockStore:", dbErr.message);
      user = mockStore.findUserByUsername(username);
    }

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const camelUser = mapUserToCamelCase(user);

    const token = jwt.sign(
      { userId: camelUser._id, username: camelUser.username, email: camelUser.email },
      EFFECTIVE_JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.json({ token, user: camelUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function getUsers(req, res) {
  try {
    const { username } = req.query;
    if (username) {
      let user;
      try {
        const { data: fetched, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .maybeSingle();
        if (fetchError) throw fetchError;
        user = fetched;
      } catch (dbErr) {
        console.warn("Supabase unreachable. Finding user by username in Local MockStore:", dbErr.message);
        user = mockStore.findUserByUsername(username);
      }

      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user: mapUserToCamelCase(user) });
    }

    let users;
    try {
      const { data: fetchedAll, error: fetchAllError } = await supabase
        .from('users')
        .select('*');
      if (fetchAllError) throw fetchAllError;
      users = fetchedAll;
    } catch (dbErr) {
      users = Array.from(mockStore.users.values());
    }

    // Strip PII from the user list response to prevent exposure
    const safeUsers = users.map(user => {
      const camelUser = mapUserToCamelCase(user);
      if (req.user && req.user.userId !== camelUser._id) {
        delete camelUser.pan;
        delete camelUser.aadhaar;
        delete camelUser.phoneNumber;
        delete camelUser.streetAddress;
        delete camelUser.areaLocality;
      }
      return camelUser;
    });

    res.json(safeUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function getUserById(req, res) {
  try {
    let user;
    try {
      const { data: fetched, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      user = fetched;
    } catch (dbErr) {
      user = mockStore.findUserById(req.params.id);
    }

    if (!user) return res.status(404).json({ error: "User not found" });
    
    const camelUser = mapUserToCamelCase(user);
    if (req.user && req.user.userId !== req.params.id) {
      delete camelUser.pan;
      delete camelUser.aadhaar;
      delete camelUser.phoneNumber;
      delete camelUser.streetAddress;
      delete camelUser.areaLocality;
    }
    
    res.json(camelUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 5️⃣ Update user
export async function updateUser(req, res) {
  try {
    // Authorization Check: A user can only update their own profile
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    if (req.body.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(req.body.pan.toUpperCase())) {
        return res.status(400).json({ error: "Invalid PAN format (expected ABCDE1234F)" });
      }
      req.body.pan = req.body.pan.toUpperCase();
    }

    if (req.body.aadhaar) {
      const cleanAadhaar = String(req.body.aadhaar).replace(/[\s-]/g, '');
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(cleanAadhaar)) {
        return res.status(400).json({ error: "Invalid Aadhaar format (expected 12 digits)" });
      }
      req.body.aadhaar = cleanAadhaar;
    }

    const updateData = mapBodyToSnakeCase(req.body);
    if (updateData.pan) updateData.pan = encryptPII(updateData.pan);
    if (updateData.aadhaar) updateData.aadhaar = encryptPII(updateData.aadhaar);

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!user) return res.status(404).json({ error: "User not found" });

    // Rotate JWT token if password or identity changed
    let token = undefined;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password_hash = await bcrypt.hash(req.body.password, salt);
      delete req.body.password;
      token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email, iat: Math.floor(Date.now() / 1000) },
        EFFECTIVE_JWT_SECRET,
        { expiresIn: "14d" }
      );
    }

    // If credit score was updated, push it to the blockchain via oracle helper
    if (req.body.existingCreditScore && user.wallet_address) {
      import('./blockchainSyncController.js').then(({ pushScoreToChain }) => {
        pushScoreToChain(user.wallet_address, Number(user.existing_credit_score));
      }).catch(err => console.error("Oracle score push trigger failed:", err.message));
    }

    res.json({ message: "User updated", user: mapUserToCamelCase(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 6️⃣ Delete user
export async function deleteUser(req, res) {
  try {
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: "Access denied. You can only delete your own profile." });
    }

    const { data: user, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (deleteError) throw deleteError;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
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

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    } catch (signatureError) {
      console.error('Signature verification failed:', signatureError.message);
      return res.status(400).json({ error: "Signature verification failed: " + signatureError.message });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Check if user exists with this wallet address
    let user;
    try {
      const { data: fetched, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();
      if (fetchError) throw fetchError;
      user = fetched;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Checking wallet in Local MockStore:", dbErr.message);
      user = mockStore.findUserByWallet(normalizedAddress);
    }
    
    if (!user) {
      // Create new user with wallet authentication
      const defaultPassword = Math.random().toString(36).substring(7);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      
      const insertData = {
        username: `wallet_${normalizedAddress.slice(-8).toLowerCase()}`,
        email: `${normalizedAddress}@nexacred.wallet`,
        password_hash: passwordHash,
        wallet_address: normalizedAddress,
        wallet_connected_at: new Date().toISOString(),
        last_wallet_activity: new Date().toISOString(),
        
        first_name: 'Wallet',
        last_name: 'User',
        date_of_birth: '1990-01-01',
        phone_number: '+919999999999',
        pan: 'AAAAA0000A',
        aadhaar: '999999999999',
        street_address: 'Web3 Address',
        area_locality: 'Blockchain',
        city: 'Crypto',
        state: 'Decentralized',
        pin_code: '000000',
        country: 'Global',
        employment_status: 'Self-employed Professional',
        occupation_category: 'Other Professional',
        company_name: 'Decentralized Autonomous',
        years_of_experience: 1,
        monthly_income_range: '₹50,000 - ₹1,00,000',
        has_credit_accounts: false,
        credit_purpose: 'Personal Loan',
        has_bank_account: true,
        primary_bank_name: 'Crypto Bank',
        existing_credit_score: 650,
        terms_accepted: true,
        privacy_policy_accepted: true,
        consent_credit_bureau: true,
        age_verified: true,
        itr_status: 'Filed ITR in past 2 years'
      };

      try {
        const { data: createdUser, error: insertError } = await supabase
          .from('users')
          .insert([insertData])
          .select()
          .single();
        if (insertError) throw insertError;
        user = createdUser;
      } catch (dbErr) {
        console.warn("Supabase unreachable. Creating wallet user in Local MockStore:", dbErr.message);
        user = mockStore.createUser(insertData);
      }

      // New Web3 user gets default score registered on blockchain oracle
      import('./blockchainSyncController.js').then(({ pushScoreToChain }) => {
        pushScoreToChain(normalizedAddress, 650);
      }).catch(err => console.error("Oracle score push trigger failed:", err.message));
    } else {
      // Update last activity
      try {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ last_wallet_activity: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();
        if (updateError) throw updateError;
        user = updatedUser;
      } catch (dbErr) {
        user = mockStore.updateUser(user.id, { last_wallet_activity: new Date().toISOString() });
      }
    }

    const camelUser = mapUserToCamelCase(user);

    const token = jwt.sign(
      { 
        userId: camelUser._id, 
        username: camelUser.username, 
        email: camelUser.email,
        walletAddress: camelUser.walletAddress
      },
      EFFECTIVE_JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ 
      token, 
      user: {
        _id: camelUser._id,
        username: camelUser.username,
        email: camelUser.email,
        walletAddress: camelUser.walletAddress,
        firstName: camelUser.firstName,
        lastName: camelUser.lastName,
        walletConnectedAt: camelUser.walletConnectedAt
      }
    });
  } catch (err) {
    console.error('Wallet auth error:', err);
    res.status(500).json({ error: "Server error during wallet authentication" });
  }
}

// 8️⃣ Get currently logged in user profile (using req.user.userId from token)
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.userId;
    let user;
    try {
      const { data: fetched, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      user = fetched;
    } catch (dbErr) {
      console.warn("Supabase unreachable. Fetching current user from Local MockStore:", dbErr.message);
      user = mockStore.findUserById(userId);
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user: mapUserToCamelCase(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
