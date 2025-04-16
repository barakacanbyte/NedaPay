/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This will completely ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  // This will transpile the problematic packages
  transpilePackages: ['wagmi', '@coinbase/onchainkit', 'viem'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
    };
    return config;
  },
};

module.exports = nextConfig;
