import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"


describe("Test case #15. Update rewards for a single team wallet", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
        console.log("\n   [Log]: Deploying UpgradeableHYAXRewards...");

        // Deploy proxy with 'initialize' function
        const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [await hyaxToken.target], { initializer: 'initialize' });

        await upgradeableHYAXRewards.waitForDeployment();

        // Update the whitelister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Update the rewards updater address
        await upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(rewardsUpdaterAddress.address);

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("15.1. Should revert the update of the rewards because the wallet is not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

        // Try to update the rewards of a non whitelisted wallet
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Wallet is not whitelisted');
    });

    it("15.2. Should revert the update of the rewards because the wallet is blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the team wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Try to update the rewards of a blacklisted wallet
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Wallet has been blacklisted');
    });

    it("15.3. Should revert the update of the rewards because the rewards exceed the weekly limit", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884616000000000000000000";
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the team wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Try to update the rewards of a wallet that exceeds the weekly limit
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('A single wallet cannot have rewards higher than the weekly limit');
    });

    it("15.4. Should revert the update of the rewards because there are not enough reward tokens in the smart contract", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the team wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        //Withdraw all the reward tokens from the smart contract
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, ethers.parseUnits("1000000000", 18));

        // Try to update the rewards of a wallet
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Insufficient reward tokens to distribute as rewards');
    });

    it("15.5. Should update the rewards for a single wallet", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        // Call the updateRewards function
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount);

        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount,
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(walletAddress);

        console.log("\n   [Log]: Updated wallet: ", walletAddress);
        console.log("   [Log]: Updated wallet totalHyaxRewardsAmount: ", totalHyaxRewardsAmount);
        console.log("   [Log]: Updated wallet currentRewardsAmount: ", currentRewardsAmount);
        console.log("   [Log]: Updated wallet rewardsWithdrawn: ", rewardsWithdrawn);
        console.log("   [Log]: Updated wallet lastRewardsWithdrawalTime: ", lastRewardsWithdrawalTime);
        console.log("   [Log]: Updated wallet lastRewardsUpdateTime: ", lastRewardsUpdateTime);

        expect(currentRewardsAmount).to.equal(rewardAmount);
    });

    it("15.6. Should revert the update of the rewards because tried to update rewards before the minimum interval", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Call the updateRewards function
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount);

        // Try to update the rewards of a wallet before the minimum interval
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Too soon to update rewards for this wallet');
    });

    it("15.7. Should revert the update of the rewards because all the reward tokens have been already distributed", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

        const oneWeek = 7 * 24 * 60 * 60; // One week in seconds

        const totalWeeks = 416; // 8 years * 52 weeks = 416 weeks + 14 weeks for rounding errors

        //Initial successful update of wallet rewards
        for (let i = 0; i < totalWeeks; i++) {

            // Call the updateRewards function
            await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount);

            const rewardTokensDistributed = await upgradeableHYAXRewards.rewardTokensDistributed();
            console.log("   [Log]: Year: ", Math.floor(i / 52), ". Week in year: ", i % 52, ". Absolute week: ", i, ". Total distributed rewards: ", rewardTokensDistributed);

            // Wait for the specified time period to elapse (simulate one week)
            await network.provider.send("evm_increaseTime", [oneWeek]);
            await network.provider.send("evm_mine");
        }

        // Try to update the rewards of a wallet before the minimum interval
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('All the reward tokens have been already distributed');
    });
});
