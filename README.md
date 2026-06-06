# 🚀 NexaCred Enhanced - DeFi Credit Scoring Platform

NexaCred is a modern, decentralized finance (DeFi) credit scoring and peer-to-peer lending platform. It combines traditional financial profile metrics with real-time on-chain transaction analysis to calculate dynamic credit ratings, write oracle scores on-chain, and provide RAG-driven financial advisory.

The project has been migrated to a **100% free serverless architecture** utilizing **Vercel** (for unified hosting of frontend and serverless API) and **Supabase PostgreSQL** (for database-native structures and vector matching).

---

## 🏗️ System Architecture

```
                       ┌──────────────────────────────────────┐
                       │      Vercel Deployment Domain        │
                       └──────────────────┬───────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         ┌──────────────────┐                            ┌──────────────────┐
         │ React Frontend   │                            │ Express API      │
         │ (Vite / Static)  │                            │ (Serverless)     │
         └────────┬─────────┘                            └────────┬─────────┘
                  │                                               │
                  │ (Web3 Actions)                                │ (Queries / Updates)
                  ├─────────────────┐   ┌─────────────────────────┼─────────────────┐
                  ▼                 ▼   ▼                         ▼                 ▼
             ┌──────────┐      ┌──────────┐                  ┌──────────┐      ┌──────────┐
             │ MetaMask │      │ Smart    │                  │ Supabase │      │ Etherscan│
             │ Extension│      │ Contracts│                  │ Postgres │      │ Developer│
             └──────────┘      └──────────┘                  └──────────┘      └──────────┘
```

* **Vercel Serverless Architecture**: Client assets and Node.js Express routes are served on the same domain. Vercel maps `/api/*` requests directly to serverless functions, bypassing CORS issues.
* **Supabase database**: Replaced Mongoose/MongoDB with standard Postgres SQL tables, custom triggers, and indexing.
* **On-Demand Event Syncing**: Serverless backends do not run persistent background listeners. Instead, when MetaMask connects to the frontend, a trigger calls the sync route to parse contract event logs (`LoanRequested` / `LoanFunded`) and updates user history.
* **Live Etherscan Crawler**: Integrates with the Etherscan developer API to inspect the connected wallet's live tx history and compute risk ratings dynamically, with a deterministic mock fallback.
* **OpenRouter RAG Chatbot Gateway**: Integrates OpenRouter's free `meta-llama/llama-3.1-8b-instruct:free` model with guidelines context search in Supabase.

---

## 📁 Cleaned Repository Structure

```
nexacred-metamask-enhanced/
├── 📄 README.md                    # Main documentation
├── 📄 vercel.json                  # Vercel deployment routes config
├── 📄 package.json                 # Root dependency tracker for Vercel builds
│
├── 🎨 frontend/                    # Vite + React Frontend
│   └── nexacred/
│       ├── package.json            # Frontend dependency manager
│       ├── vite.config.js          # Vite config
│       └── src/                    # React components, pages, hooks, assets
│
├── ⚙️ backend/                     # Serverless backend routes & logic
│   └── Backend/
│       ├── index.js                # Express app startup
│       ├── package.json            # Backend dependencies
│       ├── config/
│       │   ├── schema.sql          # Supabase Postgres schema definition
│       │   └── supabaseClient.js   # Supabase client singleton
│       ├── controllers/
│       │   ├── blockchainSyncController.js # Event sync & Oracle push
│       │   ├── riskAnalyzerController.js   # Live Etherscan analyzer
│       │   ├── userController.js           # Auth & profile managers
│       │   └── historyController.js        # Transaction logger
│       └── routers/
│           ├── chatbotRoutes.js    # OpenRouter LLM gateway
│           └── riskRoutes.js       # Sync & analysis routes
│
├── ⛓️ blockchain/                   # Smart Contracts (Hardhat)
│   ├── contracts/
│   │   ├── NexaCred.sol            # Main lending contract
│   │   └── CreditScore.sol         # Credit registry contract
│   └── scripts/
│       └── deploy.js               # Contract deployment script
│
└── 🤖 ml/                          # Credit scoring model training & guidelines
    └── Credit_Scoring/
```

---

## ⚙️ Environment Variables Config

Configure these variables inside your Vercel Dashboard under **Project Settings**:

| Key | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project API URL | `https://yourproject.supabase.co` |
| `SUPABASE_KEY` | Your Supabase Project `anon` public key | *Secret Key from API Settings* |
| `JWT_SECRET` | Secret key for signing authorization tokens | *Random secret string* |
| `CHATBOT_API_KEY` | OpenRouter developer key (Optional) | *sk-or-v1-YourKey...* |
| `CHATBOT_API_URL` | Custom LLM completions endpoint (Optional) | *Defaults to OpenRouter completions endpoint* |
| `CHATBOT_MODEL` | Custom AI Model ID (Optional) | *Defaults to meta-llama/llama-3.1-8b-instruct:free* |
| `ETHERSCAN_API_KEY` | Etherscan API Key for live wallet analysis | *Your Etherscan API key* |
| `WEB3_PROVIDER_URL` | EVM Node RPC provider URL (Optional) | *e.g., Infura or Sepolia endpoint* |
| `NEXACRED_CONTRACT_ADDRESS` | Deployed NexaCred contract address (Optional)| *e.g., 0xYourContractAddress...* |
| `PRIVATE_KEY` | EVM admin wallet key for Oracle writes (Optional)| *Oracle admin private key* |

---

## 🚀 Quick Start & Deployment

### 1. Initialize Supabase PostgreSQL
1. Create a free project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** tab.
3. Paste the contents of `backend/Backend/config/schema.sql` and click **Run**. This generates all required tables, triggers, and indices.

### 2. Run Locally for Testing

#### A. Install Dependencies
```bash
# Frontend
cd frontend/nexacred
npm install

# Backend
cd ../../backend/Backend
npm install
```

#### B. Setup Local Config
Create a `.env` file inside `backend/Backend/`:
```env
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
CHATBOT_API_KEY=your_openrouter_api_key
ETHERSCAN_API_KEY=your_etherscan_key
```

#### C. Spin Up the Dev Server
```bash
# Start backend API (from backend/Backend)
npm run dev

# Start React app (from frontend/nexacred)
npm run dev
```

### 3. Deploy to Vercel
1. Commit all files on the `vercel-supabase-migration` branch and push to your remote repository.
2. In your Vercel Dashboard, select **Add New Project** and import the repository.
3. Add the **Environment Variables** in the Vercel Settings panel.
4. Click **Deploy**. Vercel will automatically compile the React frontend bundle and configure the serverless function endpoints.
