'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import WalletSelector from '../components/WalletSelector';
import { loadWalletState, clearWalletState } from '../utils/global-wallet-state';
import { disconnectWallet } from '../utils/wallet-connect';

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [walletType, setWalletType] = useState<'metamask' | 'coinbase' | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  
  // Function to fetch transaction history
  const fetchTransactionHistory = async (userAddress: string) => {
    if (!isConnected || !userAddress) {
      setTransactions([]);
      setIsLoadingTx(false);
      return;
    }
    
    try {
      setIsLoadingTx(true);
      
      // Simplified transaction history for now
      setTransactions([]);
      setIsLoadingTx(false);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setTransactions([]);
      setIsLoadingTx(false);
    }
  };

  // Function to fetch TSHC balance
  const fetchTSHCBalance = async (userAddress: string) => {
    if (!isConnected || !userAddress) {
      setBalance('0.00');
      return;
    }
    
    try {
      // Check if provider is available
      if (typeof window === 'undefined' || !window.ethereum) {
        console.error('No provider available');
        setBalance('0.00');
        return;
      }
      
      // For demo purposes, set a fixed balance of 1100 TSHC
      // This is temporary until we have proper balance fetching from the blockchain
      setBalance('1100.0000');
      
      // Uncomment the below code to fetch real balance from blockchain
      /*
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
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
      */
    } catch (error) {
      console.error('Error fetching TSHC balance:', error);
      setBalance('0.00');
    }
  };
  
  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      clearWalletState();
      
      // Update local state
      setAccount('');
      setIsConnected(false);
      setWalletType(null);
      setBalance('0.00');
      setTransactions([]);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };
  
  // Verify wallet connection on mount
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        // First check if we have a provider
        if (typeof window === 'undefined' || !window.ethereum) {
          setIsConnected(false);
          setAccount('');
          clearWalletState();
          return;
        }
        
        // Check if we have a saved state
        const state = loadWalletState();
        
        // If we have a saved connected state, verify it with the provider
        if (state.isConnected && state.address) {
          // Verify the connection with the provider
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            // Connection is valid
            setAccount(accounts[0]);
            setIsConnected(true);
            
            // Determine wallet type
            if (window.ethereum.isMetaMask) {
              setWalletType('metamask');
            } else {
              setWalletType('coinbase');
            }
            
            // Fetch data
            fetchTSHCBalance(accounts[0]);
            fetchTransactionHistory(accounts[0]);
          } else {
            // No accounts, clear connection
            console.log('No accounts available, clearing connection state');
            setIsConnected(false);
            setAccount('');
            clearWalletState();
          }
        } else {
          // Not connected according to state
          setIsConnected(false);
          setAccount('');
        }
      } catch (error) {
        console.error('Error verifying wallet connection:', error);
        setIsConnected(false);
        setAccount('');
        clearWalletState();
      }
      
      setMounted(true);
    };
    
    verifyConnection();
    
    // Set up event listeners for account and chain changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          fetchTSHCBalance(accounts[0]);
          fetchTransactionHistory(accounts[0]);
        } else {
          handleDisconnect();
        }
      };
      
      const handleChainChanged = () => {
        window.location.reload();
      };
      
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);
  
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
                <Link href="/send" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center transition-colors">
                  Send
                </Link>
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
                  onClick={handleDisconnect}
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
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  </div>
                  <h3 className="font-medium mb-1">Mobile Money Transfer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fund your wallet using popular mobile money services like M-Pesa.
                  </p>
                </div>
                
                {/* Crypto Deposit Option */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-600 dark:text-orange-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                    </svg>
                  </div>
                  <h3 className="font-medium mb-1">Crypto Deposit</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Deposit cryptocurrency to convert to TSHC stablecoin.
                  </p>
                  <Link href="/deposit" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                    Deposit Now
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Recent Transactions */}
            <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              
              {isLoadingTx ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.map((tx, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {tx.from.toLowerCase() === account.toLowerCase() ? (
                                <span className="text-red-600 dark:text-red-400">Sent</span>
                              ) : (
                                <span className="text-green-600 dark:text-green-400">Received</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {parseFloat(tx.value) / 1e18} TSHC
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {tx.from.toLowerCase() === account.toLowerCase() 
                                ? `To: ${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`
                                : `From: ${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}`
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
