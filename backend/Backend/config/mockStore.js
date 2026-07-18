import bcrypt from 'bcryptjs';

// Pre-computed bcrypt hash for password "password123"
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

class MockStore {
  constructor() {
    this.users = new Map();
    this.history = [];

    // Seed initial demo user
    const demoUser = {
      id: 'demo-user-uuid-1001',
      username: 'demouser',
      email: 'demo@nexacred.com',
      password_hash: DEMO_PASSWORD_HASH,
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      wallet_connected_at: new Date().toISOString(),
      last_wallet_activity: new Date().toISOString(),
      first_name: 'Demo',
      last_name: 'User',
      date_of_birth: '1995-05-15',
      phone_number: '+919876543210',
      pan: 'ABCDE1234F',
      aadhaar: '999988887777',
      street_address: '123 Tech Park',
      area_locality: 'Silicon Valley',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin_code: '560001',
      country: 'India',
      employment_status: 'Salaried Full-time',
      occupation_category: 'IT / Technology',
      company_name: 'NexaCred Labs',
      years_of_experience: 4,
      monthly_income_range: '₹1,00,000 - ₹2,00,000',
      has_credit_accounts: true,
      credit_purpose: 'Home Improvement',
      has_bank_account: true,
      primary_bank_name: 'HDFC Bank',
      existing_credit_score: 750,
      terms_accepted: true,
      privacy_policy_accepted: true,
      consent_credit_bureau: true,
      age_verified: true,
      itr_status: 'Filed ITR in past 2 years',
      created_at: new Date().toISOString()
    };

    this.users.set(demoUser.id, demoUser);

    // Seed initial demo borrowing history
    this.history.push({
      id: 'loan-hist-001',
      user_id: demoUser.id,
      amount: 5000,
      term_months: 12,
      interest_rate: 8.5,
      purpose: 'Home Renovation',
      status: 'APPROVED',
      risk_score: 750,
      risk_tier: 'Low Risk',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  findUserByUsername(username) {
    if (!username) return null;
    return Array.from(this.users.values()).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    ) || null;
  }

  findUserByEmail(email) {
    if (!email) return null;
    return Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    ) || null;
  }

  findUserByWallet(walletAddress) {
    if (!walletAddress) return null;
    return Array.from(this.users.values()).find(
      u => u.wallet_address && u.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    ) || null;
  }

  findUserById(id) {
    return this.users.get(id) || null;
  }

  createUser(userData) {
    const id = userData.id || `mock-user-${Date.now()}`;
    const user = {
      ...userData,
      id,
      created_at: userData.created_at || new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  updateUser(id, updateData) {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updateData };
    this.users.set(id, updated);
    return updated;
  }

  getHistoryByUserId(userId) {
    return this.history.filter(h => h.user_id === userId);
  }

  addHistory(historyData) {
    const item = {
      id: `loan-hist-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...historyData
    };
    this.history.push(item);
    return item;
  }
}

export const mockStore = new MockStore();
export default mockStore;
