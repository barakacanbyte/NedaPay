'use client';

import { BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_DECIMAL } from './chain-helpers';
import { saveWalletState, clearWalletState, loadWalletState } from './global-wallet-state';

// Interface for wallet connection state
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  error: string | null;
}

// Direct wallet connection function for MetaMask
export async function connectMetaMask(): Promise<WalletState> {
  try {
    // Check if provider exists
    if (!window.ethereum) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'No wallet detected. Please install MetaMask or Coinbase Wallet.'
      };
    }
    
    // More permissive detection for MetaMask
    // Some wallet providers might not set isMetaMask flag correctly
    const isMetaMaskLike = window.ethereum.isMetaMask || 
                          (typeof window.ethereum.request === 'function');
                          
    if (!isMetaMaskLike) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'Compatible wallet not detected. Please use MetaMask or Coinbase Wallet.'
      };
    }

    // Try to switch to Base Sepolia
    // Try to get the current chain ID first
    let currentChainId;
    try {
      currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    } catch (error) {
      console.error('Error getting chain ID:', error);
      // Continue anyway, we'll try to switch
    }
    
    // If already on Base Sepolia, no need to switch
    if (currentChainId === BASE_SEPOLIA_CHAIN_ID) {
      console.log('Already on Base Sepolia');
    } else {
      // Try to switch to Base Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
        });
      } catch (switchError: any) {
        console.error('Switch chain error:', switchError);
        
        // If chain not added yet
        if (switchError.code === 4902 || 
            switchError.message?.includes('Unrecognized chain ID') || 
            switchError.message?.includes('chain ID') ||
            switchError.message?.includes('network')) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: BASE_SEPOLIA_CHAIN_ID,
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          } catch (addError) {
            console.error('Add chain error:', addError);
            // Continue anyway, we'll try to get accounts
          }
        }
        // Continue anyway, the user might have rejected the switch but we can still connect
      }
    }

    // Request accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'No accounts returned from MetaMask.'
      };
    }

    // Get chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
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
    console.error('Error connecting to MetaMask:', error);
    return {
      address: null,
      isConnected: false,
      chainId: null,
      error: error.message || 'Failed to connect to MetaMask.'
    };
  }
}

// Direct wallet connection function for Coinbase Wallet
export async function connectCoinbaseWallet(): Promise<WalletState> {
  try {
    // Check if provider exists
    if (!window.ethereum) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'No wallet detected. Please install MetaMask or Coinbase Wallet.'
      };
    }
    
    // For Coinbase Wallet, we need to ensure we're using the correct provider
    // Try to detect if Coinbase Wallet is available
    let provider = window.ethereum;
    
    // If we have multiple providers (like with wallet extensions), try to find Coinbase
    if (window.ethereum.providers) {
      const coinbaseProvider = window.ethereum.providers.find(
        (p: any) => p.isCoinbaseWallet || p.isCoinbase
      );
      
      if (coinbaseProvider) {
        provider = coinbaseProvider;
        console.log('Found Coinbase provider');
      }
    }
    
    // Request accounts using the selected provider
    console.log('Requesting accounts from provider:', provider);
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      return {
        address: null,
        isConnected: false,
        chainId: null,
        error: 'No accounts returned from Coinbase Wallet.'
      };
    }

    // Get chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
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

// Disconnect wallet function
export async function disconnectWallet(): Promise<void> {
  // Clear global wallet state
  clearWalletState();
  
  // Clear any additional wallet connection cache
  try {
    if (window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('wagmi') || 
          key.includes('coinbase') ||
          key.includes('ethereum') ||
          key.includes('metamask')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (e) {
    console.error('Error clearing localStorage:', e);
  }
}

// Setup event listeners for wallet events
export function setupWalletEventListeners(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
): () => void {
  if (typeof window === 'undefined' || !window.ethereum) return () => {};

  // Add event listeners
  window.ethereum.on('accountsChanged', onAccountsChanged);
  window.ethereum.on('chainChanged', onChainChanged);

  // Return cleanup function
  return () => {
    window.ethereum?.removeListener('accountsChanged', onAccountsChanged);
    window.ethereum?.removeListener('chainChanged', onChainChanged);
  };
}

// Check wallet connection on page load
export async function checkWalletConnection(): Promise<WalletState> {
  try {
    // Load wallet state from localStorage
    const savedState = loadWalletState();
    
    // If we have a saved connected state, verify it with the provider
    if (savedState.isConnected && savedState.address) {
      // Check if there's an Ethereum provider
      if (!window.ethereum) {
        clearWalletState();
        return {
          address: null,
          isConnected: false,
          chainId: null,
          error: null
        };
      }

      try {
        // Verify the connection with the provider
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          // Get chain ID
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdDecimal = parseInt(chainId, 16);
          
          // Update saved state with current chain ID
          savedState.chainId = chainIdDecimal;
          saveWalletState(savedState);
          
          return savedState;
        } else {
          // If no accounts, clear the state
          clearWalletState();
        }
      } catch (error) {
        console.error('Error verifying wallet connection:', error);
        // On error, clear the state
        clearWalletState();
      }
    }
    
    // Return disconnected state
    return {
      address: null,
      isConnected: false,
      chainId: null,
      error: null
    };
  } catch (error: any) {
    console.error('Error checking wallet connection:', error);
    return {
      address: null,
      isConnected: false,
      chainId: null,
      error: null
    };
  }
}
