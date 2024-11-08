import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #4. Fund Smart Contract with growth tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
        console.log("\n   [Log]: Deploying UpgradeableHYAXRewards...");

        // Deploy proxy with 'initialize' function
        const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [await hyaxToken.target], { initializer: 'initialize' });

        await upgradeableHYAXRewards.waitForDeployment();
        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("4.1. Should fail to fund the contract with growth tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'AccessControlUnauthorizedAccount');
    });

    it("4.2. Should fail to fund the contract with growth tokens because its not approved", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(hyaxToken, 'ERC20InsufficientAllowance');
    });

    it("4.3. Should revert when funding with an invalid type of funding", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(3, fundingAmount)
        ).to.be.reverted;
    });

    it("4.4. Should revert when funding with an invalid amount", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const invalidAmount = ethers.parseUnits("0", 18); // Invalid amount

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, invalidAmount)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("4.5. Should successfully fund the contract with growth tokens with a specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the current balance of growth tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.growthTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1000000000", 18));
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("4.6. Should update the growthTokensFundingStarted variable to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Check if the growthTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.growthTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("4.7. Should update the total value of growthTokensFunded", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevGrowthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();
        console.log("\n   [Log]: PrevGrowthTokensFunded:", prevGrowthTokensFunded);
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the value of growthTokensFunded
        const newGrowthTokensFunded = prevGrowthTokensFunded + fundingAmount;
        console.log("   [Log]: NewGrowthTokensFunded:", newGrowthTokensFunded);
        const growthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();

        // Check if the growthTokensStartFundingTime and growthTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(growthTokensFunded).to.equal(newGrowthTokensFunded);
    });

    it("4.8. Should update the times of growthTokensStartFundingTime and growthTokensLastWithdrawalTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Get the growthTokensStartFundingTime and growthTokensLastWithdrawalTime
        const growthTokensStartFundingTime = await upgradeableHYAXRewards.growthTokensStartFundingTime();
        console.log("\n   [Log]: GrowthTokensStartFundingTime:", growthTokensStartFundingTime);
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        console.log("   [Log]: GrowthTokensLastWithdrawalTime:", growthTokensLastWithdrawalTime);

        // Check if the growthTokensStartFundingTime and growthTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(growthTokensStartFundingTime).to.equal(timestampOfBlockBefore);
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);
    });

    it("4.9. Should revert when funding with an amout above the total intended for growth tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("2500000000", 18); // Fund with (2.5B) 2,500,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intended for growth tokens');
    });

    it("4.10. Should successfully fund the contract with growth tokens with the total intended amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the current balance of growth tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.growthTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("2400000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("2400000000", 18));
    });
});
