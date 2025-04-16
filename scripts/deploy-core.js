// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");

async function main() {
  console.log("Deploying NEDA Pay core contracts to", network.name);
  
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
  
  // Deploy Reserve contract
  console.log("Deploying Reserve contract...");
  const Reserve = await ethers.getContractFactory("Reserve");
  const reserve = await Reserve.deploy(tshcAddress, deployer.address);
  await reserve.waitForDeployment();
  const reserveAddress = await reserve.getAddress();
  console.log("Reserve deployed to:", reserveAddress);
  
  // Grant MINTER_ROLE to Reserve contract
  console.log("Granting MINTER_ROLE to Reserve contract...");
  const MINTER_ROLE = await tshc.MINTER_ROLE();
  const grantTx = await tshc.grantRole(MINTER_ROLE, reserveAddress);
  await grantTx.wait();
  console.log("MINTER_ROLE granted to Reserve contract");
  
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
  
  // Deploy a simple ERC20 token for testing as collateral
  console.log("Deploying TestUSDC for collateral...");
  const TestToken = await ethers.getContractFactory("TestUSDC");
  const testUSDC = await TestToken.deploy(deployer.address);
  await testUSDC.waitForDeployment();
  const testUSDCAddress = await testUSDC.getAddress();
  console.log("TestUSDC deployed to:", testUSDCAddress);
  
  // Add TestUSDC as collateral to Reserve
  console.log("Adding TestUSDC as collateral to Reserve...");
  // Set collateral ratio to 150% (15000)
  const collateralRatio = 15000;
  const addCollateralTx = await reserve.addCollateralAsset(testUSDCAddress, collateralRatio);
  await addCollateralTx.wait();
  console.log("TestUSDC added as collateral with ratio:", collateralRatio);
  
  console.log("Deployment completed!");
  console.log("TSHC Token:", tshcAddress);
  console.log("Reserve:", reserveAddress);
  console.log("Wallet Factory:", walletFactoryAddress);
  console.log("Paymaster:", paymasterAddress);
  console.log("Test USDC:", testUSDCAddress);
  
  // Save deployment addresses to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    entryPoint: entryPointAddress,
    tshc: tshcAddress,
    reserve: reserveAddress,
    walletFactory: walletFactoryAddress,
    paymaster: paymasterAddress,
    testUSDC: testUSDCAddress,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    `deployment-${network.name}-${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment information saved to file");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
