import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #2. Update wallet whitelist status", function () {

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

        //Update the whitelister address in the contract
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, whitelisterAddress, hyaxToken };
    }

    it("2.1. Should fail to add a wallet because it doesnt have an authorized role", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(addr1).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))
        ).to.be.revertedWith("Function reserved only for the whitelister or the owner");
    });

    it("2.2. Should successfully add a team wallet to the whitelist as owner", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(owner)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("\n   [Log]: Wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(true);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);
    });

    it("2.3.Should successfully add a team wallet to the whitelist as whitelister", async function () {
        const { upgradeableHYAXRewards, addr1, addr2, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(true);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);
    });

    it("2.4. Should fail to add a wallet because it has already been added", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(owner)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))
        ).to.be.revertedWith("Wallet is already whitelisted");
    });

    it("2.5. Should fail to add a wallet because it contains invalid data", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to add the wallet to the whitelist with an hyax holding amount of 0
        await expect(
            upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("0", 18))
        ).to.be.revertedWith("Team wallets must be added with a hyax holding amount greater than 0");

        // Try to add the wallet to the whitelist with an hyax holding amount of 0
        await expect(
            upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1500000001", 18))
        ).to.be.revertedWith("Team wallets must be added with a hyax holding amount less than the total team tokens");

    });

    it("2.6. Should fail to remove a wallet because it doesnt have an authorized role", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateWhitelistStatus(addr1.address, false)
        ).to.be.revertedWith("Function reserved only for the whitelister or the owner");
    });

    it("2.7. Should successfully remove a team wallet from the whitelist as owner", async function () {
        const { upgradeableHYAXRewards, owner, addr1, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(owner).updateWhitelistStatus(addr1.address, false);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("\n   [Log]: Wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "teamTokenWithdrawalTimes:", teamTokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(false);
    });

    it("2.8. Should successfully remove a team wallet from the whitelist as whitelister", async function () {
        const { upgradeableHYAXRewards, whitelisterAddress, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, false);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(false);
    });

    it("2.9. Should fail to remove a wallet because it is not currently whitelisted", async function () {
        const { upgradeableHYAXRewards, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, false);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, false)
        ).to.be.revertedWith("Wallet has already been updated to that status");
    });
});
