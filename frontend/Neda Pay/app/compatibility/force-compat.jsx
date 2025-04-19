
'use client';

import React from 'react';
import { createConfig } from 'wagmi';
import { http } from 'viem';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

// Define chains manually
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://sepolia.base.org'] }, public: { http: ['https://sepolia.base.org'] } },
  blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
  testnet: true,
};

// Create a minimal wagmi config
const minimalWagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({ appName: 'NEDA Pay' }),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});

// Create a minimal OnchainProvider that doesn't rely on external dependencies
export const OnchainProvider = ({ children }) => {
  return <>{children}</>;
};

// Create a minimal WagmiProvider that doesn't rely on external dependencies
export const WagmiProvider = ({ children }) => {
  return <>{children}</>;
};

// Export a WagmiConfig for compatibility
export const WagmiConfig = WagmiProvider;

// Export the config
export const wagmiConfig = minimalWagmiConfig;
