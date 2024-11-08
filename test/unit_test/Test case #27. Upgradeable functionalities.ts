import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #27. Upgradeable functionalities", function () {
    // Create fixture to deploy smart contract and set initial variables
    async function deployContractAndSetVariables() {
        const [owner, addr1, addr2, addr3, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
        console.log("\n   [Log]: Deploying UpgradeableHYAXRewards...");

        // Deploy proxy with 'initialize' function
        const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [await hyaxToken.target], { initializer: 'initialize' });

        await upgradeableHYAXRewards.waitForDeployment();

        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress };
    }
    it("27.1. Should deploy the proxy contract successfully", async function () {
        const { upgradeableHYAXRewards } = await deployContractAndSetVariables();

        // Verify that the proxy contract has a valid address
        expect(await upgradeableHYAXRewards.getAddress()).to.properAddress;
    });

    it("27.2. Should initialize with the correct team tokens total", async function () {
        const { upgradeableHYAXRewards } = await deployContractAndSetVariables();
        const teamTokensTotal = await upgradeableHYAXRewards.TEAM_TOKENS_TOTAL();

        // Verify that the total team tokens is initialized to 1,500,000,000 HYAX tokens
        expect(teamTokensTotal).to.equal(ethers.parseEther("1500000000"));
    });

    it("27.3. Should transfer growth tokens to the contract address", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await deployContractAndSetVariables();

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount);

        // Get the initial balance of the smart contract
        const contractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

       // Expect the total of tokens in the smart contract to be 1,000,000,000 HYAX tokens
        expect(contractBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });
    
    it("27.4. Should allow upgrading the contract", async function () {

        const { upgradeableHYAXRewards, hyaxToken, owner } = await deployContractAndSetVariables();

        const UpgradeableHYAXRewardsV2 = await ethers.getContractFactory('UpgradeableHYAXRewardsV2');
        const upgradedHyaxRewards = await upgrades.upgradeProxy(upgradeableHYAXRewards.target, UpgradeableHYAXRewardsV2);

        // Verify that the upgraded contract maintains the same address as the original proxy
        expect(await upgradedHyaxRewards.getAddress()).to.equal(await upgradeableHYAXRewards.getAddress());
    });

    it("27.5. Should maintain state after upgrade", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await deployContractAndSetVariables();

        const UpgradeableHYAXRewardsV2 = await ethers.getContractFactory('UpgradeableHYAXRewardsV2');
        const upgradedHyaxRewards = await upgrades.upgradeProxy(upgradeableHYAXRewards.target, UpgradeableHYAXRewardsV2);

        const teamTokensTotal = await upgradeableHYAXRewards.TEAM_TOKENS_TOTAL();

        // Verify that the team tokens total remains unchanged after the upgrade
        expect(teamTokensTotal).to.equal(ethers.parseEther("1500000000"));
    });

    it("27.6. Should allow calling new functions after upgrade", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await deployContractAndSetVariables();

        const UpgradeableHYAXRewardsV2 = await ethers.getContractFactory('UpgradeableHYAXRewardsV2');
        const upgradedHyaxRewards = await upgrades.upgradeProxy(upgradeableHYAXRewards.target, UpgradeableHYAXRewardsV2);

        // Verify that the new function added in V2 returns "New function in V2"
        expect(await upgradedHyaxRewards.newFunction()).to.equal("New function in V2");
    });

    it("27.7. Should not allow initialization after deployment", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await deployContractAndSetVariables();

        // Verify that attempting to initialize an already initialized contract reverts
        await expect(upgradeableHYAXRewards.initialize(hyaxToken.target)).to.be.revertedWithCustomError(upgradeableHYAXRewards, "InvalidInitialization()");
    });

    it("27.8. Should have different state in implementation contract", async function () {
        const { upgradeableHYAXRewards, owner } = await deployContractAndSetVariables();

        const implementationAddress = await upgrades.erc1967.getImplementationAddress(upgradeableHYAXRewards.target);
        const UpgradeableHYAXRewardsV2 = await ethers.getContractFactory('UpgradeableHYAXRewardsV2');
        const implementationContract = UpgradeableHYAXRewardsV2.attach(implementationAddress);

        // Verify that the implementation contract has an uninitialized state separate from the proxy
        const implMaximumBatchSizeForUpdateRewards = await implementationContract.maximumBatchSizeForUpdateRewards();
        const proxyMaximumBatchSizeForUpdateRewards = await upgradeableHYAXRewards.maximumBatchSizeForUpdateRewards();

        // Expect the implementation contract to have an uninitialized state
        expect(implMaximumBatchSizeForUpdateRewards).to.not.equal(proxyMaximumBatchSizeForUpdateRewards);
        expect(implMaximumBatchSizeForUpdateRewards).to.equal(0); // Implementation contract should have uninitialized state
    });

    it("27.9. Should allow admin to upgrade the contract", async function () {
        const { upgradeableHYAXRewards, deployer } = await deployContractAndSetVariables();
        const UpgradeableHYAXRewardsV2 = await ethers.getContractFactory('UpgradeableHYAXRewardsV2');

        // Attempt to upgrade the contract as the admin and expect it to not revert
        await expect(upgrades.upgradeProxy(upgradeableHYAXRewards.target, UpgradeableHYAXRewardsV2)).to.not.be.reverted;
    });

    it("27.10. Should not allow non-admin to upgrade the contract", async function () {
        const { upgradeableHYAXRewards, addr1 } = await deployContractAndSetVariables();
        const UpgradeableHYAXRewardsV2 = await ethers.getContractFactory('UpgradeableHYAXRewardsV2', addr1);
        
        // Attempt to upgrade the contract as a non-admin and expect it to revert
        await expect(upgrades.upgradeProxy(upgradeableHYAXRewards.target, UpgradeableHYAXRewardsV2)).to.be.reverted;
    });
});