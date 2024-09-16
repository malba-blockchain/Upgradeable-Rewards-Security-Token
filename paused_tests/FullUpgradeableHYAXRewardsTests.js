import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat"
import { expect } from "chai"

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


describe("Testing Use Case #2: Add Wallet to Whitelist", function () {

    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should successfully add a wallet to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Replace 'addWalletToWhitelist' with actual function name and parameters
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);

        // Replace 'getWalletData' with the actual function to retrieve whitelist data
        const whitelistData = await upgradeableHYAXRewards.getWalletData(addr1.address);
        expect(whitelistData.type).to.equal("WhitelistType");
        expect(whitelistData.amount).to.equal(1000);
    });

    it("Should only allow the owner to add a wallet to the whitelist", async function () {
        const { upgradeableHYAXRewards, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to add a wallet from a non-owner account
        await expect(
            upgradeableHYAXRewards.connect(addr1).addWalletToWhitelist(addr2.address, "WhitelistType", 1000)
        ).to.be.revertedWith("Ownable: caller is not the owner"); // Replace with actual error message
    });

    it("Should not create duplicates when adding the same wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 2000); // Updating the amount

        const whitelistData = await upgradeableHYAXRewards.getWalletData(addr1.address);
        expect(whitelistData.amount).to.equal(2000); // The amount should be updated, not duplicated
    });

    it("Should fail to add a wallet with invalid data", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to add a wallet with invalid data
        await expect(
            upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "", -1000) // Invalid type and amount
        ).to.be.revertedWith("Invalid data error message"); // Replace with actual error message
    });

    it("Should validate wallet data correctly", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);

        const whitelistData = await upgradeableHYAXRewards.getWalletData(addr1.address);
        expect(whitelistData.type).to.equal("WhitelistType");
        expect(whitelistData.amount).to.equal(1000);
    });
});


describe("Testing Use Case #3: Remove Wallet from Whitelist", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should successfully remove a wallet from the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist first
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);

        // Now remove the wallet
        await upgradeableHYAXRewards.removeWalletFromWhitelist(addr1.address);

        // Verify that the wallet is removed
        const whitelistData = await upgradeableHYAXRewards.getWalletData(addr1.address);
        expect(whitelistData.type).to.be.empty; // Assuming an empty type indicates removal
        expect(whitelistData.amount).to.equal(0); // Assuming zero amount indicates removal
    });

    it("Should only allow the owner to remove a wallet from the whitelist", async function () {
        const { upgradeableHYAXRewards, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist first
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);

        // Attempt to remove the wallet from a non-owner account
        await expect(
            upgradeableHYAXRewards.connect(addr2).removeWalletFromWhitelist(addr1.address)
        ).to.be.revertedWith("Ownable: caller is not the owner"); // Replace with actual error message
    });

    it("Should succeed when removing a non-existent wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to remove a wallet that does not exist
        await expect(
            upgradeableHYAXRewards.removeWalletFromWhitelist(addr1.address)
        ).to.not.be.reverted; // Expect no error even though the wallet doesn't exist
    });

    it("Should validate that data associated with a removed wallet is deleted", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet with specific data
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);

        // Remove the wallet
        await upgradeableHYAXRewards.removeWalletFromWhitelist(addr1.address);

        // Retrieve data for the removed wallet
        const whitelistData = await upgradeableHYAXRewards.getWalletData(addr1.address);
        expect(whitelistData.type).to.be.empty; // Assuming an empty type indicates removal
        expect(whitelistData.amount).to.equal(0); // Assuming zero amount indicates removal
    });

    it("Should successfully re-add a removed wallet to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "WhitelistType", 1000);

        // Remove the wallet
        await upgradeableHYAXRewards.removeWalletFromWhitelist(addr1.address);

        // Re-add the wallet
        await upgradeableHYAXRewards.addWalletToWhitelist(addr1.address, "NewWhitelistType", 2000);

        // Verify the wallet is re-added with the new data
        const whitelistData = await upgradeableHYAXRewards.getWalletData(addr1.address);
        expect(whitelistData.type).to.equal("NewWhitelistType");
        expect(whitelistData.amount).to.equal(2000);
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

    it("Should successfully fund the contract with growth tokens with a specified amount", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens
        
        //Allow the contract to spend the tokens
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const contractBalance = await upgradeableHYAXRewards.growthTokensFunded();

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


describe("Testing Use Case #5: Withdraw Locked Tokens for Team Member", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should successfully withdraw tokens according to the schedule", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const lockAmount = ethers.parseUnits("1000", 18);
        const withdrawAmount = ethers.parseUnits("500", 18);
        const lockPeriod = 30 * 24 * 60 * 60; // Lock period in seconds (e.g., 30 days)
        const unlockTime = (await ethers.provider.getBlock()).timestamp + lockPeriod;

        // Add team member with locked tokens
        await upgradeableHYAXRewards.addTeamMember(addr1.address, lockAmount, unlockTime);

        // Wait for the lock period to elapse
        await network.provider.send("evm_increaseTime", [lockPeriod]);
        await network.provider.send("evm_mine");

        // Withdraw tokens
        await upgradeableHYAXRewards.withdrawLockedTokensForTeamMember(addr1.address, withdrawAmount);

        const remainingBalance = await upgradeableHYAXRewards.getLockedTokens(addr1.address);
        expect(remainingBalance).to.equal(lockAmount.sub(withdrawAmount));
    });

    it("Should revert withdrawal if the waiting period has not elapsed", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const lockAmount = ethers.parseUnits("1000", 18);
        const lockPeriod = 30 * 24 * 60 * 60; // Lock period in seconds (e.g., 30 days)
        const unlockTime = (await ethers.provider.getBlock()).timestamp + lockPeriod;

        // Add team member with locked tokens
        await upgradeableHYAXRewards.addTeamMember(addr1.address, lockAmount, unlockTime);

        // Attempt to withdraw before the lock period ends
        await expect(
            upgradeableHYAXRewards.withdrawLockedTokensForTeamMember(addr1.address, lockAmount)
        ).to.be.revertedWith("Tokens are still locked"); // Replace with actual error message
    });

    it("Should handle partial withdrawals according to the schedule", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const lockAmount = ethers.parseUnits("1000", 18);
        const partialAmount = ethers.parseUnits("200", 18);
        const lockPeriod = 30 * 24 * 60 * 60; // Lock period in seconds (e.g., 30 days)
        const unlockTime = (await ethers.provider.getBlock()).timestamp + lockPeriod;

        // Add team member with locked tokens
        await upgradeableHYAXRewards.addTeamMember(addr1.address, lockAmount, unlockTime);

        // Wait for the first partial withdrawal time
        await network.provider.send("evm_increaseTime", [lockPeriod / 2]);
        await network.provider.send("evm_mine");

        // Perform partial withdrawal
        await upgradeableHYAXRewards.withdrawLockedTokensForTeamMember(addr1.address, partialAmount);

        const remainingBalance = await upgradeableHYAXRewards.getLockedTokens(addr1.address);
        expect(remainingBalance).to.equal(lockAmount.sub(partialAmount));

        // Additional partial withdrawals as per schedule can be tested similarly
    });

    it("Should revert withdrawal if attempted by a non-whitelisted address", async function () {
        const { upgradeableHYAXRewards, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const lockAmount = ethers.parseUnits("1000", 18);
        const lockPeriod = 30 * 24 * 60 * 60; // Lock period in seconds (e.g., 30 days)
        const unlockTime = (await ethers.provider.getBlock()).timestamp + lockPeriod;

        // Add team member with locked tokens
        await upgradeableHYAXRewards.addTeamMember(addr1.address, lockAmount, unlockTime);

        // Attempt withdrawal from a non-whitelisted address
        await expect(
            upgradeableHYAXRewards.connect(addr2).withdrawLockedTokensForTeamMember(addr1.address, lockAmount)
        ).to.be.revertedWith("Not authorized"); // Replace with actual error message
    });

    it("Should successfully withdraw all remaining tokens after the full lock period", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const lockAmount = ethers.parseUnits("1000", 18);
        const lockPeriod = 30 * 24 * 60 * 60; // Lock period in seconds (e.g., 30 days)
        const unlockTime = (await ethers.provider.getBlock()).timestamp + lockPeriod;

        // Add team member with locked tokens
        await upgradeableHYAXRewards.addTeamMember(addr1.address, lockAmount, unlockTime);

        // Wait for the full lock period to elapse
        await network.provider.send("evm_increaseTime", [lockPeriod]);
        await network.provider.send("evm_mine");

        // Withdraw remaining tokens
        await upgradeableHYAXRewards.withdrawLockedTokensForTeamMember(addr1.address, lockAmount);

        const remainingBalance = await upgradeableHYAXRewards.getLockedTokens(addr1.address);
        expect(remainingBalance).to.equal(0);
    });
});


describe("Testing Use Case #6: Withdraw Locked Tokens for Growth", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };

    }

    it("Should successfully withdraw growth tokens at the specified rate", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundAmount = ethers.parseUnits("10000", 18);
        const withdrawAmount = ethers.parseUnits("500", 18); // Amount to withdraw
        const withdrawalRate = 0.05; // 5% per year
        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Fund the contract with growth tokens
        await upgradeableHYAXRewards.fundGrowthTokens(fundAmount);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Withdraw growth tokens
        await upgradeableHYAXRewards.withdrawLockedTokensForGrowth(withdrawAmount);

        const remainingBalance = await upgradeableHYAXRewards.getGrowthTokenBalance();
        expect(remainingBalance).to.equal(fundAmount.sub(withdrawAmount));
    });

    it("Should revert if the withdrawal exceeds the allowed rate", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundAmount = ethers.parseUnits("10000", 18);
        const allowedAmount = ethers.parseUnits("500", 18); // Allowed amount to withdraw based on the rate
        const exceedAmount = ethers.parseUnits("600", 18); // Amount that exceeds the allowed rate
        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Fund the contract with growth tokens
        await upgradeableHYAXRewards.fundGrowthTokens(fundAmount);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the allowed rate
        await expect(
            upgradeableHYAXRewards.withdrawLockedTokensForGrowth(exceedAmount)
        ).to.be.revertedWith("Withdrawal exceeds allowed rate"); // Replace with actual error message
    });

    it("Should revert if trying to withdraw before the specified time", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundAmount = ethers.parseUnits("10000", 18);
        const withdrawAmount = ethers.parseUnits("500", 18); // Amount to withdraw
        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Fund the contract with growth tokens
        await upgradeableHYAXRewards.fundGrowthTokens(fundAmount);

        // Attempt to withdraw before the one-year period elapses
        await expect(
            upgradeableHYAXRewards.withdrawLockedTokensForGrowth(withdrawAmount)
        ).to.be.revertedWith("Withdrawal not permitted yet"); // Replace with actual error message
    });

    it("Should update token balance correctly after withdrawal", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundAmount = ethers.parseUnits("10000", 18);
        const withdrawAmount = ethers.parseUnits("500", 18); // Amount to withdraw
        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Fund the contract with growth tokens
        await upgradeableHYAXRewards.fundGrowthTokens(fundAmount);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Withdraw tokens
        await upgradeableHYAXRewards.withdrawLockedTokensForGrowth(withdrawAmount);

        const remainingBalance = await upgradeableHYAXRewards.getGrowthTokenBalance();
        expect(remainingBalance).to.equal(fundAmount.sub(withdrawAmount));
    });

    it("Should revert if attempting to withdraw more than available tokens", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundAmount = ethers.parseUnits("10000", 18);
        const withdrawAmount = ethers.parseUnits("12000", 18); // Amount to withdraw exceeds available balance
        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Fund the contract with growth tokens
        await upgradeableHYAXRewards.fundGrowthTokens(fundAmount);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the available balance
        await expect(
            upgradeableHYAXRewards.withdrawLockedTokensForGrowth(withdrawAmount)
        ).to.be.revertedWith("Insufficient tokens for withdrawal"); // Replace with actual error message
    });
});


describe("Testing Use Case #7: Update Values of Token Rewards", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };

    }

    it("Should successfully update rewards for each wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const rewards = {
            [addr1.address]: ethers.parseUnits("1000", 18),
            [addr2.address]: ethers.parseUnits("2000", 18)
        };

        // Update rewards
        await upgradeableHYAXRewards.updateValuesOfTokenRewards(rewards);

        // Verify updated rewards
        const addr1Reward = await upgradeableHYAXRewards.getReward(addr1.address);
        const addr2Reward = await upgradeableHYAXRewards.getReward(addr2.address);

        expect(addr1Reward).to.equal(rewards[addr1.address]);
        expect(addr2Reward).to.equal(rewards[addr2.address]);
    });

    it("Should revert if non-authorized account tries to update rewards", async function () {
        const { upgradeableHYAXRewards, addr3 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const rewards = {
            [addr3.address]: ethers.parseUnits("1000", 18)
        };

        // Attempt to update rewards from a non-authorized account
        await expect(
            upgradeableHYAXRewards.connect(addr3).updateValuesOfTokenRewards(rewards)
        ).to.be.revertedWith("Unauthorized"); // Replace with actual error message
    });

    it("Should revert if updating rewards with invalid data", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const rewards = {
            [addr1.address]: ethers.parseUnits("-1000", 18) // Invalid reward amount
        };

        // Attempt to update rewards with invalid data
        await expect(
            upgradeableHYAXRewards.updateValuesOfTokenRewards(rewards)
        ).to.be.revertedWith("Invalid reward data"); // Replace with actual error message
    });

    it("Should reflect updated rewards data correctly", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const rewards = {
            [addr1.address]: ethers.parseUnits("1000", 18),
            [addr2.address]: ethers.parseUnits("2000", 18)
        };

        // Update rewards
        await upgradeableHYAXRewards.updateValuesOfTokenRewards(rewards);

        // Retrieve and verify updated rewards data
        const addr1Reward = await upgradeableHYAXRewards.getReward(addr1.address);
        const addr2Reward = await upgradeableHYAXRewards.getReward(addr2.address);

        expect(addr1Reward).to.equal(rewards[addr1.address]);
        expect(addr2Reward).to.equal(rewards[addr2.address]);
    });

    it("Should handle large updates correctly", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const numberOfAddresses = 1000; // Example large dataset
        let rewards = {};

        for (let i = 0; i < numberOfAddresses; i++) {
            // Create dummy addresses for testing
            const testAddress = ethers.Wallet.createRandom().address;
            rewards[testAddress] = ethers.parseUnits((i + 1).toString(), 18);
        }

        // Update rewards with a large dataset
        await upgradeableHYAXRewards.updateValuesOfTokenRewards(rewards);

        // Verify rewards for a few sample addresses
        const sampleAddress = Object.keys(rewards)[0];
        const sampleReward = await upgradeableHYAXRewards.getReward(sampleAddress);

        expect(sampleReward).to.equal(rewards[sampleAddress]);
    });
});


describe("Testing Use Case #8: Withdraw Token Rewards", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should successfully withdraw token rewards for a whitelisted user", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Withdraw rewards
        await expect(upgradeableHYAXRewards.connect(addr1).withdrawTokenRewards())
            .to.emit(upgradeableHYAXRewards, "RewardsWithdrawn")
            .withArgs(addr1.address, ethers.parseUnits("1000", 18));

        // Verify that the user's rewards are withdrawn and balance is reset
        const remainingRewards = await upgradeableHYAXRewards.getRewards(addr1.address);
        expect(remainingRewards).to.equal(ethers.parseUnits("0", 18));
    });

    it("Should revert if a non-whitelisted user attempts to withdraw rewards", async function () {
        const { upgradeableHYAXRewards, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to withdraw rewards from a non-whitelisted address
        await expect(
            upgradeableHYAXRewards.connect(addr2).withdrawTokenRewards()
        ).to.be.revertedWith("Not whitelisted"); // Replace with actual error message
    });

    it("Should not affect contract state when withdrawing zero rewards", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Set the user's rewards to zero
        await upgradeableHYAXRewards.setRewards(addr1.address, ethers.parseUnits("0", 18));

        // Attempt to withdraw rewards
        await expect(upgradeableHYAXRewards.connect(addr1).withdrawTokenRewards()).to.not.emit(upgradeableHYAXRewards, "RewardsWithdrawn");

        // Verify that the contract state remains unchanged
        const remainingRewards = await upgradeableHYAXRewards.getRewards(addr1.address);
        expect(remainingRewards).to.equal(ethers.parseUnits("0", 18));
    });

    it("Should update rewards balance correctly after withdrawal", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Withdraw rewards
        await upgradeableHYAXRewards.connect(addr1).withdrawTokenRewards();

        // Verify that the rewards balance is reset to zero
        const remainingRewards = await upgradeableHYAXRewards.getRewards(addr1.address);
        expect(remainingRewards).to.equal(ethers.parseUnits("0", 18));
    });

    it("Should handle large withdrawals correctly", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Set a large reward amount
        const largeAmount = ethers.parseUnits("1000000", 18);
        await upgradeableHYAXRewards.setRewards(addr1.address, largeAmount);

        // Withdraw rewards
        await expect(upgradeableHYAXRewards.connect(addr1).withdrawTokenRewards())
            .to.emit(upgradeableHYAXRewards, "RewardsWithdrawn")
            .withArgs(addr1.address, largeAmount);

        // Verify that the large withdrawal is processed correctly
        const remainingRewards = await upgradeableHYAXRewards.getRewards(addr1.address);
        expect(remainingRewards).to.equal(ethers.parseUnits("0", 18));
    });
});


describe("Testing Use Case #9: Withdraw Tokens to Burn", function () {

    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };

    }

    it("Should successfully withdraw tokens to burn", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define the amount to burn
        const burnAmount = ethers.parseUnits("5000", 18);

        // Call withdrawTokensToBurn
        await expect(upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(burnAmount))
            .to.emit(upgradeableHYAXRewards, "TokensBurned")
            .withArgs(burnAmount);

        // Verify the tokens are burned
        const contractBalance = await upgradeableHYAXRewards.balanceOf(upgradeableHYAXRewards.address);
        expect(contractBalance).to.equal(ethers.parseUnits("5000", 18)); // Assuming initial balance was 10000
    });

    it("Should revert if a non-owner attempts to burn tokens", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to withdraw tokens to burn from a non-owner account
        const burnAmount = ethers.parseUnits("500", 18);
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTokensToBurn(burnAmount)
        ).to.be.revertedWith("Ownable: caller is not the owner"); // Replace with actual error message
    });

    it("Should revert when attempting to burn more tokens than available", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define burn amount larger than available
        const excessiveBurnAmount = ethers.parseUnits("20000", 18);

        // Attempt to burn more tokens than available
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(excessiveBurnAmount)
        ).to.be.revertedWith("Insufficient tokens"); // Replace with actual error message
    });

    it("Should accurately record burned tokens", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define the amount to burn
        const burnAmount = ethers.parseUnits("2000", 18);

        // Call withdrawTokensToBurn
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(burnAmount);

        // Verify that the burned tokens are no longer in the contract
        const contractBalance = await upgradeableHYAXRewards.balanceOf(upgradeableHYAXRewards.address);
        expect(contractBalance).to.equal(ethers.parseUnits("8000", 18)); // Assuming initial balance was 10000
    });

    it("Should revert if burning unauthorized tokens", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to burn tokens that are not authorized (assuming `addr1` is not authorized)
        const unauthorizedBurnAmount = ethers.parseUnits("500", 18);
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTokensToBurn(unauthorizedBurnAmount)
        ).to.be.revertedWith("Unauthorized tokens"); // Replace with actual error message
    });
});


describe("Testing Use Case #10: Update Waiting Time", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should successfully update the waiting time", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define the waiting time parameters
        const fundingType = 1; // Replace with actual funding type identifier
        const newWaitingTime = 3600; // New waiting time in seconds

        // Call updateWaitingTime
        await upgradeableHYAXRewards.connect(owner).updateWaitingTime(fundingType, newWaitingTime);

        // Retrieve the updated waiting time
        const updatedWaitingTime = await upgradeableHYAXRewards.getWaitingTime(fundingType);
        expect(updatedWaitingTime).to.equal(newWaitingTime);
    });

    it("Should revert if a non-owner attempts to update the waiting time", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define the waiting time parameters
        const fundingType = 1; // Replace with actual funding type identifier
        const newWaitingTime = 3600; // New waiting time in seconds

        // Attempt to update waiting time from a non-owner account
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateWaitingTime(fundingType, newWaitingTime)
        ).to.be.revertedWith("Ownable: caller is not the owner"); // Replace with actual error message
    });

    it("Should revert when updating waiting time with invalid parameters", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define invalid waiting time parameter
        const fundingType = 1; // Replace with actual funding type identifier
        const invalidWaitingTime = -3600; // Negative waiting time

        // Attempt to update waiting time with invalid parameters
        await expect(
            upgradeableHYAXRewards.connect(owner).updateWaitingTime(fundingType, invalidWaitingTime)
        ).to.be.revertedWith("Invalid waiting time"); // Replace with actual error message
    });

    it("Should correctly reflect updated waiting times", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define waiting time parameters
        const fundingType1 = 1; // Replace with actual funding type identifier
        const newWaitingTime1 = 3600; // New waiting time in seconds
        const fundingType2 = 2; // Replace with actual funding type identifier
        const newWaitingTime2 = 7200; // New waiting time in seconds

        // Update waiting times
        await upgradeableHYAXRewards.connect(owner).updateWaitingTime(fundingType1, newWaitingTime1);
        await upgradeableHYAXRewards.connect(owner).updateWaitingTime(fundingType2, newWaitingTime2);

        // Retrieve and verify the updated waiting times
        const updatedWaitingTime1 = await upgradeableHYAXRewards.getWaitingTime(fundingType1);
        const updatedWaitingTime2 = await upgradeableHYAXRewards.getWaitingTime(fundingType2);

        expect(updatedWaitingTime1).to.equal(newWaitingTime1);
        expect(updatedWaitingTime2).to.equal(newWaitingTime2);
    });

    it("Should handle multiple updates correctly", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define waiting time parameters
        const fundingType1 = 1; // Replace with actual funding type identifier
        const fundingType2 = 2; // Replace with actual funding type identifier
        const fundingType3 = 3; // Replace with actual funding type identifier

        const waitingTimes = {
            [fundingType1]: 3600, // 1 hour
            [fundingType2]: 7200, // 2 hours
            [fundingType3]: 10800 // 3 hours
        };

        // Update waiting times for multiple funding types
        for (const [type, time] of Object.entries(waitingTimes)) {
            await upgradeableHYAXRewards.connect(owner).updateWaitingTime(type, time);
        }

        // Verify all updates
        for (const [type, time] of Object.entries(waitingTimes)) {
            const updatedWaitingTime = await upgradeableHYAXRewards.getWaitingTime(type);
            expect(updatedWaitingTime).to.equal(time);
        }
    });
});

describe("Testing External Use Case #11: Calculate Token Rewards Earned Weekly", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("Should calculate and update rewards correctly based on weekly data", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define initial rewards data
        const initialRewards = [
            { account: owner.address, reward: ethers.parseUnits("100", 18) },
            { account: addr1.address, reward: ethers.parseUnits("50", 18) },
            { account: addr2.address, reward: ethers.parseUnits("75", 18) }
        ];

        // Simulate adding rewards data to the contract
        for (const { account, reward } of initialRewards) {
            await upgradeableHYAXRewards.connect(owner).addReward(account, reward);
        }

        // Execute the calculateTokenRewardsEarnedWeekly script
        await upgradeableHYAXRewards.connect(owner).calculateTokenRewardsEarnedWeekly();

        // Verify that rewards are updated correctly
        for (const { account, reward } of initialRewards) {
            const updatedReward = await upgradeableHYAXRewards.getReward(account);
            expect(updatedReward).to.equal(reward); // Adjust as needed based on actual logic
        }
    });

    it("Should handle large datasets efficiently and accurately", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Generate a large dataset of rewards
        const numAccounts = 1000; // Adjust as needed
        const rewards = [];
        for (let i = 0; i < numAccounts; i++) {
            const account = ethers.Wallet.createRandom().address;
            const reward = ethers.parseUnits((Math.random() * 100).toFixed(2), 18);
            rewards.push({ account, reward });
            await upgradeableHYAXRewards.connect(owner).addReward(account, reward);
        }

        // Measure time taken to run the calculation
        const startTime = Date.now();
        await upgradeableHYAXRewards.connect(owner).calculateTokenRewardsEarnedWeekly();
        const endTime = Date.now();

        // Check execution time (adjust threshold as needed)
        const executionTime = endTime - startTime;
        expect(executionTime).to.be.below(10000); // e.g., 10 seconds

        // Verify the results
        for (const { account, reward } of rewards) {
            const updatedReward = await upgradeableHYAXRewards.getReward(account);
            expect(updatedReward).to.equal(reward); // Adjust as needed based on actual logic
        }
    });

    it("Should calculate rewards accurately based on known input data", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define known reward data
        const knownRewards = [
            { account: owner.address, reward: ethers.parseUnits("100", 18) },
            { account: addr1.address, reward: ethers.parseUnits("50", 18) },
            { account: addr2.address, reward: ethers.parseUnits("75", 18) }
        ];

        // Simulate adding rewards data to the contract
        for (const { account, reward } of knownRewards) {
            await upgradeableHYAXRewards.connect(owner).addReward(account, reward);
        }

        // Execute the calculation
        await upgradeableHYAXRewards.connect(owner).calculateTokenRewardsEarnedWeekly();

        // Verify the calculated rewards match expected results
        for (const { account, reward } of knownRewards) {
            const updatedReward = await upgradeableHYAXRewards.getReward(account);
            expect(updatedReward).to.equal(reward); // Adjust as needed based on actual logic
        }
    });

    it("Should handle edge cases such as zero or very high reward values", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define edge cases
        const edgeCases = [
            { account: owner.address, reward: ethers.BigNumber.from(0) }, // Zero reward
            { account: addr1.address, reward: ethers.parseUnits("1000000", 18) } // Very high reward
        ];

        // Simulate adding edge case rewards data to the contract
        for (const { account, reward } of edgeCases) {
            await upgradeableHYAXRewards.connect(owner).addReward(account, reward);
        }

        // Execute the calculation
        await upgradeableHYAXRewards.connect(owner).calculateTokenRewardsEarnedWeekly();

        // Verify the results
        for (const { account, reward } of edgeCases) {
            const updatedReward = await upgradeableHYAXRewards.getReward(account);
            expect(updatedReward).to.equal(reward); // Adjust as needed based on actual logic
        }
    });

    it("Should execute within acceptable time limits", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Define some reward data
        const rewards = [
            { account: owner.address, reward: ethers.parseUnits("100", 18) },
            { account: addr1.address, reward: ethers.parseUnits("50", 18) }
        ];

        // Simulate adding rewards data to the contract
        for (const { account, reward } of rewards) {
            await upgradeableHYAXRewards.connect(owner).addReward(account, reward);
        }

        // Measure execution time
        const startTime = Date.now();
        await upgradeableHYAXRewards.connect(owner).calculateTokenRewardsEarnedWeekly();
        const endTime = Date.now();

        // Verify that the execution time is within an acceptable limit
        const executionTime = endTime - startTime;
        expect(executionTime).to.be.below(5000); // e.g., 5 seconds
    });
});