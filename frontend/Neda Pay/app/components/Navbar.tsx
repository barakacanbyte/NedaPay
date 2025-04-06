'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletSelector from './WalletSelector';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <Link href="/" className="text-blue-400 font-bold text-2xl">
            NEDA Pay
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <NavLink href="/" label="Home" isActive={pathname === '/'} />
          <NavLink href="/dashboard" label="Dashboard" isActive={pathname === '/dashboard'} />
          <NavLink href="/wallet" label="Wallet" isActive={pathname === '/wallet'} />
          <NavLink href="/about" label="About" isActive={pathname === '/about'} />
        </div>
        
        <div className="flex items-center space-x-4">
          <WalletSelector />
          
          {/* Mobile menu button - hidden on desktop */}
          <div className="md:hidden">
            <button className="text-white hover:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Helper component for navigation links
function NavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link 
      href={href} 
      className={`transition-colors duration-200 ${
        isActive 
          ? 'text-blue-400 font-medium' 
          : 'text-gray-300 hover:text-blue-400'
      }`}
    >
      {label}
    </Link>
  );
}
