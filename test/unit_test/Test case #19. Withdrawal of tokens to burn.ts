import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #19. Withdrawal of tokens to burn", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
        console.log("\n   [Log]: Deploying UpgradeableHYAXRewards...");

        // Deploy proxy with 'initialize' function
        const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [await hyaxToken.target], { initializer: 'initialize' });

        await upgradeableHYAXRewards.waitForDeployment();

        // Update the whiteLister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress };
    }


    it("19.1. Should revert the withdraw of tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}  
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTokensToBurn(2, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'AccessControlUnauthorizedAccount');
    });

    it("19.2. Should revert the withdraw of tokens because its using an invalid type", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Tokens
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(3, fundingAmount)
        ).to.be.reverted;
    });

    it("19.3. Should revert the withdraw of Growth tokens because the amount is 0", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(0, 0)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("19.4. Should revert the withdraw of Growth tokens because the funding has not started yet", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const withdrawAmount = ethers.parseUnits("1000000", 18); // Withdraw (1M) 1,000,000 Team Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(0, withdrawAmount)
        ).to.be.revertedWith('Growth tokens funding has not started yet, no tokens to withdraw');
    });

    it("19.5. Should revert because of insufficient growth tokens in the contract to withdraw", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000", 18); // Fund with (1M) 1,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount);

        const withdrawAmount = ethers.parseUnits("10000000", 18); // Withdraw (10M) 10,000,000 Team Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(0, withdrawAmount)
        ).to.be.revertedWith('Insufficient growth tokens in the contract to withdraw');
    });

    it("19.6. Should successfully withdraw the growth tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount);

        const withdrawAmount = ethers.parseUnits("10000000", 18); // Withdraw (10M) 10,000,000 Growth Tokens

        //Balances before withdraw
        const growthTokensInSmartContractBeforeWithdraw = await upgradeableHYAXRewards.growthTokensInSmartContract();

        const smartContractBalanceBeforeWithdraw = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const ownerBalanceBeforeWithdraw = await hyaxToken.balanceOf(owner.address);

        // Execute the withdraw of growth tokens
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(0, withdrawAmount);

        //Balances after withdraw
        const growthTokensInSmartContractAfterWithdraw = await upgradeableHYAXRewards.growthTokensInSmartContract();

        const smartContractBalanceAfterWithdraw = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const ownerBalanceAfterWithdraw = await hyaxToken.balanceOf(owner.address);

        // Growth tokens in smart contract should be less by the withdraw amount
        expect(growthTokensInSmartContractBeforeWithdraw - growthTokensInSmartContractAfterWithdraw).to.equal(withdrawAmount);

        // Smart contract balance should be less by the withdraw amount
        expect(smartContractBalanceBeforeWithdraw - smartContractBalanceAfterWithdraw).to.equal(withdrawAmount);

        // Owner balance should be more by the withdraw amount
        expect(ownerBalanceAfterWithdraw - ownerBalanceBeforeWithdraw).to.equal(withdrawAmount);
    });

    it("19.7. Should revert the withdraw of Team tokens because the amount is 0", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(1, 0)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("19.8. Should revert the withdraw of Team tokens because the funding has not started yet", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const withdrawAmount = ethers.parseUnits("1000000", 18); // Withdraw (1M) 1,000,000 Team Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(1, withdrawAmount)
        ).to.be.revertedWith('Team tokens funding has not started yet, no tokens to withdraw');
    });

    it("19.9. Should revert because of insufficient team tokens in the contract to withdraw", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000", 18); // Fund with (1M) 1,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        const withdrawAmount = ethers.parseUnits("10000000", 18); // Withdraw (10M) 10,000,000 Team Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(1, withdrawAmount)
        ).to.be.revertedWith('Insufficient team tokens in the contract to withdraw');
    });

    it("19.10. Should successfully withdraw the team tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        const withdrawAmount = ethers.parseUnits("10000000", 18); // Withdraw (10M) 10,000,000 Team Tokens

        //Balances before withdraw
        const teamTokensInSmartContractBeforeWithdraw = await upgradeableHYAXRewards.teamTokensInSmartContract();

        const smartContractBalanceBeforeWithdraw = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const ownerBalanceBeforeWithdraw = await hyaxToken.balanceOf(owner.address);

        // Execute the withdraw of team tokens
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(1, withdrawAmount);

        //Balances after withdraw
        const teamTokensInSmartContractAfterWithdraw = await upgradeableHYAXRewards.teamTokensInSmartContract();

        const smartContractBalanceAfterWithdraw = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const ownerBalanceAfterWithdraw = await hyaxToken.balanceOf(owner.address);

        // Team tokens in smart contract should be less by the withdraw amount
        expect(teamTokensInSmartContractBeforeWithdraw - teamTokensInSmartContractAfterWithdraw).to.equal(withdrawAmount);

        // Smart contract balance should be less by the withdraw amount
        expect(smartContractBalanceBeforeWithdraw - smartContractBalanceAfterWithdraw).to.equal(withdrawAmount);

        // Owner balance should be more by the withdraw amount
        expect(ownerBalanceAfterWithdraw - ownerBalanceBeforeWithdraw).to.equal(withdrawAmount);
    });


    it("19.11. Should revert the withdraw of rewards tokens because the amount is 0", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, 0)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("19.12. Should revert the withdraw of rewards tokens because the funding has not started yet", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const withdrawAmount = ethers.parseUnits("1000000", 18); // Withdraw (1M) 1,000,000 Investor Rewards Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, withdrawAmount)
        ).to.be.revertedWith('Reward tokens funding has not started yet, no tokens to withdraw');
    });

    it("19.13. Should revert because of insufficient rewards tokens in the contract to withdraw", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000", 18); // Fund with (1M) 1,000,000 Investor Rewards Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const withdrawAmount = ethers.parseUnits("10000000", 18); // Withdraw (10M) 10,000,000 Rewards Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, withdrawAmount)
        ).to.be.revertedWith('Insufficient reward tokens in the contract to withdraw');
    });

    it("19.14. Should successfully withdraw the reward tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Rewards Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const withdrawAmount = ethers.parseUnits("10000000", 18); // Withdraw (10M) 10,000,000 Rewards Tokens

        //Balances before withdraw
        const rewardTokensInSmartContractBeforeWithdraw = await upgradeableHYAXRewards.rewardTokensInSmartContract();

        const smartContractBalanceBeforeWithdraw = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const ownerBalanceBeforeWithdraw = await hyaxToken.balanceOf(owner.address);

        // Execute the withdraw of team tokens
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, withdrawAmount);

        //Balances after withdraw
        const rewardTokensInSmartContractAfterWithdraw = await upgradeableHYAXRewards.rewardTokensInSmartContract();

        const smartContractBalanceAfterWithdraw = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const ownerBalanceAfterWithdraw = await hyaxToken.balanceOf(owner.address);

        // Team tokens in smart contract should be less by the withdraw amount
        expect(rewardTokensInSmartContractBeforeWithdraw - rewardTokensInSmartContractAfterWithdraw).to.equal(withdrawAmount);

        // Smart contract balance should be less by the withdraw amount
        expect(smartContractBalanceBeforeWithdraw - smartContractBalanceAfterWithdraw).to.equal(withdrawAmount);

        // Owner balance should be more by the withdraw amount
        expect(ownerBalanceAfterWithdraw - ownerBalanceBeforeWithdraw).to.equal(withdrawAmount);
    });
});
