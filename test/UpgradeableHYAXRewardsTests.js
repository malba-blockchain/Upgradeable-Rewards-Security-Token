const { loadFixture, } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Testing Use Case #1: Constructor", function () {

    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("1.1. Should deploy with correct initial state", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Should deploy with the correct owner
        expect(await upgradeableHYAXRewards.owner()).to.equal(owner.address);

    });

    it("1.2. Should have correct initial parameters", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Should deploy with the correct hyax token address
        expect(await upgradeableHYAXRewards.hyaxTokenAddress()).to.equal(await hyaxToken.target);
    });

    it("1.3. Should reject deployment with invalid parameters", async function () {
        const [owner] = await ethers.getSigners();

        //Deploy the USDC token mock
        const usdcToken = await ethers.deployContract("USDCToken");

        const invalidHyaxTokenAddress = usdcToken.target; // Example of an invalid parameter

        await expect(ethers.deployContract("UpgradeableHYAXRewards", [invalidHyaxTokenAddress])
        ).to.be.revertedWith("Hyax token address is not valid"); // Replace with actual error message
    });
});


describe("Testing Use Case #4: Fund Smart Contract", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should fail to fund the contract with growth tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens
        
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("Should fail to fund the contract with growth tokens because its not approved", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(hyaxToken, 'ERC20InsufficientAllowance');
    });

    it("Should successfully fund the contract with growth tokens with a specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens
        
        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Fund the smart contract with growth tokens (FundingType.GrowthTokens is represented by 0)
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the current balance of growth tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.growthTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);
    });

    it("Should successfully fund the contract with a specified amount and type", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingType = "TeamRewards";
        const fundingAmount = ethers.parseUnits("1000", 18); // Replace with appropriate unit

        await upgradeableHYAXRewards.fundSmartContract(fundingType, fundingAmount);

        const contractBalance = await upgradeableHYAXRewards.getContractBalance(fundingType);
        expect(contractBalance).to.equal(fundingAmount);
    });

    it("Should only allow the owner to fund the contract", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingType = "TeamRewards";
        const fundingAmount = ethers.parseUnits("1000", 18); // Replace with appropriate unit

        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(fundingType, fundingAmount)
        ).to.be.revertedWith("Ownable: caller is not the owner"); // Replace with actual error message
    });

    it("Should revert when funding with an invalid amount", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingType = "TeamRewards";
        const invalidAmount = ethers.parseUnits("0", 18); // Example of invalid amount

        await expect(
            upgradeableHYAXRewards.fundSmartContract(fundingType, invalidAmount)
        ).to.be.revertedWith("Invalid amount"); // Replace with actual error message
    });

    it("Should correctly allocate funds based on the specified funding type", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const teamRewardsAmount = ethers.parseUnits("1000", 18);
        const investorRewardsAmount = ethers.parseUnits("500", 18);

        // Fund the contract with different types
        await upgradeableHYAXRewards.fundSmartContract("TeamRewards", teamRewardsAmount);
        await upgradeableHYAXRewards.fundSmartContract("InvestorRewards", investorRewardsAmount);

        // Verify allocations
        const teamRewardsBalance = await upgradeableHYAXRewards.getContractBalance("TeamRewards");
        const investorRewardsBalance = await upgradeableHYAXRewards.getContractBalance("InvestorRewards");

        expect(teamRewardsBalance).to.equal(teamRewardsAmount);
        expect(investorRewardsBalance).to.equal(investorRewardsAmount);
    });

    it("Should handle or reject excess funding appropriately", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingType = "TeamRewards";
        const excessiveAmount = ethers.parseUnits("1000000", 18); // Example of excessive amount

        // Assuming there is a limit on the amount, this should be tested accordingly
        await expect(
            upgradeableHYAXRewards.fundSmartContract(fundingType, excessiveAmount)
        ).to.be.revertedWith("Funding amount exceeds the limit"); // Replace with actual error message or handling
    });
});
