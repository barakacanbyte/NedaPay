import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
    };

    // Improve module resolution for both @coinbase/onchainkit and wagmi
    config.resolve.alias = {
      ...config.resolve.alias,
      '@coinbase/onchainkit': path.join(__dirname, 'node_modules/@coinbase/onchainkit'),
      'wagmi': path.join(__dirname, 'node_modules/wagmi'),
    };
    
    // Ensure proper handling of ESM modules
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.m?js$/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    };
    
    return config;
  },
  // Transpile specific modules
  transpilePackages: ['@coinbase/onchainkit', 'wagmi', '@wagmi/core', 'viem'],
};

export default nextConfig;