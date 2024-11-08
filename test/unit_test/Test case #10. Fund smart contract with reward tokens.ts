import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #10. Fund smart contract with reward tokens", function () {
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


    it("10.1. Should fail to fund the contract with reward tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'AccessControlUnauthorizedAccount');
    });

    it("10.2. Should fail to fund the contract with reward tokens because its not approved", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWithCustomError(hyaxToken, 'ERC20InsufficientAllowance');
    });

    it("10.3. Should revert when funding with an invalid type of funding", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(3, fundingAmount)
        ).to.be.reverted;
    });

    it("10.4. Should revert when funding with an invalid amount", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const invalidAmount = ethers.parseUnits("0", 18); // Invalid amount

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, invalidAmount)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("10.5. Should successfully fund the contract with reward tokens with a specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Get the current balance of team tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.rewardTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1000000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("10.6. Should update the rewardTokensFundingStarted variable to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Check if the rewardTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.rewardTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("10.7. Should update the total value of rewardTokensFunded", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevRewardTokensFunded = await upgradeableHYAXRewards.rewardTokensFunded();
        console.log("\n   [Log]: PrevRewardTokensFunded:", prevRewardTokensFunded);
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Get the value of rewardTokensFunded
        const newRewardTokensFunded = prevRewardTokensFunded + fundingAmount;
        console.log("   [Log]: NewRewardTokensFunded:", newRewardTokensFunded);
        const rewardTokensFunded = await upgradeableHYAXRewards.rewardTokensFunded();
        console.log("   [Log]: RewardTokensFunded:", rewardTokensFunded);
        // Check if the rewardTokensFunded is equal to the newRewardTokensFunded
        expect(rewardTokensFunded).to.equal(newRewardTokensFunded);
    });

    it("10.8. Should update the time of teamTokensStartFundingTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;
        console.log("\n   [Log]: TimestampOfBlockBefore:", timestampOfBlockBefore);
        // Get the teamTokensStartFundingTime
        const teamTokensStartFundingTime = await upgradeableHYAXRewards.teamTokensStartFundingTime();
        console.log("   [Log]: TeamTokensStartFundingTime:", teamTokensStartFundingTime);
        // Check if the teamTokensStartFundingTime is equal to the timestamp of the block before
        expect(teamTokensStartFundingTime).to.equal(timestampOfBlockBefore);
    });

    it("10.9. Should revert when funding with an amout above the total intended for reward tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1600000000", 18); // Fund with (1,6B) 1,600,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intended for reward tokens');
    });

    it("10.10. Should successfully fund the contract with reward tokens with the total intended amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1,5B) 1,500,000,000 Reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Get the current balance of reward tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.rewardTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1000000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });
});
