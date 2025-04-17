'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { loadWalletState, saveWalletState, clearWalletState, WalletState } from '../utils/wallet-state';

export default function ImprovedWalletConnector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(loadWalletState());
  const [mounted, setMounted] = useState(false);
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

  // Helper function to detect if MetaMask is installed
  const isMetaMaskInstalled = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const { ethereum } = window as any;
    
    // Check multiple ways MetaMask might be available
    if (ethereum) {
      // Direct property
      if (ethereum.isMetaMask) return true;
      
      // In providers array
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        return ethereum.providers.some((p: any) => p.isMetaMask);
      }
    }
    
    // Always return true for testing if needed
    return true; // Force MetaMask to always show in the list
  };

  // Helper function to detect if Coinbase Wallet is installed
  const isCoinbaseWalletInstalled = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const { ethereum } = window as any;
    
    // Check multiple ways Coinbase might be available
    if (ethereum) {
      // Direct property
      if (ethereum.isCoinbaseWallet) return true;
      
      // In providers array
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        return ethereum.providers.some((p: any) => p.isCoinbaseWallet);
      }
    }
    
    // Also check for coinbaseWalletExtension global
    return Boolean((window as any).coinbaseWalletExtension);
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
      
      // Look specifically for MetaMask - different ways to detect it
      let metaMaskProvider = null;
      
      // Check if it's a multi-provider environment
      if (ethereum.providers) {
        // Find the MetaMask provider in the providers array
        metaMaskProvider = ethereum.providers.find((p: any) => p.isMetaMask && !p.isCoinbaseWallet);
      } else if (ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
        // Single MetaMask provider
        metaMaskProvider = ethereum;
      } else {
        // Fallback to using ethereum directly
        metaMaskProvider = ethereum;
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
          signature
        };
        
        setWalletState(newState);
        saveWalletState(newState);
      }
    } catch (error) {
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
          signature
        };
        
        setWalletState(newState);
        saveWalletState(newState);
      }
    } catch (error) {
      console.error('Coinbase Wallet connection error:', error);
      alert('Failed to connect to Coinbase Wallet. Please try again.');
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
      setIsModalOpen(false);
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
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Connect Wallet
          </button>
          
          {/* Improved Wallet Selection Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div 
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 m-4 animate-fadeIn"
                style={{ maxHeight: '90vh', overflowY: 'auto', position: 'relative', top: '0' }}
              >
                <div className="flex justify-between items-center mb-6">
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
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select a wallet to connect to NEDA Pay:
                </p>
                
                <div className="space-y-4">
                  {/* MetaMask Option - Added mb-4 for extra spacing and a distinctive outline */}
                  <button
                    onClick={connectMetaMask}
                    disabled={isConnecting && connectingWallet !== 'MetaMask'}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all mb-4 ${
                      connectingWallet === 'MetaMask' 
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-4 flex-shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
                        <img 
                          src="/images/metamask-logo.svg" 
                          alt="MetaMask" 
                          width={36} 
                          height={36} 
                          className="rounded-full"
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">MetaMask</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect to your MetaMask wallet</p>
                      </div>
                    </div>
                    {connectingWallet === 'MetaMask' ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Coinbase Wallet Option */}
                  <button
                    onClick={connectCoinbaseWallet}
                    disabled={isConnecting && connectingWallet !== 'Coinbase'}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      connectingWallet === 'Coinbase' 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-4 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                        <img 
                          src="/images/coinbase-logo.svg" 
                          alt="Coinbase Wallet" 
                          width={36} 
                          height={36} 
                          className="rounded-full"
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">Coinbase Wallet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect to your Coinbase wallet</p>
                      </div>
                    </div>
                    {connectingWallet === 'Coinbase' ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Help section */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
                      New to Ethereum wallets?
                    </p>
                    <div className="flex justify-center space-x-6">
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Install MetaMask
                      </a>
                      <a
                        href="https://www.coinbase.com/wallet/downloads"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Install Coinbase Wallet
                      </a>
                    </div>
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
