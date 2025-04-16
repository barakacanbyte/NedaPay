'use client';

// No need to import wagmi chains directly
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainProvider } from '@coinbase/onchainkit';

// Create a query client for React Query
const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
    </ThemeProvider>
  );
}

