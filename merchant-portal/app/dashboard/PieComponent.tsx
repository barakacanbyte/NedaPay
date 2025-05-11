import {
  Color,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { stablecoins } from "../data/stablecoins";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

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

interface ChartComponentProps {
  transactions: Transaction[];
}

const getPaymentMethodsData = (transactions: any[]) => {
  const grouped: Record<string, { count: number; flag: string }> = {};
  transactions.forEach((tx) => {
    const symbol = tx.currency;
    if (!grouped[symbol]) {
      const coin = stablecoins.find((c) => c.baseToken === symbol);
      grouped[symbol] = { count: 0, flag: coin?.flag || "🌐" };
    }
    grouped[symbol].count++;
  });
  const entries = Object.entries(grouped).filter(
    ([sym, data]) => data.count > 0
  );

  // Sort symbols to match stablecoin order for consistent color assignment
  const stablecoinOrder = stablecoins.map((c) => c.baseToken);
  const labels = entries
    .sort(([a], [b]) => stablecoinOrder.indexOf(a) - stablecoinOrder.indexOf(b))
    .map(([symbol]) => symbol);

  const data = entries
    .sort(([a], [b]) => stablecoinOrder.indexOf(a) - stablecoinOrder.indexOf(b))
    .map(([_, d]) => d.count);

  // Explicitly type as Color[] to ensure array indexing
  const backgroundColor: Color[] = labels.map(
    (_, i) => `hsla(${i * 60}, 70%, 50%, 0.8)`
  );
  const borderColor: Color[] = labels.map((_, i) => `hsl(${i * 60}, 70%, 50%)`);

  return {
    labels,
    datasets: [
      {
        label: "Payment Methods",
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  };
};

const PieChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
   // State to track theme
   const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
   const { theme } = useTheme();
 
   console.log('Current theme:', theme); //debugging
 
   useEffect(() => {
   theme === 'dark' ? setIsDarkMode(true) : setIsDarkMode(false);
 }, [theme, setIsDarkMode]);

 

    

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDarkMode ? "#9ca3af" : "#4b5563",
          padding: 20,
          font: { size: 12 },
          usePointStyle: false,
          boxWidth: 20,
          boxHeight: 9,
          generateLabels: (chart) => {
            const { datasets } = chart.data;
            if (!datasets || !datasets.length) return [];
            const backgroundColor = datasets[0].backgroundColor as Color[];
            const borderColor = datasets[0].borderColor as Color[];
            return datasets[0].data.map((_, i) => {
              const symbol = chart.data.labels![i] as string;
              const coin = stablecoins.find((c) => c.baseToken === symbol);
              const flag = coin?.flag || "🌐";
              return {
                text: `${flag} ${symbol}`,
                fillStyle: backgroundColor[i],
                strokeStyle: borderColor[i],
                lineWidth: 1,
                hidden: false,
                index: i,
              };
            });
          },
        },
      },
    },
  };

  return (
    <div
      className="h-64 w-full"
      style={{ position: "relative", maxHeight: "256px" }}
    >
      <Doughnut data={getPaymentMethodsData(transactions)} options={options} />
    </div>
  );
};

export default PieChartComponent;