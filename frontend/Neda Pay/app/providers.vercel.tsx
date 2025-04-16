'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Create a providers component with minimal dependencies for Vercel
// We're removing all wagmi-related code to avoid TypeScript errors
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
