// Port of the Python NexaCred Transaction Analyzer to native Node.js Express Controller
import { ethers } from "ethers";

// Protocol risk classifications
const PROTOCOL_RISK_LEVELS = {
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
};

// Protocol method signatures
const METHOD_SIGNATURES = {
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
};

// Protocol addresses
const PROTOCOL_ADDRESSES = {
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
};

// A simple pseudo-random generator seeded by address hash
const seededRandom = (seedString) => {
  let h = 1779033703 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return () => {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

const sample = (arr, randomFn) => {
  return arr[Math.floor(randomFn() * arr.length)];
};

const sampleSize = (arr, size, randomFn) => {
  const shuffled = [...arr].sort(() => 0.5 - randomFn());
  return shuffled.slice(0, size);
};

// Fetch transaction history (mock logic matched from original Python code)
const fetchTransactions = (walletAddress) => {
  const seed = walletAddress.toLowerCase();
  const rand = seededRandom(seed);
  
  const mockTransactions = [];
  const numTransactions = Math.floor(rand() * 170) + 30; // Between 30 and 200
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  // Wallet age: between 90 and 900 days
  const walletAgeDays = Math.floor(rand() * 810) + 90;
  const earliestTimestamp = currentTimestamp - (walletAgeDays * 86400);
  
  const availableProtocols = Object.keys(PROTOCOL_RISK_LEVELS);
  const numProtocols = Math.min(3 + (seed.charCodeAt(seed.length - 1) % 8), availableProtocols.length);
  const usedProtocols = sampleSize(availableProtocols, numProtocols, rand);
  
  for (let i = 0; i < numTransactions; i++) {
    const txTimestamp = earliestTimestamp + Math.floor(rand() * (currentTimestamp - earliestTimestamp));
    const isProtocolTx = rand() < 0.4;
    
    if (isProtocolTx) {
      const protocol = sample(usedProtocols, rand);
      let protocolAddress = Object.keys(PROTOCOL_ADDRESSES).find(
        key => PROTOCOL_ADDRESSES[key] === protocol
      );
      
      if (!protocolAddress) {
        protocolAddress = "0x" + Array.from({length: 40}, () => Math.floor(rand()*16).toString(16)).join('');
      }
      
      const method = sample(Object.values(METHOD_SIGNATURES), rand);
      
      mockTransactions.push({
        hash: "0x" + Array.from({length: 64}, () => Math.floor(rand()*16).toString(16)).join(''),
        from_address: walletAddress.toLowerCase(),
        to_address: protocolAddress.toLowerCase(),
        value: Math.floor(rand() * 1000000000000000000).toString(),
        gas_used: (Math.floor(rand() * 479000) + 21000).toString(),
        timestamp: txTimestamp,
        method: method,
        protocol: protocol
      });
    } else {
      mockTransactions.push({
        hash: "0x" + Array.from({length: 64}, () => Math.floor(rand()*16).toString(16)).join(''),
        from_address: rand() < 0.5 ? walletAddress.toLowerCase() : "0x" + Array.from({length: 40}, () => Math.floor(rand()*16).toString(16)).join(''),
        to_address: rand() < 0.5 ? "0x" + Array.from({length: 40}, () => Math.floor(rand()*16).toString(16)).join('') : walletAddress.toLowerCase(),
        value: Math.floor(rand() * 1000000000000000000).toString(),
        gas_used: (Math.floor(rand() * 179000) + 21000).toString(),
        timestamp: txTimestamp
      });
    }
  }
  
  mockTransactions.sort((a, b) => a.timestamp - b.timestamp);
  return mockTransactions;
};

// Analyze transactions and generate risk report
const analyzeTransactions = (walletAddress, transactions) => {
  const totalTransactions = transactions.length;
  
  if (totalTransactions === 0) {
    return {
      wallet_address: walletAddress,
      risk_score: 50,
      risk_level: "Medium",
      wallet_age_days: 0,
      total_transactions: 0,
      defi_interactions: 0,
      risk_factors: ["No transaction history available"],
      positive_factors: [],
      defi_protocols: [],
      recommendation: "Insufficient data for credit assessment"
    };
  }

  const firstTxTimestamp = transactions[0].timestamp;
  const lastTxTimestamp = transactions[transactions.length - 1].timestamp;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const walletAgeDays = Math.floor((currentTimestamp - firstTxTimestamp) / 86400);
  
  const defiInteractions = transactions.filter(tx => tx.protocol).length;
  
  const protocolInteractions = {};
  for (const tx of transactions) {
    if (tx.protocol) {
      if (!protocolInteractions[tx.protocol]) {
        protocolInteractions[tx.protocol] = {
          count: 0,
          first_interaction: tx.timestamp,
          last_interaction: tx.timestamp,
          total_value: 0
        };
      }
      protocolInteractions[tx.protocol].count++;
      protocolInteractions[tx.protocol].last_interaction = tx.timestamp;
      
      if (tx.from_address.toLowerCase() === walletAddress.toLowerCase()) {
        const valEth = parseFloat(tx.value) / 1e18;
        if (!isNaN(valEth)) {
          protocolInteractions[tx.protocol].total_value += valEth;
        }
      }
    }
  }

  const defiProtocols = Object.keys(protocolInteractions).map(name => ({
    name,
    interactions: protocolInteractions[name].count,
    first_interaction: protocolInteractions[name].first_interaction,
    last_interaction: protocolInteractions[name].last_interaction,
    total_value: protocolInteractions[name].total_value,
    risk: PROTOCOL_RISK_LEVELS[name] || "Medium"
  }));

  const riskFactors = [];
  const positiveFactors = [];
  
  if (walletAgeDays < 30) {
    riskFactors.push("New wallet (less than 30 days old)");
  } else if (walletAgeDays > 365) {
    positiveFactors.push("Long wallet history (over 1 year)");
  }

  if (totalTransactions < 10) {
    riskFactors.push("Low transaction volume");
  } else if (totalTransactions > 100) {
    positiveFactors.push("High transaction volume indicating active usage");
  }

  const highRiskProtocols = defiProtocols.filter(p => p.risk === "High");
  if (highRiskProtocols.length > 0) {
    riskFactors.push(`Interaction with high-risk protocols (${highRiskProtocols.map(p => p.name).join(", ")})`);
  }

  if (defiInteractions > 20) {
    positiveFactors.push("Significant DeFi experience");
  } else if (defiInteractions === 0) {
    riskFactors.push("No DeFi interactions");
  }

  const timeBetweenTxs = [];
  for (let i = 1; i < transactions.length; i++) {
    timeBetweenTxs.push(transactions[i].timestamp - transactions[i - 1].timestamp);
  }

  if (timeBetweenTxs.length > 0) {
    const avgTime = timeBetweenTxs.reduce((a, b) => a + b, 0) / timeBetweenTxs.length;
    if (avgTime < 86400) {
      positiveFactors.push("Regular transaction activity");
    }
  }

  const daysSinceLastTx = Math.floor((currentTimestamp - lastTxTimestamp) / 86400);
  if (daysSinceLastTx > 90) {
    riskFactors.push(`No recent activity (${daysSinceLastTx} days since last transaction)`);
  } else if (daysSinceLastTx < 7) {
    positiveFactors.push("Recent wallet activity");
  }

  // Calculate risk score
  let riskScore = 50;
  
  if (walletAgeDays < 30) {
    riskScore += Math.min(15, 30 - walletAgeDays);
  } else {
    riskScore -= Math.min(15, Math.floor(walletAgeDays / 30));
  }

  if (totalTransactions < 10) {
    riskScore += Math.min(10, 10 - totalTransactions);
  } else {
    riskScore -= Math.min(10, Math.floor(totalTransactions / 10));
  }

  if (defiInteractions === 0) {
    riskScore += 15;
  } else {
    riskScore -= Math.min(15, Math.floor(defiInteractions / 2));
  }

  for (const protocol of highRiskProtocols) {
    riskScore += 5;
  }

  if (daysSinceLastTx > 90) {
    riskScore += Math.min(10, Math.floor(daysSinceLastTx / 9));
  }

  riskScore = Math.max(0, Math.min(100, riskScore));
  
  let riskLevel = "Low";
  if (riskScore > 70) {
    riskLevel = "High";
  } else if (riskScore > 40) {
    riskLevel = "Medium";
  }

  let recommendation = "Approved for credit";
  if (riskLevel === "Medium") {
    recommendation = "Requires additional verification";
  } else if (riskLevel === "High") {
    recommendation = "High risk - manual review required";
  }

  return {
    wallet_address: walletAddress,
    risk_score: riskScore,
    risk_level: riskLevel,
    wallet_age_days: walletAgeDays,
    total_transactions: totalTransactions,
    defi_interactions: defiInteractions,
    risk_factors: riskFactors,
    positive_factors: positiveFactors,
    defi_protocols: defiProtocols,
    recommendation: recommendation,
    generated_at: currentTimestamp
  };
};

// Controller endpoint handler
export const getRiskAnalysis = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address format" });
    }

    const txs = fetchTransactions(walletAddress);
    const report = analyzeTransactions(walletAddress, txs);
    
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal transaction analyzer error" });
  }
};
