'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { stablecoins, mockBalances, mockTransactions } from '../data/stablecoins';
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
const processBalances = (balanceData: Record<string, string>) => {
  const processed = Object.entries(balanceData).map(([symbol, balance]) => {
    const coin = stablecoins.find(c => c.baseToken === symbol);
    return {
      symbol,
      name: coin?.name || symbol,
      balance,
      flag: coin?.flag || '🌐',
      region: coin?.region || 'Unknown'
    };
  });
  
  // Calculate total received
  const total = Object.values(balanceData)
    .reduce((sum, balance) => sum + parseInt(balance.replace(/,/g, '')), 0);
  
  // Calculate percentages
  const processedCoins = processed.map(coin => ({
    ...coin,
    percentage: Math.round((parseInt(coin.balance.replace(/,/g, '')) / total) * 100)
  })).sort((a, b) => b.percentage - a.percentage).slice(0, 5); // Top 5 by balance
  
  return {
    processedBalances: processed,
    totalReceived: total.toLocaleString(),
    processedStablecoins: processedCoins
  };
};

// Format transactions for display
const mockRecentTransactions = mockTransactions.slice(0, 5).map(tx => ({
  id: tx.id,
  date: tx.date,
  amount: `${tx.amount} ${tx.currency}`,
  status: tx.status
}));

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
const mockDailyRevenue = {
  labels: ['Apr 5', 'Apr 6', 'Apr 7', 'Apr 8', 'Apr 9', 'Apr 10', 'Apr 11'],
  datasets: [
    {
      label: 'Daily Revenue (TSHC)',
      data: [45000, 52000, 38000, 61000, 42000, 55000, 48000],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.3,
      fill: true
    }
  ]
};

// Transactions by day data
const mockTransactionsByDay = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Transactions',
      data: [65, 78, 52, 91, 83, 56, 42],
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }
  ]
};

export default function MerchantDashboard() {
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>(mockBalances);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const router = useRouter();
  
  // Get wallet connection status from wagmi
  const { address, isConnected } = useAccount();
  
  useEffect(() => {
    setMounted(true);
    
    // Check if wallet is connected
    if (!isConnected && typeof window !== 'undefined') {
      // Check both localStorage and cookies for wallet connection
      const walletConnected = localStorage.getItem('walletConnected');
      const cookieWalletConnected = document.cookie
        .split('; ')
        .find(row => row.startsWith('wallet_connected='));
      
      if ((!walletConnected || walletConnected !== 'true') && !cookieWalletConnected) {
        router.push('/?walletRequired=true');
      } else if (cookieWalletConnected && !walletConnected) {
        // If cookie exists but localStorage doesn't, sync them
        localStorage.setItem('walletConnected', 'true');
      }
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
    if (isConnected && address) {
      fetchRealBalances(address);
    }
  }, [address, isConnected, router]);
  
  // Function to fetch real balances (simulated)
  const fetchRealBalances = async (walletAddress: string) => {
    try {
      // In a real implementation, this would call a blockchain API to get real balances
      // For now, we'll simulate real balances by generating random values based on the wallet address
      
      // Use the wallet address to seed a pseudo-random number generator
      const seed = walletAddress.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const randomFactor = (seed % 20) / 10 + 0.5; // Between 0.5 and 2.5
      
      // Create new balances based on mock data but with "real" values
      const realBalances: Record<string, string> = {};
      
      Object.entries(mockBalances).forEach(([token, balance]) => {
        const baseValue = parseInt(balance.replace(/,/g, ''));
        const newValue = Math.round(baseValue * randomFactor);
        realBalances[token] = newValue.toLocaleString();
      });
      
      setBalances(realBalances);
    } catch (error) {
      console.error('Error fetching real balances:', error);
      // Fall back to mock balances
      setBalances(mockBalances);
    }
  };

  if (!mounted) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
            Merchant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your stablecoin payments and track business performance
          </p>
        </div>

        {/* Smart Wallet Info */}
        {smartWalletAddress && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Smart Wallet Connected</h2>
            <p className="text-blue-600 dark:text-blue-400 mb-4">You're using a smart wallet for enhanced security and lower fees</p>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-300">Smart Wallet Address:</div>
              <div className="text-sm text-gray-700 dark:text-gray-400">
                {`${smartWalletAddress.substring(0, 10)}...${smartWalletAddress.substring(smartWalletAddress.length - 8)}`}
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-900 dark:text-gray-400 mb-1 font-semibold">Total Received</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{processBalances(balances).totalReceived} TSHC</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-900 dark:text-gray-400 mb-1 font-semibold">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{mockTransactions.length.toString()}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-900 dark:text-gray-400 mb-1 font-semibold">Average Transaction</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(parseInt(processBalances(balances).totalReceived.replace(/,/g, '')) / mockTransactions.length).toLocaleString()} TSHC
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-gray-900 dark:text-gray-400 mb-1 font-semibold">Conversion Rate</div>
            <div className="text-2xl font-bold text-green-800 dark:text-green-400">98.5%</div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily Revenue</h3>
            <div className="h-64">
              <Line 
                data={mockDailyRevenue} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Transactions by Day Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Transactions by Day</h3>
            <div className="h-64">
              <Bar 
                data={mockTransactionsByDay} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
        
        {/* Payment Methods and Stablecoin Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                        color: 'rgb(55, 65, 81)'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Stablecoin Balances */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Stablecoin Balances</h2>
              
              <div className="h-60 flex justify-center items-center mb-4">
                <Doughnut 
                  data={getPaymentMethodsData(balances)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {processBalances(balances).processedStablecoins.map((coin: any, index: number) => (
                  <div key={index} className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2">{coin.flag}</span>
                      <div>
                        <span className="font-medium text-gray-800 dark:text-white">{coin.symbol}</span>
                        <span className="text-xs text-gray-700 dark:text-gray-400 block">{coin.name}</span>
                      </div>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-white">{coin.balance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Transactions and Weekly Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockRecentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{tx.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{tx.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{tx.amount}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                View All Transactions
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Actions</h3>
            
            <div className="space-y-4">
              <button className="p-4 w-full bg-gray-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                <h3 className="font-bold text-blue-900 dark:text-blue-300">Create Payment Link</h3>
                <p className="text-sm text-blue-900 dark:text-blue-400 mt-1 font-medium">Generate a payment link to share with customers</p>
              </button>
              
              <button className="p-4 w-full bg-gray-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition">
                <h3 className="font-bold text-green-900 dark:text-green-300">Withdraw Funds</h3>
                <p className="text-sm text-green-900 dark:text-green-400 mt-1 font-medium">Transfer stablecoins to your wallet</p>
              </button>
              
              <button className="p-4 w-full bg-gray-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition">
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
