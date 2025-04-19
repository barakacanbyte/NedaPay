'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import WalletSelector from './WalletSelector';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check both cookie and localStorage on mount
    const checkWallet = () => {
      const cookieConnected = document.cookie.includes('wallet_connected=true');
      const storageConnected = localStorage.getItem('walletConnected') === 'true';
      setWalletConnected(cookieConnected || storageConnected);
    };
    checkWallet();
    window.addEventListener('storage', checkWallet);
    // Optionally poll cookie every second (cookies don't trigger events)
    const interval = setInterval(checkWallet, 1000);
    return () => {
      window.removeEventListener('storage', checkWallet);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return null;

  return (
    <header className="bg-primary-light dark:bg-slate-800 shadow-sm border-b-2 border-white dark:border-slate-700">
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-slate-800 dark:text-white">
                NEDA Pay Merchant
              </span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-slate-800 hover:text-primary-dark dark:text-white dark:hover:text-primary-light font-medium">
                Dashboard
              </Link>
              <Link href="/payment-link" className="text-slate-800 hover:text-primary-dark dark:text-white dark:hover:text-primary-light font-medium">
                Payment Link
              </Link>
              <Link href="/analytics" className="text-slate-800 hover:text-primary-dark dark:text-white dark:hover:text-primary-light font-medium">
                Analytics
              </Link>
              <Link href="/payments" className="text-slate-800 hover:text-primary-dark dark:text-white dark:hover:text-primary-light font-medium">
                Payments
              </Link>
              <Link href="/settings" className="text-slate-800 hover:text-primary-dark dark:text-white dark:hover:text-primary-light font-medium">
                Settings
              </Link>
              {walletConnected && (
                <button
                  onClick={() => {
                    document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                    setTimeout(() => {
                      window.location.href = '/payment-link';
                    }, 100);
                  }}
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Generate Payment Link
                </button>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white"
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

