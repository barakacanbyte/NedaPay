'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Connector } from 'wagmi';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import TransactionTable from './TransactionTable';
import { stablecoins } from '../data/stablecoins';
import { ethers } from 'ethers';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

// Function to process balances data
const processBalances = (balanceData: Record<string, string>, networkChainId?: number) => {
  // Always show all stablecoins, but only real balances for tokens on the current network
  const processed = stablecoins.map((coin) => {
    let balance = '0';
    if (!networkChainId || coin.chainId === networkChainId) {
      balance = balanceData[coin.baseToken] || '0';
    }
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance,
      flag: coin.flag || '🌐',
      region: coin.region || 'Unknown',
    };
  });

  // Calculate total received
  const total = processed.reduce((sum, coin) => sum + parseInt(coin.balance.replace(/,/g, '')), 0);

  // Calculate percentages
  const processedCoins = processed.map(coin => ({
    ...coin,
    percentage: total > 0 ? Math.round((parseInt(coin.balance.replace(/,/g, '')) / total) * 100) : 0
  }));

  return {
    processedBalances: processed,
    totalReceived: total.toLocaleString(),
    processedStablecoins: processedCoins
  };
};

// Format transactions for display with links and currency
// Utility to fetch real incoming payments (ERC20 Transfer events) for all stablecoins on Base
async function fetchIncomingPayments(merchantAddress: string) {
  if (!merchantAddress) return [];
  const ethers = (await import('ethers')).ethers;
  // Base Mainnet RPC (public)
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
  const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(latestBlock - 10000, 0); // last ~10000 blocks
  let allTxs: any[] = [];
  for (const coin of stablecoins.filter(c => c.chainId === 8453 && c.address && /^0x[a-fA-F0-9]{40}$/.test(c.address))) {
    const contract = new ethers.Contract(coin.address, ERC20_ABI, provider);
    let logs;
    let decimals;
    try {
      // Try to fetch decimals, skip if fails (not a real ERC20)
      decimals = await contract.decimals();
    } catch (e) {
      console.warn(`Skipping token ${coin.baseToken} at ${coin.address}: decimals() call failed.`);
      continue;
    }
    try {
      logs = await contract.queryFilter(
        contract.filters.Transfer(null, merchantAddress),
        fromBlock,
        latestBlock
      );
    } catch (e) {
      console.warn(`Skipping token ${coin.baseToken} at ${coin.address}: queryFilter failed.`);
      continue;
    }
    const symbol = coin.baseToken;
    for (const log of logs) {
      const { transactionHash, args, blockNumber } = log;
      if (!args) continue;
      const from = args.from;
      const to = args.to;
      const value = ethers.utils.formatUnits(args.value, decimals);
      const block = await provider.getBlock(blockNumber);
      const date = new Date(block.timestamp * 1000);
      allTxs.push({
        id: transactionHash,
        shortId: transactionHash.slice(0, 6) + '...' + transactionHash.slice(-4),
        date: date.toISOString().replace('T', ' ').slice(0, 16),
        amount: value,
        currency: symbol,
        status: 'Completed',
        sender: from,
        senderShort: from.slice(0, 6) + '...' + from.slice(-4),
        blockExplorerUrl: `https://basescan.org/tx/${transactionHash}`
      });
    }
  }
  // Sort by most recent
  allTxs.sort((a, b) => b.date.localeCompare(a.date));
  return allTxs.slice(0, 10); // Limit to 10 most recent
}


// Function to get payment methods data for charts
const getPaymentMethodsData = (balanceData: Record<string, string>) => {
  const { processedStablecoins } = processBalances(balanceData);
  return {
    labels: processedStablecoins.map((coin: any) => coin.symbol),
    datasets: [
      {
        label: 'Payment Methods',
        data: processedStablecoins.map((coin: any) => coin.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(16, 185, 129, 0.8)',  // Green
          'rgba(245, 158, 11, 0.8)',  // Amber
          'rgba(139, 92, 246, 0.8)',  // Purple
          'rgba(239, 68, 68, 0.8)'    // Red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
};

// Daily revenue data
// Generate daily revenue data from real transactions
function getDailyRevenueData(transactions: any[]) {
  // Determine the most common currency symbol
  const currencyCounts: Record<string, number> = {};
  transactions.forEach(tx => {
    if (tx.currency) currencyCounts[tx.currency] = (currencyCounts[tx.currency] || 0) + 1;
  });
  const mainSymbol = Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // Build a map of YYYY-MM-DD to total revenue
  const dayMap: Record<string, number> = {};
  transactions.forEach(tx => {
    // Defensive: ensure tx.date is valid and amount is a number
    let day = '';
    if (tx.date) {
      try {
        // Accept both ISO and Date objects
        day = typeof tx.date === 'string' ? tx.date.slice(0, 10) : new Date(tx.date).toISOString().slice(0, 10);
      } catch {}
    }
    const amount = parseFloat((tx.amount || '0').toString().replace(/,/g, ''));
    if (day && !isNaN(amount)) {
      dayMap[day] = (dayMap[day] || 0) + amount;
    }
  });

  // Always show the last 7 days including today
  const today = new Date('2025-04-23'); // Use current local time from user context
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return {
    labels: days,
    datasets: [
      {
        label: `Daily Revenue${mainSymbol ? ' (' + mainSymbol + ')' : ''}`,
        data: days.map(day => dayMap[day] || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };
}

// Transactions by day data
// Generate transactions by day data from real transactions
function getTransactionsByDayData(transactions: any[]) {
  // Group by weekday
  const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
  transactions.forEach(tx => {
    const dateObj = new Date(tx.date);
    const day = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    dayMap[day] = (dayMap[day] || 0) + 1;
  });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    labels: weekDays,
    datasets: [
      {
        label: 'Transactions',
        data: weekDays.map(day => dayMap[day] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };
}

export default function MerchantDashboard() {
  // ...existing state and hooks...
  const { address, isConnected, connector } = useAccount();
  const [networkWarning, setNetworkWarning] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [errorTokens, setErrorTokens] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const router = useRouter();
  
  // Set mounted state
  useEffect(() => {
    setMounted(true);
    
    // Check for smart wallet
    if (address && typeof window !== 'undefined') {
      const storedWallet = localStorage.getItem(`smartWallet_${address}`);
      if (storedWallet) {
        try {
          const wallet = JSON.parse(storedWallet);
          setSmartWalletAddress(wallet.address);
        } catch (e) {
          console.error('Error parsing smart wallet data', e);
        }
      }
    }
    // Fetch real balances when connected
    if (isConnected && address && connector) {
      fetchRealBalances(address);
    }
    // Fetch real incoming payments
    if (isConnected && address) {
      setIsTransactionLoading(true);
      fetchIncomingPayments(address).then(async (txs) => {
        setTransactions(txs);
        setIsTransactionLoading(false);
        // Automatically save new transactions to the database
        if (txs.length > 0) {
          // Fetch existing transactions from the DB for this merchant
          const res = await fetch(`/api/transactions?merchantId=${address}`);
          const dbTxs = res.ok ? await res.json() : [];
          const dbHashes = new Set(dbTxs.map((t: any) => t.txHash));
          // Only POST transactions that aren't already in DB
          for (const tx of txs) {
            if (!dbHashes.has(tx.id)) {
              await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  merchantId: address,
                  wallet: tx.sender,
                  amount: parseFloat(tx.amount),
                  currency: tx.currency,
                  status: tx.status,
                  txHash: tx.id,
                })
              });
            }
          }
        }
      });
    }
  }, [address, isConnected]);

  // --- Live Blockchain Event Listeners for Instant Updates ---
  useEffect(() => {
    if (!isConnected || !address) return;
    let listeners: Array<() => void> = [];
    let cancelled = false;
    (async () => {
      const ethersLib = (await import('ethers')).ethers;
      // Use public Base Mainnet RPC
      const provider = new ethersLib.providers.JsonRpcProvider('https://mainnet.base.org');
      const ERC20_ABI = [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
      ];
      // For each supported stablecoin on Base
      for (const coin of stablecoins.filter(c => c.chainId === 8453 && c.address && /^0x[a-fA-F0-9]{40}$/.test(c.address))) {
        try {
          const contract = new ethersLib.Contract(coin.address, ERC20_ABI, provider);
          const decimals = await contract.decimals();
          const symbol = coin.baseToken;
          // Listener callback
          const onTransfer = async (from: string, to: string, value: ethers.BigNumber, event: any) => {
            if (cancelled) return;
            if (to.toLowerCase() === address.toLowerCase()) {
              const txHash = event.transactionHash;
              // Check if already in DB
              const res = await fetch(`/api/transactions?merchantId=${address}`);
              const dbTxs = res.ok ? await res.json() : [];
              const dbHashes = new Set(dbTxs.map((t: any) => t.txHash));
              if (!dbHashes.has(txHash)) {
                await fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    merchantId: address,
                    wallet: from,
                    amount: parseFloat(ethersLib.utils.formatUnits(value, decimals)),
                    currency: symbol,
                    status: 'Completed',
                    txHash,
                  })
                });
                // Show toast notification for new payment
                const shortSender = from.slice(0, 6) + '...' + from.slice(-4);
                (await import('react-hot-toast')).toast.success(
                  `Payment received: ${parseFloat(ethersLib.utils.formatUnits(value, decimals))} ${symbol} from ${shortSender}`
                );
                // Dispatch notification event for NotificationTab
                window.dispatchEvent(new CustomEvent('neda-notification', {
                  detail: {
                    message: `Payment received: ${parseFloat(ethersLib.utils.formatUnits(value, decimals))} ${symbol} from ${shortSender}`
                  }
                }));
                // Optionally, refresh the UI
                fetchIncomingPayments(address).then(setTransactions);
              }
            }
          };
          contract.on('Transfer', onTransfer);
          listeners.push(() => contract.off('Transfer', onTransfer));
        } catch (e) {
          // Ignore tokens that can't be listened to
        }
      }
    })();
    return () => {
      cancelled = true;
      listeners.forEach(off => off());
    };
  }, [isConnected, address]);
  
  // Check wallet connection and redirect if needed
  useEffect(() => {
    if (!mounted) return;
    
    // Check if wallet is connected via localStorage
    const walletConnected = localStorage.getItem('walletConnected') === 'true';
    const cookieWalletConnected = document.cookie.includes('wallet_connected=true');
    
    // If not connected, redirect to home
    if (!walletConnected && !cookieWalletConnected) {
      router.push('/?walletRequired=true');
    } else if (walletConnected && !cookieWalletConnected) {
      // If localStorage has connection but cookie doesn't, sync them
      document.cookie = 'wallet_connected=true; path=/; max-age=86400'; // 24 hours
    } else if (cookieWalletConnected && !walletConnected) {
      // If cookie exists but localStorage doesn't, sync them
      localStorage.setItem('walletConnected', 'true');
    }
    
    // Check for smart wallet
    if (address && typeof window !== 'undefined') {
      const storedWallet = localStorage.getItem(`smartWallet_${address}`);
      if (storedWallet) {
        try {
          const wallet = JSON.parse(storedWallet);
          setSmartWalletAddress(wallet.address);
        } catch (e) {
          console.error('Error parsing smart wallet data', e);
        }
      }
    }
    
    // Fetch real balances when connected
    if (isConnected && address && connector) {
      fetchRealBalances(address);
    }
    
    // Set up real blockchain event listeners
    if (typeof window !== 'undefined' && isConnected) {
      // In a production environment, we would set up real blockchain event listeners
      // For example using ethers.js to listen for Transfer events:
      
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const tokenAddresses = stablecoins.map(coin => coin.address);
      // 
      // // Set up listeners for each token
      // tokenAddresses.forEach(address => {
      //   const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      //   const filter = tokenContract.filters.Transfer(null, walletAddress);
      //   
      //   tokenContract.on(filter, (from, to, amount, event) => {
      //     // Refresh balances and transactions when we receive a transfer
      //     fetchRealBalances(walletAddress);
      //   });
      // });
      // 
      // // Clean up
      // return () => {
      //   tokenAddresses.forEach(address => {
      //     const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      //     tokenContract.removeAllListeners();
      //   });
      // };
      
      // For this demo, we'll set up a periodic refresh
      const refreshInterval = setInterval(() => {
        if (address) {
          fetchRealBalances(address);
        }
      }, 30000); // Refresh every 30 seconds
      
      // Clean up
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [address, isConnected, router]);
  
  // Function to fetch real balances from wallet
  const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const BASE_MAINNET_CHAIN_ID = 8453;

const fetchRealBalances = async (walletAddress: string) => {
  let filteredCoins: any[] = [];

  console.log('[DEBUG] fetchRealBalances called', { walletAddress, connector });
  try {
    setIsLoading(true);
    let provider;
    // Always use window.ethereum for both MetaMask and Coinbase Wallet
    // Using connector.getProvider() for Coinbase Wallet is unreliable for ethers.js
    // See: https://github.com/coinbase/coinbase-wallet-sdk/issues/119
    if (typeof window !== 'undefined' && window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log('[DEBUG] Using window.ethereum as provider', provider);
      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== BASE_MAINNET_CHAIN_ID) {
        setNetworkWarning(true);
        setIsLoading(false);
        filteredCoins = [];
        return;
      } else {
        setNetworkWarning(false);
        filteredCoins = stablecoins.filter((coin: any) => coin.chainId === network.chainId);
      }
    } else {
      console.error('[DEBUG] No wallet provider found');
      throw new Error('No wallet provider found');
    }
    const realBalances: Record<string, string> = {};
    let anyError = false;
    const tokenErrors: Record<string, string> = {};
    // Only fetch balances for tokens on the current network
    for (const coin of filteredCoins) {
      try {
        console.log(`[DEBUG] Fetching balance for coin`, { coin, walletAddress });
        const tokenContract = new ethers.Contract(coin.address, ERC20_ABI, provider);
        let balance = '0';
        let decimals = 18;
        try {
          [balance, decimals] = await Promise.all([
            tokenContract.balanceOf(walletAddress),
            tokenContract.decimals()
          ]);
        } catch (tokenErr: any) {
          // Suppress error, log for debugging only
          console.warn(`[WARN] Could not fetch balance/decimals for ${coin.baseToken}:`, tokenErr?.message);
          tokenErrors[coin.baseToken] = tokenErr?.message || 'Error fetching balance';
          anyError = true;
        }
        let formatted = '0';
        try {
          formatted = ethers.utils.formatUnits(balance, decimals);
        } catch {}
        realBalances[coin.baseToken] = parseFloat(formatted).toLocaleString();
        if (!tokenErrors[coin.baseToken]) {
          console.log(`[DEBUG] Balance fetched`, { coin: coin.baseToken, formatted });
        }
      } catch (err: any) {
        // Suppress error, do not propagate
      }
    }
    setBalanceError(anyError);
    setErrorTokens(tokenErrors);
    setBalances(realBalances);
    // Also fetch transactions
    setIsTransactionLoading(true);
    // ...existing transaction code...
  } catch (error) {
    console.error('Error fetching balances:', error);
  } finally {
    setIsTransactionLoading(false);
    setIsLoading(false);
  }
};

  if (!mounted) return null;
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      <div className="my-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
          <span aria-hidden="true">←</span> Back
        </button>
      </div>
      {networkWarning && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
          <strong className="font-bold">Network Error:</strong>
          <span className="block sm:inline"> Please switch your wallet to <b>Base Mainnet</b> (chainId 8453) to view your balances.</span>
        </div>
      )}
      {/* No generic warning, handled per-token below */}
      <div className="flex-grow">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
              Merchant Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base">
              Manage your stablecoin payments and track business performance
            </p>
          </div>

          {/* Smart Wallet Info */}
          {smartWalletAddress && (
            <div className="bg-primary dark:bg-primary-dark border border-primary-light dark:border-blue-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">Smart Wallet Connected</h2>
              <p className="text-white mb-4">You're using a smart wallet for enhanced security and lower fees</p>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-white">Smart Wallet Address:</div>
                <div className="text-sm text-white/90">
                  {`${smartWalletAddress.substring(0, 10)}...${smartWalletAddress.substring(smartWalletAddress.length - 8)}`}
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Total Received</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isTransactionLoading ? (
                  <div className="animate-pulse h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                ) : (
                  (() => {
                    if (!transactions.length) return '0';
                    // Sum all incoming amounts
                    const total = transactions.reduce((acc, tx) => acc + (parseFloat((tx.amount || '0').replace(/,/g, '')) || 0), 0);
                    // Use the most common currency (by count) among transactions
                    const symbol = (() => {
                      const counts: Record<string, number> = {};
                      transactions.forEach(tx => { counts[tx.currency] = (counts[tx.currency] || 0) + 1; });
                      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
                    })();
                    return `${total.toLocaleString()} ${symbol}`;
                  })()
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Total Transactions</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Average Transaction</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
  {(() => {
    const total = parseInt(processBalances(balances).totalReceived.replace(/,/g, ''));
    const symbol = processBalances(balances).processedBalances.find(c => parseInt(c.balance.replace(/,/g, '')) > 0)?.symbol || '';
    if (total === 0 || transactions.length === 0) return `0 ${symbol}`;
    // Average over real transactions
    const sum = transactions.reduce((acc, tx) => acc + (parseFloat(tx.amount.replace(/,/g, '')) || 0), 0);
    return `${Math.round(sum / transactions.length).toLocaleString()} ${symbol}`;
  })()}
</div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Monthly Growth</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {(() => {
                  // Compute monthly growth based on real transactions
                  const now = new Date();
                  const thisMonth = now.getMonth();
                  const thisYear = now.getFullYear();
                  // Previous month (handle January)
                  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                  const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                  // Sum revenue for this and previous month
                  let thisMonthSum = 0;
                  let prevMonthSum = 0;
                  transactions.forEach(tx => {
                    const txDate = new Date(tx.date);
                    const amt = parseFloat((tx.amount || '0').replace(/,/g, '')) || 0;
                    if (txDate.getFullYear() === thisYear && txDate.getMonth() === thisMonth) {
                      thisMonthSum += amt;
                    } else if (txDate.getFullYear() === prevYear && txDate.getMonth() === prevMonth) {
                      prevMonthSum += amt;
                    }
                  });
                  if (prevMonthSum === 0 && thisMonthSum === 0) return 'N/A';
                  if (prevMonthSum === 0) return '+100%'; // All new growth
                  const growth = ((thisMonthSum - prevMonthSum) / prevMonthSum) * 100;
                  const sign = growth >= 0 ? '+' : '';
                  return `${sign}${growth.toFixed(1)}%`;
                })()}
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily Revenue</h3>
              <div className="h-64">
                <Line 
  data={getDailyRevenueData(transactions)} 
  options={{ 
    responsive: true, 
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: typeof window !== 'undefined' && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                '#9ca3af' : '#4b5563',
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: typeof window !== 'undefined' && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                '#9ca3af' : '#4b5563',
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }} 
/>
              </div>
            </div>
            
            {/* Payment Methods Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Payment Methods</h3>
              <div className="h-64">
                <Doughnut 
                  data={getPaymentMethodsData(balances)} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: typeof window !== 'undefined' && 
                                window.matchMedia && 
                                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                                '#9ca3af' : '#4b5563',
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Transactions and Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tx Hash</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {isTransactionLoading ? (
                      // Loading skeleton for transactions
                      Array(5).fill(0).map((_, index) => (
                        <tr key={`loading-${index}`} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a 
                              href={tx.blockExplorerUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-blue-300 font-medium"
                            >
                              {tx.shortId}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                            <a 
                              href={`https://basescan.org/address/${tx.sender}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-blue-300 font-medium"
                            >
                              {tx.senderShort}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">{tx.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{tx.amount} <span className="text-primary dark:text-primary-light">{tx.currency}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tx.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                              tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-center mt-4">
                  <a href="/transactions" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                    View All Transactions
                  </a>
                </div>
              </div>
            </div>
            
            {/* Wallet Balances */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Wallet Balances</h3>
              
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeleton for balances
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="animate-pulse h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full mr-2"></div>
                        <div>
                          <div className="animate-pulse h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                          <div className="animate-pulse h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      </div>
                      <div className="animate-pulse h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  ))
                ) : (
                  processBalances(balances, BASE_MAINNET_CHAIN_ID).processedStablecoins.map((coin: any, index: number) => (
                    <div key={coin.symbol + '-' + (coin.address || index)} className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{coin.flag}</span>
                        <div>
                          <span className="font-medium text-slate-800 dark:text-white">{coin.symbol}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 block">{coin.name}</span>
                        </div>
                      </div>
                      <span className="font-medium text-slate-800 dark:text-white flex items-center">
                        {coin.balance}
                        {errorTokens[coin.symbol] && (
                          <span
                            className="ml-2 text-yellow-500 cursor-pointer"
                            title={`Error fetching balance: ${errorTokens[coin.symbol]}`}
                          >
                            ⚠️
                          </span>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Actions</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
  setTimeout(() => {
    window.location.href = '/payment-link';
  }, 100);
}} 
                className="p-4 w-full bg-gray-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
              >
                <h3 className="font-bold text-blue-900 dark:text-blue-300">Create Payment Link</h3>
                <p className="text-sm text-blue-900 dark:text-blue-400 mt-1 font-medium">Generate a payment link to share with customers</p>
              </button>

              <button 
                onClick={() => router.push('/invoice')} 
                className="p-4 w-full bg-gray-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition"
              >
                <h3 className="font-bold text-green-900 dark:text-green-300">Generate Invoice</h3>
                <p className="text-sm text-green-900 dark:text-green-400 mt-1 font-medium">Send an invoice to your customer for payment</p>
              </button>

              <button 
                onClick={() => router.push('/analytics')} 
                className="p-4 w-full bg-gray-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
              >
                <h3 className="font-bold text-purple-900 dark:text-purple-300">View Analytics</h3>
                <p className="text-sm text-purple-900 dark:text-purple-400 mt-1 font-medium">Detailed reports and business insights</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
