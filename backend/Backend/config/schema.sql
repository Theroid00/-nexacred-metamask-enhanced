-- DDL Schema for NexaCred Database on Supabase (PostgreSQL)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    wallet_connected_at TIMESTAMP WITH TIME ZONE,
    last_wallet_activity TIMESTAMP WITH TIME ZONE,
    
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    father_or_spouse_name VARCHAR(255),
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    aadhaar VARCHAR(12) NOT NULL,
    
    street_address TEXT NOT NULL,
    area_locality VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    pin_code VARCHAR(6) NOT NULL,
    country VARCHAR(255) DEFAULT 'India' NOT NULL,
    
    employment_status VARCHAR(50) NOT NULL,
    occupation_category VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    years_of_experience INTEGER NOT NULL,
    monthly_income_range VARCHAR(50) NOT NULL,
    
    has_credit_accounts BOOLEAN NOT NULL,
    credit_purpose VARCHAR(50) NOT NULL,
    has_bank_account BOOLEAN NOT NULL,
    primary_bank_name VARCHAR(255) NOT NULL,
    existing_credit_score INTEGER NOT NULL,
    
    terms_accepted BOOLEAN NOT NULL,
    privacy_policy_accepted BOOLEAN NOT NULL,
    consent_credit_bureau BOOLEAN NOT NULL,
    age_verified BOOLEAN NOT NULL,
    itr_status VARCHAR(50) NOT NULL,
    
    educational_qualification VARCHAR(50),
    language_preference VARCHAR(50),
    communication_method VARCHAR(50),
    marital_status VARCHAR(50),
    number_of_dependents INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for user queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- 2. Credit Scores Table
CREATE TABLE IF NOT EXISTS credit_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 300 AND score <= 850),
    category VARCHAR(50) NOT NULL,
    ml_version VARCHAR(50) DEFAULT 'v1.0',
    confidence NUMERIC(3,2) DEFAULT 0.85,
    features_used TEXT[],
    reason_codes TEXT[],
    blockchain_tx_hash VARCHAR(66),
    verified_on_chain BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(20) DEFAULT 'Medium',
    flagged BOOLEAN DEFAULT FALSE,
    score_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user_id ON credit_scores(user_id);

-- 3. Loan History Table
CREATE TABLE IF NOT EXISTS history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrower UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    lender UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(20, 8) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('borrow', 'lend')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'defaulted')),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP WITH TIME ZONE,
    message TEXT,
    blockchain_loan_id INTEGER UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_history_borrower ON history(borrower);
CREATE INDEX IF NOT EXISTS idx_history_lender ON history(lender);

-- 4. Financial Guidelines Table (For RAG Chatbot queries)
CREATE TABLE IF NOT EXISTS guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index for RAG retrieval
CREATE INDEX IF NOT EXISTS idx_guidelines_content_fts ON guidelines USING gin(to_tsvector('english', content));

-- Trigger function for automatic updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_credit_scores_updated_at
    BEFORE UPDATE ON credit_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
