'use client';

import { BASE_SEPOLIA_CHAIN_ID } from './chain-helpers';
import { saveWalletState } from './global-wallet-state';

// Interface for wallet connection state
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  error: string | null;
}

// Direct wallet connection function for Coinbase Wallet
export async function connectCoinbaseWallet(): Promise<WalletState> {
  try {
    // Check if provider exists
    if (!window.ethereum) {
      console.error('No Ethereum provider found');
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'No wallet detected. Please install Coinbase Wallet.'
      };
    }
    
    // For Coinbase Wallet, we need to ensure we're using the correct provider
    // Try to detect if Coinbase Wallet is available
    let provider = window.ethereum;
    
    // If we have multiple providers (like with wallet extensions), try to find Coinbase
    if (window.ethereum.providers) {
      console.log('Multiple providers detected');
      const coinbaseProvider = window.ethereum.providers.find(
        (p: any) => p.isCoinbaseWallet || p.isCoinbase
      );
      
      if (coinbaseProvider) {
        provider = coinbaseProvider;
        console.log('Found Coinbase provider');
      } else {
        console.log('No specific Coinbase provider found, using default');
      }
    } else {
      console.log('Using single provider');
    }
    
    // Request accounts using the selected provider
    console.log('Requesting accounts from provider');
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    console.log('Accounts received:', accounts);
    
    if (!accounts || accounts.length === 0) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'No accounts returned from Coinbase Wallet.'
      };
    }

    // Get chain ID using the same provider
    console.log('Getting chain ID');
    const chainId = await provider.request({ method: 'eth_chainId' });
    console.log('Chain ID received:', chainId);
    const chainIdDecimal = parseInt(chainId, 16);

    // Save wallet state globally
    saveWalletState({
      address: accounts[0],
      isConnected: true,
      chainId: chainIdDecimal,
      error: null
    });

    return {
      address: accounts[0],
      isConnected: true,
      chainId: chainIdDecimal,
      error: null
    };
  } catch (error: any) {
    console.error('Error connecting to Coinbase Wallet:', error);
    return {
      address: null,
      isConnected: false,
      chainId: null,
      error: error.message || 'Failed to connect to Coinbase Wallet.'
    };
  }
}
