import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { Alchemy, Network } from "alchemy-sdk";

dotenv.config();


// Define the constant values to interact with the smart contract

const SMART_CONTRACT_NETWORK = Network.MATIC_AMOY;

const AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN = 2.1;

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

const alchemy = new Alchemy({
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY, // Replace with your Alchemy API key
    network: SMART_CONTRACT_NETWORK, // Adjust the network if needed
});


// Function to get all unique holders of a token by querying the Transfer events.
async function getAllTokenHolders(): Promise<Set<string>> {

    //Create a filter that allows you to see all events and get all transfers no matter the from nor the to
    const transferEventFilter = tokenContract.filters.Transfer(null, null);

    //Now add the filter the restriction of until 1 week ago
    const oneWeekAgoTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    (transferEventFilter as any).fromBlock = 0;
    //(transferEventFilter as any).toBlock = oneWeekAgoTimestamp; //BLOCK FROM A WEEK AGO

    //Get the whole list of transfer events, query filter helps determine the range of blocks to to the query
    const transferEvents = await tokenContract.queryFilter(transferEventFilter);

    //Create a set to store the addresses because a set doesn't store repeated values
    const holders: Set<string> = new Set();

    transferEvents.forEach((event) => {

        if ("args" in event) { //Ensure the event has the expected arguments
            const { from, to } = event.args; //Destructure from and to addresses from the event

            if (from !== ethers.ZeroAddress) holders.add(from); //Add the from address if its not a minting transaction

            holders.add(to); //Always add the to address
        }
    });

    return holders;
}


async function getAllWhitelistedTokenHolders(): Promise<Set<string>> {

    var allTokenHolders = await getAllTokenHolders();

    var whitelistedTokenHolders: Set<string> = new Set();

    for (const tokenHolder of allTokenHolders) {
        //Check the address is in the whitelist
        const [isWhiteListed, isQualifiedInvestor, totalHyaxBoughtByInvestor, totalUsdDepositedByInvestor] 
            = await tokenContract.investorData(tokenHolder);
        if (isWhiteListed == true) {
            whitelistedTokenHolders.add(tokenHolder);
        }
    }

    return whitelistedTokenHolders;
}

async function getTokenBalancesAndTotalHoldings(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    
    const whitelistedTokenHolders = await getAllWhitelistedTokenHolders();

    let totalHoldingsLastWeek = 0;

    let whitelistedAddressesAndBalances = new Map<string, number>();

    const currentBlock = await alchemy.core.getBlockNumber();

    const secondsInAWeek = 7 * 24 * 60 * 60;

    const blocksInAWeek = Math.floor(secondsInAWeek / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);

    //const targetBlockNumber = currentBlock - blocksInAWeek; //BLOCK IN A WEEK AGO

    const targetBlockNumber = currentBlock;

    console.log("[Log]: Block target number: ", targetBlockNumber);

    const block = await alchemy.core.getBlock(targetBlockNumber);

    const blockDate = new Date(block.timestamp * 1000); // Convert timestamp to milliseconds
    console.log("[Log]: Block date: ", blockDate.toISOString());

    for (const whiteListedtokenHolder of whitelistedTokenHolders) {
 
        const balance = await tokenContract.balanceOf(whiteListedtokenHolder, {
            blockTag: targetBlockNumber, // Fetch at a specific block
          });

        const formattedBalance = Number(ethers.formatEther(balance.toString()));

        whitelistedAddressesAndBalances.set(whiteListedtokenHolder,formattedBalance);

        totalHoldingsLastWeek += formattedBalance;
    }

   return { balances: whitelistedAddressesAndBalances, totalTokenHoldings: totalHoldingsLastWeek }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
//CALCULUS FOR TEAM WALLETS
////////////////////////////////////////////////////////////////////////////////////////////////////

async function getAllTeamWallets(): Promise<Set<string>> {

    // Create a filter for WalletAddedToWhitelist events with no specific parameters
    const transferEventFilter = rewardsContract.filters.WalletAddedToWhitelist(null, null, null, null);

    // Calculate the timestamp for 1 week ago to filter events up to that point
    const oneWeekAgoTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // Set the filter to start from the first block (0) and end at the block corresponding to 1 week ago
    (transferEventFilter as any).fromBlock = 0;
    //(transferEventFilter as any).toBlock = oneWeekAgoTimestamp; //BLOCK FROM A WEEK AGO

    // Query the blockchain for events that match the filter
    const addToWhitelistEvents = await rewardsContract.queryFilter(transferEventFilter);

    //Create a set to store the addresses because a set doesn't store repeated values
    const teamWallets: Set<string> = new Set();

    addToWhitelistEvents.forEach((event) => {

        if ("args" in event) { //Ensure the event has the expected arguments
            const [ sender, walletAddress, isTeamWallet, hyaxHoldingAmount ] = event.args; //Destructure from and to addresses from the event
            
            if (isTeamWallet == true) 
            {
                teamWallets.add(walletAddress); //Add the from address if its not a minting transaction
            }     
        }
    });

    return teamWallets;
}


async function getAllWhitelistedTeamWallets(): Promise<Set<string>> {

    var allTeamWallets = await getAllTeamWallets();

    var whitelistedTeamWallets: Set<string> = new Set();

    for (const teamWallet of allTeamWallets) {
        //Check the address is in the whitelist
        const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await rewardsContract.wallets(teamWallet);

        if (isWhitelisted == true && isBlacklisted == false ) {
            whitelistedTeamWallets.add(teamWallet);
        }
    }

    return whitelistedTeamWallets;
}


async function getTokenBalancesAndTotalHoldingsTeam(): Promise<{ balances: Map<string, number>, totalTokenHoldings: number }> {
    
    const whitelistedTeamWallets = await getAllWhitelistedTeamWallets();

    let totalTeamHoldingsLastWeek = 0;

    let whitelistedTeamAddressesAndBalances = new Map<string, number>();

    const currentBlock = await alchemy.core.getBlockNumber();

    const secondsInAWeek = 7 * 24 * 60 * 60;

    const blocksInAWeek = Math.floor(secondsInAWeek / AVERAGE_BLOCK_TIME_IN_BLOCKCHAIN);

    //const targetBlockNumber = currentBlock - blocksInAWeek; //BLOCK IN A WEEK AGO

    const targetBlockNumber = currentBlock;

    console.log("[Log]: Block target number: ", targetBlockNumber);

    const block = await alchemy.core.getBlock(targetBlockNumber);

    const blockDate = new Date(block.timestamp * 1000); // Convert timestamp to milliseconds
    console.log("[Log]: Block date: ", blockDate.toISOString());

    for (const whiteListedTeamtokenHolder of whitelistedTeamWallets) {

        const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await rewardsContract.wallets(whiteListedTeamtokenHolder,{
                blockTag: targetBlockNumber, // Fetch at a specific block
            });

        const formattedBalance = Number(ethers.formatEther(hyaxHoldingAmountAtWhitelistTime.toString()));

        whitelistedTeamAddressesAndBalances.set(whiteListedTeamtokenHolder,formattedBalance);

        totalTeamHoldingsLastWeek += formattedBalance;
    }

   return { balances: whitelistedTeamAddressesAndBalances, totalTokenHoldings: totalTeamHoldingsLastWeek }
}

async function calculateRewardsForTeamWallets(): Promise<{ balances: Map<string, [bigint, number]>, totalRewards: bigint }> {
    
    let totalRewards = BigInt(0); 

    let totalPercentage = 0.0;

    //Mapping stores rewards per wallet and percentage of those rewards
    let rewardsForWallets = new Map<string, [bigint, number]>();

    const tokenHoldingsInvestors = (await getTokenBalancesAndTotalHoldings()).totalTokenHoldings;

    const tokenHoldingsTeam = (await getTokenBalancesAndTotalHoldingsTeam()).totalTokenHoldings;


    const tokenBalancesInvestors = (await getTokenBalancesAndTotalHoldings()).balances;
    
    const tokenBalancesTeam = (await getTokenBalancesAndTotalHoldingsTeam()).balances;


    const totalTokenBalances = new Set([...tokenBalancesInvestors, ...tokenBalancesTeam]);

    const totalTokenHoldings = tokenHoldingsInvestors + tokenHoldingsTeam;


    for (const balanceTokenHolder of totalTokenBalances) {

        const percentageRewards = balanceTokenHolder[1] / totalTokenHoldings;

        // Convert the product of percentageRewards and REWARD_TOKENS_PER_WEEK to a string to avoid overflow
        const amountRewards = BigInt(percentageRewards * REWARD_TOKENS_PER_WEEK);
        
        console.log("\nAddress: ", balanceTokenHolder[0], ". Token rewards: ", Number(ethers.formatEther(amountRewards.toString())) ,
            ". Percentage: ", percentageRewards*100, "%");
        
        totalRewards += amountRewards;

        totalPercentage += percentageRewards;

        rewardsForWallets.set(balanceTokenHolder[0], [amountRewards, percentageRewards]);
    }

    console.log("\nPercentage rewards: ", totalPercentage*100, "%");
    console.log("Expected rewards:", REWARD_TOKENS_PER_WEEK);
    console.log("Distributed rewards: ",  Number(ethers.formatEther(totalRewards.toString())) );

    return { balances: rewardsForWallets, totalRewards: totalRewards }
}

async function main() {
    /*
    console.log("\nList of all token holders");
    const allTokenHolders = await getAllTokenHolders();
    console.log(allTokenHolders);

    console.log("\nList of all whitelisted token holders");   
    const whitelistedTokenHolders = await getAllWhitelistedTokenHolders();
    console.log(whitelistedTokenHolders);
    

    console.log("\nTotal holdings last week");
    const totalTokenHoldings = (await getTokenBalancesAndTotalHoldings()).totalTokenHoldings;
    console.log(totalTokenHoldings);

    console.log("\nList of all team wallets");
    const allTeamWallets = await getAllTeamWallets();
    console.log(allTeamWallets);

    console.log("\nList of all whitelisted team wallets");  
    const whitelistedTeamWallets = await getAllWhitelistedTeamWallets();
    console.log(whitelistedTeamWallets);

    console.log("\nTotal team holdings last week");
    const totalTeamTokenHoldings = (await getTokenBalancesAndTotalHoldingsTeam()).totalTokenHoldings;
    console.log(totalTeamTokenHoldings);
    */

    console.log("\nList of whitelisted token holders and their balances");  
    const tokenBalances = (await getTokenBalancesAndTotalHoldings()).balances;
    console.log(tokenBalances);

    console.log("\nList of whitelisted team token holders and their balances");  
    const tokenTeamBalances = (await getTokenBalancesAndTotalHoldingsTeam()).balances;
    console.log(tokenTeamBalances);

    await calculateRewardsForTeamWallets();

}

main(); // Call the async function