import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network } from "hardhat"
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
        ).to.be.revertedWith("Hyax token address is not valid");
    });
});


describe("Testing Use Case #2: Update wallet whitelist status", function () {

    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whitelister] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        //Update the whitelister address in the contract
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelister.address);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, whitelister, hyaxToken };
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
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("\n   [Log]: Wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(true);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);
    });

    it("2.3.Should successfully add a team wallet to the whitelist as whitelister", async function () {
        const { upgradeableHYAXRewards, addr1, addr2, whitelister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
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
        const { upgradeableHYAXRewards, owner, addr1, whitelister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelister).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(owner).updateWhitelistStatus(addr1.address, false);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("\n   [Log]: Wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(false);
    });

    it("2.8. Should successfully remove a team wallet from the whitelist as whitelister", async function () {
        const { upgradeableHYAXRewards, whitelister, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(whitelister).updateWhitelistStatus(addr1.address, false);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the wallet is a team wallet
        expect(isTeamWallet).to.equal(true);

        // Check if the wallet is in the whitelist
        expect(isWhitelisted).to.equal(false);
    });

    it("2.9. Should fail to remove a wallet because it is not currently whitelisted", async function () {
        const { upgradeableHYAXRewards, whitelister, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelister).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(whitelister).updateWhitelistStatus(addr1.address, false);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(whitelister).updateWhitelistStatus(addr1.address, false)
        ).to.be.revertedWith("Wallet has already been updated to that status");
    });
});


describe("Testing Use Case #3: Update wallet blacklist status", function () {

    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whitelister] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        //Update the whitelister address in the contract
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelister.address);

        //Add wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelister).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, whitelister, hyaxToken };
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

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("\n   [Log]: Wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
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
        const { upgradeableHYAXRewards, addr1, addr2, whitelister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelister).updateBlacklistStatus(addr1.address, true);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
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
        const { upgradeableHYAXRewards, owner, whitelister, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelister).updateBlacklistStatus(addr1.address, true);

        // Remove the wallet from the blacklist
        await upgradeableHYAXRewards.connect(owner).updateBlacklistStatus(addr1.address, false);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("\n   [Log]: Wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
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
        const { upgradeableHYAXRewards, whitelister, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelister).updateBlacklistStatus(addr1.address, true);

        // Remove the wallet from the blacklist
        await upgradeableHYAXRewards.connect(whitelister).updateBlacklistStatus(addr1.address, false);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes,
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
        const { upgradeableHYAXRewards, whitelister, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(whitelister).updateBlacklistStatus(addr1.address, false)
        ).to.be.revertedWith("Wallet has already been updated to that status");
    });
});


describe("Testing Use Case #4: Fund Smart Contract with growth tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("4.1. Should fail to fund the contract with growth tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
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

        const fundingAmount = ethers.parseUnits("2500000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intented for growth tokens');
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


describe("Testing Use Case #5: Fund Smart Contract with growth tokens after having already funded the first time", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("5.1. Should update the total value of growthTokensFunded with the specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevGrowthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount);

        // Get the value of growthTokensFunded
        const newGrowthTokensFunded = prevGrowthTokensFunded + fundingAmount;
        console.log("\n   [Log]: NewGrowthTokensFunded:", newGrowthTokensFunded);
        const growthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();
        console.log("   [Log]: GrowthTokensFunded:", growthTokensFunded);

        // Verify that the contract balance matches the funding amount
        expect(growthTokensFunded).to.equal(newGrowthTokensFunded);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1000000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("5.2. Should continue with the same growthTokensFundingStarted variable equal to true", async function () {
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

    it("5.3. Should not have updated the times of growthTokensStartFundingTime and growthTokensLastWithdrawalTime", async function () {
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
        console.log("\n   [Log]: TimestampOfBlockBefore:", timestampOfBlockBefore);

        // Get the growthTokensStartFundingTime and growthTokensLastWithdrawalTime
        const growthTokensStartFundingTime = await upgradeableHYAXRewards.growthTokensStartFundingTime();
        console.log("   [Log]: GrowthTokensStartFundingTime:", growthTokensStartFundingTime);
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        console.log("   [Log]: GrowthTokensLastWithdrawalTime:", growthTokensLastWithdrawalTime);

        // Check if the growthTokensStartFundingTime and growthTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(growthTokensStartFundingTime).to.not.equal(timestampOfBlockBefore);
        expect(growthTokensLastWithdrawalTime).to.not.equal(timestampOfBlockBefore);
    });

    it("5.4. Should revert when funding with an amout above the total intended for growth tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intented for growth tokens');
    });

});


describe("Testing Use Case #6: Withdraw Growth Tokens ", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("6.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
    });

    it("6.2. Should revert if trying to withdraw without being the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawGrowthTokens()
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
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
        ).to.be.revertedWith("Funding has not started yet, no tokens to withdraw");
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


describe("Testing Use Case #7: Fund Smart Contract with team tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("7.1. Should fail to fund the contract with team tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(1, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("7.2. Should fail to fund the contract with team tokens because its not approved", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount)
        ).to.be.revertedWithCustomError(hyaxToken, 'ERC20InsufficientAllowance');
    });

    it("7.3. Should revert when funding with an invalid type of funding", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(3, fundingAmount)
        ).to.be.reverted;
    });

    it("7.4. Should revert when funding with an invalid amount", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const invalidAmount = ethers.parseUnits("0", 18); // Invalid amount

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(1, invalidAmount)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("7.5. Should successfully fund the contract with team tokens with a specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Get the current balance of team tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.teamTokensFunded();

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

    it("7.6. Should update the teamTokensFundingStarted variable to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Check if the teamTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.teamTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("7.7. Should update the total value of teamTokensFunded", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevTeamTokensFunded = await upgradeableHYAXRewards.teamTokensFunded();
        console.log("\n   [Log]: PrevTeamTokensFunded:", prevTeamTokensFunded);
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Get the value of teamTokensFunded
        const newTeamTokensFunded = prevTeamTokensFunded + fundingAmount;
        console.log("   [Log]: NewTeamTokensFunded:", newTeamTokensFunded);
        const teamTokensFunded = await upgradeableHYAXRewards.teamTokensFunded();
        console.log("   [Log]: TeamTokensFunded:", teamTokensFunded);
        // Check if the growthTokensStartFundingTime and teamTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(teamTokensFunded).to.equal(newTeamTokensFunded);
    });

    it("7.8. Should update the time of teamTokensStartFundingTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

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

    it("7.9. Should revert when funding with an amout above the total intended for team tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1600000000", 18); // Fund with (1,6B) 1,600,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intented for team tokens');
    });

    it("7.10. Should successfully fund the contract with team tokens with the total intended amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1,5B) 1,500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Get the current balance of team tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.teamTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1500000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1500000000", 18));
    });
});


describe("Testing Use Case #8: Fund Smart Contract with team tokens after having already funded the first time", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("8.1. Should update the total value of teamTokensFunded with the specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("500000000", 18); // Fund with (500M) 500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevTeamTokensFunded = await upgradeableHYAXRewards.teamTokensFunded();

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: PrevOwnerTokenBalance:", prevOwnerTokenBalance);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Get the value of teamTokensFunded
        const newTeamTokensFunded = prevTeamTokensFunded + fundingAmount;
        console.log("   [Log]: NewTeamTokensFunded:", newTeamTokensFunded);

        const teamTokensFunded = await upgradeableHYAXRewards.teamTokensFunded();
        console.log("   [Log]: TeamTokensFunded:", teamTokensFunded);

        // Verify that the contract balance matches the funding amount
        expect(teamTokensFunded).to.equal(newTeamTokensFunded);

        // Verify that the smart contract balance increased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("500000000", 18));

        // Check if the owner's balance decreased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        console.log("   [Log]: NewOwnerTokenBalance:", newOwnerTokenBalance);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("500000000", 18));
    });

    it("8.2. Should continue with the same teamTokensFundingStarted variable equal to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("500000000", 18); // Fund with (500M) 500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        // Check if the growthTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.teamTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("8.3. Should not have updated the time of teamTokensStartFundingTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("500000000", 18); // Fund with (500M) 500,000,000 Team Tokens

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
        // Check if the teamTokensStartFundingTime and teamTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(teamTokensStartFundingTime).to.not.equal(timestampOfBlockBefore);
    });

    it("8.4. Should revert when funding with an amout above the total intended for team tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("600000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intented for team tokens');
    });

});

describe("Testing Use Case #9: Withdraw Team Tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whiteLister] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Update the whiteLister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whiteLister.address);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whiteLister };
    }

    it("9.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, addr1, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
    });

    it("9.2. Should revert if trying to withdraw without being whitelisted", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Wallet is not whitelisted');
    });

    it("9.3. Should revert if trying to withdraw team tokens without being a team member", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, false, ethers.parseUnits("0", 18));

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Only team wallets can withdraw tokens using this function');
    });

    it("9.4. Should revert if trying to withdraw team tokens before 4 years since being added to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Cannot withdraw before 4 years after being added to the whitelist');

        const fourYearsMinusOneDay = 1459 * 24 * 60 * 60; // 4 years minus 1 day in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYearsMinusOneDay]);
        await network.provider.send("evm_mine");

        // Try to withdraw growth tokens just 1 day before 4 years
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Cannot withdraw before 4 years after being added to the whitelist');
    });


    it("9.5. Should withdraw the correct amount of team tokens after 4 years have passed and update the corresponding variables", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 1460 * 24 * 60 * 60; // Four years in seconds

        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");
        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the team member wallet
        const prevTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [prevHyaxHoldingAmount, , , , , , , , , ,] = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("   [Log]: Current year:", await upgradeableHYAXRewards.calculateYearForTeamTokens());

        // Withdraw team tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;
        console.log("\n   [Log]: TimestampOfBlockBefore:", timestampOfBlockBefore);

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("200000", 18));
        console.log("\n   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [newHyaxHoldingAmount, , , , , , tokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(tokenWithdrawalTimes).to.equal(1);

        // Check if the remaining tokens in the smart contract are correct
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("200000", 18));

        // Check if the team member's balance increased by the correct amount
        const newTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: NewTeamMemberWalletTokenBalance:", newTeamMemberWalletTokenBalance);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);
        expect(newTeamMemberWalletTokenBalance - prevTeamMemberWalletTokenBalance).to.equal(ethers.parseUnits("200000", 18));
    });


    it("9.6. Should revert if trying to withdraw team tokens before 1 year after first withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 1460 * 24 * 60 * 60; // 4 years in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        // Withdraw team tokens for the wallet for first time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        const lessThanOneYear = 364 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Try to withdraw growth tokens just 1 day before 4 years
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Can only withdraw team tokens once per year');
    });

    it("9.7. Should withdraw the correct amount of team tokens one year has passed since last withdrawal and update the corresponding variables", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 1460 * 24 * 60 * 60; // 4 years in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        // Withdraw team tokens for the wallet for first time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        const oneYear = 365 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the team member wallet
        const prevTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [prevHyaxHoldingAmount, , , , , , , , ,] = await upgradeableHYAXRewards.wallets(addr1.address);

        // Withdraw team tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore?.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        console.log("   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("400000", 18));

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [newHyaxHoldingAmount, , , , , , tokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        console.log("\n   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        // Verify that the last withdrawal time was updated correctly
        expect(tokenWithdrawalTimes).to.equal(2);

        // Check if the remaining tokens in the smart contract are correct
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("200000", 18));

        // Check if the team member's balance increased by the correct amount
        const newTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: NewTeamMemberWalletTokenBalance:", newTeamMemberWalletTokenBalance);
        expect(newTeamMemberWalletTokenBalance - prevTeamMemberWalletTokenBalance).to.equal(ethers.parseUnits("200000", 18));

        // Check if the total amount in team member's wallet is correct
        const teamMemberWalletBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: TeamMemberWalletBalance:", teamMemberWalletBalance);
        expect(teamMemberWalletBalance).to.equal(ethers.parseUnits("400000", 18));
    });

    it("9.8. Should revert after withdrawing all team tokens", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1,5B) 1,500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist with 15 Billion tokens as the amount
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1500000000", 18));

        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        const prevTeamMemberWalletBalance = await hyaxToken.balanceOf(addr1.address);

        const fourYears = 1460 * 24 * 60 * 60; // 4 years in seconds

        const oneYear = 365 * 24 * 60 * 60; // 1 year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        // Get the timestamp of the block after withdrawal
        let blockNumBefore;
        let blockBefore;
        let timestampOfBlockBefore;

        for (let i = 0; i < 5; i++) {
            await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

            blockNumBefore = await ethers.provider.getBlockNumber();
            blockBefore = await ethers.provider.getBlock(blockNumBefore);
            timestampOfBlockBefore = blockBefore?.timestamp;

            // Wait for the specified time period to elapse (simulate one year)
            await network.provider.send("evm_increaseTime", [oneYear]);
            await network.provider.send("evm_mine");
        }

        // Verify that the last withdrawal time was updated correctly
        const [, , , , , , tokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("\n   [Log]: Token Withdrawal Times:", tokenWithdrawalTimes);
        expect(tokenWithdrawalTimes).to.equal(5);

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        console.log("\n   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("1500000000", 18));

        // Check if the remaining tokens in the smart contract are correct. It should be 0 because all tokens have been withdrawn
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(0);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("1500000000", 18));

        // Check if the team member's wallet balance increased by the correct amount
        const newTeamMemberWalletBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: NewTeamMemberWalletBalance:", newTeamMemberWalletBalance);
        expect(newTeamMemberWalletBalance - prevTeamMemberWalletBalance).to.equal(ethers.parseUnits("1500000000", 18));

        //Try to withdraw again once there are no more team tokens to withdraw
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the available balance
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith("All team tokens have been withdrawn");
    });

    it("9.9. Should revert after the team member has withdrawn all his own team tokens", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1,5B) 1,500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist with 1 Million tokens as the amount
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("10000000", 18));

        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        const prevTeamMemberWalletBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletBalance:", prevTeamMemberWalletBalance);

        const fourYears = 1460 * 24 * 60 * 60; // 4 years in seconds

        const oneYear = 365 * 24 * 60 * 60; // 1 year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        // Get the timestamp of the block after withdrawal
        let blockNumBefore;
        let blockBefore;
        let timestampOfBlockBefore;

        for (let i = 0; i < 5; i++) {
            await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

            blockNumBefore = await ethers.provider.getBlockNumber();
            blockBefore = await ethers.provider.getBlock(blockNumBefore);
            timestampOfBlockBefore = blockBefore?.timestamp;

            // Wait for the specified time period to elapse (simulate one year)
            await network.provider.send("evm_increaseTime", [oneYear]);
            await network.provider.send("evm_mine");
        }

        // Verify that the last withdrawal time was updated correctly
        const [newHyaxHoldingAmount, , , , , , tokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("\n   [Log]: Last Token Withdrawal Time:", tokenWithdrawalTimes);
        expect(tokenWithdrawalTimes).to.equal(5);

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        console.log("   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("10000000", 18));

        // Check if the remaining tokens in the smart contract are correct. It should be 0 because all tokens have been withdrawn
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("10000000", 18));

        // Check if the team member's wallet balance increased by the correct amount
        const newTeamMemberWalletBalance = await hyaxToken.balanceOf(addr1.address);
        expect(newTeamMemberWalletBalance - prevTeamMemberWalletBalance).to.equal(ethers.parseUnits("10000000", 18));
        console.log("   [Log]: NewTeamMemberWalletBalance:", newTeamMemberWalletBalance);
        //Try to withdraw again once there are no more team tokens to withdraw
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Attempt to withdraw more than the available balance
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith("No hyax holding amount to withdraw");
    });


    it("9.10. Should withdraw tokens two times after two years since being added to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 1460 * 24 * 60 * 60; // 4 years

        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        const twoYears = 365 * 24 * 60 * 60; // 6 years

        // Wait for the specified time period to elapse (simulate two years)
        await network.provider.send("evm_increaseTime", [twoYears]);
        await network.provider.send("evm_mine");

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the team member wallet
        const prevTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [prevHyaxHoldingAmount, , , , , , , , ,] = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("   [Log]: Current year:", await upgradeableHYAXRewards.calculateYearForTeamTokens());

        // Withdraw team tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet for a second time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("400000", 18));
        console.log("\n   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [newHyaxHoldingAmount, , , , , , tokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("400000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(tokenWithdrawalTimes).to.equal(2);

        // Check if the remaining tokens in the smart contract are correct
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("400000", 18));

        // Check if the team member's balance increased by the correct amount
        const newTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: NewTeamMemberWalletTokenBalance:", newTeamMemberWalletTokenBalance);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);
        expect(newTeamMemberWalletTokenBalance - prevTeamMemberWalletTokenBalance).to.equal(ethers.parseUnits("400000", 18));
    });

    it("9.11. Should withdraw tokens five times after five years since being added to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 1460 * 24 * 60 * 60; // 4 years

        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        const fourYearsMore = 1460 * 24 * 60 * 60; // 8 years

        // Wait for the specified time period to elapse (simulate two years)
        await network.provider.send("evm_increaseTime", [fourYearsMore]);
        await network.provider.send("evm_mine");

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the team member wallet
        const prevTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [prevHyaxHoldingAmount, , , , , , , , ,] = await upgradeableHYAXRewards.wallets(addr1.address);

        console.log("   [Log]: Current year:", await upgradeableHYAXRewards.calculateYearForTeamTokens());

        // Withdraw team tokens for the wallet the first time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the second time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the third time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the fourth time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the fifth time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("1000000", 18));
        console.log("\n   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [newHyaxHoldingAmount, , , , , , tokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(tokenWithdrawalTimes).to.equal(5);

        // Check if the remaining tokens in the smart contract are correct
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("1000000", 18));

        // Check if the team member's balance increased by the correct amount
        const newTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: NewTeamMemberWalletTokenBalance:", newTeamMemberWalletTokenBalance);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);
        expect(newTeamMemberWalletTokenBalance - prevTeamMemberWalletTokenBalance).to.equal(ethers.parseUnits("1000000", 18));

    });

    it("9.12. Should revert after trying to withdraw tokens six times after five years since being added to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whiteLister } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whiteLister)
            .addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 1460 * 24 * 60 * 60; // 4 years

        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        const sixYearsMore = 2190 * 24 * 60 * 60; // 8 years

        // Wait for the specified time period to elapse (simulate two years)
        await network.provider.send("evm_increaseTime", [sixYearsMore]);
        await network.provider.send("evm_mine");

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);
        // Get the initial balance of the team member wallet
        const prevTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);

        console.log("   [Log]: Current year:", await upgradeableHYAXRewards.calculateYearForTeamTokens());

        // Withdraw team tokens for the wallet the first time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the second time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the third time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the fourth time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the fifth time
        await upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens();

        // Attempt to withdraw six times in a row after the eight year
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith("No hyax holding amount to withdraw");
    });
});

describe("Testing Use Case #10: Fund smart contract with reward tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whiteLister] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Update the whiteLister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whiteLister.address);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whiteLister };
    }


    it("10.1. Should fail to fund the contract with reward tokens because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Reward Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("10.2. Should fail to fund the contract with reward tokens because its not approved", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens
        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWithCustomError(hyaxToken, 'ERC20InsufficientAllowance');
    });

    it("10.3. Should revert when funding with an invalid type of funding", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

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
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

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
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

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
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

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
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

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

        const fundingAmount = ethers.parseUnits("1600000000", 18); // Fund with (1,6B) 1,600,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWith('Amount to fund is greater than the total intented for reward tokens');
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

describe("Testing Use Case #11: Fund Smart Contract with reward tokens after having already funded the first time", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

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
        // Check if the rewardTokensStartFundingTime and rewardTokensLastWithdrawalTime are equal to the timestamp of the block before
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
        ).to.be.revertedWith('Amount to fund is greater than the total intented for reward tokens');
    });
});

describe("Testing Use Case #12: Update rewards for a single non team wallet", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress ] = await ethers.getSigners();
        
        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Update the whitelister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Update the rewards updater address
        await upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(rewardsUpdaterAddress.address);

        // Transfer tokens to the addresses
        await hyaxToken.connect(owner).transfer(addr1.address, ethers.parseUnits("100000000", 18));
        await hyaxToken.connect(owner).transfer(addr2.address, ethers.parseUnits("200000000", 18));
        await hyaxToken.connect(owner).transfer(addr3.address, ethers.parseUnits("300000000", 18));

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }
    
    it("12.1. Should update the rewards for a single wallet", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615384615384615384615";

        // Call the updateRewards function
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount);

        const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
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
    
});

describe("Testing Use Case #13: Update rewards for a batch of non team wallets", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress ] = await ethers.getSigners();
        
        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Update the whitelister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Update the rewards updater address
        await upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(rewardsUpdaterAddress.address);

        // Transfer tokens to the addresses
        await hyaxToken.connect(owner).transfer(addr1.address, ethers.parseUnits("100000000", 18));
        await hyaxToken.connect(owner).transfer(addr2.address, ethers.parseUnits("200000000", 18));
        await hyaxToken.connect(owner).transfer(addr3.address, ethers.parseUnits("300000000", 18));

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }
    
    it("13.1. Should update the rewards for a batch of non team wallets", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        console.log("   [Log]: walletAddresses: ", walletAddresses);
        console.log("   [Log]: walletRewards: ", walletRewards);
        
        // Call the updateRewards function
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);

        for (const walletAddress of walletAddresses) {
            const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
                currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
                lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
                = await upgradeableHYAXRewards.wallets(walletAddress);

            console.log("\n   [Log]: Updated wallet: ", walletAddress);
            console.log("   [Log]: Updated wallet totalHyaxRewardsAmount: ", totalHyaxRewardsAmount);
            console.log("   [Log]: Updated wallet currentRewardsAmount: ", currentRewardsAmount);
            console.log("   [Log]: Updated wallet rewardsWithdrawn: ", rewardsWithdrawn);
            console.log("   [Log]: Updated wallet lastRewardsWithdrawalTime: ", lastRewardsWithdrawalTime);
            console.log("   [Log]: Updated wallet lastRewardsUpdateTime: ", lastRewardsUpdateTime);
        }
    });
});

describe("Testing Use Case #14: Withdraw Rewards Tokens of non team wallets", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress ] = await ethers.getSigners();
        
        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Update the whitelister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Update the rewards updater address
        await upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(rewardsUpdaterAddress.address);

        // Transfer tokens to the addresses
        await hyaxToken.connect(owner).transfer(addr1.address, ethers.parseUnits("100000000", 18));
        await hyaxToken.connect(owner).transfer(addr2.address, ethers.parseUnits("200000000", 18));
        await hyaxToken.connect(owner).transfer(addr3.address, ethers.parseUnits("300000000", 18));

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("14.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress  } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
    });

    it("14.2. Should revert if trying to withdraw without being whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Wallet is not whitelisted');
    });

    it("14.3. Should revert if trying to withdraw reward tokens while being blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Wallet has been blacklisted');
    });

    it("14.4. Should revert if trying to withdraw team tokens before being distributed by the rewards updater to the wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('No rewards available to withdraw');
    });

    it("14.5. Should withdraw the correct amount of team tokens after being distributed by the rewards updater", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        
        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the team member wallet
        const prevTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [ hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, 
            currentRewardsAmount, rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, 
            lastRewardsWithdrawalTime, lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted] = await upgradeableHYAXRewards.wallets(addr1.address);

        // Withdraw rewards tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()

        // Check if the correct amount of tokens was withdrawn
        const rewardTokensWithdrawn = await upgradeableHYAXRewards.rewardTokensWithdrawn();
        expect(rewardTokensWithdrawn).to.equal(ethers.parseUnits("200000", 18));
        console.log("\n   [Log]: RewardTokensWithdrawn:", rewardsWithdrawn);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [newHyaxHoldingAmount, , , , , , , , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        //console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        //expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(tokenWithdrawalTimes).to.equal(1);

        // Check if the remaining tokens in the smart contract are correct
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        //expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("200000", 18));

        // Check if the team member's balance increased by the correct amount
        const newTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: NewTeamMemberWalletTokenBalance:", newTeamMemberWalletTokenBalance);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);
        expect(newTeamMemberWalletTokenBalance - prevTeamMemberWalletTokenBalance).to.equal(ethers.parseUnits("200000", 18));
    });


});