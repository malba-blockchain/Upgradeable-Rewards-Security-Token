import { ethers } from 'hardhat'; // Import the ethers object from Hardhat

import { Wallet } from 'ethers'; // Import the Wallet class from the ethers library

require('dotenv').config(); // Load environment variables from a .env file

async function main() {

    const smartContractToDeploy = 'UpgradeableHYAXRewards'; // Define the name of the smart contract to deploy

    const HYAXSmartContractAddress = "0xCd1fA2C8626B023197158aC84C5DF56EDD1F3f0C";
    
    // Connect to the custom JsonRpcProvider for PolygonAmoy using Alchemy API
    const provider = new ethers.JsonRpcProvider(`https://polygon-amoy.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`);

    const wallet = new ethers.Wallet(process.env.REACT_APP_SIGNER_PRIVATE_KEY || ""); // Create a wallet instance using the private key from .env

    const deployerWallet = wallet.connect(provider); // Connect the wallet to the provider

    console.log("\nDeployer wallet address: ", deployerWallet.address); // Log the deployer wallet's address

    console.log("\nDeployer wallet balance: ", await provider.getBalance(deployerWallet.address)); // Log the deployer wallet's balance

    console.log("\nCreating deployment transaction..."); // Log that the deployment transaction is being created

    // Get a contract factory for the smart contract to deploy, connected with the deployer's wallet
    const smartContractFactory = await ethers.getContractFactory(smartContractToDeploy, deployerWallet);

    // Get the deployment transaction data for the smart contract
    const txSmartContractDeployment = await smartContractFactory.getDeployTransaction(HYAXSmartContractAddress);

    //txSmartContractDeployment.to = null; // Ensure the transaction is for deploying a contract, not sending to an address
    txSmartContractDeployment.value = ethers.parseEther("0"); // Set the transaction value to 0 Ether
    txSmartContractDeployment.gasLimit = BigInt(5000000); // Set the gas limit for the deployment
    txSmartContractDeployment.maxPriorityFeePerGas = ethers.parseUnits("20", "gwei"); // Set the maximum priority fee per gas
    txSmartContractDeployment.maxFeePerGas = ethers.parseUnits("25", "gwei"); // Set the maximum fee per gas
    txSmartContractDeployment.nonce = await provider.getTransactionCount(deployerWallet.address, "latest"), // Set the nonce for the transaction
    txSmartContractDeployment.type = 2; // Set the transaction type to EIP-1559 (type 2)
    txSmartContractDeployment.chainId = BigInt(80002); // Set the chain ID to 80002 (PolygonAmoy testnet)

    // Sign the deployment transaction with the deployer's wallet
    const signedTxSmartContractDeployment = await deployerWallet.signTransaction(txSmartContractDeployment);

    console.log("\nDeploying smart contract..."); // Log that the smart contract is being deployed

    // Broadcast the signed transaction to the network
    const sendSignedTxSmartContractDeployment = await provider.broadcastTransaction(signedTxSmartContractDeployment);

    console.log("\nTransaction hash:", sendSignedTxSmartContractDeployment.hash); // Log the transaction hash

    console.log("\nWait a minute for the transaction to be mined..."); // Log that the script is waiting for the transaction to be mined

    // Wait for the transaction to be mined and get the receipt
    const transactionReceipt = await sendSignedTxSmartContractDeployment.wait();

    console.log("Contract deployed at address:", transactionReceipt.contractAddress); // Log the deployed contract's address

    // Get the ABI of the deployed smart contract
    const smartContractAbi = smartContractFactory.interface.formatJson();

    console.log("smartContractAbi", smartContractAbi); // Log the ABI of the smart contract

    // Create a contract instance with the deployed contract address, ABI, and deployer wallet
    const smartContractInstance = await new ethers.Contract(transactionReceipt.contractAddress, smartContractAbi, deployerWallet);

    console.log("Contract deployed at address:", smartContractInstance.target); // Log the target address of the deployed contract instance
}

main()
    .then(() => process.exit(0)) // Exit the process with code 0 (success) if the script runs successfully
    .catch(error => { // Catch any errors that occur during execution
        console.error(error); // Log the error
        process.exit(1); // Exit the process with code 1 (failure)
    });
