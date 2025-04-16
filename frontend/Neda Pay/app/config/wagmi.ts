'use client';

// Import from our compatibility layer instead of wagmi/chains
import { baseSepolia, base } from '../compatibility/chains-compat';
import { createConfig } from 'wagmi';
import { http } from 'viem';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

// Export the chain for use in other parts of the application
export const defaultChain = baseSepolia;

// Create and export the wagmi config directly
// Avoid using a separate chains variable to prevent it from being exposed
export const wagmiConfig = createConfig({
  // Inline the chains array to avoid exposing it as a separate property
  chains: [baseSepolia, base] as const,
  connectors: [
    coinbaseWallet({
      appName: 'NEDA Pay',
    }),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    [base.id]: http('https://mainnet.base.org'),
  },
});
