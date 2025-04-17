'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { ethers } from 'ethers';

// Simple ERC20 ABI with just the balanceOf function
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];


// Interface for Ethereum provider
interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

interface EthereumWindow extends Window {
  ethereum?: EthereumProvider | EthereumProvider[];
}

// Helper function to get network name based on chainId
const getNetworkName = (chainId: number | null): string => {
  if (!chainId) return 'Unknown';
  
  switch (chainId) {
    case 1: return 'Ethereum Mainnet';
    case 11155111: return 'Sepolia Testnet';
    case 84532: return 'Base Sepolia';
    case 8453: return 'Base Mainnet';
    case 137: return 'Polygon Mainnet';
    case 80001: return 'Mumbai Testnet';
    case 42161: return 'Arbitrum One';
    case 421613: return 'Arbitrum Goerli';
    case 10: return 'Optimism';
    case 420: return 'Optimism Goerli';
    case 5: return 'Goerli Testnet';
    default: return `Chain ID: ${chainId}`;
  }
};

// Helper function to get currency symbol based on chainId
const getNetworkCurrency = (chainId: number | null): string => {
  if (!chainId) return 'ETH';
  
  switch (chainId) {
    case 1: return 'ETH';
    case 11155111: return 'SepoliaETH';
    case 84532: return 'BaseETH';
    case 8453: return 'ETH';
    case 137: return 'MATIC';
    case 80001: return 'MATIC';
    case 42161: return 'ETH';
    case 421613: return 'ETH';
    case 10: return 'ETH';
    case 420: return 'ETH';
    case 5: return 'GoerliETH';
    default: return 'ETH';
  }
};

// Define supported networks with token contract addresses
const supportedNetworks = [
  { 
    chainId: 8453, 
    name: 'Base Mainnet', 
    nativeCurrency: 'ETH', 
    stablecoin: 'TSHC', 
    rpcUrl: 'https://mainnet.base.org',
    tokenAddress: '0x2fE3AD97F96783eA0Cf79C32A96409A091B569E1' // TSHC on Base Mainnet
  },
  { 
    chainId: 84532, 
    name: 'Base Sepolia', 
    nativeCurrency: 'BaseETH', 
    stablecoin: 'TSHC', 
    rpcUrl: 'https://sepolia.base.org',
    tokenAddress: '0x4200000000000000000000000000000000000023' // Updated Base Sepolia TSHC contract
  },
  { 
    chainId: 1, 
    name: 'Ethereum Mainnet', 
    nativeCurrency: 'ETH', 
    stablecoin: 'TSHC', 
    rpcUrl: 'https://mainnet.infura.io/v3/',
    tokenAddress: '0xaBEc7e7f2695AE25f95Ce2fa4e48d6Df368e2db1' // TSHC on Ethereum
  },
  { 
    chainId: 11155111, 
    name: 'Sepolia Testnet', 
    nativeCurrency: 'SepoliaETH', 
    stablecoin: 'TSHC', 
    rpcUrl: 'https://sepolia.infura.io/v3/',
    tokenAddress: '0xD9c0D8Ad06ABE99EAbe9d454eBd8f1CE96bCC3A0' // TSHC on Sepolia
  },
  { 
    chainId: 137, 
    name: 'Polygon Mainnet', 
    nativeCurrency: 'MATIC', 
    stablecoin: 'IDRX', 
    rpcUrl: 'https://polygon-rpc.com',
    tokenAddress: '0x3f7F7C444fC916493220BAB4262e118F9384c9b7' // IDRX on Polygon
  },
  { 
    chainId: 80001, 
    name: 'Mumbai Testnet', 
    nativeCurrency: 'MATIC', 
    stablecoin: 'IDRX', 
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    tokenAddress: '0x41D4B25C7E5624EC832c748F6Eb051dCAE3F8FC5' // IDRX on Mumbai
  },
  { 
    chainId: 42161, 
    name: 'Arbitrum One', 
    nativeCurrency: 'ETH', 
    stablecoin: 'CNGN', 
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    tokenAddress: '0xF1a3Db185B0e02fA5c9C6FE0D45fA891Bf87B9cF' // CNGN on Arbitrum
  }
];

// Get the appropriate stablecoin for the current network
const getStablecoin = (chainId: number | null): string => {
  if (!chainId) return 'TSHC';
  
  const network = supportedNetworks.find(net => net.chainId === chainId);
  return network?.stablecoin || 'TSHC';
};

export default function WalletPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [tshcBalance, setTshcBalance] = useState('0.00');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNetworkSwitchingModalOpen, setIsNetworkSwitchingModalOpen] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  
  const router = useRouter();
  
  // Get the provider (supports both MetaMask and Coinbase Wallet)
  const getProvider = (): EthereumProvider | null => {
    if (typeof window === 'undefined') return null;
    
    const ethereum = (window as unknown as EthereumWindow).ethereum;
    
    if (!ethereum) return null;
    
    // Handle case where multiple providers exist (e.g., both MetaMask and Coinbase Wallet)
    if (Array.isArray(ethereum)) {
      // Prefer Coinbase Wallet if available
      const coinbaseProvider = ethereum.find(p => p.isCoinbaseWallet);
      if (coinbaseProvider) return coinbaseProvider;
      
      // Fall back to MetaMask
      const metaMaskProvider = ethereum.find(p => p.isMetaMask);
      if (metaMaskProvider) return metaMaskProvider;
      
      // If neither specific provider is found, use the first one
      return ethereum[0];
    }
    
    // Single provider case
    return ethereum;
  };

  // Check if wallet is installed
  const isWalletInstalled = (): boolean => {
    return !!getProvider();
  };

  // Function to switch network
  const switchNetwork = async (targetChainId: number) => {
    const provider = getProvider();
    if (!provider) {
      alert('No provider found. Please connect your wallet first.');
      return;
    }
    
    setSwitchingNetwork(true);
    
    try {
      const network = supportedNetworks.find(net => net.chainId === targetChainId);
      if (!network) {
        throw new Error(`Unknown network with chainId: ${targetChainId}`);
      }
      
      // Request the wallet to switch to the target chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      }).catch(async (switchError: any) => {
        // This error code indicates that the chain has not been added to the wallet
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: network.name,
                  nativeCurrency: {
                    name: network.nativeCurrency,
                    symbol: network.nativeCurrency,
                    decimals: 18
                  },
                  rpcUrls: [network.rpcUrl],
                  blockExplorerUrls: targetChainId === 8453 ? ['https://basescan.org'] : 
                                    targetChainId === 84532 ? ['https://sepolia.basescan.org'] :
                                    undefined
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding network:', addError);
            throw addError;
          }
        } else {
          throw switchError;
        }
      });
      
      // Update chain ID after successful switch
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      setChainId(parseInt(chainIdHex, 16));
      
      // Close the modal after switching
      setIsNetworkSwitchingModalOpen(false);
      
      // Refresh transactions for the new network
      if (address) {
        fetchTransactionHistory(address);
      }
      
    } catch (error) {
      console.error('Error switching network:', error);
      alert(`Failed to switch network: ${(error as Error).message}`);
    } finally {
      setSwitchingNetwork(false);
    }
  };

  // Function to fetch transaction history
  const fetchTransactionHistory = async (userAddress: string) => {
    if (!userAddress) return;
    
    setIsLoadingTx(true);
    try {
      const network = supportedNetworks.find(net => net.chainId === chainId);
      if (!network) {
        throw new Error('Unsupported network');
      }
      
      const currentStablecoin = getStablecoin(chainId);
      const provider = getProvider();
      
      if (!provider) {
        throw new Error('Provider not available');
      }

      // Get a block explorer URL based on the network
      const getExplorerUrl = (txHash: string) => {
        if (chainId === 8453) {
          return `https://basescan.org/tx/${txHash}`;
        } else if (chainId === 84532) {
          return `https://sepolia.basescan.org/tx/${txHash}`;
        } else if (chainId === 11155111) {
          return `https://sepolia.etherscan.io/tx/${txHash}`;
        } else if (chainId === 1) {
          return `https://etherscan.io/tx/${txHash}`;
        } else if (chainId === 137) {
          return `https://polygonscan.com/tx/${txHash}`;
        } else if (chainId === 80001) {
          return `https://mumbai.polygonscan.com/tx/${txHash}`;
        } else if (chainId === 42161) {
          return `https://arbiscan.io/tx/${txHash}`;
        }
        return '#';
      };
      
      // Initialize with empty array
      let userTransactions: Array<{
        hash: string;
        from: string;
        to: string;
        value: string;
        currency: string;
        timestamp: number;
        status: string;
        explorerUrl: string;
      }> = [];
      
      // Get transactions from localStorage
      const storedTxsJSON = localStorage.getItem('pendingTransactions');
      if (storedTxsJSON) {
        try {
          const storedTxs = JSON.parse(storedTxsJSON);
          console.log('All stored transactions:', storedTxs);
          
          if (Array.isArray(storedTxs) && storedTxs.length > 0) {
            // Filter transactions for current user and network
            const userNetworkTxs = storedTxs.filter(tx => {
              // Match transactions on this chain
              const isOnCurrentChain = tx.chainId === chainId;
              
              // Match transactions where user is sender or receiver
              const userIsSender = tx.from && tx.from.toLowerCase() === userAddress.toLowerCase();
              const userIsReceiver = tx.to && tx.to.toLowerCase() === userAddress.toLowerCase();
              
              return isOnCurrentChain && (userIsSender || userIsReceiver);
            });
            
            console.log('User network transactions:', userNetworkTxs.length);
            
            // Map to our transaction format
            userTransactions = userNetworkTxs.map(tx => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              currency: tx.currency || currentStablecoin,
              timestamp: tx.timestamp,
              status: tx.status,
              explorerUrl: tx.explorerUrl || getExplorerUrl(tx.hash)
            }));
          }
        } catch (e) {
          console.error('Error parsing stored transactions:', e);
        }
      }
      
      // If we have user transactions, use them
      if (userTransactions.length > 0) {
        // Sort transactions with most recent first
        userTransactions.sort((a, b) => b.timestamp - a.timestamp);
        console.log('Setting user transactions:', userTransactions);
        setTransactions(userTransactions);
      } else {
        // Use fallback sample transactions
        console.log('No transactions found, using fallback data');
        setTransactions([
          {
            hash: '0x5d53558791c9346d644d077354420f9a93600acf54faff4c3693c8b171196cbd',
            from: userAddress,
            to: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
            value: '10.0',
            currency: currentStablecoin,
            timestamp: Date.now() - 86400000, // 1 day ago
            status: 'confirmed',
            explorerUrl: getExplorerUrl('0x5d53558791c9346d644d077354420f9a93600acf54faff4c3693c8b171196cbd')
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setTransactions([]);
    } finally {
      setIsLoadingTx(false);
    }
  };

  // Connect wallet function with explicit wallet selection and signature request
  const connectWallet = async () => {
    // Check if provider is available
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or Coinbase Wallet to use this feature');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Force the wallet selection modal by accessing ethereum directly
      console.log('Requesting accounts with wallet selection...');
      const ethereum = (window as unknown as EthereumWindow).ethereum;
      
      if (!ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      // Handle array of providers case to ensure wallet selection UI appears
      let accounts: string[] = [];
      if (Array.isArray(ethereum)) {
        // Try Coinbase Wallet first if available
        const coinbaseProvider = ethereum.find(p => p.isCoinbaseWallet);
        if (coinbaseProvider) {
          accounts = await coinbaseProvider.request({ method: 'eth_requestAccounts' });
        } else {
          // Fall back to MetaMask or first available provider
          const provider = ethereum.find(p => p.isMetaMask) || ethereum[0];
          accounts = await provider.request({ method: 'eth_requestAccounts' });
        }
      } else {
        // Single provider case
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      }
      
      console.log('Connect wallet result:', accounts);
      
      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setIsConnected(true);
        
        // Get the provider that was selected
        const provider = getProvider();
        if (!provider) {
          throw new Error('Provider not found after connection');
        }
        
        // Get chain ID
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainIdHex, 16));
        
        // Request signature to authenticate
        try {
          const message = `NEDA Pay Authentication\nConnecting wallet: ${userAddress}\nTimestamp: ${Date.now()}`;
          console.log('Requesting signature for message:', message);
          
          // This will trigger the signing prompt
          const signature = await provider.request({
            method: 'personal_sign',
            params: [message, userAddress]
          });
          
          console.log('Signature received:', signature);
          // Store the signature in localStorage for future reference
          localStorage.setItem('wallet_signature', signature);
        } catch (signError) {
          console.warn('User rejected signing, but connection will proceed', signError);
          // If user rejects signing, we should still allow them to use the app
        }
        
        // Fetch transaction history
        fetchTransactionHistory(userAddress);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setBalance('0.00');
    setTransactions([]);
    
    // Clear localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chainId');
    localStorage.removeItem('wallet_signature');
    
    console.log('Wallet disconnected');
    
    // Force a reload to ensure the UI updates properly
    router.refresh();
  };

  // Only set mounted state on mount, don't auto-connect
  // Only set mounted after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Set up event listeners for account changes
    const provider = getProvider();
    if (provider) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          setAddress(null);
          setIsConnected(false);
          setBalance('0.00');
          setTransactions([]);
        } else {
          setAddress(accounts[0]);
          setIsConnected(true);
          fetchTransactionHistory(accounts[0]);
        }
      };
      
      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };
      
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      
      return () => {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);
  
  // Listen for changes to the pendingTransactions in localStorage
  useEffect(() => {
    if (!mounted || !isConnected || !address) return;
    
    // Setup storage event listener to refresh transactions when localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pendingTransactions' && isConnected && address) {
        console.log('pendingTransactions changed in localStorage, refreshing...');
        fetchTransactionHistory(address);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Directly check for transactions in case they were added in another tab
    fetchTransactionHistory(address);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [mounted, isConnected, address, chainId]);

  // Fetch balance when connected, but only on client-side
  useEffect(() => {
    // Only run on client side and when mounted to avoid hydration errors
    if (!mounted) return;
    if (!isConnected || !address) return;
    
    const fetchNativeBalance = async () => {
      const provider = getProvider();
      if (!provider) return;
      
      try {
        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        
        // Convert from wei to ETH
        const balanceInWei = parseInt(balanceHex, 16);
        const balanceInEth = balanceInWei / 1e18;
        
        setBalance(balanceInEth.toFixed(4));
      } catch (error) {
        console.error('Error fetching native balance:', error);
      }
    };
    
    const fetchTokenBalance = async () => {
      const provider = getProvider();
      if (!provider) return;
      
      // Find the token address for the current network
      const network = supportedNetworks.find(net => net.chainId === chainId);
      
      if (!network?.tokenAddress) {
        console.log('No token address found for this network');
        setTshcBalance('0.00');
        return;
      }
      
      try {
        console.log(`Fetching token balance for ${address} on ${network.name}`);
        console.log(`Token address: ${network.tokenAddress}`);
        
        // Use a more direct approach with provider first - this works for read-only operations
        const balanceOfData = '0x70a08231' + '000000000000000000000000' + address.slice(2);
        
        const result = await provider.request({
          method: 'eth_call',
          params: [{
            to: network.tokenAddress,
            data: balanceOfData
          }, 'latest']
        });
        
        console.log('Raw token balance result:', result);
        
        if (result && result !== '0x') {
          // Remove '0x' prefix and parse
          const tokenBalanceBigInt = BigInt(result);
          
          // Convert to a human-readable format (assuming 18 decimals)
          const tokenBalance = Number(tokenBalanceBigInt) / 10**18;
          
          console.log('Calculated token balance:', tokenBalance);
          
            // Always use the real token balance
          console.log('Using real token balance:', tokenBalance);
          setTshcBalance(tokenBalance.toFixed(2));
        } else {
          console.log('Empty or invalid token balance result');
          
          // Always show real balance (0.00 if no data)
          console.log('No balance data, showing 0.00');
          setTshcBalance('0.00');
        }
      } catch (tokenError) {
        console.error('Error fetching token balance:', tokenError);
        
        // Always show real balances, 0.00 if there's an error
        console.log('Error occurred, showing 0.00 balance');
        setTshcBalance('0.00');
      }
    };
    
    // Fetch both balances
    fetchNativeBalance();
    fetchTokenBalance();
    
  }, [isConnected, address, chainId, mounted]); // Include mounted in dependencies

  // If not mounted yet, return empty div to avoid hydration errors
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"></div>;
  }
  
  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your wallet to view your TSHC balance and transaction history.
              </p>
              
              {isWalletInstalled() ? (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Connect Wallet
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install MetaMask
                  </a>
                  
                  <a
                    href="https://www.coinbase.com/wallet/downloads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install Coinbase Wallet
                  </a>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold mb-2">Why connect a wallet?</h2>
              <ul className="text-left text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View your TSHC balance
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Send and receive TSHC stablecoin
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track your transaction history
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pay for utilities and services
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Connected wallet view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold mb-1">Your Wallet</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </p>
              </div>
              
              <div className="flex flex-col items-end">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Available Balance</p>
                <div className="flex flex-col items-end">
                  <p className="text-3xl font-bold">
                    {balance} {getNetworkCurrency(chainId)}
                  </p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-2">
                    {tshcBalance} {getStablecoin(chainId)}
                  </p>
                  {chainId && chainId !== 1 && chainId !== 8453 && chainId !== 137 && chainId !== 42161 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getNetworkName(chainId)} testnet funds
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Link 
                href="/send" 
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-center transition-colors"
              >
                Send
              </Link>
              <Link 
                href="/wallet/receive" 
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded text-center transition-colors"
              >
                Receive
              </Link>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={disconnectWallet}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                type="button"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
          
          {/* Account Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Connected Address</p>
                <p className="bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono text-xs break-all">
                  {address}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Network</p>
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <span className="ml-2">
                    {getNetworkName(chainId)}
                  </span>
                  <button 
                    onClick={() => setIsNetworkSwitchingModalOpen(true)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    Switch
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            
            {isLoadingTx ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">Type</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">Amount</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">Date</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            {tx.from.toLowerCase() === address?.toLowerCase() ? (
                              <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                              </div>
                            ) : (
                              <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                            )}
                            <span className="ml-2">
                              {tx.from.toLowerCase() === address?.toLowerCase() ? 'Sent' : 'Received'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={tx.from.toLowerCase() === address?.toLowerCase() ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                            {tx.from.toLowerCase() === address?.toLowerCase() ? '-' : '+'}{tx.value} {tx.currency || getStablecoin(chainId)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <a 
                            href={tx.explorerUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center"
                          >
                            <span className={`
                              text-xs px-2 py-1 rounded-full
                              ${tx.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                                tx.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 
                                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}
                            `}>
                              {tx.status}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Network Switching Modal */}
        {isNetworkSwitchingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 m-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Switch Network</h3>
                <button
                  onClick={() => setIsNetworkSwitchingModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select a network to switch to:
              </p>
              
              <div className="space-y-2 mb-4">
                {supportedNetworks.map((network) => (
                  <button
                    key={network.chainId}
                    onClick={() => switchNetwork(network.chainId)}
                    disabled={switchingNetwork || network.chainId === chainId}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all
                      ${network.chainId === chainId
                        ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-500'
                        : 'bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-gray-200 dark:border-gray-600'}`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 flex-shrink-0">
                        {network.chainId === 8453 || network.chainId === 84532 ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">B</div>
                        ) : network.chainId === 137 || network.chainId === 80001 ? (
                          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">P</div>
                        ) : network.chainId === 42161 ? (
                          <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-bold">A</div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">E</div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{network.name}</p>
                        {/* No currency info as per user request */}
                      </div>
                    </div>
                    {network.chainId === chainId && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Current</span>
                    )}
                  </button>
                ))}
              </div>
              
              {switchingNetwork && (
                <div className="flex justify-center items-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-700 dark:text-gray-300">Switching network...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
