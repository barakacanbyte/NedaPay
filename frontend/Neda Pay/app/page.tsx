'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOnchainKit } from '@coinbase/onchainkit';
import ArrowSvg from './svg/ArrowSvg';
import Header from './components/Header';

// NEDA Pay features
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

export default function App() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen font-sans dark:bg-gray-900 dark:text-white bg-gradient-to-br from-blue-50 to-white text-gray-800">
      <Header />

      <main className="flex-grow">
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  The Future of Global Payments
                </h1>
                <div className="mb-8">
                  <p className="text-lg md:text-xl font-semibold landing-text">
                    NEDA Pay enables secure, fast, and affordable payments worldwide, with TSHC (Tanzania Shilling Coin) leading our suite of local stablecoins for borderless transactions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link 
                    href="/send" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-8 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Send TSHC
                  </Link>
                  <Link 
                    href="/wallet" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-blue-300 dark:border-blue-700 text-base font-medium rounded-full text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/30 md:py-4 md:text-lg md:px-8 transition-all duration-200"
                  >
                    View Wallet
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-30 dark:opacity-40 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                  <div className="text-center mb-6">
                    <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">TSHC Stablecoin</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">1:1 backed by TSH reserves</div>
                  </div>
                  <div className="flex justify-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      TSHC
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Backed by</span>
                      <span className="font-medium">TSH Government Bonds</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Exchange Rate</span>
                      <span className="font-medium">1 TSHC = 1 TSH</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Network</span>
                      <span className="font-medium">Base</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16 bg-gradient-to-b from-transparent to-blue-50 dark:to-gray-800/30 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Link 
                  href={feature.url} 
                  key={index}
                  className="group"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${hoveredFeature === index ? 'transform scale-105' : ''}`}>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-6 h-full rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {feature.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                      <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                        <span>Explore</span>
                        <ArrowSvg />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-blue-100 dark:border-blue-900/30 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">N</div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">NEDA Pay</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                A futuristic payment solution leveraging Base stablecoins and the Tanzania Shilling stablecoin (TSHC) for seamless global transactions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://chatafisha.co.tz/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Features</h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index}>
                    <Link href={feature.url} className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                      {feature.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="https://betua-two.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                    Related Projects
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} NEDA Pay. All rights reserved.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powered by Base Onchain Kit | Built on Base Testnet
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
