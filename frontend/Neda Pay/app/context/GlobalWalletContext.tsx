'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  checkWalletConnection, 
  connectWallet, 
  disconnectWallet, 
  getChainId, 
  setupWalletListeners,
  switchNetwork,
  getSmartWallet,
  createSmartWallet,
  isMetaMaskInstalled,
  isCoinbaseWalletInstalled
} from '../services/wallet';

// Define the context type
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  isConnecting: boolean;
  smartWalletAddress: string | null;
  hasMetaMask: boolean;
  hasCoinbaseWallet: boolean;
  connect: (preferredWallet?: 'metamask' | 'coinbase') => Promise<void>;
  disconnect: () => void;
  switchToNetwork: (chainId: number) => Promise<boolean>;
  createSmartAccount: () => Promise<string | null>;
}

// Create the context with default values
const GlobalWalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  chainId: null,
  isConnecting: false,
  smartWalletAddress: null,
  hasMetaMask: false,
  hasCoinbaseWallet: false,
  connect: async () => {},
  disconnect: () => {},
  switchToNetwork: async () => false,
  createSmartAccount: async () => null,
});

// Provider component
export const GlobalWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasCoinbaseWallet, setHasCoinbaseWallet] = useState(false);

  // Check for wallet providers on mount
  useEffect(() => {
    const checkWalletProviders = async () => {
      // Force detection in development if needed
      if (process.env.NEXT_PUBLIC_FORCE_WALLET_DETECTION === 'true') {
        setHasMetaMask(true);
        setHasCoinbaseWallet(true);
        console.log('Forcing wallet detection for development');
        return;
      }
      
      // Direct check for wallet providers in window.ethereum
      const ethereum = (window as any).ethereum;
      const hasMetaMask = ethereum && ethereum.isMetaMask;
      const hasCoinbase = ethereum && ethereum.isCoinbaseWallet;
      
      setHasMetaMask(!!hasMetaMask);
      setHasCoinbaseWallet(!!hasCoinbase);
      
      console.log('Wallet providers detected:', { hasMetaMask, hasCoinbase });
    };
    
    checkWalletProviders();
  }, []);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connectedAddress = await checkWalletConnection();
      if (connectedAddress) {
        setAddress(connectedAddress);
        setIsConnected(true);
        
        // Get chain ID
        const currentChainId = await getChainId();
        setChainId(currentChainId);
        
        // Check for smart wallet
        const smartWallet = getSmartWallet(connectedAddress);
        if (smartWallet) {
          setSmartWalletAddress(smartWallet);
        }
      }
    };
    
    checkConnection();
  }, []);

  // Set up wallet event listeners
  useEffect(() => {
    if (!isConnected) return;
    
    const cleanup = setupWalletListeners(
      // Accounts changed
      (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAddress(null);
          setIsConnected(false);
          setSmartWalletAddress(null);
        } else {
          // Account switched
          const newAddress = accounts[0];
          setAddress(newAddress);
          
          // Check for smart wallet for the new address
          const smartWallet = getSmartWallet(newAddress);
          setSmartWalletAddress(smartWallet);
        }
      },
      // Chain changed
      (newChainId) => {
        setChainId(newChainId);
      }
    );
    
    return cleanup;
  }, [isConnected]);

  // Connect wallet function
  const connect = async (preferredWallet?: 'metamask' | 'coinbase'): Promise<void> => {
    setIsConnecting(true);
    try {
      const connectedAddress = await connectWallet(preferredWallet);
      console.log('[GlobalWalletContext] connectWallet returned:', connectedAddress);
      if (connectedAddress) {
        setAddress(connectedAddress);
        setIsConnected(true);
        console.log('[GlobalWalletContext] setAddress & setIsConnected fired:', connectedAddress);
        // Get chain ID
        const currentChainId = await getChainId();
        setChainId(currentChainId);
        console.log('[GlobalWalletContext] setChainId fired:', currentChainId);
        // Check for existing smart wallet
        const smartWallet = getSmartWallet(connectedAddress);
        if (smartWallet) {
          setSmartWalletAddress(smartWallet);
          console.log('[GlobalWalletContext] setSmartWalletAddress fired:', smartWallet);
        }
      } else {
        console.warn('[GlobalWalletContext] connectWallet did not return an address.');
      }
    } catch (error) {
      console.error('Error in connect function:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = (): void => {
    disconnectWallet();
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setSmartWalletAddress(null);
  };
  
  // Switch network function
  const switchToNetwork = async (targetChainId: number): Promise<boolean> => {
    const success = await switchNetwork(targetChainId);
    if (success) {
      setChainId(targetChainId);
    }
    return success;
  };
  
  // Create smart account function
  const createSmartAccount = async (): Promise<string | null> => {
    if (!address) return null;
    
    try {
      const smartWallet = await createSmartWallet(address);
      if (smartWallet) {
        setSmartWalletAddress(smartWallet);
      }
      return smartWallet;
    } catch (error) {
      console.error('Error creating smart account:', error);
      return null;
    }
  };

  // Context value
  const value = {
    address,
    isConnected,
    chainId,
    isConnecting,
    smartWalletAddress,
    hasMetaMask,
    hasCoinbaseWallet,
    connect,
    disconnect,
    switchToNetwork,
    createSmartAccount,
  };

  return (
    <GlobalWalletContext.Provider value={value}>
      {children}
    </GlobalWalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useGlobalWallet = () => useContext(GlobalWalletContext);
