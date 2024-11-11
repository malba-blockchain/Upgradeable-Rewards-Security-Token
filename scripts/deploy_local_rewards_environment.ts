//Import the fs and path modules to write the HYAX smart contract address to a file
const fs = require('fs');
const path = require('path');

const { LOCAL_TOKEN_SMART_CONTRACT_ADDRESS } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/addresses.ts');
const { TOKEN_SMART_CONTRACT_ABI } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/abi.ts');

import { artifacts, ethers, upgrades } from 'hardhat'; // Import the ethers object from Hardhat


//Global variables of signers
let deployer: any, owner: any, whiteListerAddress: any, rewardsUpdaterAddress: any, treasuryAddress: any;
let addr1: any, addr2: any, addr3: any, addr4: any, addr5: any, addr6: any, addr7: any, addr8: any, addr9: any, addr10: any;
let addr11: any, addr12: any, addr13: any, addr14: any, addr15: any, addr16: any, addr17: any, addr18: any, addr19: any, addr20: any;
let addr21: any, addr22: any, addr23: any, addr24: any, addr25: any, addr26: any, addr27: any, addr28: any, addr29: any, addr30: any;
let addr31: any, addr32: any, addr33: any, addr34: any, addr35: any, addr36: any, addr37: any, addr38: any, addr39: any, addr40: any;
let addr41: any, addr42: any, addr43: any, addr44: any, addr45: any, addr46: any, addr47: any, addr48: any, addr49: any, addr50: any;
let addr51: any, taddr1: any, taddr2: any, taddr3: any, taddr4: any, taddr5: any, taddr6: any, taddr7: any, taddr8: any, taddr9: any, taddr10: any;

//Get the signers of the wallets
async function getTheSigners() { 

    const [_deployer, _owner, _whiteListerAddress, _rewardsUpdaterAddress, _treasuryAddress, 
        _addr1, _addr2, _addr3, _addr4, _addr5, _addr6, _addr7, _addr8, _addr9, _addr10, _addr11,
        _addr12, _addr13, _addr14, _addr15, _addr16, _addr17, _addr18, _addr19, _addr20, _addr21, 
        _addr22, _addr23, _addr24, _addr25, _addr26, _addr27, _addr28, _addr29, _addr30, _addr31,
        _addr32, _addr33, _addr34, _addr35, _addr36, _addr37, _addr38, _addr39, _addr40, _addr41,
        _addr42, _addr43, _addr44, _addr45, _addr46, _addr47, _addr48, _addr49, _addr50, _addr51,
        _taddr1, _taddr2, _taddr3, _taddr4, _taddr5, _taddr6, _taddr7, _taddr8, _taddr9, _taddr10 ] = await ethers.getSigners();

    deployer = _deployer; owner = _owner; whiteListerAddress = _whiteListerAddress; rewardsUpdaterAddress = _rewardsUpdaterAddress; treasuryAddress = _treasuryAddress;
    addr1 = _addr1; addr2 = _addr2; addr3 = _addr3; addr4 = _addr4; addr5 = _addr5; addr6 = _addr6; addr7 = _addr7; addr8 = _addr8; addr9 = _addr9; addr10 = _addr10;
    addr11 = _addr11; addr12 = _addr12; addr13 = _addr13; addr14 = _addr14; addr15 = _addr15; addr16 = _addr16; addr17 = _addr17; addr18 = _addr18; addr19 = _addr19; addr20 = _addr20;
    addr21 = _addr21; addr22 = _addr22; addr23 = _addr23; addr24 = _addr24; addr25 = _addr25; addr26 = _addr26; addr27 = _addr27; addr28 = _addr28; addr29 = _addr29; addr30 = _addr30;
    addr31 = _addr31; addr32 = _addr32; addr33 = _addr33; addr34 = _addr34; addr35 = _addr35; addr36 = _addr36; addr37 = _addr37; addr38 = _addr38; addr39 = _addr39; addr40 = _addr40;
    addr41 = _addr41; addr42 = _addr42; addr43 = _addr43; addr44 = _addr44; addr45 = _addr45; addr46 = _addr46; addr47 = _addr47; addr48 = _addr48; addr49 = _addr49; addr50 = _addr50;
    addr51 = _addr51; taddr1 = _taddr1; taddr2 = _taddr2; taddr3 = _taddr3; taddr4 = _taddr4; taddr5 = _taddr5; taddr6 = _taddr6; taddr7 = _taddr7; taddr8 = _taddr8; taddr9 = _taddr9; 
    taddr10 = _taddr10;
}

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
async function getHYAXUpgradeableContractInstance() {
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

async function deployHYAXRewardsContract(hyaxUpgradeable:any) {

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
async function fundHYAXRewardsContract(hyaxUpgradeable:any, upgradeableHYAXRewards:any) {

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

async function addInvestorWalletsToWhitelist(upgradeableHYAXRewards:any) {

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

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr6.address, false, 0);
  console.log("Added investor wallet to whitelist", addr6.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr7.address, false, 0);
  console.log("Added investor wallet to whitelist", addr7.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr8.address, false, 0);
  console.log("Added investor wallet to whitelist", addr8.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr9.address, false, 0);
  console.log("Added investor wallet to whitelist", addr9.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr10.address, false, 0);
  console.log("Added investor wallet to whitelist", addr10.address); 

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr11.address, false, 0);
  console.log("Added investor wallet to whitelist", addr11.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr12.address, false, 0);
    console.log("Added investor wallet to whitelist", addr12.address);
  
  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr13.address, false, 0);
  console.log("Added investor wallet to whitelist", addr13.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr14.address, false, 0);
  console.log("Added investor wallet to whitelist", addr14.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr15.address, false, 0);
  console.log("Added investor wallet to whitelist", addr15.address); 

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr16.address, false, 0);
  console.log("Added investor wallet to whitelist", addr16.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr17.address, false, 0);
  console.log("Added investor wallet to whitelist", addr17.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr18.address, false, 0);
  console.log("Added investor wallet to whitelist", addr18.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr19.address, false, 0);
  console.log("Added investor wallet to whitelist", addr19.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr20.address, false, 0);
  console.log("Added investor wallet to whitelist", addr20.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr21.address, false, 0);
  console.log("Added investor wallet to whitelist", addr21.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr22.address, false, 0);
  console.log("Added investor wallet to whitelist", addr22.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr23.address, false, 0);
  console.log("Added investor wallet to whitelist", addr23.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr24.address, false, 0);
  console.log("Added investor wallet to whitelist", addr24.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr25.address, false, 0);
  console.log("Added investor wallet to whitelist", addr25.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr26.address, false, 0);
  console.log("Added investor wallet to whitelist", addr26.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr27.address, false, 0);
  console.log("Added investor wallet to whitelist", addr27.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr28.address, false, 0);
  console.log("Added investor wallet to whitelist", addr28.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr29.address, false, 0);
  console.log("Added investor wallet to whitelist", addr29.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr30.address, false, 0);
  console.log("Added investor wallet to whitelist", addr30.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr31.address, false, 0);
  console.log("Added investor wallet to whitelist", addr31.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr32.address, false, 0);
  console.log("Added investor wallet to whitelist", addr32.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr33.address, false, 0);
  console.log("Added investor wallet to whitelist", addr33.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr34.address, false, 0);
  console.log("Added investor wallet to whitelist", addr34.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr35.address, false, 0);
  console.log("Added investor wallet to whitelist", addr35.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr36.address, false, 0);
  console.log("Added investor wallet to whitelist", addr36.address);  

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr37.address, false, 0);
  console.log("Added investor wallet to whitelist", addr37.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr38.address, false, 0);
  console.log("Added investor wallet to whitelist", addr38.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr39.address, false, 0);
  console.log("Added investor wallet to whitelist", addr39.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr40.address, false, 0);
  console.log("Added investor wallet to whitelist", addr40.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr41.address, false, 0);
  console.log("Added investor wallet to whitelist", addr41.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr42.address, false, 0);
  console.log("Added investor wallet to whitelist", addr42.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr43.address, false, 0);
  console.log("Added investor wallet to whitelist", addr43.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr44.address, false, 0);
  console.log("Added investor wallet to whitelist", addr44.address); 

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr45.address, false, 0);
  console.log("Added investor wallet to whitelist", addr45.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr46.address, false, 0);
  console.log("Added investor wallet to whitelist", addr46.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr47.address, false, 0);
  console.log("Added investor wallet to whitelist", addr47.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr48.address, false, 0);
  console.log("Added investor wallet to whitelist", addr48.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr49.address, false, 0);
  console.log("Added investor wallet to whitelist", addr49.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr50.address, false, 0);
  console.log("Added investor wallet to whitelist", addr50.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(addr51.address, false, 0);
  console.log("Added investor wallet to whitelist", addr51.address);  
}

async function addTeamWalletsToWhitelist(upgradeableHYAXRewards:any) {

  console.log("\nAdding team wallets to the rewards smart contract whitelist...");

  //Add team wallets to the rewards smart contract whitelist
  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr1.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr1.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr2.address, true, ethers.parseUnits("3000000", 18));
  console.log("Added team wallet to whitelist", taddr2.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr3.address, true, ethers.parseUnits("2000000", 18));
  console.log("Added team wallet to whitelist", taddr3.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr4.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr4.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr5.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr5.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr6.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr6.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr7.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr7.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr8.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr8.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr9.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr9.address);

  await upgradeableHYAXRewards.connect(whiteListerAddress).addWalletToWhitelist(taddr10.address, true, ethers.parseUnits("1000000", 18));
  console.log("Added team wallet to whitelist", taddr10.address);
}

async function main() {
  
    /////////////GET THE SIGNERS/////////////
    await getTheSigners();

    const hyaxUpgradeable = await getHYAXUpgradeableContractInstance();

    const upgradeableHYAXRewards = await deployHYAXRewardsContract(hyaxUpgradeable);

    //Fund the rewards smart contract 
    await fundHYAXRewardsContract(hyaxUpgradeable, upgradeableHYAXRewards);

    //Add investor wallets to the rewards smart contract whitelist
    await addInvestorWalletsToWhitelist(upgradeableHYAXRewards);

    //Add team wallets to the rewards smart contract whitelist
    await addTeamWalletsToWhitelist(upgradeableHYAXRewards);
}

main();