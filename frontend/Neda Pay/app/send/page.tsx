'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { stablecoins } from '../data/stablecoins';
import { loadWalletState } from '../utils/global-wallet-state';

export default function SendPage() {
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<string>('TSHC');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrencySelector, setShowCurrencySelector] = useState<boolean>(false);
  
  // Get wallet connection status from global state
  const [walletState, setWalletState] = useState({ isConnected: false, address: null });
  
  // Load wallet state on mount
  useEffect(() => {
    const state = loadWalletState();
    setWalletState({
      isConnected: state.isConnected,
      address: state.address
    });
  }, []);

  // Redirect to home if not connected
  useEffect(() => {
    if (typeof window !== 'undefined' && !walletState.isConnected) {
      // Optional: Redirect to home or show a modal
      // window.location.href = '/';
    }
  }, [walletState.isConnected]);

  // Get the selected coin details
  const selectedCoinDetails = stablecoins.find(coin => coin.baseToken === selectedCoin);

  const handleSend = async () => {
    if (!amount || !recipient) {
      setError('Please enter both amount and recipient address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get ethers and set up provider
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // TSHC token contract address and ABI
      const tshcAddress = '0x0859D42FD008D617c087DD386667da51570B1aAB';
      const tshcAbi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)'
      ];
      
      // Create contract instance with signer
      const tshcContract = new ethers.Contract(tshcAddress, tshcAbi, signer);
      
      // Get token decimals
      const decimals = await tshcContract.decimals();
      
      // Convert amount to wei (with 18 decimals)
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      // Send transaction - this will trigger the wallet signing prompt
      const tx = await tshcContract.transfer(recipient, amountInWei);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setIsSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Transaction error:', err);
      // Handle user rejection
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else {
        setError(`Transaction failed: ${err.message || 'Please try again'}`);
      }
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setRecipient('');
    setIsSuccess(false);
    setError(null);
  };

  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setQrScanResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, we would use a QR code scanning library
      // For now, we'll simulate finding an address in the QR code
      const simulatedAddress = "0x" + Math.random().toString(16).slice(2, 42);
      setRecipient(simulatedAddress);
      setQrScanResult(simulatedAddress);
      setShowScanner(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      {/* Use the Header component */}
      <Header />

      {/* Main content */}
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Global Payments with NEDA Pay
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Send {selectedCoin === 'TSHC' ? 'TSHC and other local stablecoins' : selectedCoin} across borders with ease on the Base network
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            Currently sending: <span className="font-medium">{selectedCoinDetails?.flag} {selectedCoinDetails?.name}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          {!walletState.isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">Please connect your wallet</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You need to connect your wallet to send {selectedCoin}.
              </p>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">Transaction Successful!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your {selectedCoin} has been sent successfully.
              </p>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
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
                  <div 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    onClick={() => setShowCurrencySelector(!showCurrencySelector)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-700 dark:text-gray-300">{selectedCoinDetails?.flag}</span>
                      <span className="text-gray-700 dark:text-gray-300">{selectedCoin}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Currency Selector Dropdown */}
                  {showCurrencySelector && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700">
                      <div className="p-2">
                        {stablecoins.map((coin) => (
                          <div 
                            key={coin.baseToken}
                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedCoin === coin.baseToken ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                            onClick={() => {
                              setSelectedCoin(coin.baseToken);
                              setShowCurrencySelector(false);
                            }}
                          >
                            <span className="text-lg">{coin.flag}</span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{coin.baseToken}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{coin.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Scan QR Code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* QR Code Scanner Modal */}
              {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scan QR Code</h3>
                      <button 
                        onClick={() => setShowScanner(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Upload a QR code image or take a photo of a QR code</p>
                      
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleQrCodeUpload}
                        className="hidden"
                      />
                      
                      <button
                        onClick={triggerFileInput}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Upload QR Code Image
                      </button>
                    </div>
                    
                    {scanResult && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-400 text-sm">
                          Address found: {scanResult.substring(0, 8)}...{scanResult.substring(scanResult.length - 6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                    `Send ${selectedCoin}`
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">About {selectedCoin}</h3>
          <p className="text-blue-700 dark:text-blue-400 text-sm">
            {selectedCoinDetails?.description || `${selectedCoin} is a stablecoin available on the Base network.`}
          </p>
        </div>
      </main>
    </div>
  );
}
