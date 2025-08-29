import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const useMetaMask = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Network configurations
  const networks = {
    '0x1': { name: 'Ethereum Mainnet', currency: 'ETH' },
    '0x89': { name: 'Polygon', currency: 'MATIC' },
    '0xaa36a7': { name: 'Sepolia Testnet', currency: 'SEP ETH' },
    '0xa4b1': { name: 'Arbitrum One', currency: 'ETH' },
  };

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Get current network info
  const getCurrentNetwork = useCallback(() => {
    if (!chainId) return null;
    return networks[chainId] || { name: 'Unknown Network', currency: 'ETH' };
  }, [chainId]);

  // Format balance for display
  const formatBalance = useCallback((balance) => {
    try {
      return parseFloat(ethers.formatEther(balance)).toFixed(4);
    } catch {
      return '0.0000';
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async (provider, account) => {
    try {
      if (provider && account) {
        const balance = await provider.getBalance(account);
        setBalance(formatBalance(balance));
      }
    } catch (err) {
      console.error('Error getting balance:', err);
      setBalance('0.0000');
    }
  }, [formatBalance]);

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId('0x' + network.chainId.toString(16));
      setIsConnected(true);

      // Update balance
      await updateBalance(provider, address);

      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      if (err.code === 4001) {
        setError('Connection rejected by user');
      } else if (err.code === -32002) {
        setError('Connection request already pending');
      } else {
        setError('Failed to connect wallet: ' + (err.message || 'Unknown error'));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isMetaMaskInstalled, updateBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      return true;
    } catch (err) {
      console.error('Error switching network:', err);
      setError('Failed to switch network: ' + (err.message || 'Unknown error'));
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Sign message for authentication
  const signMessage = useCallback(async (message) => {
    if (!signer) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setIsLoading(true);
      const signature = await signer.signMessage(message);
      return signature;
    } catch (err) {
      console.error('Error signing message:', err);
      if (err.code === 4001) {
        setError('Message signing rejected by user');
      } else {
        setError('Failed to sign message: ' + (err.message || 'Unknown error'));
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  // Auto-connect on page load
  useEffect(() => {
    const autoConnect = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };

    autoConnect();
  }, [connectWallet, isMetaMaskInstalled]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        connectWallet();
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(chainId);
      if (provider && account) {
        updateBalance(provider, account);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, provider, connectWallet, disconnectWallet, updateBalance, isMetaMaskInstalled]);

  return {
    // State
    isConnected,
    account,
    balance,
    chainId,
    provider,
    signer,
    isLoading,
    error,
    
    // Computed values
    currentNetwork: getCurrentNetwork(),
    isMetaMaskInstalled: isMetaMaskInstalled(),
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
    
    // Utils
    networks,
    formatBalance,
  };
};

export default useMetaMask;
