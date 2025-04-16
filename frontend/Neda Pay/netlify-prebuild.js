// This script ensures all required dependencies are available before build
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Running Netlify pre-build checks...');

// Check if package.json exists
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found!');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// List of required dependencies
const requiredDeps = [
  'crypto-browserify',
  'stream-browserify',
  'stream-http',
  'https-browserify',
  'browserify-zlib',
  'path-browserify',
  'os-browserify',
  'next-themes',
  'ethers'
];

// Check if dependencies are in package.json
const missingDeps = [];
requiredDeps.forEach(dep => {
  if (
    (!packageJson.dependencies || !packageJson.dependencies[dep]) &&
    (!packageJson.devDependencies || !packageJson.devDependencies[dep])
  ) {
    missingDeps.push(dep);
  }
});

// Install missing dependencies
if (missingDeps.length > 0) {
  console.log(`📦 Installing missing dependencies: ${missingDeps.join(', ')}`);
  try {
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    process.exit(1);
  }
} else {
  console.log('✅ All required dependencies are already installed');
}

// Create a special next.config.js for Netlify
console.log('📝 Creating Netlify-compatible Next.js configuration...');
try {
  const netlifyConfig = fs.readFileSync(path.join(__dirname, 'netlify-static-export.js'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'next.config.js'), netlifyConfig);
  console.log('✅ Created next.config.js for Netlify');
} catch (error) {
  console.error('❌ Failed to create next.config.js:', error);
  process.exit(1);
}

console.log('✅ Pre-build checks completed successfully');
