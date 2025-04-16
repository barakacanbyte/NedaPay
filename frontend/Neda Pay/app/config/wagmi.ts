'use client';

import { baseSepolia } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

// Export the chain for use in other parts of the application
export const defaultChain = baseSepolia;

// Create and export the wagmi config directly without a separate config object
export const wagmiConfig = createConfig({
  // Use as const to ensure the chains array is treated as a tuple
  chains: [baseSepolia] as const,
  connectors: [
    coinbaseWallet({
      appName: 'NEDA Pay',
    }),
    metaMask(),
  ] as const,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
});
