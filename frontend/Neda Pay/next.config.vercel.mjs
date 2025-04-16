/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // !! WARN !!
    // Completely disabling TypeScript checking for Vercel deployments
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also disabling ESLint during build
    ignoreDuringBuilds: true,
  },
  // Silence warnings
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
    
    return config;
  },
  // Transpile specific modules
  transpilePackages: ['@coinbase/onchainkit', 'wagmi', '@wagmi/core', 'viem'],
};

export default nextConfig;
