import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #3. Update wallet blacklist status", function () {

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

        //Add wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, whitelisterAddress, hyaxToken };
    }

    it("3.1. Should fail to add a wallet because it doesnt have an authorized role", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot add wallet to blacklist
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateBlacklistStatus(addr1.address, true)
        ).to.be.revertedWith("Function reserved only for the whitelister or the owner");
    });

    it("3.2. Should successfully add a team wallet to the blacklist as owner", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add wallet to the blacklist
        await upgradeableHYAXRewards.connect(owner).updateBlacklistStatus(addr1.address, true);

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(owner).updateWhitelistStatus(addr1.address, true);

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

        // Check if the wallet is in the blacklist
        expect(isBlacklisted).to.equal(true);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);
    });

    it("3.3.Should successfully add a team wallet to the blacklist as whitelister", async function () {
        const { upgradeableHYAXRewards, addr1, addr2, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, true);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(true);

        // Check if the wallet is in the blacklist
        expect(isBlacklisted).to.equal(true);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);
    });

    it("3.4. Should fail to add a wallet because it has already been added", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add wallet to the blacklist
        await upgradeableHYAXRewards.connect(owner).updateBlacklistStatus(addr1.address, true);

        // Test that unauthorized address cannot add wallet to blacklist
        await expect(
            upgradeableHYAXRewards.connect(owner).updateBlacklistStatus(addr1.address, true)
        ).to.be.revertedWith("Wallet has already been updated to that status");
    });

    it("3.5. Should fail to remove a wallet from the black list because it doesnt have an authorized role", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot remove wallet from whitelist
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateBlacklistStatus(addr1.address, false)
        ).to.be.revertedWith("Function reserved only for the whitelister or the owner");
    });

    it("3.6. Should successfully remove a team wallet from the blacklist as owner", async function () {
        const { upgradeableHYAXRewards, owner, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Remove the wallet from the blacklist
        await upgradeableHYAXRewards.connect(owner).updateBlacklistStatus(addr1.address, false);

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(owner).updateWhitelistStatus(addr1.address, true);

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

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);

        // Check if the wallet is in the blacklist
        expect(isBlacklisted).to.equal(false);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(true);
    });

    it("3.7. Should successfully remove a team wallet from the blacklist as whitelister", async function () {
        const { upgradeableHYAXRewards, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Remove the wallet from the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, false);

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, true);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, teamTokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);

        // Check if the wallet is in the blacklist
        expect(isBlacklisted).to.equal(false);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(true);
    });

    it("3.8. Should fail to remove a wallet from blacklist because it is not currently blacklisted", async function () {
        const { upgradeableHYAXRewards, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, false)
        ).to.be.revertedWith("Wallet has already been updated to that status");
    });
});
