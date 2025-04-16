#!/bin/bash

# Ensure correct version of Node.js
echo "Node version:"
node -v

# Install dependencies with specific flags
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Explicitly install @coinbase/onchainkit
echo "Explicitly installing @coinbase/onchainkit..."
npm install @coinbase/onchainkit@0.38.5 --force

# Create a symlink to ensure module resolution
echo "Creating module resolution symlinks..."
mkdir -p node_modules/@coinbase
ln -sf $(npm root)/@coinbase/onchainkit node_modules/@coinbase/onchainkit

# Create type definitions directory if it doesn't exist
mkdir -p types

# List installed packages
echo "Installed packages:"
npm list @coinbase/onchainkit

# Verify module resolution
echo "Verifying module resolution..."
ls -la node_modules/@coinbase/onchainkit
