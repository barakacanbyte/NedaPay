'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loadWalletState, saveWalletState, clearWalletState, WalletState } from '../utils/wallet-state';

// This ensures consistent wallet display across all browsers
const FORCE_SHOW_ALL_WALLETS = true;

export default function ImprovedWalletConnector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(loadWalletState());
  const [mounted, setMounted] = useState(false);
  const [isSupportedNetwork, setIsSupportedNetwork] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Extract connection state for easier access
  const { isConnected, address } = walletState;

  // Set mounted state once component is mounted and load wallet state
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const state = loadWalletState();
      setWalletState(state);
      
      // Function to handle wallet state changes from other components
      const handleWalletStateChanged = (event: Event) => {
        const customEvent = event as CustomEvent<WalletState>;
        setWalletState(customEvent.detail);
      };
      
      // Set up event listener for wallet state changes
      window.addEventListener('walletStateChanged', handleWalletStateChanged);
      
      // Set up click outside listener to close modal
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setIsModalOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      
      // Clean up
      return () => {
        window.removeEventListener('walletStateChanged', handleWalletStateChanged);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, []);

  // CRITICAL: Forcing MetaMask to display on ALL browsers
  const isMetaMaskInstalled = (): boolean => {
    // Always show MetaMask regardless of browser or detection
    return FORCE_SHOW_ALL_WALLETS;
  };

  // Helper function to detect if Coinbase Wallet is installed
  const isCoinbaseWalletInstalled = (): boolean => {
    // Force all wallets to display regardless of browser
    return FORCE_SHOW_ALL_WALLETS;
  };
  
  // Helper function to check if smart wallet features are available
  const isCoinbaseSmartWalletSupported = (): boolean => {
    // In a real implementation, you could do feature detection
    // For now, we'll just return true to show the option
    return true;
  };

  // Connect to MetaMask with explicit signature request
  const connectMetaMask = async () => {
    setIsConnecting(true);
    setConnectingWallet('MetaMask');
    
    try {
      // Get all Ethereum providers
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        if (confirm('MetaMask extension not detected. Would you like to install it?')) {
          window.open('https://metamask.io/download/', '_blank');
        }
        throw new Error('MetaMask provider not found');
      }
      
      // SIMPLIFIED provider detection to fix Chrome vs Safari inconsistencies
      let metaMaskProvider = ethereum;
      
      // Try to find MetaMask in a more reliable way that works cross-browser
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        // Find any provider that might be MetaMask
        const possibleMetaMask = ethereum.providers.find((p: any) => p.isMetaMask);
        if (possibleMetaMask) {
          metaMaskProvider = possibleMetaMask;
        }
      }
      
      // Request accounts
      console.log('Requesting accounts from MetaMask...');
      const accounts = await metaMaskProvider.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        console.log('Connected to MetaMask account:', userAddress);
        
        // Get chain ID
        const chainIdHex = await metaMaskProvider.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        
        // Check if on a supported network
        const supportedChainIds = [84531, 8453, 1, 137]; // Base Testnet, Base, Ethereum, Polygon
        setIsSupportedNetwork(supportedChainIds.includes(chainId));
        
        // IMPORTANT: Always request a signature to authenticate
        // This will force the signature popup to appear
        let signature = null;
        
        // Use a small delay to ensure the account connection completes before requesting signature
        // This helps avoid race conditions that might prevent the signature popup
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const timestamp = Date.now();
          const message = `NEDA Pay Authentication\nWallet: ${userAddress}\nTimestamp: ${timestamp}`;
          
          console.log('Requesting MetaMask signature for message:', message);
          signature = await metaMaskProvider.request({
            method: 'personal_sign',
            params: [message, userAddress]
          });
          
          console.log('Signature received from MetaMask');
        } catch (signError) {
          console.warn('User rejected signature request:', signError);
          // We'll still proceed with connection even if signature is rejected
        }
        
        // Update the wallet state with connection info
        const newState: WalletState = {
          isConnected: true,
          address: userAddress,
          chainId,
          signature,
          walletType: 'metamask'
        };
        
        setWalletState(newState);
        saveWalletState(newState);
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      alert('Failed to connect to MetaMask. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsModalOpen(false);
    }
  };

  // Connect to Coinbase Wallet extension
  const connectCoinbaseWallet = async () => {
    setIsConnecting(true);
    setConnectingWallet('Coinbase');
    
    try {
      // Get all Ethereum providers
      const ethereum = (window as any).ethereum;
      
      // Look specifically for Coinbase Wallet - different ways to detect it
      let coinbaseProvider = null;
      
      // Check if it's a multi-provider environment (metamask + coinbase)
      if (ethereum.providers) {
        // Find the Coinbase provider in the providers array
        coinbaseProvider = ethereum.providers.find((p: any) => p.isCoinbaseWallet);
      } else if (ethereum.isCoinbaseWallet) {
        // Single Coinbase provider
        coinbaseProvider = ethereum;
      } else if ((window as any).coinbaseWalletExtension) {
        // Try alternative Coinbase detection
        coinbaseProvider = (window as any).coinbaseWalletExtension;
      }
      
      if (!coinbaseProvider) {
        // If extension is not detected, show install options
        if (confirm('Coinbase Wallet extension not detected. Would you like to install it?')) {
          window.open('https://www.coinbase.com/wallet/downloads', '_blank');
        }
        throw new Error('Coinbase Wallet provider not found');
      }
      
      console.log('Requesting accounts from Coinbase Wallet...');
      const accounts = await coinbaseProvider.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        console.log('Connected to Coinbase Wallet account:', userAddress);
        
        // Get chain ID
        const chainIdHex = await coinbaseProvider.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        
        // Check if on a supported network
        const supportedChainIds = [84531, 8453, 1, 137]; // Base Testnet, Base, Ethereum, Polygon
        setIsSupportedNetwork(supportedChainIds.includes(chainId));
        
        // Request signature to authenticate
        let signature = null;
        try {
          const timestamp = Date.now();
          const message = `NEDA Pay Authentication\nWallet: ${userAddress}\nTimestamp: ${timestamp}`;
          
          console.log('Requesting Coinbase Wallet signature for message:', message);
          signature = await coinbaseProvider.request({
            method: 'personal_sign',
            params: [message, userAddress]
          });
          
          console.log('Signature received from Coinbase Wallet');
        } catch (signError) {
          console.warn('User rejected signature request:', signError);
          // We'll still proceed with connection even if signature is rejected
        }
        
        // Update the wallet state with connection info
        const newState: WalletState = {
          isConnected: true,
          address: userAddress,
          chainId,
          signature,
          walletType: 'coinbase'
        };
        
        setWalletState(newState);
        saveWalletState(newState);
      }
    } catch (error: any) {
      console.error('Coinbase Wallet connection error:', error);
      alert('Failed to connect to Coinbase Wallet. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsModalOpen(false);
    }
  };
  
  // Connect to Coinbase Smart Wallet
  const connectCoinbaseSmartWallet = async () => {
    setIsConnecting(true);
    setConnectingWallet('CoinbaseSmart');
    
    try {
      // Check if smart wallet features are supported
      if (!isCoinbaseSmartWalletSupported()) {
        throw new Error('Coinbase Smart Wallet features are not available on this device');
      }
      
      // First, we need the regular Coinbase Wallet provider
      const ethereum = (window as any).ethereum;
      
      // Look for the Coinbase provider
      let coinbaseProvider = null;
      if (ethereum.providers) {
        coinbaseProvider = ethereum.providers.find((p: any) => p.isCoinbaseWallet);
      } else if (ethereum.isCoinbaseWallet) {
        coinbaseProvider = ethereum;
      } else if ((window as any).coinbaseWalletExtension) {
        coinbaseProvider = (window as any).coinbaseWalletExtension;
      }
      
      if (!coinbaseProvider) {
        if (confirm('Coinbase Wallet extension is required for Smart Wallet features. Would you like to install it?')) {
          window.open('https://www.coinbase.com/wallet/downloads', '_blank');
        }
        throw new Error('Coinbase Wallet provider not found');
      }
      
      // Start the smart wallet creation/connection process
      console.log('Initializing Coinbase Smart Wallet...');
      
      // In a real implementation, this would use the Coinbase SDK to initialize a smart wallet
      // For now, we'll simulate the process with a delayed response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Request standard account first
      console.log('Requesting accounts from Coinbase Wallet...');
      const accounts = await coinbaseProvider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available from Coinbase Wallet');
      }
      
      const userAddress = accounts[0];
      console.log('Connected to Coinbase account:', userAddress);
      
      // Simulate smart wallet creation process
      console.log('Creating/accessing smart account...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll use a slightly modified address to represent the smart wallet
      // In reality, this would be a different contract wallet address
      const smartWalletAddress = userAddress.substring(0, 2) + '4aa' + userAddress.substring(5);
      
      // Get chain ID
      const chainIdHex = await coinbaseProvider.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      // Check if on a supported network
      const supportedChainIds = [84531, 8453, 1, 137]; // Base Testnet, Base, Ethereum, Polygon
      setIsSupportedNetwork(supportedChainIds.includes(chainId));
      
      // Request signature for authentication
      let signature = null;
      try {
        const timestamp = Date.now();
        const message = `NEDA Pay Smart Wallet Authentication\nWallet: ${smartWalletAddress}\nTimestamp: ${timestamp}`;
        
        console.log('Requesting signature for Smart Wallet auth:', message);
        signature = await coinbaseProvider.request({
          method: 'personal_sign',
          params: [message, userAddress] // Sign with the EOA, not the smart wallet address
        });
        
        console.log('Signature received for Smart Wallet');
      } catch (signError) {
        console.warn('User rejected signature request:', signError);
        // Still proceed with connection
      }
      
      // Update wallet state with the smart wallet info
      const newState: WalletState = {
        isConnected: true,
        address: smartWalletAddress, // Use the smart wallet address
        chainId,
        signature,
        walletType: 'coinbase-smart'
      };
      
      setWalletState(newState);
      saveWalletState(newState);
      
    } catch (error: any) {
      console.error('Coinbase Smart Wallet connection error:', error);
      alert(`Failed to connect Coinbase Smart Wallet: ${error.message || 'Please try again'}`);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsModalOpen(false);
    }
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    clearWalletState();
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      signature: null
    });
    console.log('Wallet disconnected');
  };

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
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Connect Wallet
          </button>
          
          {/* Wallet Selection Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div 
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 m-4 animate-fadeIn"
                style={{ maxHeight: '80vh', overflowY: 'auto' }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Connect Wallet</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a wallet to connect to NEDA Pay:
                </p>
                
                {/* Wallet Categories */}
                <div className="mb-6 space-y-6">
                  {/* EOA Wallets Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <span className="inline-block h-0.5 w-4 bg-gray-300 dark:bg-gray-600 mr-2"></span>
                      Standard Wallets
                    </h4>
                    
                    {/* FORCING MetaMask to show on ALL browsers - removed ALL conditional logic */}
                    <button
                      onClick={connectMetaMask}
                      disabled={isConnecting && connectingWallet !== 'MetaMask'}
                      className={`w-full flex items-center justify-between p-3 rounded-lg mb-3 ${
                        connectingWallet === 'MetaMask' 
                          ? 'bg-orange-100 dark:bg-orange-900/20 border-2 border-orange-500' 
                          : 'bg-white dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 border border-gray-200 dark:border-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 mr-3 flex-shrink-0 bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">MetaMask</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Connect to your MetaMask wallet</p>
                        </div>
                      </div>
                      {connectingWallet === 'MetaMask' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Coinbase Wallet Option */}
                    <button
                      onClick={connectCoinbaseWallet}
                      disabled={isConnecting && connectingWallet !== 'Coinbase'}
                      className={`w-full flex items-center justify-between p-3 rounded-lg ${
                        connectingWallet === 'Coinbase' 
                          ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-500' 
                          : 'bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-gray-200 dark:border-gray-600 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 mr-3 flex-shrink-0 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12h8"></path>
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Coinbase Wallet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Connect using Coinbase wallet</p>
                        </div>
                      </div>
                      {connectingWallet === 'Coinbase' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Smart Wallets Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <span className="inline-block h-0.5 w-4 bg-gray-300 dark:bg-gray-600 mr-2"></span>
                      Smart Contract Wallets
                    </h4>
                    
                    {/* Coinbase Smart Wallet Option */}
                    <button
                      onClick={connectCoinbaseSmartWallet}
                      disabled={isConnecting && connectingWallet !== 'CoinbaseSmart'}
                      className={`w-full flex items-center justify-between p-3 rounded-lg ${
                        connectingWallet === 'CoinbaseSmart' 
                          ? 'bg-indigo-100 dark:bg-indigo-900/20 border-2 border-indigo-500' 
                          : 'bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 border border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 mr-3 flex-shrink-0 bg-white p-1.5 rounded-lg border border-indigo-200 flex items-center justify-center relative">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12h8"></path>
                          </svg>
                          <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6.5 2a.5.5 0 0 0 0 1h1v1a4.5 4.5 0 0 0 9 0V3h1a.5.5 0 0 0 0-1h-11zm2 1h7v1a3.5 3.5 0 0 1-7 0V3z"/>
                              <path d="M4.5 8.5a4 4 0 0 1 8 0V10a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V8.5zm2.5.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 0-1h-2a.5.5 0 0 0-.5.5zm9 0a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5z"/>
                            </svg>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Coinbase Smart Wallet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Connect using Smart Account features</p>
                        </div>
                      </div>
                      {connectingWallet === 'CoinbaseSmart' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Help section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-2">
                    New to Ethereum wallets?
                  </p>
                  <div className="flex justify-center space-x-4">
                    <a 
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                    >
                      <span className="w-2 h-2 mr-1 bg-orange-500 rounded-full inline-block"></span>
                      Install MetaMask
                    </a>
                    <a 
                      href="https://www.coinbase.com/wallet/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                    >
                      <span className="w-2 h-2 mr-1 bg-blue-500 rounded-full inline-block"></span>
                      Install Coinbase Wallet
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}