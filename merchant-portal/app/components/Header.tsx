'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import WalletSelector from './WalletSelector';
import NotificationTab from './NotificationTab';

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
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-slate-800 dark:text-white border-2 border-blue-400 dark:border-blue-600 rounded-lg px-3 py-1 shadow-md bg-white/80 dark:bg-slate-900/60">
              NEDA Pay Merchant
            </span>
          </Link>
        </div>
        {/* Right: Nav Buttons + Wallet */}
        <div className="flex items-center space-x-4">
          <nav className="flex space-x-3">
            <a href="#how-it-works" className="px-4 py-2 rounded-full border-2 border-blue-400 dark:border-blue-300 text-slate-800 dark:text-white font-semibold bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300">How it works</a>
            <a href="#faq" className="px-4 py-2 rounded-full border-2 border-blue-400 dark:border-blue-300 text-slate-800 dark:text-white font-semibold bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300">FAQ</a>
            <Link href="/settings" className="px-4 py-2 rounded-full border-2 border-blue-400 dark:border-blue-300 text-slate-800 dark:text-white font-semibold bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
  Settings
</Link>
          </nav>
          <div className="flex items-center space-x-2 border-2 border-blue-400 dark:border-blue-600 rounded-lg px-3 py-1 shadow-md bg-white/80 dark:bg-slate-900/60">
            <NotificationTab />
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
      </div>
    </header>
  );
}

