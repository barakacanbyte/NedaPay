'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as walletService from '../services/wallet';
import { baseSepolia } from '../compatibility/chains-compat';

export default function WalletConnector() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Check if we're on Base Sepolia
  const isOnCorrectNetwork = chainId === baseSepolia.id;

  // Check for existing connection on mount
  // Set mounted state once component mounts
  useEffect(() => {
    setMounted(true);
    
    // Check if we're already connected
    const checkConnection = async () => {
      const connectedAddress = await walletService.checkWalletConnection();
      
      if (connectedAddress) {
        setAddress(connectedAddress);
        setIsConnected(true);
        
        // Get chain ID
        const currentChainId = await walletService.getChainId();
        if (currentChainId) {
          setChainId(currentChainId);
        }
        
        // Fetch balance
        fetchBalance(connectedAddress);
      }
    };
    
    checkConnection();
    
    // Set up event listeners
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
        setBalance('0');
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
        fetchBalance(accounts[0]);
      }
    };
    
    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      // Refresh balance when chain changes
      if (address) fetchBalance(address);
    };
    
    // Setup wallet listeners and get cleanup function
    const cleanup = walletService.setupWalletListeners(
      handleAccountsChanged,
      handleChainChanged
    );
    
    // Return cleanup function
    return cleanup;
  }, []);

  // Fetch ETH balance
  const fetchBalance = async (walletAddress: string) => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    try {
      const balanceHex = await walletService.getBalance(walletAddress);
      
      // Convert from wei to ETH
      const balanceInWei = parseInt(balanceHex, 16);
      const balanceInEth = balanceInWei / 1e18;
      setBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('Error');
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const connectedAddress = await walletService.connectWallet();
      
      if (connectedAddress) {
        setAddress(connectedAddress);
        setIsConnected(true);
        
        // Get chain ID
        const currentChainId = await walletService.getChainId();
        if (currentChainId) {
          setChainId(currentChainId);
        }
        
        // Fetch balance
        await fetchBalance(connectedAddress);
        
        // Sign a message for authentication
        try {
          const message = `NEDA Pay Authentication\nConnecting wallet: ${connectedAddress}\nTimestamp: ${Date.now()}`;
          await walletService.signMessage(connectedAddress, message);
          console.log('Successfully authenticated with signature');
        } catch (signError) {
          console.warn('User rejected signing, but connection will proceed');
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    walletService.disconnectWallet();
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setBalance('0');
    setShowDropdown(false);
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_chainId');
  };

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    try {
      // Try to switch to Base Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${baseSepolia.id.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain hasn't been added yet
      if (error.code === 4902) {
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
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
        }
      } else {
        console.error('Error switching to Base Sepolia:', error);
      }
    }
  };

  // Check if MetaMask is installed
  const isMetaMaskInstalled = walletService.isMetaMaskInstalled();
  
  // Don't render until client-side hydration is complete
  if (!mounted) return null;

  return (
    <div>
      {!isConnected ? (
        isMetaMaskInstalled ? (
          <button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
        ) : (
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded transition-all flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Install MetaMask</span>
          </a>
        )
      ) : (
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
              {address?.slice(2, 4)}
            </div>
            <span className="font-medium text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Connected</span>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">Active</span>
                </div>
                <div className="font-mono text-sm break-all">{address}</div>
              </div>
              
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Network</span>
                  {!isOnCorrectNetwork && (
                    <button 
                      onClick={switchNetwork}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded transition-colors"
                    >
                      Switch to Base Sepolia
                    </button>
                  )}
                </div>
                <div className="font-medium">
                  {isOnCorrectNetwork ? 'Base Sepolia' : chainId ? `Chain ID: ${chainId}` : 'Unknown'}
                </div>
              </div>
              
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</div>
                <div className="font-medium">{balance} ETH</div>
              </div>
              
              <div className="p-3">
                <button
                  onClick={disconnectWallet}
                  className="w-full text-center py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center justify-center space-x-2"
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
      )}
    </div>
  );
}
