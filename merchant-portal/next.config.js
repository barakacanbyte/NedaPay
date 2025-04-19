/** @type {import('next').NextConfig} */
const nextConfig = {
  // Completely ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure optimal compatibility with Netlify
  swcMinify: false, // Disable SWC minification to prevent syntax errors
  // Configure webpack with necessary polyfills
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
      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer'),
    };
    return config;
  },
  // Transpile problematic packages
  transpilePackages: [
    'wagmi', 
    '@coinbase/onchainkit', 
    'viem', 
    'next-themes',
    'ethers'
  ],
  // Temporarily disable strict mode to help with deployment
  reactStrictMode: false,
  // Ensure proper handling of SVG and other static assets
  images: {
    domains: ['nedapay.com'],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
