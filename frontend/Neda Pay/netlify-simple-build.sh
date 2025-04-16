#!/bin/bash
set -e

echo "🔧 Running simplified Netlify build script..."

# Install required dependencies
echo "📦 Installing required dependencies..."
npm install --save-dev crypto-browserify stream-browserify stream-http https-browserify browserify-zlib path-browserify os-browserify
npm install next-themes ethers

# Create a simple Next.js config for static export
cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['wagmi', '@coinbase/onchainkit', 'viem', 'next-themes', 'ethers'],
  webpack: (config) => {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.fallback) config.resolve.fallback = {};
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, net: false, tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      zlib: require.resolve('browserify-zlib'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
    };
    return config;
  }
};
EOL

echo "✅ Created simplified Next.js config"

# Run the build with all necessary environment variables
echo "🚀 Running Next.js build with static export..."
NEXT_TELEMETRY_DISABLED=1 \
NEXT_SKIP_TYPE_CHECK=true \
NEXT_SKIP_ESLINT=true \
NODE_OPTIONS="--max-old-space-size=8192" \
npx next build

echo "✅ Build completed successfully!"
