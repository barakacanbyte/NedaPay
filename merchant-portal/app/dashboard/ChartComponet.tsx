import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  LegendItem,
  Color,
} from 'chart.js';
import { stablecoins } from '../data/stablecoins'; 
import { useTheme } from 'next-themes';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

// Define the shape of the transaction
interface Transaction {
  id: string;
  shortId: string;
  date: string;
  amount: string;
  currency: string;
  status: string;
  sender: string;
  senderShort: string;
  blockExplorerUrl: string;
}

// Define props for the component
interface ChartComponentProps {
  transactions: Transaction[];
}

// Function to get chart data with validation
const getMultiStablecoinDailyRevenueData = (
  transactions: Transaction[]
): ChartData<'line', number[], string> => {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    console.warn('Invalid or empty transactions data');
    return { labels: [], datasets: [] };
  }

  // Get unique dates
  const dateSet = new Set<string>();
  transactions.forEach((tx) => {
    if (tx.date && typeof tx.date === 'string') {
      const date = tx.date.slice(0, 10); // e.g., "2025-05-01"
      dateSet.add(date);
    }
  });
  const labels = Array.from(dateSet).sort();

  // Get unique stablecoin symbols
  const stablecoinSymbols = Array.from(new Set(transactions.map((tx) => tx.currency)));

  // Generate datasets for each stablecoin
  const datasets = stablecoinSymbols.map((symbol, index) => {
    const coin = stablecoins.find((c) => c.baseToken === symbol);
    const flag = coin?.flag || '🌐';
    const data = labels.map((date) => {
      const dailySum = transactions
        .filter((tx) => tx.currency === symbol && tx.date.startsWith(date))
        .reduce((sum, tx) => {
          const amount = parseFloat(tx.amount.replace(/,/g, '')) || 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      return dailySum;
    });

    return {
      label: `${flag} ${symbol}`,
      data,
      fill: false,
      tension: 0.2,
      borderColor: `hsl(${index * 60}, 70%, 50%)` as Color,
      backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.3)` as Color,
    };
  });

  // Log data for debugging
  console.log('Chart Data:', { labels, datasets });

  // Validate data consistency
  datasets.forEach((dataset) => {
    if (dataset.data.length !== labels.length) {
      console.error(`Dataset length mismatch for ${dataset.label}:`, {
        dataLength: dataset.data.length,
        labelsLength: labels.length,
      });
    }
    dataset.data.forEach((value, i) => {
      if (isNaN(value) || value < 0) {
        console.warn(`Invalid data point at index ${i} for ${dataset.label}: ${value}`);
      }
    });
  });

  return { labels, datasets };
};

const ChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
  // State to track theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const { theme } = useTheme();

  console.log('Current theme:', theme); //debugging

  useEffect(() => {
  theme === 'dark' ? setIsDarkMode(true) : setIsDarkMode(false);
  const textColor = isDarkMode ? '#ffffff' : '#222222';
}, [theme, setIsDarkMode]);



  // Calculate suggested max for y-axis
  const maxAmount = transactions
    .map((tx) => parseFloat(tx.amount.replace(/,/g, '')) || 0)
    .filter((num) => !isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0);
  const suggestedMax = maxAmount > 0 ? maxAmount * 1.2 : 100; // 20% buffer or default to 100

  // Chart options with constrained y-axis and customized legend
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax, // Dynamic max based on data
        grid: { color: isDarkMode ? 'rgba(159, 161, 160, 0.28)': 'rgba(100, 102, 101, 0.17)' },
        ticks: { color: isDarkMode ? '#fffff0' : '#4b5563' },
      },
      x: {
        grid: { display: false },
        ticks: { color: isDarkMode ? '#fffff0' : '#4b5563' },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#ffffff' : '#222222',
          usePointStyle: false, 
          boxWidth: 20, // Width of the legend indicator
          boxHeight: 9, // Thin line-like appearance
          padding: 10,
          generateLabels: (chart): LegendItem[] => {
            const { datasets } = chart.data;
            if (!datasets || !datasets.length) return [];
            return datasets.map((ds, i) => {
              const labelString = ds.label || '';
              const match = labelString.match(/^(\S+)\s+(.+)$/);
              let flag = '',
                code = '';
              if (match) {
                flag = match[1];
                code = match[2];
              } else {
                code = labelString;
              }
              return {
                text: `${flag} ${code}`.trim(),
                fillStyle: ds.borderColor as Color, // Cast to Color
                strokeStyle: ds.borderColor as Color, // Cast to Color
                hidden: !chart.isDatasetVisible(i),
                index: i,
                lineWidth: 2,
              };
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const ds = context.dataset;
            const label = ds.label || '';
            const match = label.match(/^(\S+)\s+(.+)$/);
            let flag = '',
              code = '';
            if (match) {
              flag = match[1];
              code = match[2];
            } else {
              code = label;
            }
            return `${flag} ${code}: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64 w-full" style={{ position: 'relative', maxHeight: '256px' }}>
      <Line data={getMultiStablecoinDailyRevenueData(transactions)} options={options} />
    </div>
  );
};



export default ChartComponent;