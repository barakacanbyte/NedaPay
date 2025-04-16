'use client';

import { useState, useEffect } from 'react';
import { addBaseSepolia } from '../utils/chain-helpers';
import { connectMetaMask, disconnectWallet, checkWalletConnection, setupWalletEventListeners, WalletState } from '../utils/wallet-connect';
import { connectCoinbaseWallet } from '../utils/coinbase-wallet';

export default function MinimalTest() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    error: null
  });
  
  // Check wallet connection on page load
  useEffect(() => {
    const checkConnection = async () => {
      const state = await checkWalletConnection();
      setWalletState(state);
    };
    
    checkConnection();
  }, []);
  
  // Setup wallet event listeners
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setWalletState({
          address: null,
          isConnected: false,
          chainId: null,
          error: null
        });
        localStorage.setItem('wallet_disconnected', 'true');
      } else {
        // User switched accounts
        setWalletState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true
        }));
        localStorage.removeItem('wallet_disconnected');
      }
    };
    
    const handleChainChanged = (chainId: string) => {
      setWalletState(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16)
      }));
      // Reload the page as recommended by MetaMask
      window.location.reload();
    };
    
    const cleanup = setupWalletEventListeners(handleAccountsChanged, handleChainChanged);
    return cleanup;
  }, []);
  
  // Function to handle wallet connection with MetaMask
  const handleConnectMetaMask = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    
    try {
      const result = await connectMetaMask();
      setWalletState(result);
      
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      setErrorMessage(error.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to handle wallet connection with Coinbase Wallet
  const handleConnectCoinbase = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    
    try {
      const result = await connectCoinbaseWallet();
      setWalletState(result);
      
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (error: any) {
      console.error('Error connecting to Coinbase Wallet:', error);
      setErrorMessage(error.message || 'Failed to connect to Coinbase Wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setWalletState({
        address: null,
        isConnected: false,
        chainId: null,
        error: null
      });
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      setErrorMessage(error.message || 'Failed to disconnect wallet');
    }
  };

  // Function to add Base Sepolia to MetaMask
  const handleAddBaseSepolia = async () => {
    try {
      await addBaseSepolia();
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Error adding Base Sepolia to MetaMask', error);
      setErrorMessage(error.message || 'Failed to add Base Sepolia to MetaMask');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Wallet Connection Test</h1>
        
        {errorMessage && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {errorMessage}
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Connection Status</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="mb-2"><span className="font-bold">Status:</span> {walletState.isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
            {walletState.address && <p className="mb-2"><span className="font-bold">Address:</span> {walletState.address}</p>}
            {walletState.chainId && <p><span className="font-bold">Network:</span> {walletState.chainId === 84532 ? 'Base Sepolia' : `Chain ID: ${walletState.chainId}`}</p>}
          </div>
          
          <div className="flex flex-col space-y-4">
            {!walletState.isConnected ? (
              <>
                <button 
                  onClick={handleConnectMetaMask}
                  disabled={isConnecting}
                  className="py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
                </button>
                
                <button 
                  onClick={handleConnectCoinbase}
                  disabled={isConnecting}
                  className="py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect with Coinbase Wallet'}
                </button>
                
                <button 
                  onClick={handleAddBaseSepolia}
                  className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors mt-2"
                >
                  Add Base Sepolia to MetaMask
                </button>
              </>
            ) : (
              <button 
                onClick={handleDisconnect}
                className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-sm">
          <p>This is a minimal test page for wallet connection using Coinbase OnchainKit.</p>
          <p>Use the buttons above to test connecting and disconnecting your wallet.</p>
        </div>
      </div>
    </main>
  );
}
