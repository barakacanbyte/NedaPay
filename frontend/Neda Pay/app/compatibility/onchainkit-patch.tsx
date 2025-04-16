'use client';

import React from 'react';
import { OnchainProvider as OriginalOnchainProvider } from '@coinbase/onchainkit';
import { wagmiConfig } from '../config/wagmi';

// This is a patched version of the OnchainProvider that works with our compatibility layer
export const OnchainProvider: React.FC<{ children: React.ReactNode; config?: any }> = ({ 
  children, 
  config = {} 
}) => {
  // Ensure the config has the wagmiConfig property
  const patchedConfig = {
    ...config,
    wagmiConfig: config.wagmiConfig || wagmiConfig,
  };
  
  return <OriginalOnchainProvider config={patchedConfig}>{children}</OriginalOnchainProvider>;
};
