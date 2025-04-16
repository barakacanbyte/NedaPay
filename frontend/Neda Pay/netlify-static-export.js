// This file configures Next.js to export a static site for Netlify
/** @type {import('next').NextConfig} */
module.exports = {
  // Use static export for Netlify
  output: 'export',
  
  // Set the output directory
  distDir: 'out',
  
  // Disable image optimization which can cause issues on Netlify
  images: {
    unoptimized: true,
  },
  
  // Transpile necessary packages
  transpilePackages: ['wagmi', '@coinbase/onchainkit', 'viem', 'next-themes', 'ethers'],
  
  // Configure webpack for browser compatibility
  webpack: (config) => {
    // Ensure fallback object exists
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.fallback) config.resolve.fallback = {};
    
    // Add polyfills for browser compatibility
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
  
  // Disable TypeScript and ESLint checks during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
