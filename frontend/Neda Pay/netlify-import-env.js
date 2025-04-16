#!/usr/bin/env node

// This script imports environment variables from netlify-env.js and sets them
// Useful for importing all variables at once during Netlify deployment

const fs = require('fs');
const path = require('path');
const envVars = require('./netlify-env.js');

// Create a .env file with all variables
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write to .env file
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

console.log('✅ Environment variables imported successfully from netlify-env.js');

// Also set them in the current process
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
  console.log(`Set ${key}`);
});

console.log('✅ All environment variables are now set in the current process');
