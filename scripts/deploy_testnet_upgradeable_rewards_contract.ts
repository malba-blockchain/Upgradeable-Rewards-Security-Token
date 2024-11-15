import { ethers, upgrades } from 'hardhat'; // Import the ethers object from Hardhat

require('dotenv').config(); // Load environment variables from a .env file

async function main() {
    
    const smartContractToDeploy = 'UpgradeableHYAXRewards'; // Define the name of the smart contract to deploy

    const HYAXSmartContractAddress = "0x4805e72439d34555CB7DDa729341215f7994000D";
    
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
    //const txSmartContractDeployment = await smartContractFactory.getDeployTransaction(HYAXSmartContractAddress);

    // This line deploys the upgradeable contract proxy using the `upgrades.deployProxy` function.
    // The function likely takes the contract factory, an array of constructor arguments (`[42]` in this case),
    // and an optional object with deployment configuration (`{ initializer: "store" }`).
    //const txSmartContractDeployment = await upgrades.deployProxy(smartContractFactory, { initializer: 'initialize' });
    
    const txSmartContractDeployment = await upgrades.deployProxy(
        smartContractFactory, 
        [HYAXSmartContractAddress], // Pass the parameter(s) as an array
        { initializer: 'initialize' }
    );

    console.log("\nUpgradeable smart contract deployed: ", smartContractToDeploy);

    // This line logs the address of the deployed upgradeable contract proxy to the console.
    console.log("\nContract deployed at address: ", txSmartContractDeployment.target);

    // Get the ABI of the deployed smart contract
    const smartContractAbi = smartContractFactory.interface.formatJson();

    console.log("smartContractAbi", smartContractAbi); // Log the ABI of the smart contract

    // Create a contract instance with the deployed contract address, ABI, and deployer wallet
    const smartContractInstance = await new ethers.Contract(txSmartContractDeployment.target, smartContractAbi, deployerWallet);

    console.log("Contract deployed at address:", smartContractInstance.target); // Log the target address of the deployed contract instance
}

main()
    .then(() => process.exit(0)) // Exit the process with code 0 (success) if the script runs successfully
    .catch(error => { // Catch any errors that occur during execution
        console.error(error); // Log the error
        process.exit(1); // Exit the process with code 1 (failure)
    });
