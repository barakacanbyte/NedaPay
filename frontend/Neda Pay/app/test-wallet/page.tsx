'use client';

import { useState, useEffect } from 'react';
import { createConfig, WagmiProvider } from 'wagmi';
import { useConnect, useAccount, useDisconnect, useSwitchNetwork } from 'wagmi/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

// Define the Base Sepolia chain with proper parameters for wallet recognition
const baseSepolia = {
  id: 84532,
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
};

// Create wagmi config with proper chain configuration
const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'NEDA Pay',
      chainId: 84532, // Explicitly set the chainId for Coinbase Wallet
    }),
    metaMask({
      chains: [baseSepolia], // Explicitly provide chains to MetaMask
    }),
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});

// Create a query client
const queryClient = new QueryClient();

// Helper function to add Base Sepolia to MetaMask
async function addBaseSepolia() {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x14a34', // 84532 in hex
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
  } catch (error) {
    console.error('Error adding Base Sepolia to MetaMask:', error);
    return false;
  }
}

// Wallet Connection Component
function WalletConnection() {
  const { connect, connectors, isPending, error } = useConnect();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingChain, setIsAddingChain] = useState(false);

  // Display any connection errors
  useEffect(() => {
    if (error) {
      console.error('Connection error:', error);
      
      // Check if the error is about unrecognized chain ID
      if (error.message?.includes('Unrecognized chain ID')) {
        setErrorMessage('Base Sepolia chain not recognized. Click "Add Base Sepolia" button below.');
      } else {
        setErrorMessage(error.message || 'Failed to connect wallet');
      }
    } else {
      setErrorMessage(null);
    }
  }, [error]);

  // Handle adding Base Sepolia to MetaMask
  const handleAddBaseSepolia = async () => {
    setIsAddingChain(true);
    try {
      const success = await addBaseSepolia();
      if (success) {
        setErrorMessage('Base Sepolia added successfully. Try connecting again.');
      } else {
        setErrorMessage('Failed to add Base Sepolia. Please try manually adding the network.');
      }
    } catch (error) {
      console.error('Error adding chain:', error);
      setErrorMessage('Error adding Base Sepolia. Please try manually adding the network.');
    } finally {
      setIsAddingChain(false);
    }
  };

  // Handle connecting to wallet with proper chain
  const handleConnect = async (connector) => {
    console.log('Connecting with:', connector.name);
    try {
      await connect({ connector });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Wallet Connection Test</h1>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <p>{errorMessage}</p>
          
          {errorMessage.includes('Base Sepolia') && (
            <button
              onClick={handleAddBaseSepolia}
              disabled={isAddingChain}
              className="mt-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              {isAddingChain ? 'Adding Base Sepolia...' : 'Add Base Sepolia to MetaMask'}
            </button>
          )}
        </div>
      )}
      
      {isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 text-green-700 rounded-lg">
            <p className="font-medium">Connected!</p>
            <p className="text-sm break-all">Address: {address}</p>
            <p className="text-sm">Chain ID: {chainId}</p>
          </div>
          
          {chainId !== 84532 && (
            <button
              onClick={() => switchChain({ chainId: 84532 })}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Switch to Base Sepolia
            </button>
          )}
          
          <button
            onClick={() => disconnect()}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Select a wallet to connect:
          </p>
          
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>
                {connector.name === 'Coinbase Wallet' ? 'Connect Coinbase Wallet' : 'Connect MetaMask'}
              </span>
              {isPending && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <p>This is a minimal test page for wallet connection.</p>
        <p>Check the console for detailed error messages.</p>
      </div>
    </div>
  );
}

// Page component with providers
export default function TestWalletPage() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletConnection />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
