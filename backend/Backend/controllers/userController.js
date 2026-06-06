import supabase from '../config/supabaseClient.js';
import bcrypt from "bcryptjs";  
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

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
    pan: dbUser.pan,
    aadhaar: dbUser.aadhaar,
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

    // Save user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (insertError) throw insertError;

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
    
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const camelUser = mapUserToCamelCase(user);

    const token = jwt.sign(
      { userId: camelUser._id, username: camelUser.username, email: camelUser.email },
      process.env.JWT_SECRET || 'dev_jwt_secret_key',
      { expiresIn: "14d" }
    );

    res.json({ token, user: camelUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 3️⃣ Get all users
export async function getUsers(req, res) {
  try {
    const { username } = req.query;
    if (username) {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user: mapUserToCamelCase(user) });
    }

    const { data: users, error: fetchAllError } = await supabase
      .from('users')
      .select('*');

    if (fetchAllError) throw fetchAllError;
    res.json(users.map(mapUserToCamelCase));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 4️⃣ Get user by ID
export async function getUserById(req, res) {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(mapUserToCamelCase(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 5️⃣ Update user
export async function updateUser(req, res) {
  try {
    const updateData = mapBodyToSnakeCase(req.body);

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    if (!user) return res.status(404).json({ error: "User not found" });

    // If credit score was updated, push it to the blockchain via oracle helper
    if (req.body.existingCreditScore && user.wallet_address) {
      import('./blockchainSyncController.js').then(({ pushScoreToChain }) => {
        pushScoreToChain(user.wallet_address, Number(user.existing_credit_score));
      }).catch(err => console.error("Oracle score push trigger failed:", err.message));
    }

    res.json({ message: "User updated", user: mapUserToCamelCase(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// 6️⃣ Delete user
export async function deleteUser(req, res) {
  try {
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
    let { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    if (fetchError) throw fetchError;
    
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

      const { data: createdUser, error: insertError } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();

      if (insertError) throw insertError;
      user = createdUser;

      // New Web3 user gets default score registered on blockchain oracle
      import('./blockchainSyncController.js').then(({ pushScoreToChain }) => {
        pushScoreToChain(normalizedAddress, 650);
      }).catch(err => console.error("Oracle score push trigger failed:", err.message));
    } else {
      // Update last activity
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_wallet_activity: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    }

    const camelUser = mapUserToCamelCase(user);

    const token = jwt.sign(
      { 
        userId: camelUser._id, 
        username: camelUser.username, 
        email: camelUser.email,
        walletAddress: camelUser.walletAddress
      },
      process.env.JWT_SECRET || 'dev_jwt_secret_key',
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
