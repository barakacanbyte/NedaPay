'use client';

import { baseSepolia } from 'wagmi/chains';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainProvider, getDefaultConfig } from '@coinbase/onchainkit';

// Create a query client for React Query
const queryClient = new QueryClient();

// Get the default config from OnchainKit
const wagmiConfig = getDefaultConfig({
  appName: 'NEDA Pay',
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
          <OnchainProvider
            config={{
              chain: baseSepolia,
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

