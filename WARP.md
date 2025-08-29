# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NexaCred Enhanced is a production-ready DeFi credit scoring platform that bridges traditional finance with Web3. It combines traditional ML-based credit scoring with blockchain transaction analysis, featuring MetaMask integration, hybrid authentication, and real-time risk assessment.

## Architecture

The system follows a microservices architecture with these main components:

### Frontend (React + Web3)
- **Location**: `frontend/nexacred/`
- **Tech Stack**: React 19.1, Vite 7.1, Tailwind CSS 4.1, ethers.js 6.8
- **Key Features**: MetaMask integration, wallet authentication, risk report visualization

### Backend Services
1. **Main API Server** (`backend/Backend/`)
   - Node.js + Express with MongoDB
   - Handles user management, authentication, credit profiles
   
2. **Transaction Analyzer** (`backend/services/transactionAnalyzer.py`)
   - FastAPI microservice for wallet risk analysis
   - Generates credit scores based on on-chain behavior

3. **Legacy Flask API** (`backend/app.py`)
   - Original Flask-based credit scoring system
   - Contains ML model integration

### Blockchain Layer
- **Smart Contracts**: `blockchain/contracts/`
- **NexaCred.sol**: P2P lending platform with credit integration
- **CreditScore.sol**: Immutable credit score storage and verification
- **Network Support**: Ethereum, Polygon, Sepolia, Arbitrum

### ML Components
- **Credit Scoring**: `ml/Credit_Scoring/` - AAVE protocol-based scoring
- **RAG Chatbot**: `ml/rag_chatbot/` - AI-powered customer support

## Common Development Commands

### Frontend Development
```bash
cd frontend/nexacred
npm install                 # Install dependencies
npm run dev                # Start development server (http://localhost:5173)
npm run build              # Build for production
npm run lint               # Run ESLint
```

### Main Backend API
```bash
cd backend/Backend
npm install                 # Install dependencies
npm start                  # Start Node.js server (http://localhost:5000)
```

### Transaction Analyzer Service
```bash
cd backend/services
pip install -r requirements.txt
python -m uvicorn transactionAnalyzer:app --reload --port 8000
# Runs on http://localhost:8000 with API docs at /docs
```

### Legacy Flask Backend
```bash
cd backend
pip install -r requirements.txt
python app.py              # Start Flask server (http://localhost:5000)
```

### Blockchain Development
```bash
cd blockchain
npm install                 # Install Hardhat and dependencies
npm run compile            # Compile smart contracts
npm run test              # Run contract tests
npm run node              # Start local Hardhat network
npm run deploy:local      # Deploy contracts locally
npm run deploy:testnet    # Deploy to Sepolia testnet
npm run deploy:mainnet    # Deploy to mainnet (production)
```

### ML Model Training
```bash
cd ml/Credit_Scoring
pip install -r requirements.txt
python scripts/train_model.py        # Train credit scoring model
python scripts/feature_engineering.py # Generate features from transaction data
streamlit run app.py                 # Launch ML model dashboard
```

### Running Full Stack Locally
```bash
# Terminal 1: Start MongoDB (required)
brew services start mongodb/brew/mongodb-community  # macOS
# OR: sudo systemctl start mongod  # Linux

# Terminal 2: Frontend
cd frontend/nexacred && npm run dev

# Terminal 3: Main Backend
cd backend/Backend && npm start

# Terminal 4: Transaction Analyzer
cd backend/services && python -m uvicorn transactionAnalyzer:app --reload --port 8000

# Terminal 5 (Optional): Local blockchain
cd blockchain && npx hardhat node
```

## Key Integration Points

### Web3 Wallet Integration
- **Hook**: `frontend/nexacred/src/hooks/useMetaMask.js`
- Manages wallet connections, network switching, balance tracking
- Supports signature-based authentication
- Multi-network support with automatic reconnection

### Hybrid Authentication System
Two authentication methods available:
1. **Traditional**: Username/password with JWT tokens
2. **Web3**: MetaMask signature verification with automatic user creation

**Authentication Flow**:
```javascript
// Traditional
POST /api/users/login { username, password }

// Web3
POST /api/users/wallet-auth { walletAddress, message, signature }
```

### Risk Analysis Pipeline
1. **Frontend** triggers analysis via wallet connection
2. **Transaction Analyzer** (`transactionAnalyzer.py`) processes on-chain data
3. **Risk scoring** based on wallet age, DeFi interactions, protocol usage
4. **Results** displayed in real-time dashboard

### Smart Contract Integration
- **Credit Score Contract**: Immutable score storage with audit trails
- **Lending Platform**: P2P loans with automated matching
- **Integration Points**: See `blockchain/INTEGRATION_GUIDE.md` for detailed backend integration

## Development Environment Setup

### Required Environment Variables

**Frontend** (`.env`):
```bash
VITE_API_URL=http://localhost:5000
VITE_ANALYZER_URL=http://localhost:8000
```

**Backend** (`.env`):
```bash
JWT_SECRET=your_super_secure_jwt_secret
MONGODB_URI=mongodb://localhost:27017/nexacred
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Blockchain** (`.env`):
```bash
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Testing Strategies

### Frontend Testing
```bash
cd frontend/nexacred
npm run lint              # Code quality checks
```

### Smart Contract Testing
```bash
cd blockchain
npm run test              # Run Hardhat tests
```

### API Testing
- **Node.js API**: Manual testing through frontend or Postman
- **FastAPI Service**: Auto-generated docs at `http://localhost:8000/docs`
- **ML Models**: Streamlit interface at respective component directories

### Integration Testing Checklist
- [ ] MetaMask connection/disconnection
- [ ] Network switching between supported chains
- [ ] Wallet authentication flow vs traditional login
- [ ] Risk report generation for connected wallets
- [ ] Transaction analysis API responses
- [ ] Cross-service communication (Frontend ↔ Backend ↔ Analyzer)

## Architecture Patterns

### State Management
- **Frontend**: React hooks pattern with useMetaMask for Web3 state
- **Backend**: Stateless API design with JWT authentication
- **Database**: MongoDB with Mongoose ODM for flexible schema evolution

### Microservices Communication
- **Synchronous**: HTTP/REST APIs between frontend and backend services
- **Asynchronous**: Event-driven blockchain integration (via smart contract events)
- **Service Discovery**: Hardcoded URLs for development, configurable for production

### Data Flow
1. **User Authentication**: Frontend → Backend API → MongoDB
2. **Wallet Connection**: Frontend → MetaMask → ethers.js validation
3. **Risk Analysis**: Frontend → Transaction Analyzer → Mock/Real blockchain data → Risk score
4. **Credit Scoring**: Backend → ML Models → Database persistence
5. **Blockchain Integration**: Backend → Smart Contracts → On-chain storage

## Production Deployment Notes

### Docker Support
Currently manual deployment. Future enhancement: Docker Compose setup for all services.

### Scaling Considerations
- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend APIs**: Horizontal scaling with load balancer
- **Database**: MongoDB Atlas with replica sets
- **Blockchain**: Multiple RPC providers for redundancy

### Security Implementation
- **Web3 Security**: Non-custodial, signature-based auth, no private key storage
- **API Security**: JWT tokens, CORS configuration, input validation
- **Smart Contract Security**: Access controls, reentrancy protection, emergency pause

### Performance Optimizations
- **Frontend**: Code splitting, lazy loading, Vite build optimizations
- **Backend**: MongoDB indexing, connection pooling
- **Blockchain**: Gas optimization, batch operations

## Key Files for Understanding System

### Critical Frontend Files
- `src/hooks/useMetaMask.js` - Core Web3 integration logic
- `src/components/WalletConnection.jsx` - Wallet UI component
- `src/components/RiskReport.jsx` - Risk visualization dashboard
- `src/pages/Dashboard.jsx` - Main application interface

### Critical Backend Files
- `backend/Backend/controllers/userController.js` - User and wallet auth logic
- `backend/services/transactionAnalyzer.py` - Core risk analysis engine
- `backend/Backend/modals/User.js` - User data schema with Web3 fields

### Critical Smart Contract Files
- `blockchain/contracts/NexaCred.sol` - P2P lending platform
- `blockchain/web3_integration.py` - Blockchain integration utilities
- `blockchain/INTEGRATION_GUIDE.md` - Comprehensive integration documentation

This codebase represents a sophisticated DeFi application that seamlessly integrates traditional fintech with Web3 technologies, making it an excellent reference for building production-ready blockchain-enabled financial services.
