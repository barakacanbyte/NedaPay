import React, { useState, useEffect, useRef } from 'react';
import { stablecoins } from '../data/stablecoins';
import { getAerodromeQuote, swapAerodrome, AERODROME_ROUTER_ADDRESS, AERODROME_FACTORY_ADDRESS } from '../utils/aerodrome';
import { checkAllowance, approveToken } from '../utils/erc20';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';


interface SwapModalProps {
  open: boolean;
  fromSymbol: string;
  onClose: () => void;
  onSwap: (from: string, to: string, amount: string) => void;
  maxAmount: string;
}

const SwapModal: React.FC<SwapModalProps> = ({ open, fromSymbol, onClose, onSwap, maxAmount }) => {
  const { address, isConnected } = useAccount();
  const [toSymbol, setToSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [poolType, setPoolType] = useState<'stable' | 'volatile'>('stable');
  const swapInProgress = useRef(false);

  // Get token and factory addresses
  const fromToken = stablecoins.find(c => c.baseToken === fromSymbol)?.address;
  const toToken = stablecoins.find(c => c.baseToken === toSymbol)?.address;
  // Get decimals for input and output tokens
  const fromTokenObj = stablecoins.find(c => c.baseToken === fromSymbol);
  const toTokenObj = stablecoins.find(c => c.baseToken === toSymbol);
  const fromDecimals = fromTokenObj?.decimals ?? 18;
  const toDecimals = toTokenObj?.decimals ?? 18;
  // Use the official Aerodrome PoolFactory address for Base
  const factory = AERODROME_FACTORY_ADDRESS;

  // Update quote when amount or toSymbol changes


  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!fromToken || !toToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const fetchQuote = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const parsedAmount = ethers.utils.parseUnits(amount, fromDecimals).toString();
        console.log('[Quote] Fetching quote with:', {
          fromToken,
          toToken,
          poolType,
          factory,
          fromDecimals,
          toDecimals,
          parsedAmount,
          amount
        });
        const amounts = await getAerodromeQuote({
          provider,
          amountIn: parsedAmount,
          fromToken,
          toToken,
          stable: poolType === 'stable',
          factory
        });
        console.log('[Quote] getAerodromeQuote result:', amounts);
        setQuote(ethers.utils.formatUnits(amounts[amounts.length - 1], toDecimals));
      } catch (err: any) {
        console.error('[Quote] Error fetching quote:', err);
        setQuoteError('Unable to fetch quote');
      }
    };
    fetchQuote();
  }, [fromToken, toToken, amount, fromSymbol, toSymbol, factory, poolType, fromDecimals, toDecimals]);

  const handleSwap = async () => {
    setSwapError(null);
    if (!fromToken || !toToken || !address || !amount) {
      setSwapError('Missing swap details');
      return;
    }
    const parsedAmount = ethers.utils.parseUnits(amount, fromDecimals).toString();
    const minOut = quote ? ethers.utils.parseUnits((Number(quote) * 0.995).toFixed(toDecimals), toDecimals).toString() : '0'; // 0.5% slippage
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min
    try {
      setIsSwapping(true);
      swapInProgress.current = true;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      // Check allowance
      const allowance = await checkAllowance({
        token: fromToken,
        owner: address,
        spender: AERODROME_ROUTER_ADDRESS,
        provider
      });
      if (ethers.BigNumber.from(allowance).lt(parsedAmount)) {
        // Approve only the exact amount needed for this swap
        const approveTx = await approveToken({
          token: fromToken,
          spender: AERODROME_ROUTER_ADDRESS,
          amount: parsedAmount, // Only approve the needed amount
          signer
        });
        await approveTx.wait();
      }
      // Swap
      const tx = await swapAerodrome({
        signer,
        amountIn: parsedAmount,
        amountOutMin: minOut,
        fromToken,
        toToken,
        stable: poolType === 'stable',
        factory,
        userAddress: address,
        deadline
      });
      await tx.wait();
      setIsSwapping(false);
      swapInProgress.current = false;
      onSwap(fromSymbol, toSymbol, amount); // callback to parent
    } catch (err: any) {
      setSwapError(err?.reason || err?.message || 'Swap failed');
      setIsSwapping(false);
      swapInProgress.current = false;
    }
  };

  useEffect(() => {
    setToSymbol('');
    setAmount('');
    setIsSwapping(false);
    setQuote(null);
    setQuoteError(null);
    setSwapError(null);
  }, [open, fromSymbol]);

  const availableToCoins = stablecoins.filter(c => c.baseToken !== fromSymbol);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col border border-slate-200 dark:border-slate-700 p-0 animate-fadeInScale">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-2xl focus:outline-none" aria-label="Close">
          &times;
        </button>
        <div className="flex-1 p-8 text-slate-900 dark:text-white space-y-6">
          <h2 className="text-2xl font-bold mb-6">Swap {fromSymbol}</h2>
          <label className="block mb-2 font-medium">To:</label>
          <select
            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded mb-4 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
            value={toSymbol}
            onChange={e => setToSymbol(e.target.value)}
          >
            <option value="">Select token</option>
            {availableToCoins.map(c => (
              <option key={c.baseToken} value={c.baseToken}>
                {c.baseToken} - {c.name}
              </option>
            ))}
          </select>
          <label className="block mb-2 font-medium">Amount:</label>
          <div className="flex mb-8 gap-2">
            <input
              type="number"
              className="flex-grow p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              max={maxAmount}
              min="0"
              placeholder="0.0"
            />
            <button
              className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 rounded font-semibold"
              onClick={() => setAmount(maxAmount)}
              type="button"
            >
              Max
            </button>
          </div>
          {/* Pool type selector */}
          <div className="mb-2 flex items-center gap-3">
            <span className="text-xs text-gray-500">Pool Type:</span>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={poolType}
              onChange={e => setPoolType(e.target.value as 'stable' | 'volatile')}
            >
              <option value="stable">Stable</option>
              <option value="volatile">Volatile</option>
            </select>
          </div>
          {/* Show estimated output/rate from Aerodrome here */}
          <div className="mb-4 min-h-[24px]">
            {amount && toSymbol && (
              quoteError ? (
                <span className="text-red-500 text-sm">{quoteError}</span>
              ) : quote ? (
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                  Estimated: {quote} {toSymbol}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">Fetching quote...</span>
              )
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-8">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-slate-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow-md hover:bg-blue-700 transition disabled:opacity-60 w-full sm:w-auto"
              disabled={!toSymbol || !amount || parseFloat(amount) <= 0 || isSwapping || !quote}
              onClick={async () => {
                if (swapInProgress.current) return;
                await handleSwap();
              }}
              type="button"
            >
              {isSwapping ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m-7-7l7 7-7 7" /></svg>
              )}
              {isSwapping ? 'Swapping...' : 'Swap'}
            </button>
          </div>
          {swapError && (
            <div className="mt-4 text-red-500 text-center text-sm">
              {swapError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapModal;
