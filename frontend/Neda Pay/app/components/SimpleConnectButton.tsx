'use client';

import { useState, useEffect } from 'react';
import { loadWalletState, saveWalletState, clearWalletState, WalletState } from '../utils/wallet-state';

export default function SimpleConnectButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set up initial state and event listeners
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      // Load wallet state
      const state = loadWalletState();
      setIsConnected(state.isConnected);
      setAddress(state.address);
      
      // Set up event listener for wallet state changes
      const handleWalletStateChanged = (event: Event) => {
        const customEvent = event as CustomEvent<WalletState>;
        setIsConnected(customEvent.detail.isConnected);
        setAddress(customEvent.detail.address);
      };
      
      window.addEventListener('walletStateChanged', handleWalletStateChanged);
      
      return () => {
        window.removeEventListener('walletStateChanged', handleWalletStateChanged);
      };
    }
  }, []);

  // Simple direct wallet connect function that will reliably trigger wallet popup
  const connectWallet = async () => {
    if (typeof window === 'undefined') return;
    
    setIsConnecting(true);
    
    try {
      // Check if MetaMask or other wallet is installed
      if (!window.ethereum) {
        alert('Please install MetaMask or Coinbase Wallet to connect');
        setIsConnecting(false);
        return;
      }
      
      // Direct method to request accounts - this will trigger the wallet popup
      const ethereum = window.ethereum as any;
      
      console.log('Requesting wallet connection...');
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        console.log('Connected to wallet:', userAddress);
        
        // Get chain ID
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        
        // Request signature
        try {
          const message = `NEDA Pay Authentication\nConnecting wallet: ${userAddress}\nTimestamp: ${Date.now()}`;
          
          console.log('Requesting signature for:', message);
          const signature = await ethereum.request({
            method: 'personal_sign',
            params: [message, userAddress]
          });
          
          console.log('Signature received');
          
          // Save wallet state
          const newState: WalletState = {
            isConnected: true,
            address: userAddress,
            chainId,
            signature
          };
          
          saveWalletState(newState);
          setIsConnected(true);
          setAddress(userAddress);
          
        } catch (signError) {
          console.warn('User declined to sign message:', signError);
          
          // Connect anyway without signature
          const newState: WalletState = {
            isConnected: true,
            address: userAddress,
            chainId,
            signature: null
          };
          
          saveWalletState(newState);
          setIsConnected(true);
          setAddress(userAddress);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    clearWalletState();
    setIsConnected(false);
    setAddress(null);
    console.log('Wallet disconnected');
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
            onClick={disconnectWallet}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
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
      )}
    </div>
  );
}
