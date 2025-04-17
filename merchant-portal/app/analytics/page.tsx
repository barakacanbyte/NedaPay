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

export default function AnalyticsPage() {
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
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Total Revenue</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">39,100 TSHC</div>
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              <span className="font-medium">↑ 12.5%</span> vs previous period
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Total Transactions</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">131</div>
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              <span className="font-medium">↑ 8.2%</span> vs previous period
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Average Transaction</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">298 TSHC</div>
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              <span className="font-medium">↑ 4.3%</span> vs previous period
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">Conversion Rate</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">98.5%</div>
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              <span className="font-medium">↑ 1.2%</span> vs previous period
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Revenue</h3>
            <div className="h-64">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Transactions</h3>
            <div className="h-64">
              <Bar data={transactionsData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Currency Distribution</h3>
            <div className="h-64">
              <Doughnut data={currencyDistributionData} options={doughnutOptions} />
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Top Customers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Transactions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">John Doe</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">15</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">5,200 TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 17, 2025</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Jane Smith</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">12</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">4,800 TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 15, 2025</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Robert Johnson</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">10</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">3,900 TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 14, 2025</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Sarah Williams</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">8</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">3,200 TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 13, 2025</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Michael Brown</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">7</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">2,800 TSHC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">Apr 12, 2025</td>
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
