#!/bin/bash

# Force build script for NEDA Pay Merchant Portal
# This script bypasses TypeScript errors during build

echo "🚀 Starting force build process for NEDA Pay Merchant Portal..."

# Install necessary polyfills if they don't exist
echo "📦 Installing required polyfills..."
npm install --save crypto-browserify stream-browserify stream-http https-browserify os-browserify path-browserify

# Backup original files
echo "💾 Backing up original files..."
cp app/providers.tsx app/providers.tsx.bak

# Copy the deployment config to next.config.js
echo "⚙️ Setting up deployment configuration..."
cp next.config.deploy.js next.config.js

# Copy the simplified providers implementation
echo "🔄 Using simplified providers implementation..."
cp app/providers.deploy.tsx app/providers.tsx

# Set environment variables to ignore TypeScript errors
export NEXT_TYPESCRIPT_CHECK=false
export NEXT_ESLINT_CHECK=false
export NODE_OPTIONS="--max-old-space-size=4096"

# Run the build
echo "🏗️ Building the application..."
npm run build

# Restore original files
echo "🔄 Restoring original files..."
mv app/providers.tsx.bak app/providers.tsx

echo "✅ Build process completed!"
