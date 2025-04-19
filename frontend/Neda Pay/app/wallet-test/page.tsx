'use client';

import { useEffect, useState } from 'react';
import WalletSelector from '../components/WalletSelector';
import Link from 'next/link';

export default function WalletTestPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [pageLoadTime, setPageLoadTime] = useState<string>('');
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Set the page load time to verify state persistence
    setPageLoadTime(new Date().toLocaleTimeString());
    
    // Check for wallet connection on page load
    const checkWalletConnection = async () => {
      // Check localStorage for connection info
      const storedAddress = localStorage.getItem('walletAddress');
      const storedConnected = localStorage.getItem('walletConnected');
      const storedWalletType = localStorage.getItem('walletType');
      
      if (storedAddress && storedConnected === 'true') {
        // Check if the wallet is still connected
        try {
          // Get the provider
          const ethereum = (window as any).ethereum;
          if (ethereum) {
            // Request accounts to verify connection
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              // Still connected
              setAddress(accounts[0]);
              setIsConnected(true);
              setWalletType(storedWalletType || 'unknown');
              
              // Get chain ID
              const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
              setChainId(chainIdHex);
              
              // Check for smart wallet
              const storedSmartWallet = localStorage.getItem(`smartWallet_${accounts[0]}`);
              if (storedSmartWallet) {
                try {
                  const parsed = JSON.parse(storedSmartWallet);
                  setSmartWalletAddress(parsed.address);
                } catch (e) {
                  console.error('Error parsing stored smart wallet:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkWalletConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Wallet Connection Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This page tests wallet connection persistence across page navigations.
            The wallet state should be maintained when you navigate between pages.
          </p>
          
          <div className="flex justify-end mb-6">
            <WalletSelector />
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Wallet Connection Status
            </h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Connection Status:</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {isConnected ? 
                      <span className="text-green-600 dark:text-green-400">Connected</span> : 
                      <span className="text-red-600 dark:text-red-400">Not Connected</span>
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Address:</p>
                  <p className="font-medium text-gray-900 dark:text-white break-all">
                    {address || 'None'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chain ID:</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {chainId || 'None'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Smart Wallet:</p>
                  <p className="font-medium text-gray-900 dark:text-white break-all">
                    {smartWalletAddress || 'None'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Page Loaded At:</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pageLoadTime}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Link 
                href="/"
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition"
              >
                Home Page
              </Link>
              <Link 
                href="/dashboard"
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition"
              >
                Dashboard
              </Link>
              <Link 
                href="/wallet-test"
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition"
              >
                Reload This Page
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Local Storage Data
          </h2>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto" id="localStorage">
              Loading...
            </pre>
          </div>
          
          <script dangerouslySetInnerHTML={{ __html: `
            function updateLocalStorageDisplay() {
              const el = document.getElementById('localStorage');
              if (el) {
                const items = {};
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key) {
                    items[key] = localStorage.getItem(key);
                  }
                }
                el.textContent = JSON.stringify(items, null, 2);
              }
            }
            
            // Update on load
            updateLocalStorageDisplay();
            
            // Update when localStorage changes
            window.addEventListener('storage', updateLocalStorageDisplay);
            
            // Also update periodically
            setInterval(updateLocalStorageDisplay, 1000);
          ` }}/>
        </div>
      </div>
    </div>
  );
}
