'use client';

import { wagmiConfig } from './wagmi';

// Export a simple configuration object for Coinbase Onchain Kit
// Only include properties that are explicitly supported by OnchainProvider
export const onchainConfig = {
  // Pass the wagmiConfig as a reference without exposing its internal structure
  wagmiConfig,
  // Set the app name for Coinbase Onchain Kit
  appName: 'NEDA Pay',
};

export default onchainConfig;
