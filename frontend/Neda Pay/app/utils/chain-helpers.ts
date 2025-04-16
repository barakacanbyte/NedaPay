'use client';

// Base Sepolia chain ID in hex format
export const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532 in decimal: 84532
export const BASE_SEPOLIA_DECIMAL = 84532;

// Base Sepolia network configuration
export const baseSepolia = {
  id: BASE_SEPOLIA_DECIMAL,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
} as const;

// Helper function to detect wallet type
export function detectWalletType() {
  if (typeof window === 'undefined') return 'unknown';
  
  const provider = window.ethereum;
  if (!provider) return 'none';
  
  // Check for Coinbase Wallet
  if (provider.isCoinbaseWallet) return 'coinbase';
  
  // Check for MetaMask
  if (provider.isMetaMask) return 'metamask';
  
  // Check for other wallets
  return 'other';
}

// Helper function to check if ethereum provider is available
export function getEthereumProvider() {
  if (typeof window === 'undefined') return null;
  
  // Check for multiple possible ethereum providers
  const provider = window.ethereum || 
                  (window as any).web3?.currentProvider || 
                  (window as any).ethereum;
  
  if (!provider) {
    console.error('No Ethereum provider detected');
    return null;
  }
  
  return provider;
}

// Safe method to add Base Sepolia to wallet
export async function addBaseSepolia() {
  const provider = getEthereumProvider();
  if (!provider) throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
  
  try {
    // First check if the wallet supports adding chains
    if (typeof provider.request !== 'function') {
      console.warn('Wallet does not support adding chains via provider.request');
      return false;
    }
    
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BASE_SEPOLIA_CHAIN_ID,
        chainName: 'Base Sepolia',
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://sepolia.base.org'],
        blockExplorerUrls: ['https://sepolia.basescan.org'],
      }],
    });
    return true;
  } catch (error: any) {
    // If the method is not supported (like in Coinbase Wallet), don't treat as error
    if (error.message?.includes('not supported') || 
        error.message?.includes('wallet_addEthereumChain')) {
      console.warn('wallet_addEthereumChain not supported by this wallet');
      return false;
    }
    
    console.error('Error adding Base Sepolia to wallet:', error);
    throw error;
  }
}

// Safe method to switch to Base Sepolia
export async function switchToBaseSepolia() {
  const provider = getEthereumProvider();
  if (!provider) throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
  
  const walletType = detectWalletType();
  
  try {
    // First check if we're already on Base Sepolia
    try {
      const chainId = await getCurrentChainId();
      if (chainId === BASE_SEPOLIA_CHAIN_ID) {
        console.log('Already on Base Sepolia');
        return true;
      }
    } catch (e) {
      // Ignore errors when checking chain ID
    }
    
    // For Coinbase Wallet, we don't need to switch chains as it's handled by the Onchain Kit
    if (walletType === 'coinbase') {
      console.log('Coinbase Wallet detected, chain switching handled by Onchain Kit');
      return true;
    }
    
    // For other wallets, try to switch chains
    if (typeof provider.request === 'function') {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
      return true;
    } else {
      console.warn('wallet_switchEthereumChain not supported by this wallet');
      return false;
    }
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      return addBaseSepolia();
    }
    
    // If the method is not supported, don't treat as error
    if (error.message?.includes('not supported') || 
        error.message?.includes('wallet_switchEthereumChain')) {
      console.warn('wallet_switchEthereumChain not supported by this wallet');
      return false;
    }
    
    // If user rejected the request, throw the error
    if (error.code === 4001) {
      throw new Error('User rejected the request to switch networks');
    }
    
    console.error('Error switching to Base Sepolia:', error);
    throw error;
  }
}

// Helper to get current chain ID
export async function getCurrentChainId() {
  const provider = getEthereumProvider();
  if (!provider) return null;
  
  try {
    if (typeof provider.request === 'function') {
      return await provider.request({ method: 'eth_chainId' });
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
}
