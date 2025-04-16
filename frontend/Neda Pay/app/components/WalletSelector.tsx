'use client';

import { useState, useRef, useEffect } from 'react';
import { addBaseSepolia, switchToBaseSepolia, BASE_SEPOLIA_DECIMAL, getEthereumProvider } from '../utils/chain-helpers';
import Link from 'next/link';

// Smart wallet factory address from memory
const SMART_WALLET_FACTORY_ADDRESS = '0x10dE41927cdD093dA160E562630e0efC19423869';

export default function WalletSelector() {
  const [showOptions, setShowOptions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Track wallet connection state manually
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  // Check if wallet is already connected on component mount
  useEffect(() => {
    // We'll skip auto-connecting to prevent automatic reconnection
    // This ensures the user is always prompted to connect
    
    // Instead, we'll just set up listeners for account and chain changes
    // This way, if the user connects through another component or manually,
    // we'll still update our state
    
    // Suppress console errors when no provider is detected
    const originalConsoleError = console.error;
    console.error = function(msg, ...args) {
      if (typeof msg === 'string' && msg.includes('No Ethereum provider detected')) {
        // Silently ignore this specific error
        return;
      }
      originalConsoleError.apply(console, [msg, ...args]);
    };
    
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
      
      // Clear any cached connection data in localStorage
      try {
        if (window.localStorage) {
          // Clear any wallet connection cache that might be causing auto-reconnect
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('wallet') || key.includes('connect') || key.includes('wagmi') || key.includes('coinbase'))) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }
    
    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
      // Restore original console.error
      console.error = originalConsoleError;
    };
  }, []);
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear error message when connection status changes
  useEffect(() => {
    if (isConnected) {
      setErrorMessage(null);
      setShowOptions(false);
    }
  }, [isConnected]);
  
  // Function to handle wallet connection with specific connector
  const handleConnectWallet = async (walletType?: string) => {
    setIsConnecting(true);
    setErrorMessage(null);
    setIsPending(true);
    
    try {
      const provider = getEthereumProvider();
      if (!provider) {
        throw new Error('No Ethereum provider found. Please install MetaMask or Coinbase Wallet.');
      }
      
      // For MetaMask, try to switch to Base Sepolia first
      if (walletType === 'metamask' && provider.isMetaMask) {
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
      
      // Check if the error is about unrecognized chain ID
      if (error.message?.includes('Unrecognized chain ID')) {
        setErrorMessage('Base Sepolia chain not recognized. Click "Add Base Sepolia" button below.');
      } else {
        setErrorMessage(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
      setIsPending(false);
    }
  };
  
  // Function to handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      // There's no standard way to disconnect in all wallets
      // Just update our local state
      setIsConnected(false);
      setAddress(null);
      setShowOptions(false);
      
      // For MetaMask, we can try this approach
      const provider = getEthereumProvider();
      if (provider && provider.isMetaMask && provider._state && typeof provider._state.accounts !== 'undefined') {
        // This is a hack for MetaMask
        // @ts-ignore
        provider._state.accounts = [];
      }
    } catch (error) {
      console.error('Error disconnecting wallet', error);
    }
  };
  
  // Function to add Base Sepolia to MetaMask
  const handleAddBaseSepolia = async () => {
    try {
      const success = await addBaseSepolia();
      setErrorMessage(null);
      if (success) {
        // Try connecting again after adding the network
        setTimeout(() => {
          handleConnectWallet('metamask');
        }, 500);
      }
    } catch (error: any) {
      console.error('Error adding Base Sepolia', error);
      setErrorMessage(error.message || 'Failed to add Base Sepolia to wallet');
    }
  };

  // Function to create a smart wallet
  const handleCreateSmartWallet = () => {
    // This would typically redirect to a page to create a smart wallet
    setErrorMessage(null);
    setShowOptions(false);
  };

  // Get chain name
  const getChainName = () => {
    if (chainId === BASE_SEPOLIA_DECIMAL) return 'Base Sepolia';
    return chainId ? `Chain ID: ${chainId}` : 'Unknown Chain';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => isConnected ? setShowOptions(!showOptions) : setShowOptions(true)}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-300"
        disabled={isPending}
      >
        {isConnected ? (
          <>
            <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <>
            <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
            {!isPending && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        )}
      </button>

      {errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-100 text-red-700 rounded-md z-10">
          {errorMessage}
          {errorMessage.includes('Base Sepolia') && (
            <button
              onClick={handleAddBaseSepolia}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md transition-colors duration-300"
            >
              Add Base Sepolia
            </button>
          )}
        </div>
      )}

      {showOptions && !isConnected && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white rounded-md shadow-lg z-10 overflow-hidden w-64">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Connect Wallet</h3>
          </div>

          <div className="p-3 space-y-2">
            {/* MetaMask Option */}
            <button
              onClick={() => handleConnectWallet('metamask')}
              className="w-full text-left p-3 hover:bg-gray-700 rounded-md transition-colors duration-300 flex items-center gap-3"
              disabled={isPending}
            >
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.3622 2L13.3622 8.4L14.9622 4.56L21.3622 2Z" fill="#E17726"/>
                  <path d="M2.63782 2L10.5378 8.46L9.03782 4.56L2.63782 2Z" fill="#E27625"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold">MetaMask</div>
                <div className="text-xs text-gray-400">Connect to your MetaMask wallet</div>
              </div>
            </button>
            
            {/* Coinbase Wallet Option */}
            <button
              onClick={() => handleConnectWallet('coinbaseWallet')}
              className="w-full text-left p-3 hover:bg-gray-700 rounded-md transition-colors duration-300 flex items-center gap-3"
              disabled={isPending}
            >
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0C4.478 0 0 4.478 0 10C0 15.522 4.478 20 10 20C15.522 20 20 15.522 20 10C20 4.478 15.522 0 10 0ZM10 18.75C5.175 18.75 1.25 14.825 1.25 10C1.25 5.175 5.175 1.25 10 1.25C14.825 1.25 18.75 5.175 18.75 10C18.75 14.825 14.825 18.75 10 18.75Z" fill="white"/>
                  <path d="M14.375 10C14.375 12.415 12.415 14.375 10 14.375C7.585 14.375 5.625 12.415 5.625 10C5.625 7.585 7.585 5.625 10 5.625C12.415 5.625 14.375 7.585 14.375 10Z" fill="white"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold">Coinbase Wallet</div>
                <div className="text-xs text-gray-400">Connect to your Coinbase wallet</div>
              </div>
            </button>
            
            {/* Smart Wallet Option */}
            <Link 
              href="/smart-wallet/create"
              className="w-full text-left p-3 hover:bg-gray-700 rounded-md transition-colors duration-300 flex items-center gap-3"
              onClick={handleCreateSmartWallet}
            >
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="font-semibold">Create Smart Wallet</div>
                <div className="text-xs text-gray-400">Create a new gasless smart wallet</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {showOptions && isConnected && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 text-white rounded-md shadow-lg z-10 overflow-hidden w-48">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Wallet</h3>
          </div>

          <div className="p-3">
            <div className="mb-2 text-xs text-gray-400">
              Connected to: {getChainName()}
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full text-left p-2 hover:bg-gray-700 rounded-md transition-colors duration-300 flex items-center gap-2 text-red-400"
              disabled={isPending}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}