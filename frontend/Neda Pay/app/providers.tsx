'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import from our compatibility layers
import { WagmiProvider } from './compatibility/wagmi-compat';
import { OnchainProvider } from './compatibility/onchainkit-patch';
import { wagmiConfig } from './config/wagmi';
import onchainConfig from './config/onchain-config';

// Create a query client for React Query
const queryClient = new QueryClient();

// Create a providers component that integrates both wagmi and Coinbase Onchain Kit
export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OnchainProvider config={onchainConfig}>
            {props.children}
          </OnchainProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
