'use client';

import { base } from 'wagmi/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{ 
          appearance: { 
            mode: 'auto',
          }
        }}
      >
        {props.children}
      </OnchainKitProvider>
    </ThemeProvider>
  );
}

