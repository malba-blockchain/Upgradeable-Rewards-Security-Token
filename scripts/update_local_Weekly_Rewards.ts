import { ethers } from 'hardhat'; // Import the ethers object from Hardhat
import { mine } from "@nomicfoundation/hardhat-network-helpers";

import * as fs from 'fs';
import * as path from 'path';

////////////////LOG HANDLING////////////////
const logFilePath = path.join('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Rewards/utils/logs/', 'logs.txt');

// Create a write stream for the log file
const logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Override console.log to log to both console and file
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
    const message = args.join(' ') + '\n';
    originalConsoleLog.apply(console, args); // Write to console
    logFileStream.write(message); // Write to the log file
};

const { LOCAL_TOKEN_SMART_CONTRACT_ADDRESS } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/addresses.ts');
const { TOKEN_SMART_CONTRACT_ABI } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/abi.ts');

const { LOCAL_REWARDS_SMART_CONTRACT_ADDRESS } = require('../utils/addresses.ts');
const { REWARDS_SMART_CONTRACT_ABI } = require('../utils/abi.ts');

const BATCH_SIZE_REWARDS_UPDATE = 10;

const AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN = 2;

const MIN_INTERVAL_FOR_UPDATE_REWARDS = 6; 

const REWARD_TOKENS_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

const REWARD_TOKENS_PER_WEEK =  REWARD_TOKENS_PER_YEAR / 52; // 150 Million tokens divided by 52 weeks

//Create an instance of the token contract to interact with it
const tokenContract = new ethers.Contract(LOCAL_TOKEN_SMART_CONTRACT_ADDRESS, TOKEN_SMART_CONTRACT_ABI, ethers.provider);

//Create an instance of the rewards contract to interact with it
const rewardsContract = new ethers.Contract(LOCAL_REWARDS_SMART_CONTRACT_ADDRESS, REWARDS_SMART_CONTRACT_ABI, ethers.provider);

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

//Get all the whitelisted investor wallets
async function getAllWhitelistedInvestorWallets(): Promise<Set<string>> {
    // Fetch all transfer events to identify holders
    const transferEvents = await tokenContract.queryFilter(tokenContract.filters.Transfer());
    // Initialize a Set to store whitelisted token holders
    const whitelistedTokenHolders = new Set<string>();

    // Use Set to track all unique holders
    const holders = new Set<string>();
    // Iterate through each transfer event to extract from and to addresses
    transferEvents.forEach(({ args }: any) => {
        if (args) {
            const { from, to } = args;
            // Add the from address if it's not the zero address (minting transaction)
            if (from !== ethers.ZeroAddress) holders.add(from);
            // Always add the to address
            holders.add(to);
        }
    });

    // Check whitelisting status for each holder
    await Promise.all(Array.from(holders).map(async (holder) => {

        // Fetch the wallet details for the current holder
        const { isWhitelisted, isBlacklisted, lastRewardsUpdateTime } = await rewardsContract.wallets(holder);
        
        // Get the current block number
        const currentBlockNumber = await ethers.provider.getBlockNumber();
        
        // Get the current block details
        const currentBlock = await ethers.provider.getBlock(currentBlockNumber);

        // Calculate the time difference between the current block and the last rewards update time
        const lastUpdateTimeSpread = currentBlock.timestamp - Number(lastRewardsUpdateTime);
        
        // Check if the holder is whitelisted, not blacklisted, and if the time since the last update exceeds 550000 seconds (approximately 6.4 days)
        if (isWhitelisted && !isBlacklisted && lastUpdateTimeSpread > 550000) {
            // Add the holder to the set of whitelisted token holders if all conditions are met
            whitelistedTokenHolders.add(holder);
        }
    }));

    // Return the set of whitelisted token holders
    return whitelistedTokenHolders;
}

//Get the token balances and total holdings of the whitelisted investor wallets
async function getTokenBalancesInvestors(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    // Fetch all whitelisted token holders
    const whitelistedTokenHolders = await getAllWhitelistedInvestorWallets();

    // Get the current block number and compute the number of blocks in a week
    const currentBlockNumber = await ethers.provider.getBlockNumber();
    const blocksInAWeek = Math.floor(7 * 24 * 60 * 60 / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);
    console.log("\n   [LOG]: Blocks in a week: ", blocksInAWeek);

    // Define target block number as the current block for now (can change if historical data is needed)
    const targetBlockNumber = currentBlockNumber - blocksInAWeek; // Change to currentBlock - blocksInAWeek for last week's data

    //Fetch the block details for the target block number
    console.log("   [LOG]: Current block number: ", currentBlockNumber);
    console.log("   [LOG]: Target block number: ", targetBlockNumber);

    const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
    const currentBlockDate = new Date(currentBlock.timestamp * 1000); // Convert timestamp to milliseconds
    console.log("   [LOG]: Current block date: ", currentBlockDate.toISOString());
    
    const targetBlock = await ethers.provider.getBlock(targetBlockNumber);
    const targetBlockDate = new Date(targetBlock.timestamp * 1000); // Convert timestamp to milliseconds
    console.log("   [LOG]: Target block date: ", targetBlockDate.toISOString());
    
    // Initialize total holdings last week to 0
    let totalHoldingsLastWeek = 0;
    // Create a map to store balances
    const balances = new Map<string, number>();
    
    // Iterate through each whitelisted token holder to fetch their balance
    await Promise.all(Array.from(whitelistedTokenHolders).map(async (holder) => {

        // Fetch the balance of the holder at the target block number
        const balance = await tokenContract.balanceOf(holder, { blockTag: targetBlockNumber});

        // Format the balance from wei to ether
        const formattedBalance = Number(ethers.formatEther(balance));

        // Store the formatted balance in the balances map
        balances.set(holder, formattedBalance);

        // Add the formatted balance to the total holdings last week
        totalHoldingsLastWeek += formattedBalance;
    }));

    // Return the balances and total holdings last week
    return { balances, totalTokenHoldings: totalHoldingsLastWeek };
}

//Get all the whitelisted team wallets  
async function getAllWhitelistedTeamWallets(): Promise<Set<string>> {
    // Create a filter for WalletAddedToWhitelist events
    const transferEventFilter = rewardsContract.filters.WalletAddedToWhitelist();

    // Query the blockchain for events that match the filter
    const addToWhitelistEvents = await rewardsContract.queryFilter(transferEventFilter);

    // Use a set to store the whitelisted team wallets
    const whitelistedTeamWallets: Set<string> = new Set();

    // Process all events to filter out team wallets and check their whitelisted status
    await Promise.all(addToWhitelistEvents.map(async (event) => {
        const [ , walletAddress, isTeamWallet ] = event.args;
        
        // If it's a team wallet, check its whitelist and blacklist status
        if (isTeamWallet) {
            const { isWhitelisted, isBlacklisted, lastRewardsUpdateTime } = await rewardsContract.wallets(walletAddress);

            // Get the current block number
            const currentBlockNumber = await ethers.provider.getBlockNumber();

            // Get the current block details
            const currentBlock = await ethers.provider.getBlock(currentBlockNumber);

            // Calculate the time difference between the current block and the last rewards update time
            const lastUpdateTimeSpread = currentBlock.timestamp - Number(lastRewardsUpdateTime);
            
            // Check if the holder is whitelisted, not blacklisted, and if the time since the last update exceeds 550000 seconds (approximately 6.4 days)
            if (isWhitelisted && !isBlacklisted && lastUpdateTimeSpread > 550000) {
                // Add the holder to the set of whitelisted token holders if all conditions are met
                whitelistedTeamWallets.add(walletAddress);
            }
        }
    }));

    return whitelistedTeamWallets;
}

//Get the token balances and total holdings of the whitelisted team wallets
async function getTokenBalancesTeam(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    
    // Retrieve all whitelisted team wallets
    const whitelistedTeamWallets = await getAllWhitelistedTeamWallets();

    // Initialize the total token holdings counter and map for storing balances
    let totalTokenHoldings = 0;
    const balances = new Map<string, number>();

    // Get the current block number and compute the number of blocks in a week
    const currentBlockNumber = await ethers.provider.getBlockNumber();
    const blocksInAWeek = Math.floor(7 * 24 * 60 * 60 / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);
    
    // Define target block number as the current block for now (can change if historical data is needed)
    const targetBlockNumber = currentBlockNumber - blocksInAWeek; // Change to currentBlock - blocksInAWeek for last week's data
    
    // Loop through all whitelisted team wallets and fetch their token data
    for (const wallet of whitelistedTeamWallets) {
        
        // Fetch multiple token-related properties from the rewards contract for each wallet at the target block
        const { hyaxHoldingAmountAtWhitelistTime } = await rewardsContract.wallets(wallet, { blockTag: targetBlockNumber});

        // Format balance from BigNumber (wei) to a readable number (ether)
        const balance = Number(ethers.formatEther(hyaxHoldingAmountAtWhitelistTime.toString()));

        // Update map of wallet balances and add the balance to the total holdings
        balances.set(wallet, balance);
        totalTokenHoldings += balance;
    }

    // Return the final balances map and the total token holdings
    return { balances, totalTokenHoldings };
}

//Calculate the rewards for all wallets
async function calculateRewardsForAllWallets(): Promise<{ balances: Map<string, [bigint, number]>, totalRewards: bigint }> {
    
    let totalRewards = BigInt(0); // Track total rewards
    let totalPercentage = 0.0; // Track total percentage for sanity check

    // Map to store rewards and percentage of rewards for each wallet
    const rewardsForWallets = new Map<string, [bigint, number]>();

    // Fetch token balances and total holdings for both investors and team wallets
    const { balances: investorBalances, totalTokenHoldings: investorHoldings } = await getTokenBalancesInvestors();
    const { balances: teamBalances, totalTokenHoldings: teamHoldings } = await getTokenBalancesTeam();

    // Combine investor and team token balances, and calculate total token holdings
    const totalTokenBalances = new Set([...investorBalances, ...teamBalances]);
    const totalTokenHoldings = investorHoldings + teamHoldings;

    // Iterate through all token holders and calculate rewards based on their token balance percentage
    for (const [address, balance] of totalTokenBalances) {

        const percentageRewards = balance / totalTokenHoldings; // Calculate percentage of total token holdings
        let amountRewards = BigInt(percentageRewards * REWARD_TOKENS_PER_WEEK); // Calculate initial reward amount

        // Remove lower 18 digits to eliminate decimal part and ensure precision
        const divisor = BigInt(10 ** 18);
        amountRewards = (amountRewards / divisor) * divisor;

        //console.log(`\nAddress: ${address}, Token balance: ${balance}, Token rewards: ${Number(ethers.formatEther(amountRewards.toString()))}, Percentage: ${(percentageRewards * 100).toFixed(2)}%`);

        totalRewards += amountRewards; // Update total rewards
        totalPercentage += percentageRewards; // Update total percentage
        
        rewardsForWallets.set(address, [amountRewards, percentageRewards]); // Store rewards and percentage in map
    }

    // Log sanity checks for total percentage and rewards distribution
    //console.log(`\nTotal Percentage Rewards: ${(totalPercentage * 100).toFixed(2)}%`);
    //console.log(`Expected Weekly Rewards: ${BigInt(REWARD_TOKENS_PER_WEEK)}`);
    //console.log(`Distributed Rewards: ${totalRewards}`);

    return { balances: rewardsForWallets, totalRewards }; // Return final rewards map and total rewards
}

//Update the rewards for all wallets in a batch
async function updateRewardsBatch(): Promise<string> {
    // Log the updater wallet's address and balance
    const { address } = rewardsUpdaterAddress;

    const balance = await ethers.provider.getBalance(address);
    
    console.log("\n   [LOG]: EXECUTION OF BATCH UPDATE");

    console.log("\n     Updater wallet address:", address, "\n     Updater wallet balance:", balance.toString());

    console.log("\n     Reward batch size update:", BATCH_SIZE_REWARDS_UPDATE);

    // Get rewards data from the calculateRewardsForAllWallets function
    const { balances: rewardsForWallets, totalRewards: totalRewards } = await calculateRewardsForAllWallets();

    console.log("\n     Rewards to distribute this week:", Number(ethers.formatEther(totalRewards.toString())));

    // Check if total rewards exceed the weekly cap
    if (totalRewards <= REWARD_TOKENS_PER_WEEK) {
        // Extract wallet addresses and reward amounts
        const walletAddresses = Array.from(rewardsForWallets.keys());
        const walletRewards = Array.from(rewardsForWallets.values()).map(([rewardAmount]) => rewardAmount);
        
        // Ensure the addresses and rewards lists are of the same length
        if (walletAddresses.length === walletRewards.length) {
            
            //Create a batch of transactions
            for (let i = 0; i < walletAddresses.length; i += BATCH_SIZE_REWARDS_UPDATE) {

                console.log(`\n   [LOG]: Processing batch ${Math.floor(i/BATCH_SIZE_REWARDS_UPDATE) + 1} of ${Math.ceil(walletAddresses.length/BATCH_SIZE_REWARDS_UPDATE)}`);
            
                const batchAddresses = walletAddresses.slice(i, i + BATCH_SIZE_REWARDS_UPDATE);
                const batchRewards = walletRewards.slice(i, i + BATCH_SIZE_REWARDS_UPDATE);
                
                //Print the addresses and rewards to be updated
                for (let j =0; j < batchAddresses.length; j++) {
                    
                    console.log(`     Address to update: ${batchAddresses[j]}. Rewards: ${Number(ethers.formatEther(batchRewards[j]))}`);
                } 
                
                try {
                    // Send the batch update transaction
                    const tx = await rewardsContract.connect(rewardsUpdaterAddress).updateRewardsBatch(batchAddresses, batchRewards);
                    console.log("\n   [LOG]: Sending batch update transaction...");
                    
                    const updateRewardsBatchReceipt = await tx.wait(); // Wait for the transaction to be mined
                    
                    const events = updateRewardsBatchReceipt?.logs || [];
                    
                    let batchFailedUpdates  = 0;
                    
                    for (const event of events) {
                        if (event.fragment.name === "RewardUpdateFailed") {
                            console.log(`   [LOG]: Reward Update Failed. Sender: ${event.args[0]}. Wallet address: ${event.args[1]}. Error message:  ${event.args[2]}`);
                            batchFailedUpdates++;
                        }
                    }
                    if (batchFailedUpdates == 0) {
                        console.log(`   [LOG]: Successful batch update. All updated wallets received rewards correctly.`);
                    }
                    if (batchFailedUpdates == walletAddresses.length) {
                        console.error(`   [ERROR]: All rewards in the batch failed to be updated. Check blockchain explorer logs for more details.`);
                        return `   [ERROR]: All rewards in the batch failed to be updated. Check blockchain explorer logs for more details.`;
                    }
                    if (batchFailedUpdates > 0) {
                        console.error(`   [ERROR]: ${batchFailedUpdates} out of ${BATCH_SIZE_REWARDS_UPDATE} rewards in the batch failed to be updated. Check blockchain explorer logs for more details.`);
                        //return `   [ERROR]: ${batchFailedUpdates} out of ${BATCH_SIZE_REWARDS_UPDATE} rewards in the batch failed to be updated. Check blockchain explorer logs for more details.`;
                    }
                } catch (error) {
                    console.error(`   [ERROR]: Batch transaction sent to smart contract failed:`, error); // Handle transaction failure
                    return `   [ERROR]: Batch transaction sent to smart contract failed:` + error;
                }
            }
        } else {
            console.error(`   [ERROR]: Mismatch in wallet addresses and rewards length.`);
            return `   [ERROR]: Mismatch in wallet addresses and rewards length.`;
        }
    } else {
        console.error(`   [ERROR]: Total rewards exceed the weekly limit.`);
        return `   [ERROR]: Total rewards exceed the weekly limit.`;
    }

    // Show the rewards of all wallets after the batch update.
    await showRewardsOfAllWallets(rewardsForWallets);
    return "";
}


//Show the rewards of all wallets
async function showRewardsOfAllWallets(balances:any){

    console.log("\n   [LOG]: WALLETS AND REWARDS LIST");

    //Get the wallet addresses
    const walletAddresses = Array.from(balances.keys());
    
    for (const address of walletAddresses) {

        const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await rewardsContract.wallets(address);
            
        console.log(`\n     Address: ${address}. Total rewards: ${Number(ethers.formatEther(totalHyaxRewardsAmount))}. Current rewards: ${Number(ethers.formatEther(currentRewardsAmount))}. Rewards withdrawn: ${Number(ethers.formatEther(rewardsWithdrawn))}`);
    }
}

//Show the state of the rewards smart contract
async function showRewardsSmartContractState() {

    console.log("\n   [LOG]: SMART CONTRACT STATE");
    console.log("\n     Rewards token funded:", Number(ethers.formatEther((await rewardsContract.rewardTokensFunded()).toString())));
    console.log("\n     Rewards token in smart contract:", Number(ethers.formatEther((await rewardsContract.rewardTokensInSmartContract()).toString())));
    console.log("\n     Rewards token distributed:", Number(ethers.formatEther((await rewardsContract.rewardTokensDistributed()).toString())));
    console.log("\n     Rewards token withdrawn:", Number(ethers.formatEther((await rewardsContract.rewardTokensWithdrawn()).toString())));
}

//Simulate the weekly reward distribution
async function weeklyRewardDistributionSimulation() {
    // Calculate the total number of weeks to simulate, assuming 8 years with 52 weeks per year, plus 14 weeks for rounding errors.
    const totalWeeks = 500; // 8 years * 52 weeks = 416 weeks + 14 weeks for rounding errors = 430 weeks
    
    // Loop through each week to simulate the reward distribution process.
    for (let i = 0; i < totalWeeks; i++) {
        console.log("\n   #######################################################################################################");
        // Mine the approximate number of blocks in a week to move forward in time. 
        // Assuming 2 seconds per block, we mine 302400 seconds (approximately 1 week) worth of blocks.
        await mine(302400, { interval: AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN });
        
        // Log the current week's information, including the year, week in the year, and the absolute week number.
        console.log("\n   --------------------------------------------------------------------------------------------------------");
        console.log("\n   [LOG]: Year: ", Math.floor(i / 52), ". Week in year: ", i % 52, ". Absolute week: ", i);
        console.log("\n   --------------------------------------------------------------------------------------------------------");

        // Show the current state of the rewards smart contract.
        await showRewardsSmartContractState();
        
        // Attempt to update the rewards batch for the current week.
        const updateRewardsBatchResult = await updateRewardsBatch();
        
        // If the update process fails, log the error and exit the simulation.
        if (updateRewardsBatchResult != "") {
            console.error(updateRewardsBatchResult);
            return;
        }
        // If the update process succeeds, log a success message.
        else {
            console.log("\n   [LOG]: All batch rewards updated successfully!");
        }
    }
}

async function main() {

    //////////////GET THE SIGNERS/////////////
    await getTheSigners();

    await weeklyRewardDistributionSimulation();
}

main(); // Call the async function