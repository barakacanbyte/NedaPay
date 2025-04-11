'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import WalletSelector from './WalletSelector';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white !important">
                NEDA Pay Merchant
              </span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Dashboard
              </Link>
              <Link href="/payments" className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Payments
              </Link>
              <Link href="/stablecoins" className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Stablecoins
              </Link>
              <Link href="/settings" className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                Settings
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            <WalletSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
