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

# List installed packages
echo "Installed packages:"
npm list @coinbase/onchainkit
