// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");

async function main() {
  console.log("Deploying NEDA Pay minimal contracts to", network.name);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
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
  console.log("Test USDC:", testUSDCAddress);
  
  // Save deployment addresses to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    tshc: tshcAddress,
    reserve: reserveAddress,
    testUSDC: testUSDCAddress,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    `deployment-minimal-${network.name}-${new Date().toISOString().split('T')[0]}.json`,
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
