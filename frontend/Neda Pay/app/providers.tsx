'use client';

import { base } from 'wagmi/chains';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for React Query
const queryClient = new QueryClient();

// Configure wagmi with all supported wallet connectors
const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'NEDA Pay',
    }),
    metaMask()
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
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

