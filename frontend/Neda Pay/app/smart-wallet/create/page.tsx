'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { switchToBaseSepolia, BASE_SEPOLIA_DECIMAL, getEthereumProvider } from '../../utils/chain-helpers';

// Smart wallet factory address from memory
const SMART_WALLET_FACTORY_ADDRESS = '0x10dE41927cdD093dA160E562630e0efC19423869';
const PAYMASTER_ADDRESS = '0x7d9687c95831874926bbc9476844674D6B943464';

export default function CreateSmartWallet() {
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const router = useRouter();
  
  // Track wallet connection state manually
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnectPending, setIsConnectPending] = useState(false);
  
  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const provider = getEthereumProvider();
      if (!provider) return;
      
      try {
        // Check for accounts
        if (provider.request) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            
            // Get chain ID
            const chainId = await provider.request({ method: 'eth_chainId' });
            setChainId(parseInt(chainId, 16));
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setAddress(null);
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };
    
    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };
    
    const provider = getEthereumProvider();
    if (provider) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  // Function to handle wallet connection
  const handleConnectWallet = async () => {
    setErrorMessage(null);
    setIsConnectPending(true);
    
    try {
      const provider = getEthereumProvider();
      if (!provider) {
        throw new Error('No Ethereum provider found. Please install MetaMask or Coinbase Wallet.');
      }
      
      // Try to switch to Base Sepolia first if using MetaMask
      if (provider.isMetaMask) {
        await switchToBaseSepolia();
      }
      
      // Request accounts
      if (provider.request) {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          
          // Get chain ID
          const chainId = await provider.request({ method: 'eth_chainId' });
          setChainId(parseInt(chainId, 16));
        } else {
          throw new Error('No accounts returned from wallet');
        }
      } else {
        throw new Error('Provider does not support request method');
      }
    } catch (error: any) {
      console.error('Error connecting wallet', error);
      setErrorMessage(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnectPending(false);
    }
  };
  
  // Function to create a smart wallet
  const handleCreateSmartWallet = async () => {
    if (!isConnected || !address) {
      setErrorMessage('Please connect your wallet first');
      return;
    }
    
    setIsCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Ensure we're on Base Sepolia
      await switchToBaseSepolia();
      
      // In a real implementation, we would call the smart wallet factory contract here
      // For demo purposes, we'll simulate the creation with a timeout
      setTimeout(() => {
        // Generate a dummy smart wallet address based on the user's EOA address
        const generatedAddress = `0x${address.substring(2, 10)}...${Math.floor(Math.random() * 10000)}`;
        setSmartWalletAddress(generatedAddress);
        setSuccessMessage('Smart wallet created successfully!');
        setIsCreating(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating smart wallet', error);
      setErrorMessage(error.message || 'Failed to create smart wallet');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
        Create Smart Wallet
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">What is a Smart Wallet?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            A smart wallet is a contract-based wallet that enables gasless transactions on Base. 
            With a smart wallet, you can:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
            <li>Pay transaction fees in TSHC instead of ETH</li>
            <li>Execute transactions without needing ETH in your wallet</li>
            <li>Batch multiple transactions together</li>
            <li>Set spending limits and recovery options</li>
          </ul>
        </div>
        
        {!isConnected ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              Connect your wallet to create a smart wallet
            </p>
            <button
              onClick={handleConnectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              disabled={isConnectPending}
            >
              {isConnectPending ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Connected Address:
              </p>
              <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {address}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2 mb-2">
                Network:
              </p>
              <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {chainId === BASE_SEPOLIA_DECIMAL ? 'Base Sepolia' : chainId ? `Chain ID: ${chainId}` : 'Unknown Network'}
              </p>
            </div>
            
            {!smartWalletAddress ? (
              <button
                onClick={handleCreateSmartWallet}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Smart Wallet...
                  </>
                ) : (
                  'Create Smart Wallet'
                )}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-700 dark:text-green-300 font-semibold mb-2">
                  {successMessage}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Smart Wallet Address:
                </p>
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                  {smartWalletAddress}
                </p>
                <div className="flex space-x-4">
                  <Link 
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                  <Link 
                    href="/"
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How Smart Wallets Work</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
            <div className="ml-4">
              <h3 className="font-medium">Create a Smart Wallet</h3>
              <p className="text-gray-600 dark:text-gray-300">Your smart wallet is created through our factory contract on Base Sepolia.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
            <div className="ml-4">
              <h3 className="font-medium">Deposit TSHC</h3>
              <p className="text-gray-600 dark:text-gray-300">Deposit TSHC into your smart wallet or the paymaster contract to pay for gas fees.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">3</div>
            <div className="ml-4">
              <h3 className="font-medium">Use Gasless Transactions</h3>
              <p className="text-gray-600 dark:text-gray-300">Send transactions without ETH, paying gas fees in TSHC instead.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
