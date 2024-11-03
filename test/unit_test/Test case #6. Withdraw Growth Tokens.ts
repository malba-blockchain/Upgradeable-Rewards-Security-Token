import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #6. Withdraw Growth Tokens", function () {
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

    it("6.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith('Growth tokens funding has not started yet, no tokens to withdraw');
    });

    it("6.2. Should revert if trying to withdraw without being the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawGrowthTokens()
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'AccessControlUnauthorizedAccount');
    });

    it("6.3. Should revert if trying to withdraw after a year has passed and still has not been funded", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith("Growth tokens funding has not started yet, no tokens to withdraw");
    });

    it("6.4. Should revert if attempting to withdraw after funding but before a year has passed", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const lessThanOneYear = 360 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the available balance
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith("Cannot withdraw before 1 year after funding start");
    });

    it("6.5. Should withdraw the correct amount of growth tokens after a year has passed and update the corresponding variables", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");
        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        // Withdraw growth tokens
        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const growthTokensWithdrawn = await upgradeableHYAXRewards.growthTokensWithdrawn();
        console.log("\n   [Log]: GrowthTokensWithdrawn:", growthTokensWithdrawn);
        expect(growthTokensWithdrawn).to.equal(ethers.parseUnits("120000000", 18));

        // Verify that the last withdrawal time was updated correctly
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        console.log("   [Log]: GrowthTokensLastWithdrawalTime:", growthTokensLastWithdrawalTime);
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);

        // Check if the remaining tokens in the smart contract are correct
        const growthTokensInSmartContract = await upgradeableHYAXRewards.growthTokensInSmartContract();
        console.log("   [Log]: GrowthTokensInSmartContract:", growthTokensInSmartContract);
        expect(growthTokensInSmartContract).to.equal(fundingAmount - growthTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("120000000", 18));

        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(newOwnerTokenBalance - prevOwnerTokenBalance).to.equal(ethers.parseUnits("120000000", 18));
    });

    it("6.6. Should revert if attempting to withdraw before a year has passed since last withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const oneYear = 365 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        const lessThanOneYear = 360 * 24 * 60 * 60; // Less than one year in seconds
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the available balance
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith("Can only withdraw once per year");
    });

    it("6.7. Should withdraw the correct amount of growth tokens after a year has passed since last withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const firstYear = 365 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [firstYear]);
        await network.provider.send("evm_mine");

        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        const secondYear = 365 * 24 * 60 * 60; // Less than one year in seconds
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [secondYear]);
        await network.provider.send("evm_mine");

        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const growthTokensWithdrawn = await upgradeableHYAXRewards.growthTokensWithdrawn();
        console.log("\n   [Log]: GrowthTokensWithdrawn:", growthTokensWithdrawn);
        expect(growthTokensWithdrawn).to.equal(ethers.parseUnits("240000000", 18));

        // Verify that the last withdrawal time was updated correctly
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        console.log("   [Log]: GrowthTokensLastWithdrawalTime:", growthTokensLastWithdrawalTime);
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);

        // Check if the remaining tokens in the smart contract are correct
        const growthTokensInSmartContract = await upgradeableHYAXRewards.growthTokensInSmartContract();
        console.log("   [Log]: GrowthTokensInSmartContract:", growthTokensInSmartContract);
        expect(growthTokensInSmartContract).to.equal(fundingAmount - growthTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("120000000", 18));

        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(newOwnerTokenBalance - prevOwnerTokenBalance).to.equal(ethers.parseUnits("120000000", 18));
    });


    it("6.8. Should revert after withdrawing all growth tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        for (let i = 0; i < 20; i++) {
            // Wait for the specified time period to elapse (simulate one year)
            await network.provider.send("evm_increaseTime", [oneYear]);
            await network.provider.send("evm_mine");

            await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();
        }

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const growthTokensWithdrawn = await upgradeableHYAXRewards.growthTokensWithdrawn();
        console.log("\n   [Log]: GrowthTokensWithdrawn:", growthTokensWithdrawn);
        expect(growthTokensWithdrawn).to.equal(ethers.parseUnits("2400000000", 18));

        // Verify that the last withdrawal time was updated correctly
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        console.log("   [Log]: GrowthTokensLastWithdrawalTime:", growthTokensLastWithdrawalTime);
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);

        // Check if the remaining tokens in the smart contract are correct
        const growthTokensInSmartContract = await upgradeableHYAXRewards.growthTokensInSmartContract();
        console.log("   [Log]: GrowthTokensInSmartContract:", growthTokensInSmartContract);
        expect(growthTokensInSmartContract).to.equal(fundingAmount - growthTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("2400000000", 18));

        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(newOwnerTokenBalance - prevOwnerTokenBalance).to.equal(ethers.parseUnits("2400000000", 18));

        //Try to withdraw again once there are no more growth tokens to withdraw
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the available balance
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith("All growth tokens have been withdrawn");
    });
});
