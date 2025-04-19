'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { baseSepolia } from '../compatibility/chains-compat';
import { useOnchainKit } from '@coinbase/onchainkit';

// Define a global variable to track wallet state across page navigations
let globalWalletState = {
  address: null as string | null,
  isConnected: false,
  chainId: null as number | null,
  provider: null as any
};

// Define the shape of our wallet context
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  isPending: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  error: string | null;
  switchNetwork: () => Promise<void>;
}

// Create the context with a default value
const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  chainId: null,
  isPending: false,
  connect: async () => false,
  disconnect: () => {},
  error: null,
  switchNetwork: async () => {}
});

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Provider component to wrap our app
export function WalletProvider({ children }: { children: ReactNode }) {
  // Get OnchainKit state
  const { 
    address: onchainAddress, 
    isConnected: onchainIsConnected, 
    chain,  // OnchainKit uses 'chain' instead of 'chainId'
    connect: onchainConnect,
    disconnect: onchainDisconnect
  } = useOnchainKit();
  
  // Extract chainId from chain if available
  const onchainChainId = chain?.id || null;

  // Use state that synchronizes with OnchainKit and global state
  const [address, setAddress] = useState<string | null>(onchainAddress || globalWalletState.address);
  const [isConnected, setIsConnected] = useState<boolean>(onchainIsConnected || globalWalletState.isConnected);
  const [chainId, setChainId] = useState<number | null>(onchainChainId || globalWalletState.chainId);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sync with OnchainKit state changes
  useEffect(() => {
    if (onchainAddress) {
      setAddress(onchainAddress);
      globalWalletState.address = onchainAddress;
    }
    
    if (onchainIsConnected) {
      setIsConnected(true);
      globalWalletState.isConnected = true;
    }
    
    if (onchainChainId) {
      setChainId(onchainChainId);
      globalWalletState.chainId = onchainChainId;
    }
    
    // Store in localStorage for persistence across page refreshes
    if (typeof window !== 'undefined' && onchainIsConnected && onchainAddress) {
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', onchainAddress);
      if (onchainChainId) {
        localStorage.setItem('wallet_chainId', onchainChainId.toString());
      }
    }
  }, [onchainAddress, onchainIsConnected, onchainChainId]);
  
  // Check for existing connection on mount - but don't auto-connect
  // We want to always prompt the user to connect their wallet explicitly
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window === 'undefined') return;
      
      // First check if we're already connected via OnchainKit
      if (onchainIsConnected && onchainAddress) {
        console.log('Already connected via OnchainKit:', onchainAddress);
        return;
      }
      
      // Clear any existing wallet connection data to ensure user always has to connect explicitly
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_chainId');
      
      // Reset global state
      globalWalletState.address = null;
      globalWalletState.isConnected = false;
      globalWalletState.chainId = null;
      
      // Reset local state
      setAddress(null);
      setIsConnected(false);
      setChainId(null);
    };
    
    checkExistingConnection();
  }, [onchainIsConnected, onchainAddress]);
  
  // Set up event listeners for wallet events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setAddress(null);
        setIsConnected(false);
        setError(null);
        
        // Update global state
        globalWalletState.address = null;
        globalWalletState.isConnected = false;
        
        // Clear localStorage
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_chainId');
      } else {
        // User switched accounts
        setAddress(accounts[0]);
        setIsConnected(true);
        setError(null);
        
        // Update global state
        globalWalletState.address = accounts[0];
        globalWalletState.isConnected = true;
        
        // Update localStorage
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_address', accounts[0]);
      }
    };
    
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      
      // Update global state
      globalWalletState.chainId = newChainId;
      
      // Update localStorage
      localStorage.setItem('wallet_chainId', newChainId.toString());
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);
  
  // Function to connect wallet - direct provider interaction approach
  // Always prompt for signing when connecting
  const connect = async (): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    
    try {
      // Skip OnchainKit connect and use direct connection for consistency
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask or Coinbase Wallet.');
      }
      
      // Direct interaction with Ethereum provider - this will trigger the wallet popup
      // Using eth_requestAccounts to ensure the user is prompted to connect
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }
      
      // Get current chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      
      // Request a signature to ensure the user is prompted to sign
      // This is a simple message signing that doesn't do anything but ensures the user sees the signing prompt
      try {
        const message = `NEDA Pay Authentication\nConnecting wallet: ${accounts[0]}\nTimestamp: ${Date.now()}`;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]]
        });
        console.log('User signed authentication message:', signature);
      } catch (signError: any) {
        // If user rejects signing, we still proceed with connection
        // but log the rejection
        if (signError.code === 4001) {
          console.warn('User rejected signing, but connection will proceed');
        } else {
          console.error('Error during signing:', signError);
        }
      }
      
      // Update local state
      setAddress(accounts[0]);
      setIsConnected(true);
      setChainId(currentChainId);
      
      // Update global state to share across pages
      globalWalletState.address = accounts[0];
      globalWalletState.isConnected = true;
      globalWalletState.chainId = currentChainId;
      globalWalletState.provider = window.ethereum;
      
      // Store in localStorage for persistence
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', accounts[0]);
      localStorage.setItem('wallet_chainId', currentChainId.toString());
      
      console.log('Connected wallet:', accounts[0]);
      return true;
    } catch (error: any) {
      // Handle user rejection separately
      if (error.code === 4001) {
        console.error('User rejected the connection request');
        setError('Connection rejected. Please approve the connection request in your wallet.');
      } else {
        console.error('Error connecting wallet:', error);
        setError(error.message || 'Failed to connect wallet');
      }
      return false;
    } finally {
      setIsPending(false);
    }
  };
  
  // Function to disconnect wallet
  const disconnect = () => {
    // First try OnchainKit disconnect
    if (onchainDisconnect) {
      try {
        onchainDisconnect();
      } catch (error) {
        console.error('Error with OnchainKit disconnect:', error);
      }
    }
    
    // Reset local state
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setError(null);
    
    // Reset global state
    globalWalletState.address = null;
    globalWalletState.isConnected = false;
    globalWalletState.chainId = null;
    globalWalletState.provider = null;
    
    // Clear localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chainId');
    
    console.log('Wallet disconnected');
  };
  
  // Function to switch to Base Sepolia network
  const switchNetwork = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      setIsPending(true);
      setError(null);
      
      try {
        // Try to switch to Base Sepolia
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${baseSepolia.id.toString(16)}` }],
        });
        
        // Update chain ID after successful switch
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const newChainId = parseInt(chainIdHex, 16);
        
        // Update local state
        setChainId(newChainId);
        
        // Update global state
        globalWalletState.chainId = newChainId;
        
        // Update localStorage
        localStorage.setItem('wallet_chainId', newChainId.toString());
        
        console.log('Switched to Base Sepolia');
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to the wallet
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${baseSepolia.id.toString(16)}`,
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
            
            // Try switching again after adding
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${baseSepolia.id.toString(16)}` }],
            });
            
            // Update chain ID after successful switch
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const newChainId = parseInt(chainIdHex, 16);
            
            // Update local state
            setChainId(newChainId);
            
            // Update global state
            globalWalletState.chainId = newChainId;
            
            // Update localStorage
            localStorage.setItem('wallet_chainId', newChainId.toString());
          } catch (addError) {
            console.error('Failed to add Base Sepolia network:', addError);
            setError('Failed to add Base Sepolia network. Please try again.');
          }
        } else {
          console.error('Failed to switch to Base Sepolia:', switchError);
          setError('Failed to switch network. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error switching network:', error);
      setError(error.message || 'Failed to switch network');
    } finally {
      setIsPending(false);
    }
  };
  
  // Provide the wallet context value with our global state
  const contextValue: WalletContextType = {
    address,
    isConnected,
    chainId,
    isPending,
    connect,
    disconnect,
    error,
    switchNetwork
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}
