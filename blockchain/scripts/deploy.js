const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying NexaCred smart contracts...");

  // Get the contract factories
  const CreditScore = await hre.ethers.getContractFactory("CreditScore");
  const NexaCred = await hre.ethers.getContractFactory("NexaCred");

  // Deploy Credit Score contract first
  console.log("\n📊 Deploying CreditScore contract...");
  const creditScore = await CreditScore.deploy();
  if (typeof creditScore.waitForDeployment === "function") {
    await creditScore.waitForDeployment();
  } else if (typeof creditScore.deployed === "function") {
    await creditScore.deployed();
  }
  const creditScoreAddress = creditScore.target || creditScore.address;
  console.log(`✅ CreditScore deployed to: ${creditScoreAddress}`);

  // Deploy NexaCred lending contract
  console.log("\n💰 Deploying NexaCred lending contract...");
  const nexaCred = await NexaCred.deploy();
  if (typeof nexaCred.waitForDeployment === "function") {
    await nexaCred.waitForDeployment();
  } else if (typeof nexaCred.deployed === "function") {
    await nexaCred.deployed();
  }
  const nexaCredAddress = nexaCred.target || nexaCred.address;
  console.log(`✅ NexaCred deployed to: ${nexaCredAddress}`);

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer account: ${deployer.address}`);
  
  // Authorize NexaCred contract to update credit scores
  const authTx = await creditScore.setAuthorizedUpdater(nexaCredAddress, true);
  await authTx.wait();
  console.log("✅ NexaCred contract authorized to update credit scores");

  // Get block numbers safely
  let creditScoreBlockNumber = 0;
  let nexaCredBlockNumber = 0;
  try {
    if (creditScore.deploymentTransaction) {
      const txReceipt = await creditScore.deploymentTransaction().wait();
      creditScoreBlockNumber = txReceipt.blockNumber;
    } else if (creditScore.deployTransaction) {
      const txReceipt = await creditScore.deployTransaction.wait();
      creditScoreBlockNumber = txReceipt.blockNumber;
    }
  } catch (e) {
    console.warn("Could not retrieve CreditScore block number:", e.message);
  }

  try {
    if (nexaCred.deploymentTransaction) {
      const txReceipt = await nexaCred.deploymentTransaction().wait();
      nexaCredBlockNumber = txReceipt.blockNumber;
    } else if (nexaCred.deployTransaction) {
      const txReceipt = await nexaCred.deployTransaction.wait();
      nexaCredBlockNumber = txReceipt.blockNumber;
    }
  } catch (e) {
    console.warn("Could not retrieve NexaCred block number:", e.message);
  }

  // Create deployment info for backend integration
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      CreditScore: {
        address: creditScoreAddress,
        deployer: deployer.address,
        blockNumber: creditScoreBlockNumber
      },
      NexaCred: {
        address: nexaCredAddress,
        deployer: deployer.address,
        blockNumber: nexaCredBlockNumber
      }
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Save deployment info for backend use
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  // Generate environment variables for backend
  const envVars = `
# Blockchain Configuration (Generated from deployment)
BLOCKCHAIN_NETWORK=${hre.network.name}
CREDIT_SCORE_CONTRACT_ADDRESS=${creditScoreAddress}
NEXACRED_CONTRACT_ADDRESS=${nexaCredAddress}
WEB3_PROVIDER_URL=${hre.network.config.url}
`;

  const envPath = path.join(__dirname, "..", ".env.blockchain");
  fs.writeFileSync(envPath, envVars.trim());
  console.log(`🔧 Environment variables saved to: ${envPath}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract addresses to your backend configuration");
  console.log("2. Update web3_integration.py with the deployed contract addresses");
  console.log("3. Test the integration with the Flask backend");
  
  console.log("\n📊 Deployment Summary:");
  console.log(`Network: ${hre.network.name}`);
  console.log(`CreditScore: ${creditScoreAddress}`);
  console.log(`NexaCred: ${nexaCredAddress}`);
  console.log(`Deployer: ${deployer.address}`);
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
