'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EthereumWindow extends Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
  };
}

export default function SimpleWalletConnector() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    
    // Set up event listeners for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };
    
    // Add event listener
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Return cleanup function
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Simple function to check if wallet is connected
  const checkConnection = async () => {
    if (typeof window === 'undefined') return;
    
    const ethereum = (window as unknown as EthereumWindow).ethereum;
    if (!ethereum) return;
    
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('Checking connection, accounts:', accounts);
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  // Simple function to connect wallet
  const connectWallet = async () => {
    if (typeof window === 'undefined') return;
    
    const ethereum = (window as unknown as EthereumWindow).ethereum;
    if (!ethereum) {
      alert('Please install MetaMask to use this feature');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connect wallet result:', accounts);
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // Navigate to wallet page after successful connection
        router.push('/wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Simple function to disconnect wallet
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chainId');
    console.log('Wallet disconnected');
  };

  // Render connect button or address + disconnect button
  return (
    <div>
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium bg-gray-100 dark:bg-gray-800 py-1 px-3 rounded-full">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <button
            onClick={disconnectWallet}
            className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
            type="button"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all flex items-center space-x-2 disabled:opacity-50"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      )}
    </div>
  );
}
