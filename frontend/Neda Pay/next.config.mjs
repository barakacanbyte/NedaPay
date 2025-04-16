/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Improve module resolution for @coinbase/onchainkit
    config.resolve.alias = {
      ...config.resolve.alias,
      '@coinbase/onchainkit': require.resolve('@coinbase/onchainkit'),
    };
    
    return config;
  },
  // Transpile specific modules
  transpilePackages: ['@coinbase/onchainkit'],
};

export default nextConfig;
  