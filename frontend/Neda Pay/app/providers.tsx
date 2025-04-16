'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for React Query
const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

