'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { loadWalletState, saveWalletState, clearWalletState, WalletState } from '../utils/wallet-state';

interface WalletOption {
  name: string;
  icon: string;
  description: string;
  providerCheck: () => boolean;
  connect: () => Promise<void>;
}

export default function ManualWalletSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(loadWalletState());
  const [mounted, setMounted] = useState(false);
  
  // Extract connection state for easier access
  const { isConnected, address } = walletState;

  // Set mounted state once component is mounted
  useEffect(() => {
    setMounted(true);
    
    // Function to handle wallet state changes from other components
    const handleWalletStateChanged = (event: Event) => {
      const customEvent = event as CustomEvent<WalletState>;
      setWalletState(customEvent.detail);
    };
    
    // Set up event listener
    window.addEventListener('walletStateChanged', handleWalletStateChanged);
    
    // Load initial state
    setWalletState(loadWalletState());
    
    // Clean up
    return () => {
      window.removeEventListener('walletStateChanged', handleWalletStateChanged);
    };
  }, []);

  // Check if MetaMask is available
  const isMetaMaskAvailable = () => {
    if (typeof window === 'undefined') return false;
    const ethereum = (window as any).ethereum;
    return ethereum && ethereum.isMetaMask;
  };

  // Check if Coinbase Wallet is available
  const isCoinbaseWalletAvailable = () => {
    if (typeof window === 'undefined') return false;
    const ethereum = (window as any).ethereum;
    return ethereum && ethereum.isCoinbaseWallet;
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    setIsConnecting(true);
    setConnectingWallet('MetaMask');
    
    try {
      // Request accounts from MetaMask
      const ethereum = (window as any).ethereum;
      
      // Make sure MetaMask is the active provider
      if (ethereum && ethereum.isMetaMask) {
        console.log('Requesting accounts from MetaMask...');
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          const userAddress = accounts[0];
          console.log('Connected to MetaMask:', userAddress);
          
          // Get chain ID
          const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
          const chainId = parseInt(chainIdHex, 16);
          
          // Request signature
          try {
            const message = `NEDA Pay Authentication\nConnecting wallet: ${userAddress}\nTimestamp: ${Date.now()}`;
            
            console.log('Requesting signature from MetaMask for:', message);
            const signature = await ethereum.request({
              method: 'personal_sign',
              params: [message, userAddress]
            });
            
            console.log('Signature received from MetaMask');
            
            // Save wallet state
            const newState: WalletState = {
              isConnected: true,
              address: userAddress,
              chainId,
              signature
            };
            
            saveWalletState(newState);
            setWalletState(newState);
          } catch (signError) {
            console.warn('User declined to sign message with MetaMask:', signError);
            
            // Connect anyway without signature
            const newState: WalletState = {
              isConnected: true,
              address: userAddress,
              chainId,
              signature: null
            };
            
            saveWalletState(newState);
            setWalletState(newState);
          }
        }
      } else {
        throw new Error('MetaMask not found or not active');
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      alert('Failed to connect to MetaMask. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsOpen(false);
    }
  };

  // Connect to Coinbase Wallet
  const connectCoinbaseWallet = async () => {
    setIsConnecting(true);
    setConnectingWallet('Coinbase Wallet');
    
    try {
      const ethereum = (window as any).ethereum;
      
      // For Coinbase Wallet, we need to check if it's available
      if (ethereum && ethereum.isCoinbaseWallet) {
        console.log('Requesting accounts from Coinbase Wallet...');
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          const userAddress = accounts[0];
          console.log('Connected to Coinbase Wallet:', userAddress);
          
          // Get chain ID
          const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
          const chainId = parseInt(chainIdHex, 16);
          
          // Request signature
          try {
            const message = `NEDA Pay Authentication\nConnecting wallet: ${userAddress}\nTimestamp: ${Date.now()}`;
            
            console.log('Requesting signature from Coinbase Wallet for:', message);
            const signature = await ethereum.request({
              method: 'personal_sign',
              params: [message, userAddress]
            });
            
            console.log('Signature received from Coinbase Wallet');
            
            // Save wallet state
            const newState: WalletState = {
              isConnected: true,
              address: userAddress,
              chainId,
              signature
            };
            
            saveWalletState(newState);
            setWalletState(newState);
          } catch (signError) {
            console.warn('User declined to sign message with Coinbase Wallet:', signError);
            
            // Connect anyway without signature
            const newState: WalletState = {
              isConnected: true,
              address: userAddress,
              chainId,
              signature: null
            };
            
            saveWalletState(newState);
            setWalletState(newState);
          }
        }
      } else {
        throw new Error('Coinbase Wallet not found or not active');
      }
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      alert('Failed to connect to Coinbase Wallet. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsOpen(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    clearWalletState();
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      signature: null
    });
    console.log('Wallet disconnected');
  };

  // Define wallet options
  const walletOptions: WalletOption[] = [
    {
      name: 'MetaMask',
      icon: '/metamask-logo.png', // We'll add this image
      description: 'Connect to your MetaMask wallet',
      providerCheck: isMetaMaskAvailable,
      connect: connectMetaMask
    },
    {
      name: 'Coinbase Wallet',
      icon: '/coinbase-logo.png', // We'll add this image
      description: 'Connect to your Coinbase wallet',
      providerCheck: isCoinbaseWalletAvailable,
      connect: connectCoinbaseWallet
    }
  ];

  // Filter available wallet options
  const availableWallets = walletOptions.filter(wallet => wallet.providerCheck());

  if (!mounted) return null;

  return (
    <div className="relative">
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium text-green-800 dark:text-green-400">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
            </span>
          </div>
          <button
            onClick={disconnectWallet}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsOpen(true)}
            disabled={isConnecting}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
          
          {/* Wallet Selection Modal */}
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Connect Wallet</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please select a wallet to connect to NEDA Pay:
                </p>
                
                <div className="space-y-3">
                  {availableWallets.length > 0 ? (
                    availableWallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={wallet.connect}
                        disabled={isConnecting}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${
                          connectingWallet === wallet.name
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 mr-3 flex items-center justify-center">
                            {/* Placeholder for wallet icon */}
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg">
                              {wallet.name === 'MetaMask' ? '🦊' : '📱'}
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">{wallet.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{wallet.description}</p>
                          </div>
                        </div>
                        {connectingWallet === wallet.name && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">No compatible wallets found</p>
                      <div className="flex flex-col space-y-2 mt-4">
                        <a
                          href="https://metamask.io/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Install MetaMask
                        </a>
                        <a
                          href="https://www.coinbase.com/wallet"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Install Coinbase Wallet
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
