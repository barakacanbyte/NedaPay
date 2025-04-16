'use client';

import React from 'react';
import { OnchainProvider as OriginalOnchainProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';

// This is a patched version of the OnchainProvider that works with our compatibility layer
export const OnchainProvider: React.FC<{ children: React.ReactNode; config?: any }> = ({ 
  children, 
  config = {} 
}) => {
  // Create a clean config without the chains property
  // Extract only the properties that OnchainProvider expects
  const patchedConfig = {
    appName: config.appName || 'NEDA Pay',
    // Use the wagmiConfig directly without exposing its internal structure
    wagmiConfig: config.wagmiConfig || wagmiConfig,
  };
  
  return <OriginalOnchainProvider config={patchedConfig}>{children}</OriginalOnchainProvider>;
};
