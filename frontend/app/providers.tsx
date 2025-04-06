'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { WagmiConfig, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

const { wallets } = getDefaultWallets({
  appName: 'NEDA Pay',
  projectId: 'neda-pay', // You'll need to replace this with your actual project ID
  chains: [baseSepolia, base]
});

const connectors = connectorsForWallets([
  ...wallets,
]);

const wagmiConfig = createConfig({
  connectors,
  persister: null,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider 
            chains={[baseSepolia, base]} 
            theme={{
              lightMode: lightTheme({
                accentColor: '#3b82f6', // Blue accent color
                accentColorForeground: 'white',
                borderRadius: 'medium',
                fontStack: 'system',
              }),
              darkMode: darkTheme({
                accentColor: '#3b82f6', // Blue accent color
                accentColorForeground: 'white',
                borderRadius: 'medium',
                fontStack: 'system',
              }),
            }}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ThemeProvider>
  );
}
