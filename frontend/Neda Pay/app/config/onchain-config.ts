'use client';

import { wagmiConfig } from './wagmi';

// Export a simple configuration object for Coinbase Onchain Kit
export const onchainConfig = {
  wagmiConfig,
  appName: 'NEDA Pay',
};

export default onchainConfig;
