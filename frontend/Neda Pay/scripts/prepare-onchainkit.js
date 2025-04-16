const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist');
const VENDOR_DIR = path.join(__dirname, '../vendor');

// Clean up existing vendor directory
if (fs.existsSync(VENDOR_DIR)) {
  execSync(`rm -rf ${VENDOR_DIR}`);
}

// Create vendor directory structure
fs.mkdirSync(VENDOR_DIR, { recursive: true });

// Download and prepare OnchainKit
console.log('Preparing @coinbase/onchainkit...');
execSync('npm pack @coinbase/onchainkit', { stdio: 'inherit' });

// Move the package to vendor directory
const packageFile = fs.readdirSync('.').find(file => file.startsWith('coinbase-onchainkit'));
if (packageFile) {
  fs.renameSync(packageFile, path.join(VENDOR_DIR, packageFile));
  console.log('OnchainKit package prepared successfully');
} else {
  console.error('Failed to find OnchainKit package file');
  process.exit(1);
}

// Update package.json to use local package
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

// Save original dependencies
const originalDependencies = { ...packageJson.dependencies };

// Update dependencies to use local package
packageJson.dependencies['@coinbase/onchainkit'] = `file:${path.join(VENDOR_DIR, packageFile)}`;

// Save modified package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Package resolution setup complete');
