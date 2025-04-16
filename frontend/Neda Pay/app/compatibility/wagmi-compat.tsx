'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '../config/wagmi';

// This is a compatibility layer that provides both WagmiProvider and WagmiConfig
// to ensure compatibility with both wagmi v2 and any libraries expecting WagmiConfig

// Create a WagmiConfig component that internally uses WagmiProvider
export const WagmiConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};

// Export the WagmiProvider directly for use in our app
export { WagmiProvider };

// Export the wagmiConfig for use in other parts of the app
export { wagmiConfig };
