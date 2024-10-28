import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { Alchemy, Network } from "alchemy-sdk";

dotenv.config();

// Define the constant values to interact with the smart contract
const SMART_CONTRACT_NETWORK = Network.MATIC_AMOY;

const AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN = 2.2;

const { TOKEN_SMART_CONTRACT_ADDRESS, REWARDS_SMART_CONTRACT_ADDRESS } = require('../utils/addresses.ts');

const { TOKEN_SMART_CONTRACT_ABI, REWARDS_SMART_CONTRACT_ABI } = require('../utils/abi.ts');

const REWARD_TOKENS_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

const REWARD_TOKENS_PER_WEEK =  REWARD_TOKENS_PER_YEAR / 52; // 150 Million tokens divided by 52 weeks

//Create a provider to connect to the blockchain and be able to query it
const alchemyProvider = new ethers.JsonRpcProvider(process.env.REACT_APP_POLYGON_AMOY_RPC_URL);

//Create an instance of the token contract to interact with it
const tokenContract = new ethers.Contract(TOKEN_SMART_CONTRACT_ADDRESS, TOKEN_SMART_CONTRACT_ABI, alchemyProvider);

//Create an instance of the rewards contract to interact with it
const rewardsContract = new ethers.Contract(REWARDS_SMART_CONTRACT_ADDRESS, REWARDS_SMART_CONTRACT_ABI, alchemyProvider);

// Create a wallet instance using the private key from .env
const rewardsUpdaterWalletInstance = new ethers.Wallet(process.env.REACT_APP_REWARDS_UPDATER_PRIVATE_KEY || "");

// Connect the wallet to the provider
const rewardsUpdaterWallet = rewardsUpdaterWalletInstance.connect(alchemyProvider);

const alchemy = new Alchemy({
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY, // Replace with your Alchemy API key
    network: SMART_CONTRACT_NETWORK, // Adjust the network if needed
});


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
        const { isWhitelisted, isBlacklisted } = await rewardsContract.wallets(holder);
        // If the holder is whitelisted and not blacklisted, add them to the whitelisted set
        if (isWhitelisted && !isBlacklisted) whitelistedTokenHolders.add(holder);
    }));

    // Return the set of whitelisted token holders
    return whitelistedTokenHolders;
}


//Get the token balances and total holdings of the whitelisted investor wallets
async function getTokenBalancesInvestors(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    // Fetch all whitelisted token holders
    const whitelistedTokenHolders = await getAllWhitelistedInvestorWallets();

    // Get the current block number and compute the number of blocks in a week
    const currentBlockNumber  = await alchemy.core.getBlockNumber();
    const blocksInAWeek = Math.floor(7 * 24 * 60 * 60 / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);

    // Define target block number as the current block for now (can change if historical data is needed)
    const targetBlockNumber = currentBlockNumber - blocksInAWeek; // Change to currentBlock - blocksInAWeek for last week's data

    //Fetch the block details for the target block number
    console.log("   [Log]: Current block number: ", currentBlockNumber);
    console.log("   [Log]: Target block number: ", targetBlockNumber);

    const currentBlock = await alchemy.core.getBlock(currentBlockNumber);
    const currentBlockDate = new Date(currentBlock.timestamp * 1000); // Convert timestamp to milliseconds
    console.log("   [Log]: Current block date: ", currentBlockDate.toISOString());
    
    const targetBlock = await alchemy.core.getBlock(targetBlockNumber);
    const targetBlockDate = new Date(targetBlock.timestamp * 1000); // Convert timestamp to milliseconds
    console.log("   [Log]: Target block date: ", targetBlockDate.toISOString());

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


//Get the token balances and total holdings of the whitelisted team wallets
async function getTokenBalancesTeam(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    
    // Retrieve all whitelisted team wallets
    const whitelistedTeamWallets = await getAllWhitelistedTeamWallets();

    // Initialize the total token holdings counter and map for storing balances
    let totalTokenHoldings = 0;
    const balances = new Map<string, number>();

    // Get the current block number and compute the number of blocks in a week
    const currentBlockNumber = await alchemy.core.getBlockNumber();
    const blocksInAWeek = Math.floor(7 * 24 * 60 * 60 / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);
    
    // Define target block number as the current block for now (can change if historical data is needed)
    const targetBlockNumber = currentBlockNumber - blocksInAWeek; // Change to currentBlock - blocksInAWeek for last week's data

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

    console.log("\n   [LOG]: EXECUTION OF BATCH UPDATE");

    console.log("\n   Updater wallet address:", rewardsUpdaterWallet.address, 
                "\n   Updater wallet balance:", await alchemyProvider.getBalance(rewardsUpdaterWallet.address));

    // Get rewards data from the calculateRewardsForAllWallets function
    const { totalRewards, balances: rewardsForWallets } = await calculateRewardsForAllWallets();

    console.log("\n   Rewards to distribute this week:", Number(ethers.formatEther(totalRewards.toString())));

    // Check if total rewards exceed the weekly cap
    if (totalRewards <= REWARD_TOKENS_PER_WEEK) {
        // Extract wallet addresses and reward amounts
        const walletAddresses = Array.from(rewardsForWallets.keys());
        const walletRewards = Array.from(rewardsForWallets.values()).map(([rewardAmount]) => rewardAmount);

        // Ensure the addresses and rewards lists are of the same length
        if (walletAddresses.length === walletRewards.length) {
            try {
                // Send the batch update transaction
                const tx = await rewardsContract.connect(rewardsUpdaterWallet).updateRewardsBatch(walletAddresses, walletRewards);
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
async function automateWeeklyRewardsDistribution() {
    // Calculate the total number of weeks to simulate, assuming 8 years with 52 weeks per year, plus 14 weeks for rounding errors.
    const totalWeeks = 430; // 8 years * 52 weeks = 416 weeks + 14 weeks for rounding errors = 430 weeks
    
    // Loop through each week to simulate the reward distribution process.
    for (let i = 0; i < totalWeeks; i++) {

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
            console.log("   [LOG]: Batch rewards updated successfully!");
        }

        // Show the rewards of all wallets after the batch update.
        await showRewardsOfAllWallets();

        const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

        await new Promise(f => setTimeout(f, oneWeek));
    }
}

async function main() {

    await automateWeeklyRewardsDistribution();
}

main(); // Call the async function