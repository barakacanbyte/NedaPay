'use client';

import { useState, useEffect } from 'react';
import { useOnchainKit } from '@coinbase/onchainkit';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import WalletSelector from '../components/WalletSelector';
import Header from '../components/Header';
import { stablecoins } from '../data/stablecoins';

// Utility payment options
const utilityOptions = [
  {
    id: 'electricity',
    name: 'Electricity',
    icon: '⚡',
    providers: ['TANESCO', 'ZECO', 'DAWASCO'],
    description: 'Pay your electricity bills instantly'
  },
  {
    id: 'water',
    name: 'Water',
    icon: '💧',
    providers: ['DAWASA', 'MORUWASA', 'AUWSA'],
    description: 'Pay your water bills instantly'
  },
  {
    id: 'gas',
    name: 'Gas',
    icon: '🔥',
    providers: ['Tanzania Gas', 'Pan African Energy', 'Taifa Gas'],
    description: 'Pay for gas services'
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: '🌐',
    providers: ['TTCL', 'Vodacom', 'Airtel', 'Tigo', 'Halotel'],
    description: 'Pay for internet services'
  },
  {
    id: 'tv',
    name: 'TV Subscription',
    icon: '📺',
    providers: ['DSTV', 'Azam TV', 'StarTimes', 'Zuku'],
    description: 'Pay for TV subscription services'
  }
];

// Government payment options
const governmentOptions = [
  {
    id: 'tax',
    name: 'Tax Payments',
    icon: '📝',
    providers: ['TRA', 'ZRB'],
    description: 'Pay your taxes directly to government agencies'
  },
  {
    id: 'permits',
    name: 'Permits & Licenses',
    icon: '🪪',
    providers: ['BRELA', 'TBS', 'TFDA'],
    description: 'Pay for business permits and licenses'
  },
  {
    id: 'education',
    name: 'Education Fees',
    icon: '🎓',
    providers: ['HESLB', 'Public Universities', 'Government Schools'],
    description: 'Pay for education fees and loans'
  },
  {
    id: 'fines',
    name: 'Fines & Penalties',
    icon: '⚖️',
    providers: ['Traffic Police', 'City Council', 'Courts'],
    description: 'Pay for government fines and penalties'
  }
];

export default function UtilitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string>('TSHC');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  
  // Get wallet connection status from OnchainKit
  const { address } = useOnchainKit();
  
  useEffect(() => {
    if (address) {
      setIsConnected(true);
      setWalletAddress(address);
    }
  }, [address]);
  
  // Check if MetaMask is connected on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.isMetaMask) {
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              setIsConnected(true);
              setWalletAddress(accounts[0]);
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedProvider(null);
    setAccountNumber('');
    setAmount('');
    setError(null);
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setError(null);
  };

  const handlePayment = async () => {
    if (!accountNumber || !amount) {
      setError('Please enter both account number and amount');
      return;
    }
    
    if (!isConnected) {
      setError('Please connect your wallet to make a payment');
      return;
    }
    
    // Show confirmation modal instead of proceeding directly
    setShowConfirmation(true);
  };
  
  const confirmPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowConfirmation(false);
      
      // Get the selected stablecoin details
      const selectedCoinDetails = stablecoins.find(coin => coin.baseToken === selectedCoin);
      
      if (!selectedCoinDetails) {
        throw new Error('Selected stablecoin not found');
      }
      
      // Actual blockchain transaction logic
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // Token contract ABI (only transfer function needed)
      const tokenAbi = [
        'function transfer(address to, uint256 amount) returns (bool)'
      ];
      
      // Create contract instance
      const tokenContract = new ethers.Contract(
        selectedCoinDetails.address,
        tokenAbi,
        signer
      );
      
      // Convert amount to wei (assuming 18 decimals for all tokens)
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Send the transaction
      const tx = await tokenContract.transfer(accountNumber, amountWei);
      
      // Wait for transaction confirmation
      await tx.wait();
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const cancelPayment = () => {
    setShowConfirmation(false);
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedProvider(null);
    setAccountNumber('');
    setAmount('');
    setIsSuccess(false);
    setError(null);
  };

  // Get the current options based on selected category
  const getCurrentOptions = () => {
    if (selectedCategory) {
      const isGovernment = governmentOptions.some(option => option.id === selectedCategory);
      if (isGovernment) {
        return governmentOptions.find(option => option.id === selectedCategory);
      } else {
        return utilityOptions.find(option => option.id === selectedCategory);
      }
    }
    return null;
  };

  const currentOption = getCurrentOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />

      {/* Main content */}
      <main className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Utility & Government Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Pay for utilities and government services using TSHC and other Base stablecoins
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your payment has been processed successfully.
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            >
              Make Another Payment
            </button>
          </div>
        ) : (
          <>
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Utilities Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Utility Payments</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Pay for essential services</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {utilityOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCategorySelect(option.id)}
                          className="flex items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl mr-4">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-white">{option.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Government Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Government Payments</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Pay taxes, fees, and other government services</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {governmentOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleCategorySelect(option.id)}
                          className="flex items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl mr-4">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 dark:text-white">{option.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : !selectedProvider ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {currentOption?.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select a provider
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentOption?.providers.map((provider) => (
                      <button
                        key={provider}
                        onClick={() => handleProviderSelect(provider)}
                        className="flex items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl mr-4">
                          {currentOption.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-800 dark:text-white">{provider}</div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <button
                    onClick={() => setSelectedProvider(null)}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {selectedProvider}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enter payment details
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Account/Reference Number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter your account or reference number"
                        className="block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount ({selectedCoin})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          min="0"
                          step="0.01"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400">{selectedCoin}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Available Stablecoins</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {stablecoins.map((coin) => (
                          <div key={coin.baseToken} className="flex items-center">
                            <input
                              id={coin.baseToken}
                              name="stablecoin"
                              type="radio"
                              checked={selectedCoin === coin.baseToken}
                              onChange={() => setSelectedCoin(coin.baseToken)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor={coin.baseToken} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              <span className="mr-1">{coin.flag}</span> {coin.baseToken} ({coin.currency})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 px-6 rounded-full text-white font-medium transition-all ${
                          isLoading 
                            ? 'bg-blue-400 dark:bg-blue-700 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          'Pay Now'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Transaction Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confirm Payment</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service:</span>
                  <span className="font-medium text-gray-800 dark:text-white">{selectedProvider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account:</span>
                  <span className="font-medium text-gray-800 dark:text-white">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium text-gray-800 dark:text-white">{amount} {selectedCoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">From Wallet:</span>
                  <span className="font-medium text-gray-800 dark:text-white truncate max-w-[200px]">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                  </span>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm mb-6">
                You will be prompted to sign this transaction with your connected wallet.
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelPayment}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPayment}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Confirm & Sign
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
