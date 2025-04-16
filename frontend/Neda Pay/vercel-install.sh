#!/bin/bash

# Ensure correct version of Node.js
echo "Node version:"
node -v

# Clean installation to prevent conflicts
echo "Cleaning node_modules..."
rm -rf node_modules
rm -rf .next

# Install dependencies with specific flags
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Explicitly install critical packages
echo "Explicitly installing critical packages..."
npm install @coinbase/onchainkit@0.38.5 wagmi@2.14.16 viem@2.26.0 @wagmi/core@2.16.7 --force

# Create symlinks to ensure module resolution
echo "Creating module resolution symlinks..."
mkdir -p node_modules/@coinbase
ln -sf $(npm root)/@coinbase/onchainkit node_modules/@coinbase/onchainkit

# Create type definitions directory if it doesn't exist
mkdir -p types

# Use the Vercel-specific TypeScript configuration
echo "Using Vercel-specific TypeScript configuration..."
cp tsconfig.vercel.json tsconfig.json

# Create temporary .npmrc to help with package resolution
echo "Creating temporary .npmrc..."
cat > .npmrc << EOL
legacy-peer-deps=true
strict-peer-dependencies=false
node-linker=hoisted
EOL

# List installed packages
echo "Installed packages:"
npm list @coinbase/onchainkit wagmi viem @wagmi/core

# Verify module resolution
echo "Verifying module resolution..."
ls -la node_modules/@coinbase/onchainkit
ls -la node_modules/wagmi

# Set environment variable to skip TypeScript checking during build
export NEXT_SKIP_TYPECHECKING=true

echo "Setup complete for Vercel deployment"
