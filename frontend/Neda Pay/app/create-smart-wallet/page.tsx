'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../context/WalletContext';
import { baseSepolia } from '../compatibility/chains-compat';

export default function CreateSmartWallet() {
  const router = useRouter();
  const { 
    address, 
    isConnected, 
    chainId, 
    isPending, 
    connect, 
    hasSmartWallet, 
    smartWalletAddress,
    createSmartWallet 
  } = useWallet();
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Check if we're on Base Sepolia
  const isOnCorrectNetwork = chainId === baseSepolia.id;
  
  // Redirect to dashboard if already has a smart wallet
  useEffect(() => {
    if (hasSmartWallet && smartWalletAddress) {
      router.push('/dashboard');
    }
  }, [hasSmartWallet, smartWalletAddress, router]);
  
  // Function to handle smart wallet creation
  const handleCreateSmartWallet = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!isOnCorrectNetwork) {
      setError('Please switch to Base Sepolia network first');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      if (createSmartWallet) {
        await createSmartWallet();
        setSuccess(true);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        throw new Error('Smart wallet creation function not available');
      }
    } catch (err: any) {
      console.error('Error creating smart wallet:', err);
      setError(err.message || 'Failed to create smart wallet');
    } finally {
      setIsCreating(false);
    }
  };
  
  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Create Smart Wallet</h1>
          
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please connect your wallet to create a smart wallet.
            </p>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // If not on correct network, show network switch prompt
  if (!isOnCorrectNetwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Wrong Network</h1>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please switch to the Base Sepolia network to create a smart wallet.
            </p>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Create Smart Wallet</h1>
        
        {success ? (
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Smart Wallet Created!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Your smart wallet has been successfully created.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-6 break-all">
              {smartWalletAddress}
            </p>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">What is a Smart Wallet?</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                A smart wallet is a contract-based wallet that enables gasless transactions and enhanced security features. 
                With a smart wallet, you can pay transaction fees in TSHC instead of ETH.
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Connected Account</h3>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                  {address}
                </p>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            <button
              onClick={handleCreateSmartWallet}
              disabled={isCreating || isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isCreating || isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Smart Wallet...
                </>
              ) : (
                'Create Smart Wallet'
              )}
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
