'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask, coinbaseWallet } from 'wagmi/connectors';
import { useRouter } from 'next/navigation';
import { base } from 'wagmi/chains';

export default function WalletSelector() {
  const [showOptions, setShowOptions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingSmartWallet, setIsCreatingSmartWallet] = useState(false);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Use wagmi hooks directly
  const { address, isConnected, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Format address for display
  const formatAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowOptions(false);
    }
  };
  
  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Always write the connected wallet address to localStorage on change
  useEffect(() => {
    if (address && isConnected) {
      localStorage.setItem('walletAddress', address);
    }
  }, [address, isConnected]);

  // Check for connected wallet and store in localStorage and cookie
  useEffect(() => {
    if (address && isConnected) {
      // Store wallet connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
      
      // Set a cookie for the middleware to check
      document.cookie = 'wallet_connected=true; path=/; max-age=86400'; // 24 hours
      
      // Simulate smart wallet by creating a derived address
      const simulatedSmartWallet = `0x${address.substring(2, 6)}5${address.substring(7, 42)}`;
      setSmartWalletAddress(simulatedSmartWallet);
      
      // Store in local storage
      localStorage.setItem(`smartWallet_${address}`, JSON.stringify({
        address: simulatedSmartWallet,
        createdAt: new Date().toISOString()
      }));
      
      // Redirect to dashboard after successful connection
      // Use a short timeout to ensure cookie is set before navigation
      setTimeout(() => {
        // Only redirect to dashboard if on the homepage/root ('' or '/')
        let path = window.location.pathname.replace(/\/+$/, ''); // Remove all trailing slashes
        if (path === '' || path === '/') {
          console.log('[DEBUG] Redirecting to /dashboard from WalletSelector. Current path:', window.location.pathname);
          router.push('/dashboard');
        }
      }, 500);
    } else {
      // Clear wallet connection from localStorage
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      
      // Clear the cookie
      document.cookie = 'wallet_connected=; path=/; max-age=0';
    }
  }, [address, isConnected, router]);
  
  // Function to create a smart wallet
  const createSmartWallet = async () => {
    if (!address || !isConnected) return;
    
    setIsCreatingSmartWallet(true);
    try {
      // Simulate smart wallet creation with a 2-second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a derived address to simulate a smart wallet
      const simulatedSmartWallet = `0x${address.substring(2, 6)}5${address.substring(7, 42)}`;
      
      // Store the smart wallet address
      setSmartWalletAddress(simulatedSmartWallet);
      
      // Store in local storage for future use
      localStorage.setItem(`smartWallet_${address}`, JSON.stringify({
        address: simulatedSmartWallet,
        createdAt: new Date().toISOString()
      }));
      
      // Redirect to dashboard after creating smart wallet
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating smart wallet:', error);
    } finally {
      setIsCreatingSmartWallet(false);
      setShowOptions(false);
    }
  };
  
  // Function to handle MetaMask connection
  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // Create MetaMask connector
        const metamaskConnector = metaMask();
        await connect({ connector: metamaskConnector });
        setShowOptions(false);
        // Note: The redirect will happen in the useEffect when isConnected changes
      } else {
        // MetaMask not installed, open download page
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('MetaMask not installed');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to handle Coinbase Wallet connection
  const handleConnectCoinbase = async () => {
    setIsConnecting(true);
    try {
      // Create Coinbase Wallet connector
      const coinbaseConnector = coinbaseWallet({
        appName: 'NEDA Pay Merchant',
        chainId: 1 // Ethereum Mainnet
      });
      
      await connect({ connector: coinbaseConnector });
      setShowOptions(false);
      // Note: The redirect will happen in the useEffect when isConnected changes
    } catch (error) {
      console.error('Error connecting to Coinbase Wallet', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to handle wallet disconnection
  const handleDisconnect = () => {
    disconnect();
    setShowOptions(false);
    
    // Clear wallet connection from localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    
    // Clear the cookie
    document.cookie = 'wallet_connected=; path=/; max-age=0';
    
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {isConnected ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="flex items-center space-x-2 bg-gray-100 dark:bg-blue-900/30 hover:bg-gray-200 dark:hover:bg-blue-800/40 text-gray-900 dark:text-blue-300 px-4 py-2 rounded-lg transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.3622 2L13.3622 8.4L14.9622 4.56L21.3622 2Z" fill="#E17726"/>
              <path d="M2.63782 2L10.5378 8.46L9.03782 4.56L2.63782 2Z" fill="#E27625"/>
            </svg>
          </div>
          <div className="text-sm font-medium">
            {formatAddress(address)}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
          disabled={isConnecting}
        >
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
      
      {showOptions && (
        <div 
          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {isConnected ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Connected Wallet</h3>
                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {formatAddress(address)}
                </div>
              </div>
              
              <div className="p-2 space-y-1">
                <button 
                  onClick={createSmartWallet}
                  disabled={isCreatingSmartWallet}
                  className="block w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSmartWallet ? 'Creating Smart Wallet...' : 'Create Smart Wallet'}
                </button>
                
                <button 
                  onClick={handleDisconnect}
                  className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Select Wallet</h3>
              </div>
              <div className="p-2 space-y-2">
                {/* Coinbase Wallet Option */}
                <div>
                  <button
                    onClick={handleConnectCoinbase}
                    disabled={isConnecting}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
                        <path d="M12.0002 4.80005C8.0002 4.80005 4.8002 8.00005 4.8002 12C4.8002 16 8.0002 19.2 12.0002 19.2C16.0002 19.2 19.2002 16 19.2002 12C19.2002 8.00005 16.0002 4.80005 12.0002 4.80005ZM9.6002 14.4C8.8002 14.4 8.0002 13.6 8.0002 12.8C8.0002 12 8.8002 11.2 9.6002 11.2C10.4002 11.2 11.2002 12 11.2002 12.8C11.2002 13.6 10.4002 14.4 9.6002 14.4ZM14.4002 14.4C13.6002 14.4 12.8002 13.6 12.8002 12.8C12.8002 12 13.6002 11.2 14.4002 11.2C15.2002 11.2 16.0002 12 16.0002 12.8C16.0002 13.6 15.2002 14.4 14.4002 14.4Z" fill="white"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Coinbase Wallet</div>
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        {isConnecting ? 'Connecting...' : 'Connect using Coinbase Wallet'}
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* MetaMask Option */}
                <button
                  onClick={handleConnectMetaMask}
                  disabled={isConnecting}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.3622 2L13.3622 8.4L14.9622 4.56L21.3622 2Z" fill="#E17726"/>
                      <path d="M2.63782 2L10.5378 8.46L9.03782 4.56L2.63782 2Z" fill="#E27625"/>
                      <path d="M18.4378 16.86L16.2378 20.46L20.9378 21.84L22.3378 16.92L18.4378 16.86Z" fill="#E27625"/>
                      <path d="M1.67782 16.92L3.05782 21.84L7.75782 20.46L5.55782 16.86L1.67782 16.92Z" fill="#E27625"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">MetaMask</div>
                    <div className="text-xs text-gray-700 dark:text-gray-400">
                      {isConnecting ? 'Connecting...' : 'Connect using MetaMask'}
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
