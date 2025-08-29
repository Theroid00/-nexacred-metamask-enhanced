# 🚀 NexaCred Enhanced - Complete DeFi Credit Scoring Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-19.1-blue.svg)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Web3-purple.svg)](https://ethereum.org/)

## 🌟 Overview

NexaCred Enhanced is a production-ready decentralized finance (DeFi) credit scoring platform that revolutionizes lending by combining traditional financial data with blockchain transaction analysis. The platform provides comprehensive credit assessment, peer-to-peer lending, and AI-powered financial advisory services with complete MetaMask integration.

## ✨ Key Features

### 🔗 **MetaMask Web3 Integration**
- Complete wallet connection system with React hooks
- Multi-network support (Mainnet, Polygon, Sepolia, Arbitrum)
- Real-time balance tracking and network switching
- Auto-reconnection and account change detection

### 🔐 **Hybrid Authentication System**
- Traditional login (username/password)
- Web3 wallet authentication (MetaMask signature)
- Automatic user creation for new wallet addresses
- JWT token management for both authentication methods

### 📊 **Advanced Credit Scoring**
- Machine learning-based credit assessment using LightGBM
- AAVE protocol transaction analysis
- DeFi behavior pattern recognition
- Traditional financial data integration
- Real-time risk scoring (300-850 scale)

### 🤖 **AI-Powered Financial Advisory**
- RAG (Retrieval-Augmented Generation) chatbot
- IBM Granite 3.1 8B Instruct model
- Indian financial regulation expertise
- MongoDB Atlas Vector Search integration
- Interactive CLI and REST API interfaces

### 🏦 **Peer-to-Peer Lending**
- Smart contract-based lending platform
- Automated loan matching
- Risk-based interest rate calculation
- Collateral management and liquidation
- Comprehensive loan lifecycle management

### 📈 **Transaction Analysis**
- Real-time wallet behavior analysis
- DeFi protocol interaction tracking
- Fraud detection and risk assessment
- Comprehensive financial reports

## 🏗️ Architecture

### **System Components**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Solidity)    │
│                 │    │                 │    │                 │
│ • MetaMask      │    │ • REST API      │    │ • Smart         │
│ • Dashboard     │    │ • JWT Auth      │    │   Contracts     │
│ • Web3 UI       │    │ • MongoDB       │    │ • NexaCred      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   ML Services   │    │   AI Chatbot    │
                       │   (Python)      │    │   (Python)      │
                       │                 │    │                 │
                       │ • Credit        │    │ • RAG System    │
                       │   Scoring       │    │ • IBM Granite   │
                       │ • Risk Analysis │    │ • Financial     │
                       │ • LightGBM      │    │   Advisory      │
                       └─────────────────┘    └─────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **React 19.1** - Modern UI framework
- **Vite 7.1** - Fast build system
- **Tailwind CSS 4.1** - Utility-first styling
- **ethers.js 6.8** - Web3 interactions
- **lucide-react 0.540** - Professional icons

#### **Backend**
- **Node.js + Express** - Main API server
- **Python + FastAPI** - ML services and transaction analysis
- **MongoDB + Mongoose** - Database and ODM
- **JWT Authentication** - Secure session management
- **Flask** - Additional Python services

#### **Blockchain**
- **Solidity ^0.8.19** - Smart contract development
- **Hardhat** - Development framework
- **ethers.js** - Blockchain integration
- **Multi-network support** - Ethereum, Polygon, Arbitrum

#### **Machine Learning**
- **LightGBM** - Credit scoring model
- **Scikit-learn** - Data preprocessing
- **Pandas/NumPy** - Data analysis
- **IBM Granite 3.1 8B** - AI language model

#### **AI & RAG System**
- **Transformers** - Model loading and inference
- **Sentence Transformers** - Text embeddings
- **MongoDB Atlas Vector Search** - Vector database
- **FastAPI** - API service
- **Hugging Face Hub** - Model management

## 📁 Project Structure

```
nexacred-metamask-enhanced/
├── 📄 README.md                    # This file
├── 📄 docker-compose.yml           # Development orchestration
├── 📄 docker-compose.prod.yml      # Production orchestration
├── 📄 DEPLOYMENT_INSTRUCTIONS.md   # Deployment guide
├── 📄 AWS_DEPLOYMENT_GUIDE.md      # AWS-specific deployment
├── 📄 METAMASK_INTEGRATION_COMPLETE.md
│
├── 🎨 frontend/                    # React Frontend
│   ├── index.html                  # Main entry point
│   └── nexacred/                   # React application
│       ├── package.json            # Frontend dependencies
│       ├── vite.config.js          # Build configuration
│       ├── Dockerfile              # Frontend container
│       └── src/                    # Source code
│
├── ⚙️ backend/                     # Backend Services
│   ├── app.py                      # Flask API server
│   ├── config.py                   # Database configuration
│   ├── requirements.txt            # Python dependencies
│   ├── Backend/                    # Node.js API
│   │   ├── index.js                # Express server
│   │   ├── package.json            # Node dependencies
│   │   ├── Dockerfile              # Backend container
│   │   ├── config/                 # Database config
│   │   ├── controllers/            # API controllers
│   │   ├── middleware/             # Auth middleware
│   │   └── routers/                # API routes
│   └── services/                   # Transaction Analysis
│       ├── transactionAnalyzer.py  # Risk assessment
│       ├── Dockerfile              # Service container
│       └── requirements.txt        # Service dependencies
│
├── ⛓️ blockchain/                   # Smart Contracts
│   ├── contracts/
│   │   ├── NexaCred.sol            # Main lending contract
│   │   └── CreditScore.sol         # Credit scoring contract
│   ├── scripts/
│   │   └── deploy.js               # Deployment scripts
│   ├── hardhat.config.js           # Hardhat configuration
│   ├── package.json                # Blockchain dependencies
│   └── web3_integration.py         # Python Web3 integration
│
└── 🤖 ml/                          # Machine Learning & AI
    ├── train_model.py              # Model training
    ├── vector_embedding.py         # Embedding generation
    ├── Credit_Scoring/             # Credit ML System
    │   ├── app.py                  # Streamlit dashboard
    │   ├── README.md               # ML documentation
    │   ├── requirements.txt        # ML dependencies
    │   ├── data/                   # Training data
    │   ├── models/                 # Trained models
    │   └── scripts/                # Training scripts
    ├── rag_chatbot/                # Financial Advisory AI
    │   ├── real_rag_chatbot.py     # Main RAG system
    │   ├── cli.py                  # Command line interface
    │   ├── config.py               # RAG configuration
    │   ├── requirements.txt        # RAG dependencies
    │   ├── api/                    # REST API service
    │   └── models/                 # AI models
    └── robust_rag_chatbot/         # Enhanced RAG System
        ├── robust_rag_chatbot.py   # Production RAG
        ├── api_service.py          # FastAPI service
        ├── conversation_manager.py # Chat management
        └── requirements.txt        # Dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Python 3.8+**
- **Docker & Docker Compose**
- **MetaMask Browser Extension**
- **MongoDB** (local or Atlas)

### 1. Clone Repository

```bash
git clone https://github.com/0Advi/-nexacred-metamask-enhanced.git
cd nexacred-metamask-enhanced
```

### 2. Environment Setup

Create `.env` file in the root directory:

```env
# Blockchain
ETHERSCAN_API_KEY=your_etherscan_api_key
PRIVATE_KEY=your_wallet_private_key

# Database
MONGODB_URI=mongodb://localhost:27017/nexacred

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# API Endpoints
VITE_API_URL=http://localhost:5000
VITE_ANALYZER_URL=http://localhost:8000
```

### 3. Docker Deployment (Recommended)

```bash
# Development environment
docker-compose up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Manual Setup

#### Frontend Setup
```bash
cd frontend/nexacred
npm install
npm run dev
```

#### Backend Setup
```bash
# Node.js API
cd backend/Backend
npm install
npm start

# Python Flask API
cd ../../backend
pip install -r requirements.txt
python app.py

# Transaction Analyzer
cd services
pip install -r requirements.txt
python transactionAnalyzer.py
```

#### Blockchain Setup
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat deploy --network localhost
```

#### ML Services Setup
```bash
# Credit Scoring
cd ml/Credit_Scoring
pip install -r requirements.txt
python app.py

# RAG Chatbot
cd ../rag_chatbot
pip install -r requirements.txt
python -m rag_chatbot
```

## 📚 API Documentation

### **Authentication Endpoints**

```http
POST /api/auth/register          # Register new user
POST /api/auth/login             # Login with credentials
POST /api/auth/web3-login        # Login with MetaMask
POST /api/auth/verify-token      # Verify JWT token
```

### **Credit Scoring Endpoints**

```http
GET  /api/credit/score/:address  # Get credit score
POST /api/credit/analyze         # Analyze transactions
GET  /api/credit/history/:user   # Get scoring history
```

### **Lending Endpoints**

```http
POST /api/loans/request          # Request a loan
GET  /api/loans/active           # Get active loans
POST /api/loans/fund             # Fund a loan
POST /api/loans/repay            # Repay loan installment
```

### **Wallet Analytics**

```http
GET  /api/analytics/wallet/:address  # Wallet analytics
GET  /api/analytics/risk/:address    # Risk assessment
GET  /api/analytics/defi/:address    # DeFi interactions
```

## 🤖 AI Chatbot Usage

### CLI Interface
```bash
# Interactive mode
python -m rag_chatbot

# Single query
python cli.py --query "What are RBI guidelines for personal loans?"

# Health check
python cli.py --health
```

### API Service
```bash
# Start FastAPI service
cd ml/robust_rag_chatbot
python api_service.py

# Query endpoint
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain credit card regulations in India"}'
```

## 🔧 Smart Contract Integration

### **NexaCred Contract Functions**

```solidity
// Loan Management
function requestLoan(uint256 amount, uint256 interestRate, string memory purpose)
function fundLoan(uint256 loanId)
function repayLoan(uint256 loanId, uint256 amount)

// Credit Scoring
function updateCreditScore(address user, uint256 score)
function getCreditScore(address user) returns (uint256)

// User Management
function getUserProfile(address user) returns (UserProfile memory)
function updateKYCStatus(address user, bool verified)
```

### **Web3 Integration Example**

```javascript
import { ethers } from 'ethers';
import NexaCredABI from './contracts/NexaCred.json';

const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  NexaCredABI,
  signer
);

// Request a loan
const tx = await contract.requestLoan(
  ethers.parseEther("1.0"),  // 1 ETH
  1200,                      // 12% interest
  "Business expansion"       // Purpose
);
```

## 📊 Machine Learning Models

### **Credit Scoring Model**
- **Algorithm**: LightGBM Gradient Boosting
- **Features**: 50+ transaction-based features
- **Training Data**: Historical DeFi transactions
- **Accuracy**: 85%+ on validation set
- **Score Range**: 300-850 (FICO-like scale)

### **Risk Assessment Features**
- Transaction frequency and amounts
- DeFi protocol interaction patterns
- Loan repayment history
- Wallet age and activity
- Gas fee optimization patterns
- Collateral management behavior

## 🛡️ Security Features

- **Smart Contract Auditing**: Comprehensive security testing
- **Reentrancy Protection**: SafeMath and ReentrancyGuard
- **Access Control**: Role-based permissions
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive data sanitization
- **JWT Security**: Secure token management
- **Web3 Security**: Signature verification

## 🌐 Deployment Options

### **Local Development**
```bash
docker-compose up -d
```

### **AWS Deployment**
- **ECS Fargate**: Container orchestration
- **RDS MongoDB**: Managed database
- **ALB**: Load balancing
- **CloudFront**: CDN distribution
- **Route 53**: DNS management

### **GitHub Pages** (Frontend Only)
```bash
npm run build
npm run deploy
```

### **Heroku Deployment**
- **Frontend**: Static site deployment
- **Backend**: Node.js dyno
- **ML Services**: Python dyno
- **MongoDB Atlas**: Cloud database

## 🧪 Testing

```bash
# Frontend tests
cd frontend/nexacred
npm test

# Backend tests
cd backend/Backend
npm test

# Smart contract tests
cd blockchain
npx hardhat test

# ML model validation
cd ml/Credit_Scoring
python scripts/validate_model.py
```

## 📈 Monitoring & Analytics

- **Application Metrics**: Performance monitoring
- **Blockchain Events**: Smart contract event tracking
- **User Analytics**: Usage patterns and behavior
- **ML Model Performance**: Prediction accuracy tracking
- **Error Tracking**: Comprehensive error logging

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [Wiki](https://github.com/0Advi/-nexacred-metamask-enhanced/wiki)
- **API Docs**: [Swagger Documentation]
- **Smart Contracts**: [Etherscan Verification]

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/0Advi/-nexacred-metamask-enhanced/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0Advi/-nexacred-metamask-enhanced/discussions)
- **Email**: support@nexacred.com

---

**Built with ❤️ by the NexaCred Team**

*Revolutionizing DeFi lending through AI-powered credit scoring and blockchain innovation.*
