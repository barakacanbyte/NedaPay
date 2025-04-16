'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainProvider } from '@coinbase/onchainkit';
// Import wagmi config from separate file to avoid TypeScript errors
import { wagmiConfig, defaultChain } from './config/wagmi';

// Create a query client for React Query
const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OnchainProvider
            config={{
              appearance: {
                name: "NEDA Pay",
                mode: "auto"
              }
            }}
          >
          {props.children}
          </OnchainProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

