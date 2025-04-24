import React from 'react';
import { stablecoins } from '../data/stablecoins';

interface Balance {
  symbol: string;
  name: string;
  balance: string;
  flag?: string;
  region?: string;
}

interface BalancesProps {
  balances: Balance[];
  onSwap: (fromSymbol: string) => void;
}

const Balances: React.FC<BalancesProps> = ({ balances, onSwap }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Stablecoin Balances</h2>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Coin</th>
            <th className="px-4 py-2 text-left">Balance</th>
            <th className="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((coin) => (
            <tr key={coin.symbol}>
              <td className="px-4 py-2 flex items-center gap-2">
                <span>{coin.flag}</span>
                <span>{coin.symbol} - {coin.name}</span>
              </td>
              <td className="px-4 py-2">{coin.balance}</td>
              <td className="px-4 py-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg"
                  onClick={() => onSwap(coin.symbol)}
                  disabled={coin.balance === '0' || coin.balance === '0.0'}
                >
                  Swap
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Balances;
