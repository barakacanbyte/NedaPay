// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");

async function main() {
  console.log("Deploying NEDA Pay contracts to", network.name);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy EntryPoint (or use existing one on Base)
  // Base Sepolia EntryPoint address: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  console.log("Using EntryPoint at:", entryPointAddress);
  
  // Deploy TSHC token
  console.log("Deploying TSHC token...");
  const TSHC = await ethers.getContractFactory("TSHC");
  const tshc = await TSHC.deploy(deployer.address);
  await tshc.waitForDeployment();
  const tshcAddress = await tshc.getAddress();
  console.log("TSHC deployed to:", tshcAddress);
  
  // Deploy NedaPaySmartWalletFactory
  console.log("Deploying NedaPaySmartWalletFactory...");
  const NedaPaySmartWalletFactory = await ethers.getContractFactory("NedaPaySmartWalletFactory");
  const walletFactory = await NedaPaySmartWalletFactory.deploy(entryPointAddress);
  await walletFactory.waitForDeployment();
  const walletFactoryAddress = await walletFactory.getAddress();
  console.log("NedaPaySmartWalletFactory deployed to:", walletFactoryAddress);
  
  // Deploy NedaPaymaster
  console.log("Deploying NedaPaymaster...");
  // Set exchange rate: 1 TSHC = 0.0001 ETH (in wei)
  const exchangeRate = ethers.parseEther("0.0001");
  const NedaPaymaster = await ethers.getContractFactory("NedaPaymaster");
  const paymaster = await NedaPaymaster.deploy(entryPointAddress, tshcAddress, exchangeRate);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("NedaPaymaster deployed to:", paymasterAddress);
  
  // Fund the paymaster with ETH for gas
  console.log("Funding paymaster with ETH...");
  const fundTx = await deployer.sendTransaction({
    to: paymasterAddress,
    value: ethers.parseEther("0.1"), // Fund with 0.1 ETH
  });
  await fundTx.wait();
  console.log("Paymaster funded with 0.1 ETH");
  
  // Stake the paymaster in the EntryPoint
  console.log("Staking paymaster in EntryPoint...");
  const stakeTx = await paymaster.deposit({ value: ethers.parseEther("0.05") });
  await stakeTx.wait();
  console.log("Paymaster staked in EntryPoint");
  
  console.log("Deployment completed!");
  console.log("TSHC Token:", tshcAddress);
  console.log("Wallet Factory:", walletFactoryAddress);
  console.log("Paymaster:", paymasterAddress);
  
  // Wait for 5 block confirmations for Etherscan verification
  console.log("Waiting for block confirmations...");
  await tshc.deploymentTransaction().wait(5);
  await walletFactory.deploymentTransaction().wait(5);
  await paymaster.deploymentTransaction().wait(5);
  
  // Verify contracts on Etherscan
  console.log("Verifying contracts on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: tshcAddress,
      constructorArguments: [deployer.address],
    });
    
    await hre.run("verify:verify", {
      address: walletFactoryAddress,
      constructorArguments: [entryPointAddress],
    });
    
    await hre.run("verify:verify", {
      address: paymasterAddress,
      constructorArguments: [entryPointAddress, tshcAddress, exchangeRate],
    });
    
    console.log("Contracts verified successfully!");
  } catch (error) {
    console.error("Error verifying contracts:", error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
