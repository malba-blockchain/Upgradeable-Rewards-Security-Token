//Import the fs and path modules to write the HYAX smart contract address to a file
const fs = require('fs');
const path = require('path');

const { LOCAL_TOKEN_SMART_CONTRACT_ADDRESS } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/addresses.ts');
const { TOKEN_SMART_CONTRACT_ABI } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/abi.ts');

import { artifacts, ethers, upgrades } from 'hardhat'; // Import the ethers object from Hardhat


// Function to update the LOCAL_REWARDS_SMART_CONTRACT_ADDRESS in addresses.ts
async function updateLocalRewardsAddress(newAddress: string) {
  const addressesFilePath = path.join(__dirname, '../utils/addresses.ts');

  // Read the addresses.ts file
  fs.readFile(addressesFilePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
      console.error("Error reading addresses.ts file:", err);
      return;
    }

    // Find the existing LOCAL_REWARDS_SMART_CONTRACT_ADDRESS line and replace it with the new address
    const updatedFile = data.replace(
      /const LOCAL_REWARDS_SMART_CONTRACT_ADDRESS = ".*";/,
      `const LOCAL_REWARDS_SMART_CONTRACT_ADDRESS = "${newAddress}";`
    );

    // Write the updated content back to the file
    fs.writeFile(addressesFilePath, updatedFile, 'utf8', (err: NodeJS.ErrnoException | null) => {
      if (err) {
        console.error("Error writing to addresses.ts file:", err);
        return;
      }

      console.log("LOCAL_REWARDS_SMART_CONTRACT_ADDRESS updated successfully in addresses.ts file.");
    });
  });
}

// Function to update the REWARDS_SMART_CONTRACT_ABI in the abi.ts file
async function updateAbiFile(abi: any) {
  // Path to the abi.ts file
  const abiFilePath = path.join(__dirname, '../utils/abi.ts');

  // Read the existing abi.ts file content
  let abiFileContent = fs.readFileSync(abiFilePath, 'utf8');

  // Find the REWARDS_SMART_CONTRACT_ABI constant
  const abiRegex = /const REWARDS_SMART_CONTRACT_ABI = \[\];/;

  // Replace the empty array with the new ABI
  const newAbiContent = `const REWARDS_SMART_CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};`;

  // Replace the old constant with the updated one in the file content
  abiFileContent = abiFileContent.replace(abiRegex, newAbiContent);

  // Write the updated content back to the abi.ts file
  fs.writeFileSync(abiFilePath, abiFileContent);

  console.log("REWARDS_SMART_CONTRACT_ABI updated successfully in abi.ts file.");
}

// Function to get the HYAX upgradeable contract instance
async function getHYAXUpgradeableContractInstance(owner:any) {
  try {
      // Create contract instance
      const hyaxUpgradeable = new ethers.Contract( LOCAL_TOKEN_SMART_CONTRACT_ADDRESS, TOKEN_SMART_CONTRACT_ABI, owner);

      // Verify the contract is accessible
      try {
          await hyaxUpgradeable.name();
          console.log('Successfully connected to HYAX contract at:', LOCAL_TOKEN_SMART_CONTRACT_ADDRESS);
      } catch (error) {
          throw new Error('Failed to connect to HYAX contract. Please verify the contract address and ABI.');
      }

      return hyaxUpgradeable;
  } catch (error) {
      console.error('Error creating contract instance:', error);
      throw error;
  }
}

async function deployHYAXRewardsContract(hyaxUpgradeable:any,owner:any, deployer:any, whiteListerAddress:any, rewardsUpdaterAddress:any) {

    console.log("\nDeploying upgradeable HYAX rewards...");

    const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');

    // Deploy proxy with 'initialize' function
    const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [LOCAL_TOKEN_SMART_CONTRACT_ADDRESS], { initializer: 'initialize' });

    await upgradeableHYAXRewards.waitForDeployment();

    // Transfer ownership to the owner
    await upgradeableHYAXRewards.connect(deployer).transferOwnership(owner.address);


    /////////////UPDATE THE REWARDS SMART CONTRACT/////////////

    //Update the whitelister address
    await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whiteListerAddress);

    //Update the rewards updater address
    await upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(rewardsUpdaterAddress);

    console.log("\nUpgradeable rewards smart contract address:", upgradeableHYAXRewards.target);

    console.log("\nDeployer address: ", deployer.address);

    console.log("Owner address: ", owner.address);

    console.log("WhiteLister address: ", whiteListerAddress.address);

    console.log("Rewards updater address: ", rewardsUpdaterAddress.address);

    //Balance of the smart contract
    console.log("\nSmart contract rewards initial balance: ", Number(ethers.formatEther(await hyaxUpgradeable.balanceOf(upgradeableHYAXRewards.target))));

    // Update the LOCAL_REWARDS_SMART_CONTRACT_ADDRESS in addresses.ts
    await updateLocalRewardsAddress(upgradeableHYAXRewards.target.toString());

    // Get the bytecode and ABI of the deployed contract
    const {bytecode, abi} = await artifacts.readArtifact('UpgradeableHYAXRewards');

    // Call the function to update the abi.ts file
    await updateAbiFile(abi);

    return upgradeableHYAXRewards;
}

// Function to fund the HYAX rewards smart contract
async function fundHYAXRewardsContract(hyaxUpgradeable:any, upgradeableHYAXRewards:any, owner:any) {

  //Mint tokens in the HYAX smart contract. A total of 5,100,000,000 HYAX tokens are minted for the rewards smart contract
  for (let i = 0; i < 5; i++) { await hyaxUpgradeable.connect(owner).tokenIssuance(ethers.parseUnits("1000000000", 18));}

  await hyaxUpgradeable.connect(owner).tokenIssuance(ethers.parseUnits("100000000", 18)); //Issuance of 100,000,000 HYAX tokens

  //Approve the HYAX rewards smart contract to spend the tokens
  await hyaxUpgradeable.connect(owner).approve(upgradeableHYAXRewards.target, ethers.parseUnits("5100000000", 18));
  
  //Fund rewards smart contract with growth tokens
  const growthTokensFundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (2.4B) 2,400,000,000 Growth Tokens (60% of the total growth tokens)
  await upgradeableHYAXRewards.connect(owner).fundSmartContract(0, growthTokensFundingAmount);

  //Fund rewards smart contract with team tokens
  const teamTokensFundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1.5B) 1,500,000,000 Team Tokens
  await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, teamTokensFundingAmount);

  //Fund rewards smart contract with rewards tokens
  const rewardTokensFundingAmount = ethers.parseUnits("1200000000", 18); // Fund with (1.2B) 1,200,000,000 Team Tokens
  await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, rewardTokensFundingAmount);

  //Check the balance of the rewards smart contract
  console.log("\nRewards smart contract balance: ", Number(ethers.formatEther(await hyaxUpgradeable.balanceOf(upgradeableHYAXRewards.target))));
}

async function addInvestorWalletsToWhitelist(upgradeableHYAXRewards:any, addr1:any, addr2:any, addr3:any, addr4:any, addr5:any, whiteListerAddress:any) {

  console.log("\nAdding investor wallets to the rewards smart contract whitelist...");

  //Add investor wallets to the rewards smart contract whitelist
  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr1.address, false, 0);
  console.log("Added investor wallet to whitelist", addr1.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr2.address, false, 0);
  console.log("Added investor wallet to whitelist", addr2.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr3.address, false, 0);
  console.log("Added investor wallet to whitelist", addr3.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr4.address, false, 0);
  console.log("Added investor wallet to whitelist", addr4.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr5.address, false, 0);
  console.log("Added investor wallet to whitelist", addr5.address);
}

async function addTeamWalletsToWhitelist(upgradeableHYAXRewards:any, whiteListerAddress:any, taddr1:any, taddr2:any, taddr3:any) {

  console.log("\nAdding team wallets to the rewards smart contract whitelist...");

  //Add team wallets to the rewards smart contract whitelist
  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr1.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr1.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr2.address, true, ethers.parseUnits("3000000", 18));
  console.log("Added team wallet to whitelist", taddr2.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr3.address, true, ethers.parseUnits("2000000", 18));
  console.log("Added team wallet to whitelist", taddr3.address);
}

async function main() {

    /////////////GET THE SIGNERS/////////////
    const [deployer, owner, addr1, addr2, addr3, addr4, addr5, whiteListerAddress, treasuryAddress, 
      taddr1, taddr2, taddr3, rewardsUpdaterAddress] = await ethers.getSigners();

    const hyaxUpgradeable = await getHYAXUpgradeableContractInstance(owner);

    const upgradeableHYAXRewards = await deployHYAXRewardsContract(hyaxUpgradeable, owner, deployer, whiteListerAddress, rewardsUpdaterAddress);

    //Fund the rewards smart contract 
    await fundHYAXRewardsContract(hyaxUpgradeable, upgradeableHYAXRewards, owner);

    //Add investor wallets to the rewards smart contract whitelist
    await addInvestorWalletsToWhitelist(upgradeableHYAXRewards, addr1, addr2, addr3, addr4, addr5, whiteListerAddress);

    //Add team wallets to the rewards smart contract whitelist
    await addTeamWalletsToWhitelist(upgradeableHYAXRewards, whiteListerAddress, taddr1, taddr2, taddr3);
}

main();