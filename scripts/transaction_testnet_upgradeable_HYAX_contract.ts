import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { Alchemy, Network } from "alchemy-sdk";

dotenv.config();

// Define the constant values to interact with the smart contract
const SMART_CONTRACT_NETWORK = Network.MATIC_AMOY;

const { TOKEN_SMART_CONTRACT_ADDRESS, REWARDS_SMART_CONTRACT_ADDRESS } = require('../utils/addresses.ts');

const { TOKEN_SMART_CONTRACT_ABI, REWARDS_SMART_CONTRACT_ABI } = require('../utils/abi.ts');

//Create a provider to connect to the blockchain and be able to query it
const alchemyProvider = new ethers.JsonRpcProvider(process.env.REACT_APP_POLYGON_AMOY_RPC_URL);

//Create an instance of the token contract to interact with it
const tokenContract = new ethers.Contract(TOKEN_SMART_CONTRACT_ADDRESS, TOKEN_SMART_CONTRACT_ABI, alchemyProvider);

//Create an instance of the rewards contract to interact with it
const rewardsContract = new ethers.Contract(REWARDS_SMART_CONTRACT_ADDRESS, REWARDS_SMART_CONTRACT_ABI, alchemyProvider);

// Create whitelister wallet instance using the private key from .env
const whitelisterWalletInstance = new ethers.Wallet(process.env.REACT_APP_WHITELISTER_PRIVATE_KEY || "");

// Connect the whitelister wallet to the provider
const whitelisterWallet = whitelisterWalletInstance.connect(alchemyProvider);

// Create a instance using the private key from .env
const ownerWalletInstance = new ethers.Wallet(process.env.REACT_APP_SIGNER_PRIVATE_KEY || "");

// Connect the wallet to the provider
const ownerWallet = ownerWalletInstance.connect(alchemyProvider);

const alchemy = new Alchemy({
    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY, // Replace with your Alchemy API key
    network: SMART_CONTRACT_NETWORK, // Adjust the network if needed
});


async function getInvestorData() {

    console.log("\n Owner wallet address: ", ownerWallet.address); // Log the deployer wallet's address

    console.log("\n Owner wallet balance: ", await alchemyProvider.getBalance(ownerWallet.address)); // Log the deployer wallet's balance

    var investorData = await tokenContract.investorData(ownerWallet.address);

    console.log("\n Investor data: ", investorData);
}

async function investFromCryptoToken() {

    console.log("\n Owner wallet address: ", ownerWallet.address); // Log the deployer wallet's address
    
    console.log("\n Owner wallet balance: ", await alchemyProvider.getBalance(ownerWallet.address)); // Log the deployer wallet's balance

    //0:MATIC - 1:USDC - 2:USDT - 3:WBTC - 4:WETH
    const tokenType = 3;

    const amount = "1000000000000000000";

    const tx = await tokenContract.connect(ownerWallet).investFromCryptoToken(tokenType, amount);

    console.log("Waiting for transaction to finish...");

    const receipt = await tx.wait();

    console.log(receipt);
}



async function main() {

    await investFromCryptoToken();

}

main(); // Call the async function