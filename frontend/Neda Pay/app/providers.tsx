'use client';

import { baseSepolia } from 'wagmi/chains';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for React Query
const queryClient = new QueryClient();

// Create a wagmi config
const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  },
});

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

