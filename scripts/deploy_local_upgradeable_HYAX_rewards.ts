import { ethers, upgrades } from 'hardhat'; // Import the ethers object from Hardhat

async function main() {
    const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
    console.log("\nDeploying upgradeable HYAX rewards...");

    // Deploy proxy with 'initialize' function
    const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, { initializer: 'initialize' });

    await upgradeableHYAXRewards.waitForDeployment();
    console.log("\nUpgradeable HYAX rewards deployed to:", upgradeableHYAXRewards.target);
}

main();