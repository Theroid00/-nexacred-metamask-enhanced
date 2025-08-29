"""
NexaCred Transaction Analyzer Service

This FastAPI microservice analyzes wallet transactions and generates risk reports.
It fetches transaction history from blockchain explorers and assesses credit worthiness
based on on-chain behavior.
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union, Any
import httpx
import logging
import time
import os
import json
import random
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("transaction-analyzer")

# Initialize FastAPI
app = FastAPI(
    title="NexaCred Transaction Analyzer",
    description="Analyzes wallet transactions and generates risk reports for credit scoring",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables (set these in production)
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "YourEtherscanAPIKey")
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_key")

# Models
class WalletAddress(BaseModel):
    address: str
    
    @validator('address')
    def validate_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid Ethereum address')
        return v.lower()

class TransactionInfo(BaseModel):
    hash: str
    from_address: str
    to_address: str
    value: str
    gas_used: str
    timestamp: int
    method: Optional[str] = None
    protocol: Optional[str] = None

class RiskFactor(BaseModel):
    name: str
    description: str
    impact: int  # 1-10, where 10 is highest risk
    category: str

class ProtocolInteraction(BaseModel):
    name: str
    count: int
    first_interaction: Optional[int] = None
    last_interaction: Optional[int] = None
    total_value: float = 0
    risk_level: str = "Low"

class RiskReport(BaseModel):
    wallet_address: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str
    wallet_age_days: int
    total_transactions: int
    defi_interactions: int
    risk_factors: List[str]
    positive_factors: List[str]
    defi_protocols: List[ProtocolInteraction]
    recommendation: str
    generated_at: int = Field(default_factory=lambda: int(time.time()))

# Protocol risk classification
PROTOCOL_RISK_LEVELS = {
    "Uniswap": "Low",
    "Aave": "Low",
    "Compound": "Low",
    "MakerDAO": "Medium",
    "Curve": "Low",
    "Balancer": "Low",
    "SushiSwap": "Medium",
    "1inch": "Low",
    "dYdX": "Medium",
    "Yearn": "Medium",
    "Synthetix": "High",
    "Bancor": "Medium",
    "0x Protocol": "Low",
    "PancakeSwap": "Medium",
    "Polygon": "Low",
    "Arbitrum": "Medium",
    "Optimism": "Medium"
}

# Protocol method signatures
METHOD_SIGNATURES = {
    "0x095ea7b3": "approve",
    "0xa9059cbb": "transfer",
    "0x23b872dd": "transferFrom",
    "0x70a08231": "balanceOf",
    "0x18160ddd": "totalSupply",
    "0x7ff36ab5": "swapExactETHForTokens",
    "0x38ed1739": "swapExactTokensForTokens",
    "0xe8e33700": "addLiquidity",
    "0x4a25d94a": "removeLiquidity",
    "0x1e9a6950": "deposit",
    "0x2e1a7d4d": "withdraw",
    "0x128acb08": "stake",
    "0xb6b55f25": "unstake",
    "0xae9d70b0": "claim"
}

# Protocol addresses (simplified)
PROTOCOL_ADDRESSES = {
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "Uniswap",
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "Aave", 
    "0xc00e94cb662c3520282e6f5717214004a7f26888": "Compound",
    "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": "MakerDAO",
    "0xd533a949740bb3306d119cc777fa900ba034cd52": "Curve",
    "0xba100000625a3754423978a60c9317c58a424e3d": "Balancer",
    "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": "SushiSwap",
    "0x111111111117dc0aa78b770fa6a738034120c302": "1inch",
    "0x92d6c1e31e14520e676a687f0a93788b716beff5": "dYdX",
    "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e": "Yearn",
    "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f": "Synthetix"
}

# Authentication dependency
async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    
    token = authorization.replace("Bearer ", "")
    
    # In production, implement proper JWT verification
    # For now, we'll accept any non-empty token
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {"token": token}

# Helper functions
async def fetch_transactions(wallet_address: str) -> List[TransactionInfo]:
    """Fetch transactions for a wallet address from Etherscan or similar service"""
    logger.info(f"Fetching transactions for {wallet_address}")
    
    # In production, implement actual API call to Etherscan or other provider
    # For demo purposes, we'll generate mock transaction data
    mock_transactions = []
    
    # Use hash of address for deterministic but different results per address
    seed = int(wallet_address[-8:], 16) % 1000
    random.seed(seed)
    
    # Generate some transactions
    num_transactions = random.randint(30, 200)
    current_timestamp = int(time.time())
    
    # Generate wallet age - between 90 and 900 days
    wallet_age_days = 90 + (seed % 810)
    earliest_timestamp = current_timestamp - (wallet_age_days * 86400)
    
    # Generate protocols based on address
    available_protocols = list(PROTOCOL_RISK_LEVELS.keys())
    
    # Determine how many protocols this wallet has interacted with
    num_protocols = min(3 + (seed % 8), len(available_protocols))
    used_protocols = random.sample(available_protocols, num_protocols)
    
    for i in range(num_transactions):
        # Create a transaction timestamp between earliest and now
        tx_timestamp = random.randint(earliest_timestamp, current_timestamp)
        
        # Determine if this is a protocol interaction
        is_protocol_tx = random.random() < 0.4  # 40% chance
        
        if is_protocol_tx:
            protocol = random.choice(used_protocols)
            protocol_address = next((addr for addr, name in PROTOCOL_ADDRESSES.items() 
                                  if name == protocol), None)
            
            if not protocol_address:
                protocol_address = f"0x{random.getrandbits(160):040x}"
                
            method_name = random.choice(list(METHOD_SIGNATURES.values()))
            
            tx = TransactionInfo(
                hash=f"0x{random.getrandbits(256):064x}",
                from_address=wallet_address,
                to_address=protocol_address,
                value=str(random.randint(1, 1000000000000000000)),
                gas_used=str(random.randint(21000, 500000)),
                timestamp=tx_timestamp,
                method=method_name,
                protocol=protocol
            )
        else:
            # Regular transaction
            tx = TransactionInfo(
                hash=f"0x{random.getrandbits(256):064x}",
                from_address=wallet_address if random.random() < 0.5 else f"0x{random.getrandbits(160):040x}",
                to_address=f"0x{random.getrandbits(160):040x}" if random.random() < 0.5 else wallet_address,
                value=str(random.randint(1, 1000000000000000000)),
                gas_used=str(random.randint(21000, 200000)),
                timestamp=tx_timestamp
            )
        
        mock_transactions.append(tx)
    
    # Sort by timestamp
    mock_transactions.sort(key=lambda x: x.timestamp)
    
    return mock_transactions

async def analyze_transactions(wallet_address: str, transactions: List[TransactionInfo]) -> RiskReport:
    """Analyze transactions and generate a risk report"""
    logger.info(f"Analyzing {len(transactions)} transactions for {wallet_address}")
    
    # Extract key metrics
    total_transactions = len(transactions)
    
    if not transactions:
        return RiskReport(
            wallet_address=wallet_address,
            risk_score=50,
            risk_level="Medium",
            wallet_age_days=0,
            total_transactions=0,
            defi_interactions=0,
            risk_factors=["No transaction history available"],
            positive_factors=[],
            defi_protocols=[],
            recommendation="Insufficient data for credit assessment"
        )
    
    # Calculate wallet age
    first_tx_timestamp = transactions[0].timestamp
    last_tx_timestamp = transactions[-1].timestamp
    current_timestamp = int(time.time())
    wallet_age_seconds = current_timestamp - first_tx_timestamp
    wallet_age_days = wallet_age_seconds // 86400
    
    # Count DeFi interactions
    defi_interactions = sum(1 for tx in transactions if tx.protocol)
    
    # Analyze protocol interactions
    protocol_interactions = {}
    for tx in transactions:
        if tx.protocol:
            if tx.protocol not in protocol_interactions:
                protocol_interactions[tx.protocol] = {
                    "count": 0,
                    "first_interaction": tx.timestamp,
                    "last_interaction": tx.timestamp,
                    "total_value": 0
                }
            
            protocol_interactions[tx.protocol]["count"] += 1
            protocol_interactions[tx.protocol]["last_interaction"] = tx.timestamp
            
            # Add value if this is an outgoing transaction
            if tx.from_address.lower() == wallet_address.lower():
                try:
                    value_eth = float(tx.value) / 1e18
                    protocol_interactions[tx.protocol]["total_value"] += value_eth
                except (ValueError, TypeError):
                    pass
    
    # Create protocol interaction objects
    defi_protocols = []
    for protocol_name, data in protocol_interactions.items():
        risk_level = PROTOCOL_RISK_LEVELS.get(protocol_name, "Medium")
        
        defi_protocols.append(ProtocolInteraction(
            name=protocol_name,
            count=data["count"],
            first_interaction=data["first_interaction"],
            last_interaction=data["last_interaction"],
            total_value=data["total_value"],
            risk_level=risk_level
        ))
    
    # Risk and positive factors
    risk_factors = []
    positive_factors = []
    
    # Wallet age factor
    if wallet_age_days < 30:
        risk_factors.append("New wallet (less than 30 days old)")
    elif wallet_age_days > 365:
        positive_factors.append("Long wallet history (over 1 year)")
    
    # Transaction volume factors
    if total_transactions < 10:
        risk_factors.append("Low transaction volume")
    elif total_transactions > 100:
        positive_factors.append("High transaction volume indicating active usage")
    
    # Protocol risk factors
    high_risk_protocols = [p for p in defi_protocols if p.risk_level == "High"]
    if high_risk_protocols:
        risk_factors.append(f"Interaction with high-risk protocols ({', '.join([p.name for p in high_risk_protocols])})")
    
    # DeFi interaction factors
    if defi_interactions > 20:
        positive_factors.append("Significant DeFi experience")
    elif defi_interactions == 0:
        risk_factors.append("No DeFi interactions")
    
    # Transaction pattern factors
    time_between_txs = []
    for i in range(1, len(transactions)):
        time_between_txs.append(transactions[i].timestamp - transactions[i-1].timestamp)
    
    if time_between_txs:
        avg_time_between_txs = sum(time_between_txs) / len(time_between_txs)
        if avg_time_between_txs < 86400:  # Less than a day
            positive_factors.append("Regular transaction activity")
    
    # Recent activity
    days_since_last_tx = (current_timestamp - last_tx_timestamp) // 86400
    if days_since_last_tx > 90:
        risk_factors.append(f"No recent activity ({days_since_last_tx} days since last transaction)")
    elif days_since_last_tx < 7:
        positive_factors.append("Recent wallet activity")
    
    # Calculate risk score
    # Base score of 50
    risk_score = 50
    
    # Adjust for wallet age (up to +/- 15 points)
    if wallet_age_days < 30:
        risk_score += min(15, 30 - wallet_age_days)
    else:
        risk_score -= min(15, wallet_age_days // 30)
    
    # Adjust for transaction volume (up to +/- 10 points)
    if total_transactions < 10:
        risk_score += min(10, 10 - total_transactions)
    else:
        risk_score -= min(10, total_transactions // 10)
    
    # Adjust for DeFi interactions (up to +/- 15 points)
    if defi_interactions == 0:
        risk_score += 15
    else:
        risk_score -= min(15, defi_interactions // 2)
    
    # Adjust for protocol risk (up to +20 points)
    for protocol in high_risk_protocols:
        risk_score += 5
    
    # Adjust for activity recency (up to +10 points)
    if days_since_last_tx > 90:
        risk_score += min(10, days_since_last_tx // 9)
    
    # Ensure score is between 0-100
    risk_score = max(0, min(100, risk_score))
    
    # Determine risk level
    risk_level = "Low"
    if risk_score > 70:
        risk_level = "High"
    elif risk_score > 40:
        risk_level = "Medium"
    
    # Generate recommendation
    if risk_level == "Low":
        recommendation = "Approved for credit"
    elif risk_level == "Medium":
        recommendation = "Requires additional verification"
    else:
        recommendation = "High risk - manual review required"
    
    return RiskReport(
        wallet_address=wallet_address,
        risk_score=risk_score,
        risk_level=risk_level,
        wallet_age_days=wallet_age_days,
        total_transactions=total_transactions,
        defi_interactions=defi_interactions,
        risk_factors=risk_factors,
        positive_factors=positive_factors,
        defi_protocols=defi_protocols,
        recommendation=recommendation
    )

# API Routes
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "NexaCred Transaction Analyzer",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": int(time.time())}

@app.post("/analyze/{wallet_address}", response_model=RiskReport)
async def analyze_wallet(
    wallet_address: str, 
    auth: dict = Depends(verify_token)
):
    """
    Analyze a wallet address and generate a risk report
    
    This endpoint fetches transaction history for the provided wallet address,
    analyzes on-chain behavior, and generates a comprehensive risk report
    for credit assessment.
    """
    # Validate address
    try:
        wallet = WalletAddress(address=wallet_address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Fetch transactions
    transactions = await fetch_transactions(wallet.address)
    
    # Analyze transactions
    report = await analyze_transactions(wallet.address, transactions)
    
    return report

@app.get("/transactions/{wallet_address}")
async def get_transactions(
    wallet_address: str,
    limit: int = 100,
    auth: dict = Depends(verify_token)
):
    """Get recent transactions for a wallet address"""
    # Validate address
    try:
        wallet = WalletAddress(address=wallet_address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Fetch transactions
    all_transactions = await fetch_transactions(wallet.address)
    
    # Apply limit
    transactions = all_transactions[-limit:] if limit > 0 else all_transactions
    
    return {
        "wallet_address": wallet.address,
        "transaction_count": len(all_transactions),
        "transactions": transactions
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
