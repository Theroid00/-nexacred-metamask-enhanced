import React from 'react';
import { Wallet, AlertCircle, ExternalLink, RefreshCw, Network, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const WalletConnection = ({ 
  isConnected, 
  account, 
  balance, 
  currentNetwork, 
  isLoading, 
  error, 
  onConnect, 
  onDisconnect,
  onSwitchNetwork,
  networks,
  isMetaMaskInstalled 
}) => {
  const [copied, setCopied] = useState(false);

  // Copy address to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get network icon color
  const getNetworkColor = (chainId) => {
    switch (chainId) {
      case '0x1': return 'text-blue-400';
      case '0x89': return 'text-purple-400';
      case '0xaa36a7': return 'text-orange-400';
      case '0xa4b1': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">MetaMask Required</h3>
            <p className="text-gray-400 text-sm mb-3">
              Install MetaMask browser extension to connect your wallet and access Web3 features.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Install MetaMask
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Connect Wallet</h3>
              <p className="text-gray-400 text-sm">
                Connect your MetaMask wallet to access advanced features and risk analysis.
              </p>
            </div>
          </div>
          
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Wallet className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Wallet Connected</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Active Session
            </div>
          </div>
        </div>
        
        <button
          onClick={onDisconnect}
          className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Account Info */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Account Address</span>
          <button
            onClick={() => copyToClipboard(account)}
            className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        
        <div className="font-mono text-blue-300 text-sm bg-gray-800 rounded px-3 py-2 mb-3">
          {account}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Balance</span>
          <span className="font-medium text-white">
            {balance} {currentNetwork?.currency || 'ETH'}
          </span>
        </div>
      </div>

      {/* Network Info */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className={`h-4 w-4 ${getNetworkColor(currentNetwork?.chainId)}`} />
            <span className="text-sm font-medium text-white">
              {currentNetwork?.name || 'Unknown Network'}
            </span>
          </div>
          
          {currentNetwork?.chainId !== '0x1' && (
            <button
              onClick={() => onSwitchNetwork('0x1')}
              className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
            >
              Switch to Mainnet
            </button>
          )}
        </div>
        
        {/* Network Options */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {Object.entries(networks).map(([chainId, network]) => (
            <button
              key={chainId}
              onClick={() => onSwitchNetwork(chainId)}
              disabled={currentNetwork?.chainId === chainId || isLoading}
              className={`p-2 rounded text-xs font-medium transition-colors ${
                currentNetwork?.chainId === chainId
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentNetwork?.chainId === chainId ? 'bg-white' : 'bg-gray-400'
                }`} />
                {network.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-2 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Connected via MetaMask • Secure Web3 Authentication
      </div>
    </div>
  );
};

export default WalletConnection;
