import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #11. Fund Smart Contract with reward tokens after having already funded the first time", function () {
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

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("11.1. Should update the total value of rewardTokensFunded with the specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("200000000", 18); // Fund with (200M) 200,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevRewardTokensFunded = await upgradeableHYAXRewards.rewardTokensFunded();

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Get the value of rewardTokensFunded
        const newRewardTokensFunded = prevRewardTokensFunded + fundingAmount;
        console.log("   [Log]: NewRewardTokensFunded:", newRewardTokensFunded);

        const rewardTokensFunded = await upgradeableHYAXRewards.rewardTokensFunded();
        console.log("   [Log]: RewardTokensFunded:", rewardTokensFunded);

        // Verify that the contract balance matches the funding amount
        expect(rewardTokensFunded).to.equal(newRewardTokensFunded);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("200000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("200000000", 18));
    });

    it("11.2. Should continue with the same rewardTokensFundingStarted variable equal to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("200000000", 18); // Fund with (200M) 200,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Check if the growthTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.rewardTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("11.3. Should not have updated the time of rewardTokensStartFundingTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("200000000", 18); // Fund with (200M) 200,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;
        console.log("\n   [Log]: TimestampOfBlockBefore:", timestampOfBlockBefore);

        // Get the rewardTokensStartFundingTime
        const rewardTokensStartFundingTime = await upgradeableHYAXRewards.rewardTokensStartFundingTime();
        console.log("   [Log]: RewardTokensStartFundingTime:", rewardTokensStartFundingTime);
        // Check if the rewardTokensStartFundingTime is NOT equal to the timestamp of the block before
        expect(rewardTokensStartFundingTime).to.not.equal(timestampOfBlockBefore);
    });

    it("11.4. Should revert when funding with an amout above the total intended for reward tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("600000000", 18); // Fund with (600M) 600,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intended for reward tokens');
    });
});
