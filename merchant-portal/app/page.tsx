'use client';
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';
import { stablecoins } from './data/stablecoins';

// Client component with search params
function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  
  // Get wallet connection status from wagmi
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const prevConnected = useRef(isConnected);
  
  useEffect(() => {
    setMounted(true);
    // Check if redirected from a protected route
    const urlParams = new URLSearchParams(window.location.search);
    const walletRequired = urlParams.get('walletRequired');
    if (walletRequired === 'true') {
      setShowWalletPrompt(true);
    }
  }, []);

  useEffect(() => {
    // Only redirect if the wallet just became connected
    // Do NOT redirect if on /payment-link
    if (
      mounted &&
      isConnected &&
      address &&
      !prevConnected.current &&
      window.location.pathname !== '/payment-link' &&
      !window.location.pathname.startsWith('/invoice')
    ) {
      console.log('[DEBUG] Redirecting to /dashboard from HomeContent. Current path:', window.location.pathname);
      router.push('/dashboard');
    }
    prevConnected.current = isConnected;
  }, [mounted, isConnected, address, router]);

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
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-left">
              <div className="text-3xl mb-4">🚀</div>
              <h2 className="text-xl font-bold mb-4">Why Choose NEDA Pay?</h2>
              <div className="w-full bg-white/60 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-xl p-6">
                <ul className="space-y-4 list-disc list-inside text-lg text-gray-700 dark:text-gray-200 custom-bullets">
                  <li className="flex items-start"><span className="mr-2 mt-1 text-blue-500">🌍</span><span><span className="font-semibold">Accept Local & Global Stablecoins:</span> TSHC, cNGN, IDRX, USDC, and more</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-yellow-500">⚡</span><span><span className="font-semibold">Instant Settlement:</span> Receive funds instantly—no waiting for banks</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-green-600">🔒</span><span><span className="font-semibold">No Chargebacks:</span> Crypto payments are final, reducing fraud risk</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-pink-500">📈</span><span><span className="font-semibold">Analytics Built In:</span> Track sales, performance, and customer behavior</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-cyan-600">🌐</span><span><span className="font-semibold">Global Reach:</span> Accept payments from customers worldwide</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-indigo-500">🛠️</span><span><span className="font-semibold">Simple Integration:</span> Easy setup, no technical expertise required</span></li>
                  <li className="flex items-start"><span className="mr-2 mt-1 text-yellow-400">💡</span><span><span className="font-semibold">Transparent Fees:</span> Clear, low-cost pricing—no hidden charges</span></li>
                </ul>
              </div>
            </div>

          </div>
          
          {isConnected && (
            <div className="mt-8">
              <button 
                onClick={() => {
                  // Set cookie before navigation
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  // Navigate to dashboard
                  if (window.location.pathname !== '/payment-link') {
  window.location.href = '/dashboard';
}
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
  {/* Add border and background to each step */}
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Connect Your Wallet</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Connect your Base wallet to access the merchant dashboard
              </p>
            </div>
            
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Create Payment Links</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Generate payment links or QR codes to share with your customers
              </p>
            </div>
            
            <div className="flex flex-col items-center border border-blue-200 dark:border-blue-700 rounded-xl bg-white/70 dark:bg-gray-900/70 p-6 shadow-md transition hover:shadow-xl">
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
        
        {/* FAQ Section */}
        <div id="faq" className="max-w-3xl mx-auto mt-20 mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 group-open:text-blue-900">What is NEDA Pay?</summary>
              <div className="mt-2 text-gray-700 dark:text-gray-200">NEDA Pay is a platform that enables merchants to accept and manage local stablecoin payments easily and securely on the Base blockchain.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 group-open:text-blue-900">How do I receive stablecoin payments?</summary>
              <div className="mt-2 text-gray-700 dark:text-gray-200">Simply connect your Base wallet, generate payment links or QR codes, and share them with your customers. Payments are settled instantly to your wallet in local stablecoins.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 group-open:text-blue-900">Is NEDA Pay secure?</summary>
              <div className="mt-2 text-gray-700 dark:text-gray-200">Yes! NEDA Pay uses secure wallet connections and never stores your private keys. All transactions happen directly on the blockchain for full transparency and safety.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 group-open:text-blue-900">Can I use NEDA Pay internationally?</summary>
              <div className="mt-2 text-gray-700 dark:text-gray-200">Yes, NEDA Pay enables merchants to accept stablecoin payments from customers around the world, as long as they use supported wallets and stablecoins on the Base blockchain.</div>
            </details>
            <details className="border border-blue-200 dark:border-blue-700 rounded-lg bg-white/70 dark:bg-gray-900/70 p-4 group">
              <summary className="font-semibold text-lg cursor-pointer text-blue-700 dark:text-blue-300 group-open:text-blue-900">What fees does NEDA Pay charge?</summary>
              <div className="mt-2 text-gray-700 dark:text-gray-200">NEDA Pay charges low transaction fees for each payment processed. You can view the detailed fee structure in your merchant dashboard or on our website.</div>
            </details>
          </div>
        </div>
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to accept stablecoin payments?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join thousands of merchants across the world who are already accepting local stablecoins through NEDA Pay
          </p>
                    {!isConnected ? (
            <div className="flex flex-col items-center">
              <div className="border-t border-blue-200 dark:border-blue-700 w-full max-w-xs mx-auto mt-8 mb-4"></div>
              <button
                onClick={() => {
                  // Set cookie before wallet connection
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  // Try to connect wallet
                  if (window.ethereum) {
                    window.ethereum.request({ method: 'eth_requestAccounts' });
                  } else {
                    alert('Please install a compatible wallet like MetaMask or Coinbase Wallet');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg border-2 border-blue-400 dark:border-blue-300 transition shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Connect Wallet
              </button>
            </div>
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
            
            <div className="flex space-x-6 text-2xl">
              <a href="https://x.com/yourprofile" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M17.53 6.47a.75.75 0 0 1 1.06 1.06l-10 10a.75.75 0 1 1-1.06-1.06l10-10z"></path><path d="M6.47 6.47a.75.75 0 0 1 1.06 0l10 10a.75.75 0 1 1-1.06 1.06l-10-10a.75.75 0 0 1 0-1.06z"></path></svg>
              </a>
              <a href="https://github.com/0xMgwan/NedaPay" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.49 2.87 8.3 6.84 9.64.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.61-3.37-1.36-3.37-1.36-.46-1.19-1.12-1.5-1.12-1.5-.92-.64.07-.63.07-.63 1.02.07 1.56 1.06 1.56 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.04A9.38 9.38 0 0 1 12 7.43c.85.004 1.71.12 2.51.34 1.91-1.32 2.75-1.04 2.75-1.04.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.74 0 3.93-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.52-.01 2.86 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"></path></svg>
              </a>
              <a href="https://medium.com/@yourprofile" target="_blank" rel="noopener noreferrer" aria-label="Medium" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 6.52c.02-.24-.07-.48-.25-.65L.28 4.13V3.89h6.24l4.81 10.54 4.23-10.54h5.98v.24l-1.68 1.61c-.14.11-.21.29-.19.46v12.99c-.02.17.05.34.19.45l1.64 1.61v.24h-8.44v-.24l1.7-1.65c.17-.17.17-.22.17-.45V7.96l-4.75 12.04h-.64L3.13 7.96v8.18c-.05.33.07.67.32.9l2.21 2.68v.24H.26v-.24l2.21-2.68c.24-.23.35-.57.29-.9V6.52z"></path></svg>
              </a>
              <a href="mailto:hello@nedapay.com" aria-label="Email" className="text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19.75 4.75H4.25C3.01 4.75 2 5.76 2 7v10c0 1.24 1.01 2.25 2.25 2.25h15.5c1.24 0 2.25-1.01 2.25-2.25V7c0-1.24-1.01-2.25-2.25-2.25zm0 1.5c.41 0 .75.34.75.75v.37l-8.5 5.48-8.5-5.48V7c0-.41.34-.75.75-.75h15.5zm.75 3.17v8.58c0 .41-.34.75-.75.75H4.25a.75.75 0 0 1-.75-.75v-8.58l8.22 5.31c.24.15.54.15.78 0l8.25-5.31z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export the page component without using Suspense for useSearchParams
export default function HomePage() {
  return (
    <HomeContent />
  );
}
