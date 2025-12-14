/**
 * XSRN Protocol Deployment Script
 * 
 * Deploy all contracts to BSC Testnet or Mainnet
 */

import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

interface DeployedContracts {
  treasury: string;
  feeSplitter: string;
  sessionManager: string;
  receiptRegistry: string;
  epochManager: string;
  merkleDistributor: string;
  attestationRegistry: string;
  network: string;
  chainId: number;
  deployedAt: string;
}

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log('='.repeat(60));
  console.log('XSRN Protocol Deployment');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);
  console.log('='.repeat(60));

  const deployed: Partial<DeployedContracts> = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
  };

  // 1. Deploy Treasury
  console.log('\n1. Deploying XsrnTreasury...');
  const Treasury = await ethers.getContractFactory('XsrnTreasury');
  const treasury = await Treasury.deploy(
    deployer.address, // watcher
    deployer.address, // operator
    deployer.address, // publicGood
    deployer.address  // emergency
  );
  await treasury.waitForDeployment();
  deployed.treasury = await treasury.getAddress();
  console.log(`   Treasury: ${deployed.treasury}`);

  // 2. Deploy FeeSplitter
  console.log('\n2. Deploying XsrnFeeSplitter...');
  const FeeSplitter = await ethers.getContractFactory('XsrnFeeSplitter');
  const feeSplitter = await FeeSplitter.deploy(
    deployed.treasury,
    deployer.address // owner
  );
  await feeSplitter.waitForDeployment();
  deployed.feeSplitter = await feeSplitter.getAddress();
  console.log(`   FeeSplitter: ${deployed.feeSplitter}`);

  // 3. Deploy SessionManager
  console.log('\n3. Deploying XsrnSessionManager...');
  const SessionManager = await ethers.getContractFactory('XsrnSessionManager');
  const sessionManager = await SessionManager.deploy();
  await sessionManager.waitForDeployment();
  deployed.sessionManager = await sessionManager.getAddress();
  console.log(`   SessionManager: ${deployed.sessionManager}`);

  // 4. Deploy ReceiptRegistry
  console.log('\n4. Deploying ReceiptRegistry...');
  const ReceiptRegistry = await ethers.getContractFactory('ReceiptRegistry');
  const receiptRegistry = await ReceiptRegistry.deploy(
    deployed.feeSplitter
  );
  await receiptRegistry.waitForDeployment();
  deployed.receiptRegistry = await receiptRegistry.getAddress();
  console.log(`   ReceiptRegistry: ${deployed.receiptRegistry}`);

  // 5. Deploy EpochManager
  console.log('\n5. Deploying EpochManager...');
  const EpochManager = await ethers.getContractFactory('EpochManager');
  const epochManager = await EpochManager.deploy(7 * 24 * 60 * 60); // 7 days
  await epochManager.waitForDeployment();
  deployed.epochManager = await epochManager.getAddress();
  console.log(`   EpochManager: ${deployed.epochManager}`);

  // 6. Deploy MerkleDistributor
  console.log('\n6. Deploying MerkleDistributor...');
  const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor');
  const merkleDistributor = await MerkleDistributor.deploy(deployer.address);
  await merkleDistributor.waitForDeployment();
  deployed.merkleDistributor = await merkleDistributor.getAddress();
  console.log(`   MerkleDistributor: ${deployed.merkleDistributor}`);

  // 7. Deploy AttestationRegistry
  console.log('\n7. Deploying AttestationRegistry...');
  const AttestationRegistry = await ethers.getContractFactory('AttestationRegistry');
  const attestationRegistry = await AttestationRegistry.deploy(
    3 * 24 * 60 * 60, // 3 day challenge period
    deployer.address  // arbitrator
  );
  await attestationRegistry.waitForDeployment();
  deployed.attestationRegistry = await attestationRegistry.getAddress();
  console.log(`   AttestationRegistry: ${deployed.attestationRegistry}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Deployment Complete!');
  console.log('='.repeat(60));
  console.log('\nContract Addresses:');
  console.log(JSON.stringify(deployed, null, 2));

  // Save deployment info
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `${network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployed, null, 2)
  );
  console.log(`\nDeployment saved to: deployments/${filename}`);

  // Verification commands
  console.log('\n' + '='.repeat(60));
  console.log('Verification Commands:');
  console.log('='.repeat(60));
  console.log(`
npx hardhat verify --network ${network.name} ${deployed.treasury} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address}
npx hardhat verify --network ${network.name} ${deployed.feeSplitter} ${deployed.treasury} ${deployer.address}
npx hardhat verify --network ${network.name} ${deployed.sessionManager}
npx hardhat verify --network ${network.name} ${deployed.receiptRegistry} ${deployed.feeSplitter}
npx hardhat verify --network ${network.name} ${deployed.epochManager} 604800
npx hardhat verify --network ${network.name} ${deployed.merkleDistributor} ${deployer.address}
npx hardhat verify --network ${network.name} ${deployed.attestationRegistry} 259200 ${deployer.address}
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
