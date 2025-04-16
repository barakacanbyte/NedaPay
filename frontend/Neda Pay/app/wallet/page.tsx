'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOnchainKit } from '@coinbase/onchainkit';
import Header from '../components/Header';
import WalletSelector from '../components/WalletSelector';

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [walletType, setWalletType] = useState<'metamask' | 'coinbase' | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  
  // Get wallet connection status from OnchainKit
  const { address } = useOnchainKit();
  
  // Function to fetch transaction history - using mock data for demonstration
  const fetchTransactionHistory = async (userAddress: string) => {
    try {
      setIsLoadingTx(true);
      
      // For demonstration, we'll use mock transactions
      // In production, this would use the BaseScan API or a backend service
      const mockTransactions = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          from: userAddress.toLowerCase(),
          to: '0x7d9687c95831874926bbc9476844674D6B943464',
          value: '1000000000000000000', // 1 TSHC (18 decimals)
          timeStamp: Math.floor(Date.now() / 1000 - 3600).toString(), // 1 hour ago
          contractAddress: '0x0859D42FD008D617c087DD386667da51570B1aAB'
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          from: '0x10dE41927cdD093dA160E562630e0efC19423869',
          to: userAddress.toLowerCase(),
          value: '5000000000000000000', // 5 TSHC
          timeStamp: Math.floor(Date.now() / 1000 - 86400).toString(), // 1 day ago
          contractAddress: '0x0859D42FD008D617c087DD386667da51570B1aAB'
        },
        {
          hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
          from: userAddress.toLowerCase(),
          to: '0x46358DA741d3456dBAEb02995979B2722C3b8722',
          value: '2500000000000000000', // 2.5 TSHC
          timeStamp: Math.floor(Date.now() / 1000 - 172800).toString(), // 2 days ago
          contractAddress: '0x0859D42FD008D617c087DD386667da51570B1aAB'
        }
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setTransactions(mockTransactions);
        setIsLoadingTx(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setTransactions([]);
      setIsLoadingTx(false);
    }
  };

  // Function to fetch TSHC balance
  const fetchTSHCBalance = async (userAddress: string) => {
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const tshcAddress = '0x0859D42FD008D617c087DD386667da51570B1aAB';
      
      // TSHC token ABI (only the balanceOf function)
      const tshcAbi = [
        'function balanceOf(address account) view returns (uint256)'
      ];
      
      const tshcContract = new ethers.Contract(tshcAddress, tshcAbi, provider);
      const balanceWei = await tshcContract.balanceOf(userAddress);
      
      // Convert from wei to TSHC (with 18 decimals - standard for ERC20 tokens)
      const balanceTSHC = ethers.formatUnits(balanceWei, 18);
      setBalance(parseFloat(balanceTSHC).toFixed(4));
    } catch (error) {
      console.error('Error fetching TSHC balance:', error);
      setBalance('0.00');
    }
  };
  
  // Check for Coinbase Wallet connection
  useEffect(() => {
    if (address) {
      setAccount(address);
      setIsConnected(true);
      setWalletType('coinbase');
      fetchTSHCBalance(address);
      fetchTransactionHistory(address);
    }
  }, [address]);
  
  useEffect(() => {
    setMounted(true);
    
    // Check if already connected to MetaMask
    if (typeof window !== 'undefined') {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.isMetaMask) {
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0 && !isConnected) {
              setAccount(accounts[0]);
              setIsConnected(true);
              setWalletType('metamask');
              
              // Fetch TSHC balance and transaction history
              fetchTSHCBalance(accounts[0]);
              fetchTransactionHistory(accounts[0]);
            }
          })
          .catch(console.error);
          
        // Listen for account changes
        ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            setWalletType('metamask');
            
            // Update TSHC balance and transaction history when account changes
            fetchTSHCBalance(accounts[0]);
            fetchTransactionHistory(accounts[0]);
          } else if (walletType === 'metamask') {
            // Only disconnect if current wallet is MetaMask
            setAccount('');
            setIsConnected(false);
            setWalletType(null);
          }
        });
      }
    }
    
    return () => {
      // Cleanup listeners
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [isConnected, walletType]);
  
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">My Wallet</h1>
      
      {!isConnected ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-blue-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Connect your wallet to view your TSHC balance and transaction history.</p>
          </div>
          
          <div className="flex justify-center">
            <WalletSelector />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Wallet Balance</h2>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Available Balance</p>
                <div className="flex items-end">
                  <span className="text-3xl font-bold">{balance}</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">TSHC</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">TSHC</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => window.location.href = '/send'}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center transition-colors"
              >
                Send
              </button>
              <Link href="/wallet/receive" className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg text-center transition-colors">
                Receive
              </Link>
            </div>
          </div>
          
          {/* Account Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Connected Address</p>
              <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm overflow-hidden text-ellipsis">
                {account}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => {
                  if (walletType === 'metamask') {
                    // For MetaMask, just update the state
                    setAccount('');
                    setIsConnected(false);
                    setWalletType(null);
                  } else if (walletType === 'coinbase' && typeof window !== 'undefined') {
                    // For Coinbase, we'll reload the page which will reset the connection
                    window.location.reload();
                  }
                }}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
          
          {/* Funding Options */}
          <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Funding Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bank Account Option */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
                <div className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">
                  Coming Soon
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Connect Bank Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Securely connect your bank account to fund your TSHC wallet directly.
                </p>
              </div>
              
              {/* Mobile Money Option */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
                <div className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">
                  Coming Soon
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Mobile Money Transfer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fund your wallet using popular mobile money services like M-Pesa.
                </p>
              </div>
              
              {/* Crypto Option */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600 dark:text-orange-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Crypto Deposit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Deposit cryptocurrency to convert to TSHC stablecoin.
                </p>
                <button className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Deposit Now
                </button>
              </div>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            
            {isLoadingTx ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx, index) => {
                  const isSender = tx.from.toLowerCase() === account.toLowerCase();
                  const formattedValue = parseFloat(tx.value) / 10**18;
                  const txDate = new Date(parseInt(tx.timeStamp) * 1000);
                  const formattedDate = txDate.toLocaleDateString();
                  const formattedTime = txDate.toLocaleTimeString();
                  
                  return (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSender ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            {isSender ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-600 dark:text-red-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600 dark:text-green-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{isSender ? 'Sent TSHC' : 'Received TSHC'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formattedDate} at {formattedTime}
                            </p>
                            <a 
                              href={`https://sepolia.basescan.org/tx/${tx.hash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View on BaseScan
                            </a>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${isSender ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {isSender ? '-' : '+'}{formattedValue.toFixed(4)} TSHC
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                            {isSender ? 'To: ' : 'From: '}
                            {isSender ? 
                              tx.to.substring(0, 6) + '...' + tx.to.substring(tx.to.length - 4) : 
                              tx.from.substring(0, 6) + '...' + tx.from.substring(tx.from.length - 4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 text-center">
                <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
              </div>
            )}
            
            <Link href="/transactions" className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center mt-4">
              View All Transactions
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}