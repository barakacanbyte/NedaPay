'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { QRCodeSVG } from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useAccount } from 'wagmi';

export default function ReceivePage() {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [qrValue, setQrValue] = useState('');
  
  // Get wallet connection status using wagmi hooks
  const { isConnected, address } = useAccount();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (isConnected && address) {
      // Generate QR code value based on address and optional amount/note
      let qrData = `ethereum:${address}`;
      
      // Add parameters if provided
      const params = [];
      if (amount) params.push(`amount=${amount}`);
      if (note) params.push(`note=${encodeURIComponent(note)}`);
      
      if (params.length > 0) {
        qrData += `?${params.join('&')}`;
      }
      
      setQrValue(qrData);
    }
  }, [isConnected, address, amount, note]);
  
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-6">
          <Link 
            href="/wallet" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Wallet
          </Link>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Receive TSHC
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Share your wallet address or QR code to receive TSHC payments
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Scan QR Code
            </h2>
            
            {isConnected && address ? (
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
                  Scan this QR code to send TSHC to this wallet
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Connect your wallet to generate a QR code
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                >
                  Go to Home to Connect Wallet
                </button>
              </div>
            )}
          </div>
          
          {/* Address and Options Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Wallet Address
            </h2>
            
            {isConnected && address ? (
              <>
                <div className="relative mb-6">
                  <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <span className="block truncate text-gray-800 dark:text-gray-200 font-mono">
                      {address}
                    </span>
                  </div>
                  <CopyToClipboard text={address || ''} onCopy={handleCopy}>
                    <button className="absolute right-2 top-2 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      )}
                    </button>
                  </CopyToClipboard>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (optional)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount in TSHC"
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note for this payment"
                      className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Connect your wallet to view your address
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                >
                  Go to Home to Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
