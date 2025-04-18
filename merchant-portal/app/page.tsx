'use client';
export const dynamic = "force-dynamic";


import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';
import { stablecoins } from './data/stablecoins';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const searchParams = useSearchParams();
  
  // Get wallet connection status from wagmi
  const { address, isConnected } = useAccount();
  
  useEffect(() => {
    setMounted(true);
    
    // Check if redirected from a protected route
    const walletRequired = searchParams.get('walletRequired');
    if (walletRequired === 'true') {
      setShowWalletPrompt(true);
    }
    
    // Auto-redirect to dashboard if wallet is connected (browser only)
    if (typeof window !== 'undefined' && isConnected && address) {
      window.location.href = '/dashboard';
    }
  }, [searchParams, isConnected, address]);

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            NEDA Pay Merchant Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Accept local stablecoins for your business and manage payments with ease
          </p>
          
          {!isConnected && (
            <div className="mt-8 flex flex-col items-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition cursor-pointer" onClick={() => document.getElementById('wallet-selector-button')?.click()}>
                  Connect Wallet
                </div>
              </div>
              {showWalletPrompt && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md text-center mt-4">
                  <p className="text-yellow-800 font-medium">You need to connect your wallet to access the dashboard</p>
                </div>
              )}
            </div>
          )}
          
          {isConnected && (
            <div className="mt-8">
              <button 
                onClick={() => {
                  // Set cookie before navigation
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  // Navigate to dashboard
                  window.location.href = '/dashboard';
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">💸</div>
            <h2 className="text-xl font-semibold text-on-light dark:text-white mb-2">Accept Local Stablecoins</h2>
            <p className="text-on-light dark:text-gray-300">
              Accept TSHC, cNGN, IDRX and other local stablecoins alongside USDC
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-on-light dark:text-white mb-2">Track Performance</h2>
            <p className="text-on-light dark:text-gray-300">
              Monitor your business performance with detailed analytics and reports
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h2 className="text-xl font-semibold text-on-light dark:text-white mb-2">Automatic Settlement</h2>
            <p className="text-on-light dark:text-gray-300">
              Automatically settle payments to your preferred stablecoin
            </p>
          </div>
        </div>
        
        {/* Stablecoins Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center gradient-text">
            Global Stablecoins Network
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Accept and manage stablecoins from around the world on the Base blockchain
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stablecoins.map((coin, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
                <div className="text-3xl mb-2">{coin.flag}</div>
                <h3 className="font-semibold text-on-light dark:text-white">{coin.baseToken}</h3>
                <p className="text-sm text-on-light dark:text-gray-300">{coin.region}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Connect Your Wallet</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Connect your Base wallet to access the merchant dashboard
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Create Payment Links</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Generate payment links or QR codes to share with your customers
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Receive Payments</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Customers pay using their NEDA Pay app and you receive stablecoins instantly
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to accept stablecoin payments?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join thousands of merchants across East Africa who are already accepting local stablecoins through NEDA Pay
          </p>
          
          {!isConnected ? (
            <button
              onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Connect Wallet
            </button>
          ) : (
            <Link href="/dashboard" className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-6 rounded-lg transition">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-8 mt-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                NEDA Pay Merchant
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                © 2025 NEDA Pay. All rights reserved.
              </p>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Terms
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Privacy
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Support
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
