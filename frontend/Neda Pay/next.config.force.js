
module.exports = {
  typescript: {
    // !! WARN !!
    // Completely disables TypeScript type checking
    ignoreBuildErrors: true,
  },
  eslint: {
    // Completely disables ESLint during builds
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['wagmi', '@coinbase/onchainkit'],
  webpack: (config) => {
    // Add fallbacks for node.js core modules
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
