'use client';

import { useState, useEffect } from 'react';

// Simple wallet hook that mimics the functionality without dependencies
export function useWallet() {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect to wallet
  const connect = async () => {
    setIsConnecting(true);
    try {
      // Check if ethereum is available in window
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } else {
        console.error('Ethereum provider not found');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from wallet
  const disconnect = async () => {
    setAddress(undefined);
    setIsConnected(false);
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect
  };
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
