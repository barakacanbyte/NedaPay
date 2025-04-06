'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import WalletSelector from '../components/WalletSelector';

// Base stablecoins data
const baseStablecoins = [
  {
    id: 'tshc',
    name: 'TSHC',
    fullName: 'Tanzania Shilling Stablecoin',
    currency: 'TSH',
    country: 'Tanzania',
    flag: '🇹🇿',
    color: 'from-blue-500 to-blue-700',
    description: 'The native stablecoin of NEDA Pay, pegged 1:1 to the Tanzania Shilling (TSH).',
    issuer: 'NEDA Pay',
    backing: 'TSH Government Bonds, T-Bills, and Cash Equivalents',
    network: 'Base Testnet'
  },
  {
    id: 'usdc',
    name: 'USDC',
    fullName: 'USD Coin',
    currency: 'USD',
    country: 'United States',
    flag: '🇺🇸',
    color: 'from-blue-400 to-blue-600',
    description: 'A fully-reserved stablecoin pegged to the US Dollar.',
    issuer: 'Circle',
    backing: 'USD and US Treasuries',
    network: 'Base'
  },
  {
    id: 'euroc',
    name: 'EURC',
    fullName: 'Euro Coin',
    currency: 'EUR',
    country: 'Europe',
    flag: '🇪🇺',
    color: 'from-blue-600 to-blue-800',
    description: 'A fully-reserved stablecoin pegged to the Euro.',
    issuer: 'Circle',
    backing: 'EUR and European Government Bonds',
    network: 'Base'
  },
  {
    id: 'ngnc',
    name: 'NGNC',
    fullName: 'Nigerian Naira Stablecoin',
    currency: 'NGN',
    country: 'Nigeria',
    flag: '🇳🇬',
    color: 'from-green-600 to-green-800',
    description: 'A stablecoin pegged 1:1 to the Nigerian Naira.',
    issuer: 'Convexity',
    backing: 'NGN and Nigerian Government Securities',
    network: 'Base'
  },
  {
    id: 'idrx',
    name: 'IDRX',
    fullName: 'Indonesian Rupiah Stablecoin',
    currency: 'IDR',
    country: 'Indonesia',
    flag: '🇮🇩',
    color: 'from-red-500 to-red-700',
    description: 'A stablecoin pegged 1:1 to the Indonesian Rupiah.',
    issuer: 'IDRX.co',
    backing: 'IDR and Indonesian Government Securities',
    network: 'Base'
  },
  {
    id: 'mxne',
    name: 'MXNe',
    fullName: 'Mexican Peso Stablecoin',
    currency: 'MXN',
    country: 'Mexico',
    flag: '🇲🇽',
    color: 'from-green-500 to-green-700',
    description: 'A stablecoin pegged 1:1 to the Mexican Peso.',
    issuer: 'Etherfuse/Brale',
    backing: 'MXN and Mexican Government Securities',
    network: 'Base'
  },
  {
    id: 'brz',
    name: 'BRZ',
    fullName: 'Brazilian Real Stablecoin',
    currency: 'BRL',
    country: 'Brazil',
    flag: '🇧🇷',
    color: 'from-yellow-500 to-green-500',
    description: 'A stablecoin pegged 1:1 to the Brazilian Real.',
    issuer: 'Transfero',
    backing: 'BRL and Brazilian Government Securities',
    network: 'Base'
  },
  {
    id: 'zarp',
    name: 'ZARP',
    fullName: 'South African Rand Stablecoin',
    currency: 'ZAR',
    country: 'South Africa',
    flag: '🇿🇦',
    color: 'from-yellow-600 to-green-600',
    description: 'A stablecoin pegged 1:1 to the South African Rand.',
    issuer: 'inv.es',
    backing: 'ZAR and South African Government Securities',
    network: 'Base'
  },
  {
    id: 'tryb',
    name: 'TRYB',
    fullName: 'Turkish Lira Stablecoin',
    currency: 'TRY',
    country: 'Turkey',
    flag: '🇹🇷',
    color: 'from-red-600 to-red-800',
    description: 'A stablecoin pegged 1:1 to the Turkish Lira.',
    issuer: 'BiLira',
    backing: 'TRY and Turkish Government Securities',
    network: 'Base'
  },
  {
    id: 'cadc',
    name: 'CADC',
    fullName: 'Canadian Dollar Stablecoin',
    currency: 'CAD',
    country: 'Canada',
    flag: '🇨🇦',
    color: 'from-red-500 to-red-700',
    description: 'A stablecoin pegged 1:1 to the Canadian Dollar.',
    issuer: 'PayTrie',
    backing: 'CAD and Canadian Government Securities',
    network: 'Base'
  },
  {
    id: 'nzdd',
    name: 'NZDD',
    fullName: 'New Zealand Dollar Stablecoin',
    currency: 'NZD',
    country: 'New Zealand',
    flag: '🇳🇿',
    color: 'from-blue-700 to-blue-900',
    description: 'A stablecoin pegged 1:1 to the New Zealand Dollar.',
    issuer: 'Easy Crypto',
    backing: 'NZD and New Zealand Government Securities',
    network: 'Base'
  }
];

export default function StablecoinsPage() {
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [fromCoin, setFromCoin] = useState('tshc');
  const [toCoin, setToCoin] = useState('usdc');

  // Get coin details by ID
  const getCoinById = (id: string) => {
    return baseStablecoins.find(coin => coin.id === id);
  };

  // Handle coin selection for detailed view
  const handleCoinSelect = (coinId: string) => {
    setSelectedCoin(coinId);
  };

  // Handle swap amount change
  const handleSwapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setSwapAmount(amount);
    
    // Simple conversion calculation (in a real app, this would use actual exchange rates)
    if (amount && !isNaN(parseFloat(amount))) {
      // For demo purposes, using simple conversion rates
      const rates: Record<string, Record<string, number>> = {
        tshc: { usdc: 0.00038, euroc: 0.00035, ngnc: 0.58, idrx: 6.1, mxne: 0.0065, brz: 0.0021, zarp: 0.0071, tryb: 0.012, cadc: 0.00052, nzdd: 0.00063 },
        usdc: { tshc: 2631.58, euroc: 0.92, ngnc: 1526.32, idrx: 16052.63, mxne: 17.11, brz: 5.53, zarp: 18.68, tryb: 31.58, cadc: 1.37, nzdd: 1.66 }
      };
      
      // Default to 1:1 if no specific rate is defined
      const rate = rates[fromCoin]?.[toCoin] || 1;
      setReceiveAmount((parseFloat(amount) * rate).toFixed(4));
    } else {
      setReceiveAmount('');
    }
  };

  // Handle from coin change
  const handleFromCoinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFromCoin(e.target.value);
    // Reset amounts when changing coins
    setSwapAmount('');
    setReceiveAmount('');
  };

  // Handle to coin change
  const handleToCoinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToCoin(e.target.value);
    // Reset receive amount when changing target coin
    if (swapAmount) {
      // Trigger recalculation
      const event = { target: { value: swapAmount } } as React.ChangeEvent<HTMLInputElement>;
      handleSwapAmountChange(event);
    }
  };

  // Get selected coin details
  const selectedCoinDetails = selectedCoin ? getCoinById(selectedCoin) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-blue-100 dark:border-blue-900">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
              NEDA Pay
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <WalletSelector />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Base Stablecoins
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Explore and use stablecoins from around the world on the Base network
          </p>
        </div>

        {selectedCoin ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <button
                onClick={() => setSelectedCoin(null)}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedCoinDetails?.color} flex items-center justify-center text-white font-bold mr-4`}>
                  {selectedCoinDetails?.name}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {selectedCoinDetails?.fullName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCoinDetails?.flag} {selectedCoinDetails?.currency} • {selectedCoinDetails?.country}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">About</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedCoinDetails?.description}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-300">Issuer</span>
                    <span className="font-medium text-gray-800 dark:text-white">{selectedCoinDetails?.issuer}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-300">Backing</span>
                    <span className="font-medium text-gray-800 dark:text-white">{selectedCoinDetails?.backing}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-300">Network</span>
                    <span className="font-medium text-gray-800 dark:text-white">{selectedCoinDetails?.network}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Swap Stablecoins</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={fromCoin}
                        onChange={handleFromCoinChange}
                        className="block w-1/3 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {baseStablecoins.map(coin => (
                          <option key={coin.id} value={coin.id}>
                            {coin.name} ({coin.currency})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={swapAmount}
                        onChange={handleSwapAmountChange}
                        placeholder="0.00"
                        className="block w-2/3 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={toCoin}
                        onChange={handleToCoinChange}
                        className="block w-1/3 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {baseStablecoins.map(coin => (
                          <option key={coin.id} value={coin.id}>
                            {coin.name} ({coin.currency})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={receiveAmount}
                        readOnly
                        placeholder="0.00"
                        className="block w-2/3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      />
                    </div>
                  </div>
                  
                  <button
                    className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-medium"
                  >
                    Swap Stablecoins
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stablecoins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {baseStablecoins.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => handleCoinSelect(coin.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${coin.color} flex items-center justify-center text-white font-bold mr-4`}>
                      {coin.name}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">{coin.fullName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{coin.flag} {coin.currency}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {coin.description}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Issuer: {coin.issuer}</span>
                    <span className="text-blue-600 dark:text-blue-400 flex items-center">
                      Details
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Swap Widget */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Quick Swap</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Easily swap between different stablecoins
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        From
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={fromCoin}
                          onChange={handleFromCoinChange}
                          className="block w-1/3 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {baseStablecoins.map(coin => (
                            <option key={coin.id} value={coin.id}>
                              {coin.name} ({coin.currency})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={swapAmount}
                          onChange={handleSwapAmountChange}
                          placeholder="0.00"
                          className="block w-2/3 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        To
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={toCoin}
                          onChange={handleToCoinChange}
                          className="block w-1/3 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {baseStablecoins.map(coin => (
                            <option key={coin.id} value={coin.id}>
                              {coin.name} ({coin.currency})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={receiveAmount}
                          readOnly
                          placeholder="0.00"
                          className="block w-2/3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        />
                      </div>
                    </div>
                    
                    <button
                      className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors font-medium"
                    >
                      Swap Stablecoins
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 flex flex-col justify-center">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Why Use Base Stablecoins?</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Access to global currencies in one place</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Fast and low-cost cross-border transfers</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Hedge against local currency volatility</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Seamless integration with global payment systems</span>
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Transparent and fully backed by real assets</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
