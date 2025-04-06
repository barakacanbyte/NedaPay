'use client';

import { useState } from 'react';
import Link from 'next/link';
import WalletSelector from './WalletSelector';
import ThemeToggle from './ThemeToggle';

// NEDA Pay features for navigation
const features = [
  {
    name: 'Send TSHC',
    description: 'Send Tanzania Shilling stablecoin to anyone',
    url: '/send',
    icon: '💸',
  },
  { 
    name: 'Wallet', 
    description: 'Manage your TSHC tokens and transactions',
    url: '/wallet',
    icon: '👛',
  },
  { 
    name: 'Dashboard', 
    description: 'View your transaction history and balance',
    url: '/dashboard',
    icon: '📊',
  },
  {
    name: 'Utilities',
    description: 'Pay for utilities and government services',
    url: '/utilities',
    icon: '⚡',
  },
  {
    name: 'Stablecoins',
    description: 'Explore and use global stablecoins on Base',
    url: '/stablecoins',
    icon: '🌍',
  },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-blue-100 dark:border-blue-900">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            NEDA Pay
          </Link>
          <div className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            Base Testnet
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-6">
            {features.slice(0, 3).map((feature, index) => (
              <Link 
                key={index} 
                href={feature.url}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                {feature.name}
              </Link>
            ))}
            <div className="relative group">
              <button className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors flex items-center">
                More
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {features.slice(3).map((feature, index) => (
                  <Link 
                    key={index} 
                    href={feature.url}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{feature.icon}</span>
                      {feature.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
          
          <ThemeToggle />
          
          <WalletSelector />
        </div>
      </div>
    </header>
  );
}
