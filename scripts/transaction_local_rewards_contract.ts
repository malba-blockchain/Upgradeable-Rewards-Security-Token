import { artifacts, ethers, upgrades } from 'hardhat'; // Import the ethers object from Hardhat
import { Alchemy, Network } from "alchemy-sdk";

const { LOCAL_TOKEN_SMART_CONTRACT_ADDRESS } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/addresses.ts');
const { TOKEN_SMART_CONTRACT_ABI } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Token/utils/abi.ts');

const { LOCAL_REWARDS_SMART_CONTRACT_ADDRESS } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Rewards/utils/addresses.ts');
const { REWARDS_SMART_CONTRACT_ABI } = require('D:/USER/Downloads/ATLAS/Projects/HYAX-Upgradeable-Rewards/utils/abi.ts');

const AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN = 2.1;

const REWARD_TOKENS_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

const REWARD_TOKENS_PER_WEEK =  REWARD_TOKENS_PER_YEAR / 52; // 150 Million tokens divided by 52 weeks


//Create an instance of the token contract to interact with it
const tokenContract = new ethers.Contract(LOCAL_TOKEN_SMART_CONTRACT_ADDRESS, TOKEN_SMART_CONTRACT_ABI, ethers.provider);

//Create an instance of the rewards contract to interact with it
const rewardsContract = new ethers.Contract(LOCAL_REWARDS_SMART_CONTRACT_ADDRESS, REWARDS_SMART_CONTRACT_ABI, ethers.provider);

//Global variables of signers
let deployer: any, owner: any, addr1: any, addr2: any, addr3: any, addr4: any, addr5: any, whiteListerAddress: any, treasuryAddress: any, 
    taddr1: any, taddr2: any, taddr3: any, rewardsUpdaterAddress: any;

async function getTheSigners() { 
    const [_deployer, _owner, _addr1, _addr2, _addr3, _addr4, _addr5, _whiteListerAddress, _treasuryAddress, 
        _taddr1, _taddr2, _taddr3, _rewardsUpdaterAddress] = await ethers.getSigners();

    deployer = _deployer; owner = _owner; addr1 = _addr1; addr2 = _addr2; addr3 = _addr3; addr4 = _addr4; addr5 = _addr5;
    whiteListerAddress = _whiteListerAddress; treasuryAddress = _treasuryAddress;
    taddr1 = _taddr1; taddr2 = _taddr2; taddr3 = _taddr3; rewardsUpdaterAddress = _rewardsUpdaterAddress;
}


//Get all the whitelisted token holders
async function getAllWhitelistedTokenHolders(): Promise<Set<string>> {
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
        const { isWhitelisted, isBlacklisted } = await rewardsContract.wallets(holder);
        // If the holder is whitelisted and not blacklisted, add them to the whitelisted set
        if (isWhitelisted && !isBlacklisted) whitelistedTokenHolders.add(holder);
    }));

    // Return the set of whitelisted token holders
    return whitelistedTokenHolders;
}

//Get the token balances and total holdings of the whitelisted token holders
async function getTokenBalancesAndTotalHoldingsInvestors(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    // Fetch all whitelisted token holders
    const whitelistedTokenHolders = await getAllWhitelistedTokenHolders();
    // Get the current block number
    const currentBlock = await ethers.provider.getBlockNumber();
    // Set the target block number to the current block
    const targetBlockNumber = currentBlock;  
    // Fetch the block details for the target block number
    const block = await ethers.provider.getBlock(targetBlockNumber);
    
    // Log the target block number and its date
    //console.log(`[LOG]: Block target number: ${targetBlockNumber}`);
    if (block) {
        //console.log(`[LOG]: Block date: ${new Date(block.timestamp * 1000).toISOString()}`);
    } else {
        //console.log(`[LOG]: Block details not available`);
    }

    // Initialize total holdings last week to 0
    let totalHoldingsLastWeek = 0;
    // Create a map to store balances
    const balances = new Map<string, number>();

    // Iterate through each whitelisted token holder to fetch their balance
    await Promise.all(Array.from(whitelistedTokenHolders).map(async (holder) => {
        // Fetch the balance of the holder at the target block number
        const balance = await tokenContract.balanceOf(holder, { blockTag: targetBlockNumber });
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
            const { isWhitelisted, isBlacklisted } = await rewardsContract.wallets(walletAddress);
            if (isWhitelisted && !isBlacklisted) {
                whitelistedTeamWallets.add(walletAddress);
            }
        }
    }));

    return whitelistedTeamWallets;
}


async function getTokenBalancesAndTotalHoldingsTeam(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    
    // Retrieve all whitelisted team wallets
    const whitelistedTeamWallets = await getAllWhitelistedTeamWallets();

    // Initialize the total token holdings counter and map for storing balances
    let totalTokenHoldings = 0;
    const balances = new Map<string, number>();

    // Get the current block number and compute the number of blocks in a week
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksInAWeek = Math.floor(7 * 24 * 60 * 60 / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);
    
    // Define target block number as the current block for now (can change if historical data is needed)
    const targetBlockNumber = currentBlock; // Change to currentBlock - blocksInAWeek for last week's data
    //console.log("[LOG]: Block target number: ", targetBlockNumber);

    // Fetch the block details at the target block number to get its timestamp
    const block = await ethers.provider.getBlock(targetBlockNumber);
    if (block) {
        //console.log("[LOG]: Block date: ", new Date(block.timestamp * 1000).toISOString()); // Convert UNIX timestamp to readable date
    } else {
        //console.log("[LOG]: Block details not available");
    }

    // Loop through all whitelisted team wallets and fetch their token data
    for (const wallet of whitelistedTeamWallets) {
        
        // Fetch multiple token-related properties from the rewards contract for each wallet at the target block
        const { hyaxHoldingAmountAtWhitelistTime } = await rewardsContract.wallets(wallet, { blockTag: targetBlockNumber });

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
    const { balances: investorBalances, totalTokenHoldings: investorHoldings } = await getTokenBalancesAndTotalHoldingsInvestors();
    const { balances: teamBalances, totalTokenHoldings: teamHoldings } = await getTokenBalancesAndTotalHoldingsTeam();

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

async function updateWalletWhitelistStatus() {

    const walletToBeUpdated = addr1.address;

    const newStatus = false;
    try {

        const tx = await rewardsContract.connect(whiteListerAddress).updateWhitelistStatus(walletToBeUpdated, newStatus);

        await tx.wait();

        console.log("\n   Wallet updated whitelist status successfully!", walletToBeUpdated, "to", newStatus);
        
    } catch (error) {
        console.error("\n   [ERROR]: Wallet update whitelist status failed:", error);
    }
}

async function withdrawRewardTokens() {

    const walletToWithdraw = addr5;

    try {

        const tx = await rewardsContract.connect(walletToWithdraw).withdrawRewardTokens();

        await tx.wait();

        console.log("\n   Wallet withdrew reward tokens successfully!", walletToWithdraw.address);
        
    } catch (error) {
        console.error("\n   [ERROR]: Wallet withdrew reward tokens failed:", error);
    }
}


async function updateRewardsSingle(): Promise<string> {

    // Address of the wallet to update
    const walletToBeUpdated = addr1.address;

    // Reward amount to be updated (1.55272 million tokens with 18 decimals)
    const rewardAmount = ethers.parseUnits("1552720", 18); // Parse rewardAmount using ethers utility to ensure precision

    // Log the updater wallet address and its current balance
    const updaterAddress = rewardsUpdaterAddress.address;
    console.log("\n   Updater wallet address:", updaterAddress);
    console.log("   Updater wallet balance:", await ethers.provider.getBalance(updaterAddress));

    // Connect to the rewards contract with the updater wallet and initiate the rewards update
    const tx = await rewardsContract.connect(rewardsUpdaterAddress).updateRewardsSingle(walletToBeUpdated, rewardAmount);

    // Wait for the transaction to be mined
    console.log("\n   Waiting for single transaction to finish...");
    const receipt = await tx.wait();

    //console.log(receipt);

    const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
        currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
        lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
        = await rewardsContract.wallets(walletToBeUpdated);

    console.log("\n   Updated wallet: ", walletToBeUpdated);
    console.log("   Updated wallet totalHyaxRewardsAmount: ", totalHyaxRewardsAmount);
    console.log("   Updated wallet currentRewardsAmount: ", currentRewardsAmount);
    console.log("   Updated wallet rewardsWithdrawn: ", rewardsWithdrawn);
    console.log("   Updated wallet lastRewardsWithdrawalTime: ", lastRewardsWithdrawalTime);
    console.log("   Updated wallet lastRewardsUpdateTime: ", lastRewardsUpdateTime);

    // Return the updated total rewards amount for the wallet
    return totalHyaxRewardsAmount;
}


async function updateRewardsBatch(): Promise<string> {
    // Log the updater wallet's address and balance
    const { address } = rewardsUpdaterAddress;
    const balance = await ethers.provider.getBalance(address);
    console.log("\n   Updater wallet address:", address, "\n   Updater wallet balance:", balance.toString());

    // Get rewards data from the calculateRewardsForAllWallets function
    const { totalRewards, balances: rewardsForWallets } = await calculateRewardsForAllWallets();

    console.log("\n   Rewards to distribute this week:", Number(ethers.formatEther(totalRewards.toString())));

    // Check if total rewards exceed the weekly cap
    if (totalRewards <= REWARD_TOKENS_PER_WEEK) {
        // Extract wallet addresses and reward amounts
        const walletAddresses = Array.from(rewardsForWallets.keys());
        const walletRewards = Array.from(rewardsForWallets.values()).map(([rewardAmount]) => rewardAmount);

        // Log wallet addresses and rewards
        //console.log("walletAddresses:", walletAddresses, "\nwalletRewards:", walletRewards);

        // Ensure the addresses and rewards lists are of the same length
        if (walletAddresses.length === walletRewards.length) {
            try {
                // Send the batch update transaction
                const tx = await rewardsContract.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
                console.log("\n   [LOG]: Sending batch update transaction...");
                const updateRewardsBatchReceipt = await tx.wait(); // Wait for the transaction to be mined
                const events = updateRewardsBatchReceipt?.logs || [];

                let numberOfFailedUpdates = 0;

                for (const event of events) {
                    if (event.fragment.name === "RewardUpdateFailed") {
                        numberOfFailedUpdates++;
                    }
                }
                if (numberOfFailedUpdates == walletAddresses.length) {
                    console.error("   [ERROR]: All rewards failed to be updated. Check blockchain explorer logs for more details.");
                    return "   [ERROR]: All rewards failed to be updated. Check blockchain explorer logs for more details.";
                }
                if (numberOfFailedUpdates > 0) {
                    console.error("   [ERROR]: Some rewards failed to be updated. Check blockchain explorer logs for more details.");
                    return "   [ERROR]: Some rewards failed to be updated. Check blockchain explorer logs for more details.";
                }
            } catch (error) {
                console.error("   [ERROR]: Batch transaction failed:", error); // Handle transaction failure
                return "   [ERROR]: Batch transaction failed:" + error;
            }
        } else {
            console.error("   [ERROR]: Mismatch in wallet addresses and rewards length.");
            return "   [ERROR]: Mismatch in wallet addresses and rewards length.";
        }
    } else {
        console.error("   [ERROR]: Total rewards exceed the weekly limit.");
        return "   [ERROR]: Total rewards exceed the weekly limit.";
    }
    return "";
}


//Show the rewards of all wallets
async function showRewardsOfAllWallets(){

    console.log("\n   [LOG]: WALLETS AND REWARDS LIST");

    //Get the wallet addresses
    const walletAddresses = Array.from(((await calculateRewardsForAllWallets()).balances).keys());
    
    for (const address of walletAddresses) {

        const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await rewardsContract.wallets(address);

            console.log(`\n     Address: ${address}. Total rewards: ${Number(ethers.formatEther(totalHyaxRewardsAmount))}. Current rewards: ${Number(ethers.formatEther(currentRewardsAmount))}. Rewards withdrawn: ${rewardsWithdrawn}`);
    }
}

async function showRewardsSmartContractState() {

    console.log("\n   [LOG]: SMART CONTRACT STATE");
    console.log("\n     Rewards token funded:", Number(ethers.formatEther((await rewardsContract.rewardTokensFunded()).toString())));
    console.log("\n     Rewards token in smart contract:", Number(ethers.formatEther((await rewardsContract.rewardTokensInSmartContract()).toString())));
    console.log("\n     Rewards token distributed:", Number(ethers.formatEther((await rewardsContract.rewardTokensDistributed()).toString())));
    console.log("\n     Rewards token withdrawn:", Number(ethers.formatEther((await rewardsContract.rewardTokensWithdrawn()).toString())));
}

async function weeklyRewardDistributionSimulation() {

    const oneWeek = 7 * 24 * 60 * 60; // One week in seconds

    const totalWeeks = 416; // 8 years * 52 weeks = 416 weeks + 14 weeks for rounding errors = 430 weeks

    for (let i = 0; i < totalWeeks; i++) {

        // Wait for the specified time period to elapse (simulate one week)
        await ethers.provider.send("evm_increaseTime", [oneWeek]);
        await ethers.provider.send("evm_mine");
        console.log("\n   --------------------------------------------------------------------------------------------------------");
        console.log("\n   [LOG]: Year: ", Math.floor(i / 52), ". Week in year: ", i % 52, ". Absolute week: ", i);
        console.log("\n   --------------------------------------------------------------------------------------------------------");

        const updateRewardsBatchResult = await updateRewardsBatch();

        if (updateRewardsBatchResult != "") {
            console.error(updateRewardsBatchResult);
            return;
        }
        else {
            console.log("   [LOG]: Batch rewards updated successfully!");
        }

        await showRewardsOfAllWallets();

        //await new Promise(f => setTimeout(f, 5000));

        await showRewardsSmartContractState();
    }
}


async function main() {

    //////////////GET THE SIGNERS/////////////
    await getTheSigners();

    await withdrawRewardTokens();
}

main(); // Call the async function