'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOnchainKit } from '@coinbase/onchainkit';
import Header from '../components/Header';

// Mock data for dashboard
const mockTokenInfo = {
  totalSupply: '10,000,000',
  circulatingSupply: '5,250,000',
  backingRatio: '1.02',
  holders: '1,245',
  price: '1.00 TSH'
};

const mockTransactionHistory = [
  { date: '2025-04-06', volume: 250000, transactions: 1245 },
  { date: '2025-04-05', volume: 320000, transactions: 1567 },
  { date: '2025-04-04', volume: 180000, transactions: 987 },
  { date: '2025-04-03', volume: 420000, transactions: 2103 },
  { date: '2025-04-02', volume: 350000, transactions: 1876 },
  { date: '2025-04-01', volume: 290000, transactions: 1432 },
  { date: '2025-03-31', volume: 310000, transactions: 1654 }
];

const mockReserveAssets = [
  { type: 'Government Bonds', percentage: 45, amount: '4,500,000 TSH' },
  { type: 'T-Bills', percentage: 30, amount: '3,000,000 TSH' },
  { type: 'Cash Equivalents', percentage: 25, amount: '2,500,000 TSH' }
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [walletType, setWalletType] = useState<'metamask' | 'coinbase' | null>(null);
  
  // Get wallet connection status from OnchainKit
  const { address } = useOnchainKit();
  
  // Check for Coinbase Wallet connection
  useEffect(() => {
    if (address) {
      setAccount(address);
      setIsConnected(true);
      setWalletType('coinbase');
    }
  }, [address]);
  
  useEffect(() => {
    setMounted(true);
    
    // Check if already connected to MetaMask
    if (typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.isMetaMask) {
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0 && !isConnected) {
              setAccount(accounts[0]);
              setIsConnected(true);
              setWalletType('metamask');
            }
          })
          .catch(console.error);
      }
    }
  }, [isConnected]);

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Overview of the TSHC stablecoin ecosystem on Base
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Supply</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{mockTokenInfo.totalSupply} TSHC</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Circulating Supply</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{mockTokenInfo.circulatingSupply} TSHC</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Backing Ratio</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{mockTokenInfo.backingRatio}:1</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Token Holders</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{mockTokenInfo.holders}</div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">TSHC Token</h2>
              
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                  TSHC
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">Price</span>
                  <span className="font-medium text-gray-800 dark:text-white">{mockTokenInfo.price}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">Contract</span>
                  <span className="font-medium text-gray-800 dark:text-white font-mono text-sm">0x1234...5678</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">Network</span>
                  <span className="font-medium text-gray-800 dark:text-white">Base</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">Standard</span>
                  <span className="font-medium text-gray-800 dark:text-white">ERC-20</span>
                </div>
                {isConnected && account && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Connected Wallet</span>
                    <span className="font-medium text-gray-800 dark:text-white font-mono text-sm">
                      {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <Link 
                href="/send" 
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-center transition-colors font-medium"
              >
                Send TSHC
              </Link>
            </div>
          </div>
          
          {/* Reserve Assets */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Reserve Assets</h2>
              
              <div className="space-y-6">
                {mockReserveAssets.map((asset, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-300">{asset.type}</span>
                      <span className="font-medium text-gray-800 dark:text-white">{asset.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${asset.percentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {asset.amount}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                <div className="flex items-center text-green-700 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Fully Backed (102%)</span>
                </div>
                <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                  All TSHC tokens are backed by verified reserve assets.
                </p>
              </div>
            </div>
          </div>
          
          {/* Transaction Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Transaction Activity</h2>
              
              <div className="space-y-4">
                {mockTransactionHistory.slice(0, 5).map((day, index) => (
                  <div key={index} className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">{day.date}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{day.transactions} transactions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800 dark:text-white">{day.volume.toLocaleString()} TSHC</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <Link 
                href="/wallet" 
                className="block w-full py-3 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full text-center transition-colors font-medium"
              >
                View All Transactions
              </Link>
            </div>
          </div>
        </div>
        
        {/* About TSHC Section */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">About TSHC Stablecoin</h2>
              <p className="mb-4 opacity-90">
                The Tanzania Shilling Stablecoin (TSHC) is a digital currency that maintains a stable value of 1:1 with the Tanzania Shilling (TSH).
              </p>
              <p className="mb-6 opacity-90">
                TSHC is fully backed by a diversified portfolio of TSH government bonds, T-bills, and cash equivalents, ensuring its stability and reliability as a digital payment solution.
              </p>
              <div className="flex space-x-4">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors">
                  Learn More
                </button>
                <button className="px-6 py-3 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full font-medium transition-colors">
                  View Contract
                </button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-white/20 rounded-full blur-lg"></div>
                <div className="relative w-40 h-40 rounded-full bg-white flex items-center justify-center">
                  <div className="text-5xl font-bold text-blue-600">TSHC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
