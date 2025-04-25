// scripts/deploy-smart-wallet-factory.js
const envPath = __dirname + '/../merchant-portal/.env';
console.log('Loading .env from:', envPath);
require('dotenv').config({ path: envPath });
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY);
console.log('BASE_MAINNET_RPC_URL:', process.env.BASE_MAINNET_RPC_URL);
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying from address:', deployer.address);

  const Factory = await ethers.getContractFactory('NedaPaySmartWalletFactory');
  // Use the canonical EntryPoint address for Base mainnet
  const entryPointAddress = '0x0576a174D229E3cFA37253523E645A78A0C91B57';
  const factory = await Factory.deploy(entryPointAddress);
  await factory.waitForDeployment();
  const deployedAddress = await factory.getAddress();
  console.log('NedaPaySmartWalletFactory deployed to:', deployedAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
