'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalWallet } from '../context/GlobalWalletContext';

export interface DirectWalletConnectorProps {
  onConnected?: () => void;
  buttonClassName?: string;
  buttonText?: string;
}

export default function DirectWalletConnector({
  onConnected,
  buttonClassName = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all flex items-center space-x-2 disabled:opacity-50',
  buttonText = 'Connect Wallet',
}: DirectWalletConnectorProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Use our global wallet context
  const { 
    address, 
    isConnected, 
    chainId, 
    connect, 
    disconnect, 
    isConnecting,
    hasMetaMask,
    hasCoinbaseWallet
  } = useGlobalWallet();

  // Handle MetaMask connection
  const handleConnectMetaMask = async () => {
    try {
      await connect('metamask');
      if (onConnected) onConnected();
    } catch (error) {
      console.error('Error connecting MetaMask:', error);
    }
  };

  // Handle Coinbase Wallet connection
  const handleConnectCoinbase = async () => {
    try {
      await connect('coinbase');
      if (onConnected) onConnected();
    } catch (error) {
      console.error('Error connecting Coinbase Wallet:', error);
    }
  };

  // Fallback generic connect
  const handleConnect = async () => {
    try {
      await connect();
      if (onConnected) onConnected();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };


  // Redirect to dashboard when connected
  useEffect(() => {
    if (isConnected && address && !isRedirecting) {
      setIsRedirecting(true);
      
      // Small delay to ensure wallet state is fully updated
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, router, isRedirecting]);

  // Always assume wallets are available for better UX
  const hasWallet = true;

  return (
    <div className="flex flex-col items-center">
      {!isConnected ? (
        <>
          {hasMetaMask && hasCoinbaseWallet ? (
            <div className="flex flex-col space-y-2 w-full">
              <button
                onClick={handleConnectMetaMask}
                disabled={isConnecting}
                className={buttonClassName + ' bg-orange-500 hover:bg-orange-600'}
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
              <button
                onClick={handleConnectCoinbase}
                disabled={isConnecting}
                className={buttonClassName + ' bg-blue-500 hover:bg-blue-600'}
              >
                {isConnecting ? 'Connecting...' : 'Connect Coinbase Wallet'}
              </button>
            </div>
          ) : hasMetaMask ? (
            <button
              onClick={handleConnectMetaMask}
              disabled={isConnecting}
              className={buttonClassName + ' bg-orange-500 hover:bg-orange-600'}
            >
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          ) : hasCoinbaseWallet ? (
            <button
              onClick={handleConnectCoinbase}
              disabled={isConnecting}
              className={buttonClassName + ' bg-blue-500 hover:bg-blue-600'}
            >
              {isConnecting ? 'Connecting...' : 'Connect Coinbase Wallet'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={buttonClassName}
            >
              {isConnecting ? 'Connecting...' : buttonText}
            </button>
          )}
        </>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm mr-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.3622 2L13.3622 8.4L14.9622 4.56L21.3622 2Z" fill="#E17726"/>
                <path d="M2.63782 2L10.5378 8.46L9.03782 4.56L2.63782 2Z" fill="#E27625"/>
                <path d="M18.4378 16.86L16.2378 20.46L20.9378 21.84L22.3378 16.92L18.4378 16.86Z" fill="#E27625"/>
                <path d="M1.67782 16.92L3.05782 21.84L7.75782 20.46L5.55782 16.86L1.67782 16.92Z" fill="#E27625"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Redirecting to dashboard...
          </p>
          <div className="animate-pulse bg-blue-100 dark:bg-blue-900/30 h-1 w-full rounded-full">
            <div className="bg-blue-500 h-1 rounded-full w-1/2 animate-[progress_1s_ease-in-out_infinite]"></div>
          </div>
        </div>
      )}
    </div>
  );
}
