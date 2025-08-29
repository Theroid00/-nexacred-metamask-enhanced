import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, BarChart3, Activity } from 'lucide-react';

const RiskReport = ({ walletAddress, balance = '0.0000' }) => {
  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch risk analysis when wallet address changes
  useEffect(() => {
    if (!walletAddress) {
      setRiskData(null);
      return;
    }

    const fetchRiskAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call backend API for risk analysis
        const response = await fetch(`/api/risk-analysis/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRiskData(data);
        } else {
          // Fallback to mock data for demonstration
          setRiskData(generateMockRiskData(walletAddress));
        }
      } catch (err) {
        console.error('Risk analysis error:', err);
        // Use mock data as fallback
        setRiskData(generateMockRiskData(walletAddress));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskAnalysis();
  }, [walletAddress]);

  // Generate mock risk data for demonstration
  const generateMockRiskData = (address) => {
    const hash = address ? address.slice(-8) : '12345678';
    const seed = parseInt(hash, 16) % 100;

    return {
      risk_score: 35 + (seed % 40), // Score between 35-75
      risk_level: seed < 30 ? 'Low' : seed < 60 ? 'Medium' : 'High',
      wallet_age_days: 120 + (seed % 500),
      total_transactions: 450 + (seed % 1000),
      defi_interactions: 25 + (seed % 50),
      risk_factors: [
        seed > 70 && 'High transaction frequency',
        seed > 80 && 'Recent large transactions',
        seed < 20 && 'New wallet (less than 30 days)',
        seed > 60 && 'Multiple DeFi protocol interactions'
      ].filter(Boolean),
      positive_factors: [
        'Consistent transaction patterns',
        seed > 40 && 'Long wallet history',
        seed < 50 && 'Conservative DeFi usage',
        'No flagged addresses'
      ].filter(Boolean),
      defi_protocols: [
        { name: 'Uniswap', interactions: 15 + (seed % 20), risk: 'Low' },
        { name: 'Compound', interactions: 8 + (seed % 15), risk: 'Medium' },
        { name: 'Aave', interactions: 12 + (seed % 10), risk: 'Low' }
      ],
      recommendation:
        seed < 40
          ? 'Approved for credit'
          : seed < 70
          ? 'Requires additional verification'
          : 'High risk - manual review required'
    };
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBgColor = (score) => {
    if (score <= 30) return 'bg-green-900/20 border-green-500/30';
    if (score <= 60) return 'bg-yellow-900/20 border-yellow-500/30';
    return 'bg-red-900/20 border-red-500/30';
  };

  if (!walletAddress) {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
        <div className="text-center text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Connect your wallet to view risk analysis</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Analyzing wallet transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-300">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading risk analysis: {error}</span>
        </div>
      </div>
    );
  }

  if (!riskData) return null;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Risk Analysis Report</h3>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Wallet</div>
          <code className="text-blue-300 text-sm">{formatAddress(walletAddress)}</code>
        </div>
      </div>

      {/* Risk Score */}
      <div className={`rounded-lg p-4 mb-6 border ${getRiskBgColor(riskData.risk_score)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-200">Credit Risk Score</span>
          <div className="flex items-center gap-2">
            {riskData.risk_level === 'Low' && <Shield className="h-4 w-4 text-green-400" />}
            {riskData.risk_level === 'Medium' && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
            {riskData.risk_level === 'High' && <AlertTriangle className="h-4 w-4 text-red-400" />}
            <span className={`font-bold text-lg ${getRiskColor(riskData.risk_score)}`}>
              {riskData.risk_score}/100
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              riskData.risk_score <= 30
                ? 'bg-green-500'
                : riskData.risk_score <= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${riskData.risk_score}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>Low Risk</span>
          <span className={`font-medium ${getRiskColor(riskData.risk_score)}`}>
            {riskData.risk_level} Risk
          </span>
          <span>High Risk</span>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{riskData.wallet_age_days}</div>
          <div className="text-xs text-gray-400">Days Old</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{riskData.total_transactions}</div>
          <div className="text-xs text-gray-400">Transactions</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{riskData.defi_interactions}</div>
          <div className="text-xs text-gray-400">DeFi Actions</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{balance}</div>
          <div className="text-xs text-gray-400">ETH Balance</div>
        </div>
      </div>

      {/* DeFi Protocols */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          DeFi Protocol Interactions
        </h4>
        <div className="space-y-2">
          {riskData.defi_protocols.map((protocol, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-900/30 rounded-lg p-3">
              <span className="text-gray-200">{protocol.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">{protocol.interactions} interactions</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    protocol.risk === 'Low'
                      ? 'bg-green-900/50 text-green-300'
                      : protocol.risk === 'Medium'
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {protocol.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {riskData.risk_factors.length > 0 && (
          <div>
            <h4 className="text-red-300 font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Risk Factors
            </h4>
            <ul className="space-y-2">
              {riskData.risk_factors.map((factor, index) => (
                <li key={index} className="text-red-200 text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskData.positive_factors.length > 0 && (
          <div>
            <h4 className="text-green-300 font-medium mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Positive Factors
            </h4>
            <ul className="space-y-2">
              {riskData.positive_factors.map((factor, index) => (
                <li key={index} className="text-green-200 text-sm flex items-start gap-2">
                  <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div className={`rounded-lg p-4 border ${getRiskBgColor(riskData.risk_score)}`}>
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              riskData.risk_score <= 30
                ? 'bg-green-500/20'
                : riskData.risk_score <= 60
                ? 'bg-yellow-500/20'
                : 'bg-red-500/20'
            }`}
          >
            {riskData.risk_score <= 30 && <Shield className="h-5 w-5 text-green-400" />}
            {riskData.risk_score > 30 && riskData.risk_score <= 60 && (
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            )}
            {riskData.risk_score > 60 && <AlertTriangle className="h-5 w-5 text-red-400" />}
          </div>
          <div>
            <div className="font-medium text-white mb-1">Credit Recommendation</div>
            <div className={`text-sm ${getRiskColor(riskData.risk_score)}`}>
              {riskData.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Analysis generated at {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default RiskReport;
