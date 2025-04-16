'use client';

// Keys for localStorage
const WALLET_ADDRESS_KEY = 'neda_wallet_address';
const WALLET_CONNECTED_KEY = 'neda_wallet_connected';
const WALLET_CHAIN_ID_KEY = 'neda_wallet_chain_id';
const WALLET_DISCONNECTED_KEY = 'wallet_disconnected';

// Interface for wallet state
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  error: string | null;
}

// Save wallet state to localStorage
export function saveWalletState(state: WalletState): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (state.isConnected && state.address) {
      localStorage.setItem(WALLET_ADDRESS_KEY, state.address);
      localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
      localStorage.removeItem(WALLET_DISCONNECTED_KEY);
      
      if (state.chainId) {
        localStorage.setItem(WALLET_CHAIN_ID_KEY, state.chainId.toString());
      }
    } else {
      // If disconnected, clear wallet state
      clearWalletState();
    }
  } catch (error) {
    console.error('Error saving wallet state to localStorage:', error);
  }
}

// Load wallet state from localStorage
export function loadWalletState(): WalletState {
  if (typeof window === 'undefined') {
    return {
      address: null,
      isConnected: false,
      chainId: null,
      error: null
    };
  }
  
  try {
    // Check if explicitly disconnected
    if (localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: null
      };
    }
    
    const isConnected = localStorage.getItem(WALLET_CONNECTED_KEY) === 'true';
    const address = localStorage.getItem(WALLET_ADDRESS_KEY);
    const chainIdStr = localStorage.getItem(WALLET_CHAIN_ID_KEY);
    const chainId = chainIdStr ? parseInt(chainIdStr, 10) : null;
    
    if (isConnected && address) {
      return {
        address,
        isConnected: true,
        chainId,
        error: null
      };
    }
  } catch (error) {
    console.error('Error loading wallet state from localStorage:', error);
  }
  
  return {
    address: null,
    isConnected: false,
    chainId: null,
    error: null
  };
}

// Clear wallet state from localStorage
export function clearWalletState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(WALLET_ADDRESS_KEY);
    localStorage.removeItem(WALLET_CONNECTED_KEY);
    localStorage.removeItem(WALLET_CHAIN_ID_KEY);
    localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
  } catch (error) {
    console.error('Error clearing wallet state from localStorage:', error);
  }
}

// Check if wallet is connected
export function isWalletConnected(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if explicitly disconnected
    if (localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') {
      return false;
    }
    
    return localStorage.getItem(WALLET_CONNECTED_KEY) === 'true' && 
           !!localStorage.getItem(WALLET_ADDRESS_KEY);
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
}
