'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { baseSepolia } from './utils/chain-helpers';
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors';

// Smart wallet factory address from memory
const SMART_WALLET_FACTORY_ADDRESS = '0x10dE41927cdD093dA160E562630e0efC19423869';
const PAYMASTER_ADDRESS = '0x7d9687c95831874926bbc9476844674D6B943464';

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create wagmi config with all supported wallet types
const config = createConfig({
  // Fix for Vercel deployment - use an array for chains
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: 'NEDA Pay',
    }),
    injected(),
  ],
});

// Create a providers component with proper nesting for Vercel
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
