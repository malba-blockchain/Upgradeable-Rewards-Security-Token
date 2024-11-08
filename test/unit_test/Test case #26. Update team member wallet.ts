import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #26. Update team member wallet", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, addr3, whitelisterAddress] = await ethers.getSigners();

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

        return { upgradeableHYAXRewards, owner, addr1, addr2, addr3, hyaxToken, whitelisterAddress };
    }

    it("26.1. Should revert if team tokens funding has not started", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("Team tokens funding has not started yet, no tokens to recover");
    });

    it("26.2. Should revert if old wallet address is not a team wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("Old wallet address is not a team wallet");
    });

    it("26.3. Should revert if old wallet address is not whitelisted", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Remove the address from the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, false);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("Old team member wallet address is not whitelisted");
    });

    it("26.4. Should revert if old wallet address is blacklisted", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Add wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, true);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("Old team member wallet address is blacklisted");
    });

    it("26.5. Should revert if new wallet address is the zero address", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, ethers.ZeroAddress)
        ).to.be.revertedWith("New team member wallet address cannot be the zero address");
    });

    it("26.6. Should revert if new wallet address is the same as the old wallet address", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr1.address)
        ).to.be.revertedWith("New team member wallet address cannot be the same as the old team member wallet address");
    });

    it("26.7. Should revert if new wallet address is already whitelisted", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Add the new address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("New team member wallet address is already whitelisted");
    });

    it("26.8. Should revert if new wallet address is already a team wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, ethers.parseUnits("1000000", 18));

        //Remove the address from the whitelist, while keeping it as a team wallet
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr2.address, false);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("New team member wallet address is already a team wallet");
    });

    it("26.9. Should revert if new wallet address is blacklisted", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Add the address to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);

        await expect(
            upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address)
        ).to.be.revertedWith("New team member wallet address is blacklisted");
    });

    it("26.10. Should successfully recover team tokens on year 0, without rewards and emit event", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.11. Should successfully recover team tokens on year 1, without rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const oneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.12. Should successfully recover team tokens on year 2, without rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const twoYears = 2 * 365 * 24 * 60 * 60; // Two years in seconds

        // Wait for the specified time period to elapse (simulate two years)
        await network.provider.send("evm_increaseTime", [twoYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.13. Should successfully recover team tokens on year 3, without rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const threeYears = 3 * 365 * 24 * 60 * 60; // Three years in seconds

        // Wait for the specified time period to elapse (simulate three years)
        await network.provider.send("evm_increaseTime", [threeYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.14. Should successfully recover team tokens on year 4, without rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 4 * 365 * 24 * 60 * 60; // Four years in seconds

        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.15. Should successfully recover team tokens on year 5, without rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 4 * 365 * 24 * 60 * 60; // Four years in seconds

        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.16. Should successfully recover team tokens on year 0, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("100000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("100000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("100000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.17. Should successfully recover team tokens on year 1, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("200000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 1 year
        const oneYear = 1 * 365 * 24 * 60 * 60; // One year in seconds
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("200000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("200000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.18. Should successfully recover team tokens on year 2, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("300000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 2 years
        const twoYears = 2 * 365 * 24 * 60 * 60; // Two years in seconds
        await network.provider.send("evm_increaseTime", [twoYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("300000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("300000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.19. Should successfully recover team tokens on year 3, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("400000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 3 years
        const threeYears = 3 * 365 * 24 * 60 * 60; // Three years in seconds
        await network.provider.send("evm_increaseTime", [threeYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("400000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("400000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
 
        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.20. Should successfully recover team tokens on year 4, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("500000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 4 years
        const fourYears = 4 * 365 * 24 * 60 * 60; // Four years in seconds
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.21. Should successfully recover team tokens on year 5, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("600000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 5 years
        const fourYears = 5 * 365 * 24 * 60 * 60; // Five years in seconds
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.22. Should successfully recover team tokens on year 4 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("500000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 4 years
        const fourYears = 4 * 365 * 24 * 60 * 60; // Four years in seconds
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the team tokens available. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("800000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("800000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(1);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.23. Should successfully recover team tokens on year 5 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("600000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 5 years
        const fiveYears = 5 * 365 * 24 * 60 * 60; // Five years in seconds
        await network.provider.send("evm_increaseTime", [fiveYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the initial team tokens assigned. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("600000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(2);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        
        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.24. Should successfully recover team tokens on year 6 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("700000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 6 years
        const sixYears = 6 * 365 * 24 * 60 * 60; // Six years in seconds
        await network.provider.send("evm_increaseTime", [sixYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the initial team tokens assigned. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 60% of 1,000,000 is 600,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("400000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("400000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(3);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("700000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("700000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.25. Should successfully recover team tokens on year 7 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("800000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 7 years
        const sevenYears = 7 * 365 * 24 * 60 * 60; // Seven years in seconds
        await network.provider.send("evm_increaseTime", [sevenYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the initial team tokens assigned. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 60% of 1,000,000 is 600,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 80% of 1,000,000 is 800,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("200000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(4);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("800000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("800000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.26. Should successfully recover team tokens on year 8 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("900000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Wait for 8 years
        const eightYears = 8 * 365 * 24 * 60 * 60; // Eight years in seconds
        await network.provider.send("evm_increaseTime", [eightYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the initial team tokens assigned. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 60% of 1,000,000 is 600,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 80% of 1,000,000 is 800,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 20% of the initial team tokens assigned again. 100% of 1,000,000 is 1,000,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("0", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("0", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(5);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("900000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(ethers.parseUnits("900000", 18));
        expect(oldWallet.rewardsWithdrawn).to.equal(0);
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.27. Should successfully recover team tokens on year 4 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("500000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Withdraw rewards tokens
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Get the timestamp of the block before
        const blockNumBefore2 = await ethers.provider.getBlockNumber();
        const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
        const timestampOfBlockBefore2 = blockBefore2?.timestamp;

        //Wait for 4 years
        const fourYears = 4 * 365 * 24 * 60 * 60; // Four years in seconds
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the team tokens available. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("800000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("800000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(1);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(ethers.parseUnits("500000", 18));
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.28. Should successfully recover team tokens on year 5 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("600000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Withdraw rewards tokens
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Get the timestamp of the block before
        const blockNumBefore2 = await ethers.provider.getBlockNumber();
        const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
        const timestampOfBlockBefore2 = blockBefore2?.timestamp;

        //Wait for 5 years
        const fiveYears = 5 * 365 * 24 * 60 * 60; // Five years in seconds
        await network.provider.send("evm_increaseTime", [fiveYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the team tokens available. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 40% of the team tokens available. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("600000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(2);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(ethers.parseUnits("600000", 18));
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);
        
        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.29. Should successfully recover team tokens on year 6 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("700000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Withdraw rewards tokens
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Get the timestamp of the block before
        const blockNumBefore2 = await ethers.provider.getBlockNumber();
        const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
        const timestampOfBlockBefore2 = blockBefore2?.timestamp;

        //Wait for 6 years
        const sixYears = 6 * 365 * 24 * 60 * 60; // Six years in seconds
        await network.provider.send("evm_increaseTime", [sixYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the team tokens available. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 40% of the team tokens available. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 60% of the team tokens available. 60% of 1,000,000 is 600,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("400000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("400000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(3);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("700000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(ethers.parseUnits("700000", 18));
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.30. Should successfully recover team tokens on year 7 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("800000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Withdraw rewards tokens
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Get the timestamp of the block before
        const blockNumBefore2 = await ethers.provider.getBlockNumber();
        const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
        const timestampOfBlockBefore2 = blockBefore2?.timestamp;

        //Wait for 7 years
        const sevenYears = 7 * 365 * 24 * 60 * 60; // Seven years in seconds
        await network.provider.send("evm_increaseTime", [sevenYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the team tokens available. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 40% of the team tokens available. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 60% of the team tokens available. 60% of 1,000,000 is 600,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 80% of the team tokens available. 80% of 1,000,000 is 800,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("200000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(4);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("800000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(ethers.parseUnits("800000", 18));
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });


    it("26.31. Should successfully recover team tokens on year 7 with rewards after team token withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with team tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards} - Fund with rewards tokens
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Update the rewards for the wallet
        await upgradeableHYAXRewards.connect(owner).updateRewardsSingle(addr1.address, ethers.parseUnits("900000", 18));

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        //Withdraw rewards tokens
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Get the timestamp of the block before
        const blockNumBefore2 = await ethers.provider.getBlockNumber();
        const blockBefore2 = await ethers.provider.getBlock(blockNumBefore2);
        const timestampOfBlockBefore2 = blockBefore2?.timestamp;

        //Wait for 8 years
        const eightYears = 8 * 365 * 24 * 60 * 60; // Eight years in seconds
        await network.provider.send("evm_increaseTime", [eightYears]);
        await network.provider.send("evm_mine");

        //Withdraw 20% of the team tokens available. 20% of 1,000,000 is 200,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 40% of the team tokens available. 40% of 1,000,000 is 400,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 60% of the team tokens available. 60% of 1,000,000 is 600,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 80% of the team tokens available. 80% of 1,000,000 is 800,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        //Withdraw 100% of the team tokens available. 100% of 1,000,000 is 1,000,000
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();


        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberWalletUpdated")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("0", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("0", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(0);
        expect(newWallet.currentRewardsAmount).to.equal(0);
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.teamTokenWithdrawalTimes).to.equal(5);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the old wallet has been properly reset
        const oldWallet = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(oldWallet.isWhitelisted).to.be.false;
        expect(oldWallet.isTeamWallet).to.be.false;
        expect(oldWallet.isBlacklisted).to.be.true;
        expect(oldWallet.hyaxHoldingAmount).to.equal(0);
        expect(oldWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(0);
        expect(oldWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("900000", 18));
        expect(oldWallet.currentRewardsAmount).to.equal(0);
        expect(oldWallet.rewardsWithdrawn).to.equal(ethers.parseUnits("900000", 18));
        expect(oldWallet.teamTokenWithdrawalTimes).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes, lastRewardsWithdrawalTime,
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });
});
