'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for React Query
const queryClient = new QueryClient();

// Create a simple providers component without any wagmi dependencies
export function Providers(props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
