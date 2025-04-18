'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsContent() {
  const [dateRange, setDateRange] = useState('7d');
  const { isConnected } = useAccount();
  const router = useRouter();

  // Check if wallet is connected using useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const walletConnected = localStorage.getItem('walletConnected') === 'true';
      const cookieWalletConnected = document.cookie.includes('wallet_connected=true');
      
      if (!isConnected && !walletConnected && !cookieWalletConnected) {
        router.push('/?walletRequired=true');
      }
    }
  }, [isConnected, router]);

  // Mock data for charts
  const revenueData = {
    labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
    datasets: [
      {
        label: 'Revenue',
        data: [4500, 5200, 3800, 6000, 5600, 7200, 6800],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const transactionsData = {
    labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
    datasets: [
      {
        label: 'Transactions',
        data: [12, 19, 15, 22, 18, 24, 21],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const currencyDistributionData = {
    labels: ['TSHC', 'cNGN', 'IDRX'],
    datasets: [
      {
        label: 'Currency Distribution',
        data: [65, 20, 15],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: typeof window !== 'undefined' && 
                 window.matchMedia && 
                 window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                 '#f1f5f9' : '#1e293b',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: typeof window !== 'undefined' && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: typeof window !== 'undefined' && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                '#cbd5e1' : '#475569',
        },
      },
      y: {
        grid: {
          color: typeof window !== 'undefined' && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: typeof window !== 'undefined' && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                '#cbd5e1' : '#475569',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: typeof window !== 'undefined' && 
                 window.matchMedia && 
                 window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                 '#f1f5f9' : '#1e293b',
        },
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      <div className="flex-grow">
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base">
            Detailed reports and business insights
          </p>
        </div>
        
        {/* Date range selector */}
        <div className="mb-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setDateRange('7d')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                dateRange === '7d'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } border border-slate-200 dark:border-slate-600`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-4 py-2 text-sm font-medium ${
                dateRange === '30d'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } border-t border-b border-slate-200 dark:border-slate-600`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('90d')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                dateRange === '90d'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } border border-slate-200 dark:border-slate-600`}
            >
              90 Days
            </button>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary">39,100 TSHC</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clipRule="evenodd" />
              </svg>
              +12.5% from last period
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Transactions</h3>
            <p className="text-3xl font-bold text-primary">131</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clipRule="evenodd" />
              </svg>
              +8.2% from last period
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Average Transaction</h3>
            <p className="text-3xl font-bold text-primary">298 TSHC</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clipRule="evenodd" />
              </svg>
              +4.1% from last period
            </p>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue Over Time</h3>
            <div className="h-64">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Transactions Per Day</h3>
            <div className="h-64">
              <Bar data={transactionsData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Currency Distribution</h3>
            <div className="h-64">
              <Doughnut data={currencyDistributionData} options={doughnutOptions} />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 17, 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">450</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 16, 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">1200</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 15, 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">800</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">cNGN</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 15, 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">350</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
      </div>
    </div>
  );
}
