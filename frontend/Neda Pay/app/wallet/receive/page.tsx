'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { QRCodeSVG } from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { stablecoins } from '../../data/stablecoins';
import { loadWalletState } from '../../utils/global-wallet-state';

export default function ReceivePage() {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<string>('TSHC');
  const [showCurrencySelector, setShowCurrencySelector] = useState<boolean>(false);
  const currencySelectorRef = useRef<HTMLDivElement>(null);
  
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
  
  // Get the selected coin details
  const selectedCoinDetails = stablecoins.find(coin => coin.baseToken === selectedCoin);
  
  // Close currency selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencySelectorRef.current && !currencySelectorRef.current.contains(event.target as Node)) {
        setShowCurrencySelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      // Generate QR code value based on address, selected coin, and optional amount/note
      let qrData = `ethereum:${walletState.address}`;
      
      // Add token information
      if (selectedCoinDetails) {
        qrData += `?asset=${selectedCoin}&assetAddress=${selectedCoinDetails.address}`;
      }
      
      // Add parameters if provided
      const params = [];
      if (amount) params.push(`amount=${amount}`);
      if (note) params.push(`note=${encodeURIComponent(note)}`);
      
      if (params.length > 0) {
        qrData += (qrData.includes('?') ? '&' : '?') + params.join('&');
      }
      
      setQrValue(qrData);
    }
  }, [walletState.isConnected, walletState.address, amount, note, selectedCoin, selectedCoinDetails]);
  
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/wallet" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Wallet
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Receive {selectedCoin}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Share your wallet address or QR code to receive {selectedCoin} payments</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
            
            {walletState.isConnected && walletState.address ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl mb-4">
                  <QRCodeSVG 
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Scan this QR code to send {selectedCoin} to this wallet
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Connect your wallet to generate a QR code
                </p>
                <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full transition-colors">
                  Go to Home to Connect Wallet
                </Link>
              </div>
            )}
          </div>
          
          {/* Address and Options Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Wallet Address</h2>
            
            {/* Currency Selector */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Currency</label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-left"
                  onClick={() => setShowCurrencySelector(!showCurrencySelector)}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{selectedCoinDetails?.flag}</span>
                    <span>{selectedCoin} - {selectedCoinDetails?.name}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                
                {showCurrencySelector && (
                  <div 
                    ref={currencySelectorRef}
                    className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg py-1 max-h-60 overflow-auto"
                  >
                    {stablecoins.map((coin) => (
                      <button
                        key={coin.baseToken}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${selectedCoin === coin.baseToken ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => {
                          setSelectedCoin(coin.baseToken);
                          setShowCurrencySelector(false);
                        }}
                      >
                        <span className="mr-2">{coin.flag}</span>
                        <div>
                          <div className="font-medium">{coin.baseToken}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{coin.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {walletState.isConnected && walletState.address ? (
              <>
                <div className="relative bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="mt-2 text-center break-all">
                    {walletState.address}
                  </div>
                  <CopyToClipboard text={walletState.address || ''} onCopy={() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}>
                    <button className="absolute right-2 top-2 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      {copied ? (
                        <span className="text-green-600 dark:text-green-400">Copied!</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                  </CopyToClipboard>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (optional)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount in TSHC"
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note for this payment"
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Connect your wallet to view your address
                </p>
                <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full transition-colors">
                  Go to Home to Connect Wallet
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
