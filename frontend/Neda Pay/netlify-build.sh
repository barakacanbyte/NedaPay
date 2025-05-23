#!/bin/bash
set -e

echo "🔧 Running Netlify build with TypeScript checking disabled..."

# Install required dependencies for node polyfills and missing packages
npm install --save-dev crypto-browserify stream-browserify stream-http https-browserify browserify-zlib path-browserify os-browserify
npm install next-themes ethers

echo "✅ Installed next-themes and ethers packages"

# Import environment variables from netlify-env.js
echo "📥 Importing environment variables from netlify-env.js"
node netlify-import-env.js

# Set environment variables to disable all checks
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_SKIP_TYPE_CHECK=true
export NEXT_SKIP_ESLINT=true
export TYPESCRIPT_SKIP_CHECKING=true

# Copy our special next.config
cp netlify.config.js next.config.js
echo "✅ Using special Next.js configuration for Netlify"

# Create a special window.ethereum declaration file
mkdir -p types
cat > types/window.d.ts << 'EOL'
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
    selectedAddress?: string;
    chainId?: string;
    isConnected: () => boolean;
  };
}
EOL

# Run the build with all type checking disabled
echo "🚀 Running Next.js build..."
NEXT_SKIP_TYPE_CHECK=true NEXT_SKIP_ESLINT=true next build

echo "✅ Build completed successfully!"
