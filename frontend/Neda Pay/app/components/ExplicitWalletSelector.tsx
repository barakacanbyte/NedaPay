'use client';

import { useState, useEffect } from 'react';
import { loadWalletState, saveWalletState, clearWalletState, WalletState } from '../utils/wallet-state';

export default function ExplicitWalletSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load saved wallet state on mount
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const state = loadWalletState();
      setIsConnected(state.isConnected);
      setAddress(state.address);
      
      // Check if we're already connected
      checkIfConnected();
      
      // Set up Ethereum event listener for account changes
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            // User disconnected
            handleDisconnect();
          } else {
            // Account changed
            setAddress(accounts[0]);
            setIsConnected(true);
            updateWalletState(accounts[0]);
          }
        };
        
        ethereum.on('accountsChanged', handleAccountsChanged);
        
        return () => {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
      }
    }
  }, []);

  // Check if wallet is already connected
  const checkIfConnected = async () => {
    if (typeof window === 'undefined') return;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    
    try {
      // This just checks existing connections without prompting
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        updateWalletState(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  // Update wallet state with connected account
  const updateWalletState = async (connectedAddress: string) => {
    if (typeof window === 'undefined') return;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    
    try {
      // Get chain ID
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      // Request signature (optional)
      let signature = null;
      try {
        const message = `NEDA Pay Authentication\nConnecting wallet: ${connectedAddress}\nTimestamp: ${Date.now()}`;
        signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, connectedAddress]
        });
      } catch (signError) {
        console.warn("User declined to sign:", signError);
      }
      
      // Update state
      const newState: WalletState = {
        isConnected: true,
        address: connectedAddress,
        chainId,
        signature
      };
      
      saveWalletState(newState);
      
      console.log("Wallet state updated:", newState);
    } catch (error) {
      console.error("Error updating wallet state:", error);
    }
  };

  // Connect MetaMask
  const connectMetaMask = async () => {
    // Check if MetaMask is installed
    if (typeof window === 'undefined') return;
    
    try {
      // MetaMask deep link for mobile or extension check for desktop
      if (!(window as any).ethereum?.isMetaMask) {
        // If MetaMask is not detected, open MetaMask website or deep link
        window.open('https://metamask.app.link/dapp/yourwebsite.com', '_blank');
        setIsModalOpen(false);
        return;
      }
      
      // MetaMask is present, connect to it
      const ethereum = (window as any).ethereum;
      
      // Request accounts - this will prompt the user to connect
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        updateWalletState(accounts[0]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("MetaMask connection error:", error);
      alert("Failed to connect to MetaMask. Please try again.");
    }
  };

  // Connect Coinbase Wallet
  const connectCoinbaseWallet = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Check if Coinbase Wallet extension is installed
      if (!(window as any).ethereum?.isCoinbaseWallet) {
        // If not installed, open Coinbase Wallet deep link
        window.open('https://go.cb-w.com/dapp?cb_url=yourwebsite.com', '_blank');
        setIsModalOpen(false);
        return;
      }
      
      // Coinbase Wallet is installed
      const ethereum = (window as any).ethereum;
      
      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        updateWalletState(accounts[0]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Coinbase Wallet connection error:", error);
      alert("Failed to connect to Coinbase Wallet. Please try again.");
    }
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress(null);
    clearWalletState();
  };

  if (!mounted) return null;

  return (
    <div>
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
          
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Connect Wallet</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a wallet to connect:
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={connectMetaMask}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 text-xl">
                        🦊
                      </div>
                      <div>
                        <p className="font-medium">MetaMask</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect to your MetaMask wallet</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={connectCoinbaseWallet}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-xl">
                        💰
                      </div>
                      <div>
                        <p className="font-medium">Coinbase Wallet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect to your Coinbase wallet</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>New to Ethereum wallets?</p>
                    <div className="flex justify-center space-x-4 mt-2">
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Install MetaMask
                      </a>
                      <a
                        href="https://www.coinbase.com/wallet/downloads"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
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
