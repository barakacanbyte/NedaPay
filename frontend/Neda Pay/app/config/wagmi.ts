'use client';

import { baseSepolia } from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { http } from 'viem';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

// Export the chain for use in other parts of the application
export const defaultChain = baseSepolia;

// Define chains array with proper type annotation
const chains = [baseSepolia] as const;

// Create and export the wagmi config directly
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    coinbaseWallet({
      appName: 'NEDA Pay',
    }),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
});
