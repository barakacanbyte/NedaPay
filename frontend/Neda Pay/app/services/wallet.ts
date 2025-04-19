// Wallet service to handle all wallet interactions
// This provides a consistent interface for wallet operations across the app

// Define the Ethereum provider interface
interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

// Define the Ethereum window interface
interface EthereumWindow extends Window {
  ethereum?: EthereumProvider & {
    providers?: EthereumProvider[];
  };
}

// Get the Ethereum provider
export const getEthereumProvider = (): EthereumProvider | null => {
  if (typeof window !== 'undefined') {
    const ethereum = (window as EthereumWindow).ethereum;
    
    // Check if we have multiple providers (like with MetaMask + Coinbase Wallet)
    if (ethereum && ethereum.providers) {
      // Return the first provider as a fallback
      return ethereum.providers[0];
    }
    
    return ethereum || null;
  }
  return null;
};

// Get MetaMask provider specifically
const getMetaMaskProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as EthereumWindow).ethereum;
  if (!ethereum) return null;
  
  // If we have multiple providers, find MetaMask
  if (ethereum.providers && ethereum.providers.length > 0) {
    return ethereum.providers.find(p => p.isMetaMask) || null;
  }
  
  // Check if the single provider is MetaMask
  return ethereum.isMetaMask ? ethereum : null;
};

// Get Coinbase Wallet provider specifically
const getCoinbaseWalletProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;
  
  const ethereum = (window as EthereumWindow).ethereum;
  if (!ethereum) return null;
  
  // If we have multiple providers, find Coinbase Wallet
  if (ethereum.providers && ethereum.providers.length > 0) {
    return ethereum.providers.find(p => p.isCoinbaseWallet) || null;
  }
  
  // Check if the single provider is Coinbase Wallet
  return ethereum.isCoinbaseWallet ? ethereum : null;
};

// Check if MetaMask is installed - super simplified approach
export const isMetaMaskInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_FORCE_WALLET_DETECTION === 'true') {
    return true;
  }
  
  // Direct check for MetaMask in window.ethereum
  return typeof window !== 'undefined' && 
    !!(window as any).ethereum && 
    !!((window as any).ethereum.isMetaMask);
};

// Check if Coinbase Wallet is installed - super simplified approach
export const isCoinbaseWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_FORCE_WALLET_DETECTION === 'true') {
    return true;
  }
  
  // Direct check for Coinbase in window.ethereum
  return typeof window !== 'undefined' && 
    !!(window as any).ethereum && 
    !!((window as any).ethereum.isCoinbaseWallet);
};

// Connect to wallet - super simplified approach
export const connectWallet = async (preferredWallet?: 'metamask' | 'coinbase'): Promise<string | null> => {
  try {
    if (typeof window === 'undefined') return null;
    
    // Direct access to window.ethereum
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.error('Ethereum provider not found');
      alert('No Ethereum wallet found. Please install MetaMask or Coinbase Wallet!');
      return null;
    }

    console.log('Requesting accounts...');
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      console.error('No accounts returned from wallet');
      return null;
    }

    const address = accounts[0];
    console.log('Connected to wallet:', address);
    
    // Store connection info in localStorage
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', address);
    
    // Set a cookie for the middleware to check
    document.cookie = 'wallet_connected=true; path=/; max-age=86400'; // 24 hours
    
    // Get chain ID
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    localStorage.setItem('walletChainId', parseInt(chainIdHex, 16).toString());
    
    return address;
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    
    // Handle user rejection
    if (error.code === 4001) {
      // User rejected the request
      console.log('User rejected the connection request');
    } else {
      // Other errors
      console.error('Failed to connect to wallet:', error.message || 'Unknown error');
    }
    
    return null;
  }
};

// Check if wallet is connected
export const checkWalletConnection = async (): Promise<string | null> => {
  try {
    // First check localStorage for a stored connection
    const storedConnection = localStorage.getItem('walletConnected');
    const storedAddress = localStorage.getItem('walletAddress');
    
    if (storedConnection !== 'true' || !storedAddress) {
      return null;
    }
    
    // Try to get any available provider
    const provider = getMetaMaskProvider() || getCoinbaseWalletProvider();
    if (!provider) {
      console.error('Ethereum provider not found');
      return null;
    }

    // Use eth_accounts which doesn't trigger a popup
    const accounts = await provider.request({ method: 'eth_accounts' });
    
    if (accounts && accounts.length > 0) {
      console.log('Already connected to wallet:', accounts[0]);
      return accounts[0];
    }
    
    // If we get here, the wallet is no longer connected even though localStorage says it is
    // Clear localStorage to reflect the current state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    document.cookie = 'wallet_connected=; path=/; max-age=0';
    
    console.log('No connected accounts found');
    return null;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return null;
  }
};

// Disconnect wallet
export const disconnectWallet = (): void => {
  // Clear localStorage
  localStorage.removeItem('walletConnected');
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('walletChainId');
  
  // Clear cookies
  document.cookie = 'wallet_connected=; path=/; max-age=0';
  
  // Clear any smart wallet data
  const allKeys = Object.keys(localStorage);
  const smartWalletKeys = allKeys.filter(key => key.startsWith('smartWallet_'));
  smartWalletKeys.forEach(key => localStorage.removeItem(key));
  
  console.log('Wallet disconnected');
};

// Get current chain ID - simplified approach
export const getChainId = async (): Promise<number> => {
  try {
    if (typeof window === 'undefined') return 0;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return 0;
    
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return 0;
  }
};

// Switch to a different network - simplified approach
export const switchNetwork = async (chainId: number): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // Add the network
        // This is just a placeholder - you would need to add the actual network details
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: 'Network Name',
                nativeCurrency: {
                  name: 'Native Token',
                  symbol: 'TOKEN',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-url.example'],
                blockExplorerUrls: ['https://explorer.example'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      return false;
    }
  } catch (error) {
    console.error('Error in switchNetwork:', error);
    return false;
  }
};

// Get wallet balance
export const getBalance = async (address: string): Promise<string> => {
  try {
    const ethereum = getEthereumProvider();
    if (!ethereum) throw new Error('Ethereum provider not found');
    
    const balanceHex = await ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    
    return balanceHex;
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0x0';
  }
};

// Setup wallet event listeners
export const setupWalletListeners = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: number) => void
) => {
  // Try to get the provider from MetaMask or Coinbase
  const provider = getMetaMaskProvider() || getCoinbaseWalletProvider();
  if (!provider) return () => {};
  
  const handleAccountsChanged = (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      // User has disconnected their wallet
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletChainId');
      
      // Clear the cookie
      document.cookie = 'wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    onAccountsChanged(accounts);
  };
  
  const handleChainChanged = (chainIdHex: string) => {
    console.log('Chain changed:', chainIdHex);
    const chainId = parseInt(chainIdHex, 16);
    localStorage.setItem('walletChainId', chainId.toString());
    onChainChanged(chainId);
  };
  
  provider.on('accountsChanged', handleAccountsChanged);
  provider.on('chainChanged', handleChainChanged);
  
  // Return a cleanup function
  return () => {
    provider.removeListener('accountsChanged', handleAccountsChanged);
    provider.removeListener('chainChanged', handleChainChanged);
  };
};

// Sign a message with the connected wallet
export const signMessage = async (address: string, message: string): Promise<string | null> => {
  try {
    const provider = getMetaMaskProvider() || getCoinbaseWalletProvider();
    if (!provider) return null;
    
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address]
    });
    
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    return null;
  }
};

// Create a smart wallet (simulated)
export const createSmartWallet = async (address: string): Promise<string | null> => {
  try {
    if (!address) return null;
    
    // Simulate smart wallet creation with a 2-second delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a derived address to simulate a smart wallet
    const simulatedSmartWallet = `0x${address.substring(2, 6)}5${address.substring(7, 42)}`;
    
    // Store in local storage for future use
    localStorage.setItem(`smartWallet_${address}`, JSON.stringify({
      address: simulatedSmartWallet,
      createdAt: new Date().toISOString()
    }));
    
    return simulatedSmartWallet;
  } catch (error) {
    console.error('Error creating smart wallet:', error);
    return null;
  }
};

// Get smart wallet for an address
export const getSmartWallet = (address: string): string | null => {
  if (!address) return null;
  
  const storedSmartWallet = localStorage.getItem(`smartWallet_${address}`);
  if (!storedSmartWallet) return null;
  
  try {
    const parsed = JSON.parse(storedSmartWallet);
    return parsed.address;
  } catch (e) {
    console.error('Error parsing stored smart wallet:', e);
    return null;
  }
};
