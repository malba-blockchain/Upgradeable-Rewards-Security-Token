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
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

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
        const { upgradeableHYAXRewards, addr1, addr2, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Try to add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

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
        const { upgradeableHYAXRewards, whitelisterAddress, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Remove the wallet from the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, false);

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


describe("Testing Use Case #3: Update wallet blacklist status", function () {

    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

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
        const { upgradeableHYAXRewards, addr1, addr2, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

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
        const { upgradeableHYAXRewards, owner, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

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
        const { upgradeableHYAXRewards, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Remove the wallet from the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, false);

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
        const { upgradeableHYAXRewards, whitelisterAddress, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Test that unauthorized address cannot add wallet to whitelist
        await expect(
            upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, false)
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
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Update the whiteLister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress };
    }

    it("9.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, addr1, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
            .addWalletToWhitelist(addr1.address, false, ethers.parseUnits("0", 18));

        // Try to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Only team wallets can withdraw tokens using this function');
    });

    it("9.4. Should revert if trying to withdraw team tokens before 4 years since being added to the whitelist", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1,5B) 1,500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist with 15 Billion tokens as the amount
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1500000000", 18); // Fund with (1,5B) 1,500,000,000 Team Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist with 1 Million tokens as the amount
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress)
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
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

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

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("12.1. Should revert the update of the rewards because the wallet is not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

        // Try to update the rewards of a non whitelisted wallet
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Wallet is not whitelisted');
    });

    it("12.2. Should revert the update of the rewards because the wallet is blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Try to update the rewards of a blacklisted wallet
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Wallet has been blacklisted');
    });

    it("12.3. Should revert the update of the rewards because the rewards exceed the weekly limit", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884616000000000000000000";

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        
        // Try to update the rewards of a wallet that exceeds the weekly limit
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('A single wallet cannot have rewards higher than the weekly limit');
    });

    it("12.4. Should revert the update of the rewards because there are not enough reward tokens in the smart contract", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        //Withdraw all the reward tokens from the smart contract
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, ethers.parseUnits("1000000000", 18));
        
        // Try to update the rewards of a wallet
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Insufficient reward tokens to distribute as rewards');
    });

    it("12.5. Should update the rewards for a single wallet", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

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

    it("12.6. Should revert the update of the rewards because tried to update rewards before the minimum interval", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        const walletAddress = addr1.address;
        const rewardAmount = "2884615000000000000000000";

        // Call the updateRewards function
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount);

        // Try to update the rewards of a wallet before the minimum interval
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(walletAddress, rewardAmount)
        ).to.be.revertedWith('Too soon to update rewards for this wallet');
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
        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("13.1. Should revert all 3 internal updates because wallets are not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];
        
        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
        }
        //There should be 3 events where the wallet is not whitelisted
        expect(numberOfFailedUpdates).to.equal(3);
    });

    it("13.2. Should revert only 2 internal updates because wallets are not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add only one wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 2 events where the wallet is not whitelisted
        expect(numberOfFailedUpdates).to.equal(2);

        //There should be 1 event where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(1);
    });

    it("13.3. Should revert only 1 internal update because the wallet is not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add only two  wallets to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);
 
        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 2 events where the wallet is not whitelisted
        expect(numberOfFailedUpdates).to.equal(1);

        //There should be 1 event where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(2);
    });

    it("13.4. Should revert all 3 internal updates because wallets are blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr3.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
        }
        //There should be 3 events where the wallets are blacklisted
        expect(numberOfFailedUpdates).to.equal(3);
    });

    it("13.5. Should revert 2 internal updates because 2 wallets are blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];
        
        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 2 events where the wallets are blacklisted
        expect(numberOfFailedUpdates).to.equal(2);

        //There should be 1 event where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(1);
    });

    it("13.6. Should revert 1 internal update because 1 wallet is blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);
        
        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];
        
        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 1 events where the wallet is blacklisted
        expect(numberOfFailedUpdates).to.equal(1);

        //There should be 2 events where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(2);
    });

     it("13.7. Should revert because the rewards to deliver exceed the weekly limit", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*1.1) / divisor) * divisor]; 

          // Call the updateRewards function
          const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
          const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
          const events = updateRewardsBatchReceipt?.logs || [];
  
          let numberOfFailedUpdates = 0;
          let numberOfSuccessfulUpdates = 0;
  
          for (const event of events) {
              //'Wallet is not whitelisted'
              if(event.fragment.name === "RewardUpdateFailed") {
                  expect(event.args[2]).to.equal('A single wallet cannot have rewards higher than the weekly limit');
                  numberOfFailedUpdates++;
              }
              else if(event.fragment.name === "RewardUpdateSuccess") {
                  numberOfSuccessfulUpdates++;
              }
          }
          //There should be 1 events where the wallet is blacklisted
          expect(numberOfFailedUpdates).to.equal(1);
  
          //There should be 2 events where the wallet is whitelisted
          expect(numberOfSuccessfulUpdates).to.equal(2);
    });

    it("13.8. Revert because the batch exceeds the maximum batch size defined for updates", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        //Update the maximum batch size for update rewards
        await upgradeableHYAXRewards.connect(owner).updateMaximumBatchSizeForUpdateRewards(2);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards)
        ).to.be.revertedWith('Batch size exceeds the defined limit');
    });

    it("13.9. Should revert because there are not enough tokens in the smart contract to fund the rewards", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor]; 

        //Withdraw all the reward tokens from the smart contract 
        const withdrawAmount = ethers.parseUnits("1000000000", 18); //(1B) 1,000,000,000 reward Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.withdrawTokensToBurn(2, withdrawAmount);

          // Call the updateRewards function
          const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
          const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
          const events = updateRewardsBatchReceipt?.logs || [];
            
          let numberOfFailedUpdates = 0;
          let numberOfSuccessfulUpdates = 0;
  
          for (const event of events) {
              //'Wallet is not whitelisted'
              if(event.fragment.name === "RewardUpdateFailed") {
                  expect(event.args[2]).to.equal('Insufficient reward tokens to distribute as rewards');
                  numberOfFailedUpdates++;
              }
              else if(event.fragment.name === "RewardUpdateSuccess") {
                  numberOfSuccessfulUpdates++;
              }
          }
          //There should be 3 events where the update reverted
          expect(numberOfFailedUpdates).to.equal(3);
  
          //There should be 0 events where the update was successful
          expect(numberOfSuccessfulUpdates).to.equal(0);
    });

    it("13.10. Should revert because there is an array mismatch", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor]; 

        // Call the updateRewards function
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards)
        ).to.be.revertedWith('Array lengths must match');
    });

    
    it("13.11. Should successfully update the rewards for a batch of non team wallets", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

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

    it("13.12. Should revert because tried to update the rewards of a wallet in less than 1 week", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor]; 

        //Initial successful update of wallet rewards
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);

          // Call the updateRewards function
          const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
          const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
          const events = updateRewardsBatchReceipt?.logs || [];
            
          let numberOfFailedUpdates = 0;
          let numberOfSuccessfulUpdates = 0;
  
          for (const event of events) {
              //'Wallet is not whitelisted'
              if(event.fragment.name === "RewardUpdateFailed") {
                  expect(event.args[2]).to.equal('Too soon to update rewards for this wallet');
                  numberOfFailedUpdates++;
              }
              else if(event.fragment.name === "RewardUpdateSuccess") {
                  numberOfSuccessfulUpdates++;
              }
          }
          //There should be 3 events where the update reverted
          expect(numberOfFailedUpdates).to.equal(3);
  
          //There should be 0 events where the update was successful
          expect(numberOfSuccessfulUpdates).to.equal(0);
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

    it("14.4. Should revert if trying to withdraw reward tokens before being distributed by the rewards updater to the wallet", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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

    it("14.5. Should revert if trying to withdraw team tokens without enough reward tokens in the contract", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        // Update the rewards for the wallet
        const rewardAmount = "1442307000000000000000000"; //Equivalent to 1'442.307 M Tokens or 50% of the total reward tokens per week
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

        // Withdraw all reward tokens
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, fundingAmount);
        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Insufficient reward tokens in the contract to withdraw');
    });

    it("14.6. Should withdraw the correct amount of team tokens after being distributed by the rewards updater", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        
        // Update the rewards for the wallet
        const rewardAmount = "1442307000000000000000000"; //Equivalent to 1'442.307 M Tokens or 50% of the total reward tokens per week
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the wallet
        const prevWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevWalletTokenBalance:", prevWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [ , , totalHyaxRewardsAmount1, currentRewardsAmount1, rewardsWithdrawn1, , , , , , , ]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Withdraw rewards tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [ , , totalHyaxRewardsAmount2, currentRewardsAmount2, rewardsWithdrawn2, , , , , , , ]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the correct amount of tokens was withdrawn
        const rewardTokensWithdrawn = await upgradeableHYAXRewards.rewardTokensWithdrawn();
        expect(rewardTokensWithdrawn).to.equal(rewardsWithdrawn2);
        console.log("\n   [Log]: RewardTokensWithdrawn:", rewardsWithdrawn2);

        // Check if the correct amount of tokens was withdrawn for the wallet
        console.log("   [Log]: NewCurrentRewardsAmount:", currentRewardsAmount2);
        console.log("   [Log]: PrevCurrentRewardsAmount:", currentRewardsAmount1);
        expect(currentRewardsAmount1 - currentRewardsAmount2).to.equal(rewardAmount);
        // Verify that the last withdrawal time was updated correctly
        expect(totalHyaxRewardsAmount2).to.equal(rewardAmount);

        // Check if the remaining tokens in the smart contract are correct
        const rewardTokensInSmartContract = await upgradeableHYAXRewards.rewardTokensInSmartContract();
        console.log("\n   [Log]: RewardTokensInSmartContract:", rewardTokensInSmartContract);
        expect(rewardTokensInSmartContract).to.equal(fundingAmount - rewardTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(rewardAmount);

        // Check if the wallet balance increased by the correct amount
        const newWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("\n   [Log]: NewWalletTokenBalance:", newWalletTokenBalance);
        console.log("   [Log]: PrevWalletTokenBalance:", prevWalletTokenBalance);
        expect(newWalletTokenBalance - prevWalletTokenBalance).to.equal(rewardAmount);
    });

    it("14.7. Should withdraw all reward tokens after being distributed by the rewards updater after 8 years", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1200000000", 18); // Fund with (1,2 B) 1,200,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        // Add the wallet 1 and wallet 2 to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);

        const oneWeek = 7 * 24 * 60 * 60; // One week in seconds

        const rewardAmount = "2884615000000000000000000"; //Equivalent to 2'884.615 M Tokens or 50% of the total reward tokens per week

        //Run a for loop for 416 weeks to update the rewards for the wallet, simulating the rewards distribution for 8 years
        for (let i = 0; i < 416; i++) {

            await network.provider.send("evm_increaseTime", [oneWeek]);
            await network.provider.send("evm_mine");

            // Update the rewards for the wallet
            await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

            await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();
            /*
            console.log("   [Log]: Week:", i);
            console.log("   [Log]: RewardTokensDistributed:", await upgradeableHYAXRewards.rewardTokensDistributed());
            console.log("   [Log]: RewardTokensInSmartContract:", await upgradeableHYAXRewards.rewardTokensInSmartContract());
            console.log("   [Log]: RewardTokensWithdrawn:", await upgradeableHYAXRewards.rewardTokensWithdrawn());
            console.log("   [Log]: Total Reward Tokens:", await upgradeableHYAXRewards.REWARD_TOKENS_TOTAL());
            */
        }

        //Calculate reward tokens that are currently left. Margin error of 160 tokens due to rounding
        const rewardTokensLeftToDistribute = await upgradeableHYAXRewards.REWARD_TOKENS_TOTAL() - await upgradeableHYAXRewards.rewardTokensDistributed();
        console.log("\n   [Log]: RewardTokensLeftToDistribute:", ethers.formatEther(rewardTokensLeftToDistribute.toString())); 
        
        //Calculate reward tokens that are currently left. Margin error of 160 tokens due to rounding
        const rewardTokensLeftToWithdraw = await upgradeableHYAXRewards.REWARD_TOKENS_TOTAL() - await upgradeableHYAXRewards.rewardTokensWithdrawn();
        console.log("   [Log]: RewardTokensLeftToWithdraw:", ethers.formatEther(rewardTokensLeftToWithdraw.toString())); 
    });
});


describe("Testing Use Case #15: Update rewards for a single team wallet", function () {
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
});


describe("Testing Use Case #16: Update rewards for a batch of team wallets", function () {
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

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(2, fundingAmount);
        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("16.1. Should revert all 3 internal updates because the team wallets are not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];
        
        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
        }
        //There should be 3 events where the wallet is not whitelisted
        expect(numberOfFailedUpdates).to.equal(3);
    });

    it("16.2. Should revert only 2 internal updates because the team wallets are not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add only one wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 2 events where the wallet is not whitelisted
        expect(numberOfFailedUpdates).to.equal(2);

        //There should be 1 event where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(1);
    });

    it("16.3. Should revert only 1 internal update because the team wallet is not whitelisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add only two  wallets to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);
 
        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 2 events where the wallet is not whitelisted
        expect(numberOfFailedUpdates).to.equal(1);

        //There should be 1 event where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(2);
    });

    it("16.4. Should revert all 3 internal updates because the team wallets are blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr3.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
        }
        //There should be 3 events where the wallets are blacklisted
        expect(numberOfFailedUpdates).to.equal(3);
    });

    it("16.5. Should revert 2 internal updates because 2 team wallets are blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];
        
        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 2 events where the wallets are blacklisted
        expect(numberOfFailedUpdates).to.equal(2);

        //There should be 1 event where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(1);
    });

    it("16.6. Should revert 1 internal update because 1 team wallet is blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);
        
        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr2.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];
        
        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if(event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
            else if(event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 1 events where the wallet is blacklisted
        expect(numberOfFailedUpdates).to.equal(1);

        //There should be 2 events where the wallet is whitelisted
        expect(numberOfSuccessfulUpdates).to.equal(2);
    });

     it("16.7. Should revert because the rewards to deliver exceed the weekly limit", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*1.1) / divisor) * divisor]; 

          // Call the updateRewards function
          const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
          const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
          const events = updateRewardsBatchReceipt?.logs || [];
  
          let numberOfFailedUpdates = 0;
          let numberOfSuccessfulUpdates = 0;
  
          for (const event of events) {
              //'Wallet is not whitelisted'
              if(event.fragment.name === "RewardUpdateFailed") {
                  expect(event.args[2]).to.equal('A single wallet cannot have rewards higher than the weekly limit');
                  numberOfFailedUpdates++;
              }
              else if(event.fragment.name === "RewardUpdateSuccess") {
                  numberOfSuccessfulUpdates++;
              }
          }
          //There should be 1 events where the wallet is blacklisted
          expect(numberOfFailedUpdates).to.equal(1);
  
          //There should be 2 events where the wallet is whitelisted
          expect(numberOfSuccessfulUpdates).to.equal(2);
    });

    it("16.8. Revert because the batch exceeds the maximum batch size defined for updates", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        //Update the maximum batch size for update rewards
        await upgradeableHYAXRewards.connect(owner).updateMaximumBatchSizeForUpdateRewards(2);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor];

        // Call the updateRewards function
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards)
        ).to.be.revertedWith('Batch size exceeds the defined limit');
    });

    it("16.9. Should revert because there are not enough tokens in the smart contract to fund the rewards", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor]; 

        //Withdraw all the reward tokens from the smart contract 
        const withdrawAmount = ethers.parseUnits("1000000000", 18); //(1B) 1,000,000,000 reward Tokens

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.withdrawTokensToBurn(2, withdrawAmount);

          // Call the updateRewards function
          const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
          const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
          const events = updateRewardsBatchReceipt?.logs || [];
            
          let numberOfFailedUpdates = 0;
          let numberOfSuccessfulUpdates = 0;
  
          for (const event of events) {
              //'Wallet is not whitelisted'
              if(event.fragment.name === "RewardUpdateFailed") {
                  expect(event.args[2]).to.equal('Insufficient reward tokens to distribute as rewards');
                  numberOfFailedUpdates++;
              }
              else if(event.fragment.name === "RewardUpdateSuccess") {
                  numberOfSuccessfulUpdates++;
              }
          }
          //There should be 3 events where the update reverted
          expect(numberOfFailedUpdates).to.equal(3);
  
          //There should be 0 events where the update was successful
          expect(numberOfSuccessfulUpdates).to.equal(0);
    });

    it("16.10. Should revert because there is an array mismatch", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
    
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        const walletAddresses = [addr1.address, addr2.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor]; 

        // Call the updateRewards function
        await expect(
            upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards)
        ).to.be.revertedWith('Array lengths must match');
    });

    
    it("16.11. Should successfully update the rewards for a batch of team wallets", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

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

    it("16.12. Should revert because tried to update the rewards of a team wallet in less than 1 week", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);
        
        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, true, oneMillionTokens);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, true, oneMillionTokens);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits
        
        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards*0.16) / divisor) * divisor, 
            (BigInt(totalRewards*0.33) / divisor) * divisor, (BigInt(totalRewards*0.5) / divisor) * divisor]; 

        //Initial successful update of wallet rewards
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);

          // Call the updateRewards function
          const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
          const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
          const events = updateRewardsBatchReceipt?.logs || [];
            
          let numberOfFailedUpdates = 0;
          let numberOfSuccessfulUpdates = 0;
  
          for (const event of events) {
              //'Wallet is not whitelisted'
              if(event.fragment.name === "RewardUpdateFailed") {
                  expect(event.args[2]).to.equal('Too soon to update rewards for this wallet');
                  numberOfFailedUpdates++;
              }
              else if(event.fragment.name === "RewardUpdateSuccess") {
                  numberOfSuccessfulUpdates++;
              }
          }
          //There should be 3 events where the update reverted
          expect(numberOfFailedUpdates).to.equal(3);
  
          //There should be 0 events where the update was successful
          expect(numberOfSuccessfulUpdates).to.equal(0);
    });
});


describe("Testing Use Case #17: Withdraw Rewards Tokens of team wallets", function () {
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

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }
    
    it("17.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress  } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Try to withdraw growth tokens 
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
    });

    it("17.2. Should revert if trying to withdraw without being whitelisted", async function () {
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

    it("17.3. Should revert if trying to withdraw reward tokens while being blacklisted", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Add the wallet to the blacklist
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateBlacklistStatus(addr1.address, true);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Wallet has been blacklisted');
    });

    it("17.4. Should revert if trying to withdraw reward tokens before being distributed by the rewards updater to the wallet", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('No rewards available to withdraw');
    });

    it("17.5. Should revert if trying to withdraw team tokens without enough reward tokens in the contract", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Update the rewards for the wallet
        const rewardAmount = "1442307000000000000000000"; //Equivalent to 1'442.307 M Tokens or 50% of the total reward tokens per week
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

        // Withdraw all reward tokens
        await upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(2, fundingAmount);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Insufficient reward tokens in the contract to withdraw');
    });

    it("17.6. Should withdraw the correct amount of team tokens after being distributed by the rewards updater", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens
        
        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);
        
        // Update the rewards for the wallet
        const rewardAmount = "1442307000000000000000000"; //Equivalent to 1'442.307 M Tokens or 50% of the total reward tokens per week
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the wallet
        const prevWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("   [Log]: PrevWalletTokenBalance:", prevWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [ , , totalHyaxRewardsAmount1, currentRewardsAmount1, rewardsWithdrawn1, , , , , , , ]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Withdraw rewards tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [ , , totalHyaxRewardsAmount2, currentRewardsAmount2, rewardsWithdrawn2, , , , , , , ]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Check if the correct amount of tokens was withdrawn
        const rewardTokensWithdrawn = await upgradeableHYAXRewards.rewardTokensWithdrawn();
        expect(rewardTokensWithdrawn).to.equal(rewardsWithdrawn2);
        console.log("\n   [Log]: RewardTokensWithdrawn:", rewardsWithdrawn2);

        // Check if the correct amount of tokens was withdrawn for the wallet
        console.log("   [Log]: NewCurrentRewardsAmount:", currentRewardsAmount2);
        console.log("   [Log]: PrevCurrentRewardsAmount:", currentRewardsAmount1);
        expect(currentRewardsAmount1 - currentRewardsAmount2).to.equal(rewardAmount);
        // Verify that the last withdrawal time was updated correctly
        expect(totalHyaxRewardsAmount2).to.equal(rewardAmount);

        // Check if the remaining tokens in the smart contract are correct
        const rewardTokensInSmartContract = await upgradeableHYAXRewards.rewardTokensInSmartContract();
        console.log("\n   [Log]: RewardTokensInSmartContract:", rewardTokensInSmartContract);
        expect(rewardTokensInSmartContract).to.equal(fundingAmount - rewardTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(rewardAmount);

        // Check if the wallet balance increased by the correct amount
        const newWalletTokenBalance = await hyaxToken.balanceOf(addr1.address);
        console.log("\n   [Log]: NewWalletTokenBalance:", newWalletTokenBalance);
        console.log("   [Log]: PrevWalletTokenBalance:", prevWalletTokenBalance);
        expect(newWalletTokenBalance - prevWalletTokenBalance).to.equal(rewardAmount);
    });

    it("17.7. Should withdraw all reward tokens after being distributed by the rewards updater after 8 years", async function () {
        const {  upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1200000000", 18); // Fund with (1,2 B) 1,200,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the wallet 1 and wallet 2 to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        const oneWeek = 7 * 24 * 60 * 60; // One week in seconds

        const rewardAmount = "2884615000000000000000000"; //Equivalent to 2'884.615 M Tokens or 50% of the total reward tokens per week

        //Run a for loop for 416 weeks to update the rewards for the wallet, simulating the rewards distribution for 8 years
        for (let i = 0; i < 416; i++) {

            await network.provider.send("evm_increaseTime", [oneWeek]);
            await network.provider.send("evm_mine");

            // Update the rewards for the wallet
            await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

            await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();
            /*
            console.log("   [Log]: Week:", i);
            console.log("   [Log]: RewardTokensDistributed:", await upgradeableHYAXRewards.rewardTokensDistributed());
            console.log("   [Log]: RewardTokensInSmartContract:", await upgradeableHYAXRewards.rewardTokensInSmartContract());
            console.log("   [Log]: RewardTokensWithdrawn:", await upgradeableHYAXRewards.rewardTokensWithdrawn());
            console.log("   [Log]: Total Reward Tokens:", await upgradeableHYAXRewards.REWARD_TOKENS_TOTAL());
            */
        }

        //Calculate reward tokens that are currently left. Margin error of 160 tokens due to rounding
        const rewardTokensLeftToDistribute = await upgradeableHYAXRewards.REWARD_TOKENS_TOTAL() - await upgradeableHYAXRewards.rewardTokensDistributed();
        console.log("\n   [Log]: RewardTokensLeftToDistribute:", ethers.formatEther(rewardTokensLeftToDistribute.toString())); 
        
        //Calculate reward tokens that are currently left. Margin error of 160 tokens due to rounding
        const rewardTokensLeftToWithdraw = await upgradeableHYAXRewards.REWARD_TOKENS_TOTAL() - await upgradeableHYAXRewards.rewardTokensWithdrawn();
        console.log("   [Log]: RewardTokensLeftToWithdraw:", ethers.formatEther(rewardTokensLeftToWithdraw.toString())); 
    });
});

describe("Testing Use Case #18: Calculate year for team tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("18.1. Should return error if trying to calculate the year for team tokens before being funded", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        await expect(
            upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens()
        ).to.be.revertedWith('Team tokens funding has not started yet');
    });

    
    it("18.2. Should return 0 if trying to calculate the year between 0 and 4 years of funding the team tokens", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        //Day 0: Immediatelly after funding should be 0
        const yearForTeamTokens_immediatellyAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_immediatellyAfterFunding).to.equal(0);   

        // Less than one year in seconds
        const lessThanOneYear = 364 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate less than one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Day 364: Less than one year after funding should be 0
        const yearForTeamTokens_lessThanOneYearAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanOneYearAfterFunding).to.equal(0);   

        //One day
        const oneDay = 1 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneDay]);
        await network.provider.send("evm_mine");

        // Day 365: One year after funding should be 0
        const yearForTeamTokens_oneYearAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_oneYearAfterFunding).to.equal(0);  

        //Day 730: Two years after funding should be 0
        const oneYear = 1 * 365 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Day 730: Two years after funding should be 0
        const yearForTeamTokens_twoYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_twoYearsAfterFunding).to.equal(0);

        // Wait for the specified time period to elapse (simulate two years)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Day 1095: Three years after funding should be 0
        const yearForTeamTokens_threeYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_threeYearsAfterFunding).to.equal(0);  

        // Wait for the specified time period to elapse (simulate less than year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Day 1459: Less than four years after funding should be 0
        const yearForTeamTokens_lessThanFourYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanFourYearsAfterFunding).to.equal(0);   
    });
    
    
    it("18.2. Should return 1 if trying to calculate the year between 4 and less than 5 years of funding the team tokens", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        //Day 1460: Four years after funding should be 1
        const fourYears = 4 * 365 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        // Day 1460: Four years after funding should be 1
        const yearForTeamTokens_fourYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_fourYearsAfterFunding).to.equal(1);   

        // Less than one year in seconds
        const lessThanOneYear = 364 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");
        
        // Day 1824: Four years after funding should be 1
        const yearForTeamTokens_lessThanFiveYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanFiveYearsAfterFunding).to.equal(1);  
    });

    it("18.3. Should return 2 if trying to calculate the year between 5 and less than 6 years of funding the team tokens", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        //Five years after funding should be 2
        const fiveYears = 5 * 365 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate five years)
        await network.provider.send("evm_increaseTime", [fiveYears]);
        await network.provider.send("evm_mine");

        // Day 1825: Five years after funding should be 2
        const yearForTeamTokens_fiveYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_fiveYearsAfterFunding).to.equal(2);   

        // Less than one year in seconds
        const lessThanOneYear = 364 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");
        
        // Day 2189: Five years after funding should be 2
        const yearForTeamTokens_lessThanSixYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanSixYearsAfterFunding).to.equal(2);  
    });

    it("18.4. Should return 3 if trying to calculate the year between 6 and less than 7 years of funding the team tokens", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        //Six years after funding should be 3
        const sixYears = 6 * 365 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate six years)
        await network.provider.send("evm_increaseTime", [sixYears]);
        await network.provider.send("evm_mine");

        // Day 2190: Six years after funding should be 3
        const yearForTeamTokens_sixYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_sixYearsAfterFunding).to.equal(3);   

        // Less than one year in seconds
        const lessThanOneYear = 364 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Day 2554: Seven years after funding should be 3
        const yearForTeamTokens_lessThanSevenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanSevenYearsAfterFunding).to.equal(3);  
    });

    
    it("18.5. Should return 4 if trying to calculate the year between 7 and less than 8 years of funding the team tokens", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        //Seven years after funding should be 4
        const sevenYears = 7 * 365 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate seven years)
        await network.provider.send("evm_increaseTime", [sevenYears]);
        await network.provider.send("evm_mine");

        // Day 2555: Seven years after funding should be 4
        const yearForTeamTokens_sevenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_sevenYearsAfterFunding).to.equal(4);   

        // Less than one year in seconds
        const lessThanOneYear = 364 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");
        
        // Day 2919: Seven years after funding should be 4
        const yearForTeamTokens_lessThanEightYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanEightYearsAfterFunding).to.equal(4);  
    });

    it("18.6. Should return 5 if trying to calculate the year between 8 and beyond years of funding the team tokens", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(1, fundingAmount);

        //Eight years after funding should be 5
        const eightYears = 8 * 365 * 24 * 60 * 60; 

        // Wait for the specified time period to elapse (simulate eight years)
        await network.provider.send("evm_increaseTime", [eightYears]);
        await network.provider.send("evm_mine");

        // Day 2920: Eight years after funding should be 5
        const yearForTeamTokens_eightYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_eightYearsAfterFunding).to.equal(5);   

        // Less than one year in seconds
        const lessThanOneYear = 364 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");
        
        // Day 1460: Less than nine years after funding should be 5
        const yearForTeamTokens_lessThanNineYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_lessThanNineYearsAfterFunding).to.equal(5);

        // One year in seconds
        const oneYear = 366 * 24 * 60 * 60;

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear]);
        await network.provider.send("evm_mine");

        // Day 3286: Nine years after funding should be 5
        const yearForTeamTokens_tenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_tenYearsAfterFunding).to.equal(5);  

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear*2]);
        await network.provider.send("evm_mine");

        // Day 4016: Eleven years after funding should be 5
        const yearForTeamTokens_elevenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_elevenYearsAfterFunding).to.equal(5);  
        
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear*4]);
        await network.provider.send("evm_mine");
        
        // Day 5476: Fifteen years after funding should be 5
        const yearForTeamTokens_fifteenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_fifteenYearsAfterFunding).to.equal(5);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear*5]);
        await network.provider.send("evm_mine");
        
        // Day 6206: Twenty years after funding should be 5
        const yearForTeamTokens_twentyYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_twentyYearsAfterFunding).to.equal(5);  
    });
});

describe("Testing Use Case #19: Withdrawal of tokens to burn", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

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
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
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
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
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
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
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
        ).to.be.revertedWith('Funding has not started yet, no tokens to withdraw');
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

describe("Testing Use Case #20: Update whiteLister address", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, whitelisterAddress] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress };
    }

    it("20.1. Revert update of whitelister address because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the whiteLister address without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateWhiteListerAddress(whitelisterAddress.address)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("20.2. Revert update of whitelister address because it's the zero address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the whiteLister address to the zero address
        await expect(
            upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(ethers.ZeroAddress)
        ).to.be.revertedWith("White lister address cannot be the zero address");
    });

    it("20.3. Successfully update whitelister address", async function () {
        const { upgradeableHYAXRewards, owner, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the whiteLister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        const updatedWhiteListerAddress = await upgradeableHYAXRewards.whiteListerAddress();
        expect(updatedWhiteListerAddress).to.equal(whitelisterAddress.address);
    });
});

describe("Testing Use Case #21: Update rewardsUpdater address", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, rewardsUpdater] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, rewardsUpdater };
    }

    it("21.1. Revert update of rewardsUpdater address because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1, rewardsUpdater } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the rewardsUpdater address without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateRewardsUpdaterAddress(rewardsUpdater.address)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("21.2. Revert update of rewardsUpdater address because it's the zero address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the rewardsUpdater address to the zero address
        await expect(
            upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(ethers.ZeroAddress)
        ).to.be.revertedWith("Rewards updater address cannot be the zero address");
    });

    it("21.3. Successfully update rewardsUpdater address", async function () {
        const { upgradeableHYAXRewards, owner, rewardsUpdater } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the rewardsUpdater address
        await upgradeableHYAXRewards.connect(owner).updateRewardsUpdaterAddress(rewardsUpdater.address);

        const updatedRewardsUpdaterAddress = await upgradeableHYAXRewards.rewardsUpdaterAddress();
        expect(updatedRewardsUpdaterAddress).to.equal(rewardsUpdater.address);
    });
});

describe("Testing Use Case #22: Update hyax token address", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, rewardsUpdater] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, rewardsUpdater };
    }

    it("22.1. Revert update of hyax token address because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1, rewardsUpdater } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the rewardsUpdater address without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateHyaxTokenAddress(rewardsUpdater.address)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("22.2. Revert update of hyax token address because it's the zero address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the rewardsUpdater address to the zero address
        await expect(
            upgradeableHYAXRewards.connect(owner).updateHyaxTokenAddress(ethers.ZeroAddress)
        ).to.be.revertedWith("Hyax token address cannot be the zero address");
    });

    it("22.3. Revert update of hyax token address because it's not a valid HYAX token address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the hyax token address to an invalid HYAX token address
        await expect(
            upgradeableHYAXRewards.connect(owner).updateHyaxTokenAddress(upgradeableHYAXRewards.target)
        ).to.be.reverted;
    });

    it("22.4. Successfully update hyax token address", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the hyax token address
        await upgradeableHYAXRewards.connect(owner).updateHyaxTokenAddress(hyaxToken.target);

        const updatedHyaxTokenAddress = await upgradeableHYAXRewards.hyaxTokenAddress();
        expect(updatedHyaxTokenAddress).to.equal(hyaxToken.target);
    });
});

describe("Testing Use Case #23: Update maximum batch size for update rewards", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, rewardsUpdater] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, rewardsUpdater };
    }

    it("23.1. Revert update of maximum batch size for update rewards because it's not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the maximum batch size without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateMaximumBatchSizeForUpdateRewards(50)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("23.2. Revert update of maximum batch size for update rewards because it's zero", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the maximum batch size to zero
        await expect(
            upgradeableHYAXRewards.connect(owner).updateMaximumBatchSizeForUpdateRewards(0)
        ).to.be.revertedWith("Maximum batch size cannot be 0");
    });

    it("23.3. Revert update of maximum batch size for update rewards because it's more than 100", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the maximum batch size to more than 100
        await expect(
            upgradeableHYAXRewards.connect(owner).updateMaximumBatchSizeForUpdateRewards(101)
        ).to.be.revertedWith("Maximum batch size cannot be greater than 100");
    });

    it("23.4. Successfully update maximum batch size for update rewards", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the maximum batch size
        await upgradeableHYAXRewards.connect(owner).updateMaximumBatchSizeForUpdateRewards(50);

        const updatedMaximumBatchSize = await upgradeableHYAXRewards.maximumBatchSizeForUpdateRewards();
        expect(updatedMaximumBatchSize).to.equal(50);
    });
});

describe("Testing Use Case #24: Pause and unpause the contract", function () {

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
    
    it("24.1. Revert pause of the smart contract because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to pause the contract without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).pause()
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("24.2. Successfully pause the smart contract", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        const isPaused = await upgradeableHYAXRewards.paused();
        expect(isPaused).to.be.true;
    });

    it("24.3. Revert funding smart contract transaction because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Attempt to fund the smart contract
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.4. Revert withdraw of growth tokens because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Attempt to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.5. Revert withdraw of team tokens because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Attempt to withdraw team tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.6. Revert withdraw of reward tokens because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, false, 0)

        // Attempt to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.7. Revert withdraw of tokens to burn because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        const withdrawAmount = ethers.parseUnits("100000000", 18);

        // Attempt to withdraw tokens to burn
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(0, withdrawAmount)
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.8. Unpause the smart contract", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        const isPaused = await upgradeableHYAXRewards.paused();
        expect(isPaused).to.be.true;

        // Unpause the contract
        await upgradeableHYAXRewards.connect(owner).unpause();

        const isUnpaused = await upgradeableHYAXRewards.paused();
        expect(isUnpaused).to.be.false;
    });
});

describe("Testing Use Case #25: Transfer ownership of the contract", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, rewardsUpdater] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, rewardsUpdater };
    }

    it("25.1. Revert transfer of ownership if it's not the owner", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to transfer ownership without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).transferOwnership(addr1.address)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("25.2. Revert transfer of ownership if it's to the zero address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to transfer ownership to the zero address
        await expect(
            upgradeableHYAXRewards.connect(owner).transferOwnership(ethers.ZeroAddress)
        ).to.be.revertedWith("Ownable: new owner is the zero address");
    });

    it("25.3. Revert transfer of ownership if it's to the same contract address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to transfer ownership to the same contract address
        await expect(
            upgradeableHYAXRewards.connect(owner).transferOwnership(upgradeableHYAXRewards.target)
        ).to.be.revertedWith("Ownable: new owner cannot be the same contract address");
    });

    it("25.4. Successfully transfer ownership to addr1", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Transfer ownership to addr1
        await upgradeableHYAXRewards.connect(owner).transferOwnership(addr1.address);

        // Verify the ownership has been transferred
        const newOwner = await upgradeableHYAXRewards.owner();
        expect(newOwner).to.equal(addr1.address);
    });
});

describe("Testing Use Case #26: Recover Team Tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, addr3, whitelisterAddress] = await ethers.getSigners();

        const hyaxToken = await ethers.deployContract("HYAXToken");
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        return { upgradeableHYAXRewards, owner, addr1, addr2, addr3, hyaxToken, whitelisterAddress };
    }

    it("26.1. Should revert if team tokens funding has not started", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        await expect(
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
        ).to.be.revertedWith("Funding has not started yet, no tokens to recover");
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
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

        await expect(
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, ethers.ZeroAddress)
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr1.address)
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
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
            upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address)
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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), 0);

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
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), 0);

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
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), 0);

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
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), 0);

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
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), 0);

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
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.15. Should successfully recover team tokens on year 5, without rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18));

        const fourYears = 4 * 365 * 24 * 60 * 60; // Four years in seconds
        
        // Wait for the specified time period to elapse (simulate four years)
        await network.provider.send("evm_increaseTime", [fourYears]);
        await network.provider.send("evm_mine");

        //Recover team tokens from addr1 to addr2
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), 0);

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
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.16. Should successfully recover team tokens on year 0, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), ethers.parseUnits("100000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("100000", 18));
        expect(newWallet.currentRewardsAmount).to.equal(ethers.parseUnits("100000", 18));
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(timestampOfBlockBefore);

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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    it("26.17. Should successfully recover team tokens on year 1, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), ethers.parseUnits("200000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("200000", 18));
        expect(newWallet.currentRewardsAmount).to.equal(ethers.parseUnits("200000", 18));
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(timestampOfBlockBefore);

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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    
    it("26.18. Should successfully recover team tokens on year 2, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), ethers.parseUnits("300000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("300000", 18));
        expect(newWallet.currentRewardsAmount).to.equal(ethers.parseUnits("300000", 18));
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(timestampOfBlockBefore);

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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    
    it("26.19. Should successfully recover team tokens on year 3, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), ethers.parseUnits("400000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("400000", 18));
        expect(newWallet.currentRewardsAmount).to.equal(ethers.parseUnits("400000", 18));
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(timestampOfBlockBefore);

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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    
    it("26.20. Should successfully recover team tokens on year 4, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), ethers.parseUnits("500000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(newWallet.currentRewardsAmount).to.equal(ethers.parseUnits("500000", 18));
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(timestampOfBlockBefore);

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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });

    
    it("26.21. Should successfully recover team tokens on year 5, with rewards", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount*BigInt(2));

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
        const tx = upgradeableHYAXRewards.connect(owner).recoverTeamTokens(addr1.address, addr2.address);

        await expect(tx)
            .to.emit(upgradeableHYAXRewards, "TeamMemberTokensRecovered")
            .withArgs(addr1.address, addr2.address, ethers.parseUnits("1000000", 18), ethers.parseUnits("600000", 18));

        // Check that the new wallet has inherited the properties of the old wallet
        const newWallet = await upgradeableHYAXRewards.wallets(addr2.address);
        expect(newWallet.isWhitelisted).to.be.true;
        expect(newWallet.isTeamWallet).to.be.true;
        expect(newWallet.isBlacklisted).to.be.false;
        expect(newWallet.hyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.hyaxHoldingAmountAtWhitelistTime).to.equal(ethers.parseUnits("1000000", 18));
        expect(newWallet.totalHyaxRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(newWallet.currentRewardsAmount).to.equal(ethers.parseUnits("600000", 18));
        expect(newWallet.rewardsWithdrawn).to.equal(0);
        expect(newWallet.tokenWithdrawalTimes).to.equal(0);
        expect(newWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(newWallet.lastRewardsUpdateTime).to.equal(timestampOfBlockBefore);

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
        expect(oldWallet.tokenWithdrawalTimes).to.equal(0);
        expect(oldWallet.lastRewardsWithdrawalTime).to.equal(0);
        expect(oldWallet.lastRewardsUpdateTime).to.equal(0);

        // Check that the new wallet has inherited the addedToWhitelistTime from the old wallet 
        expect(newWallet.addedToWhitelistTime).to.equal(oldWallet.addedToWhitelistTime);

        //Get the wallet data of the address
        const [hyaxHoldingAmount, hyaxHoldingAmountAtWhitelistTime, totalHyaxRewardsAmount, currentRewardsAmount,
            rewardsWithdrawn, addedToWhitelistTime, tokenWithdrawalTimes, lastRewardsWithdrawalTime, 
            lastRewardsUpdateTime, isTeamWallet, isWhitelisted, isBlacklisted]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        console.log("\n   [Log]: New wallet data.", "hyaxHoldingAmount:", hyaxHoldingAmount, "\n   ", "hyaxHoldingAmountAtWhitelistTime:",
            hyaxHoldingAmountAtWhitelistTime, "totalHyaxRewardsAmount:", totalHyaxRewardsAmount, "\n   ", "currentRewardsAmount:",
            currentRewardsAmount, "rewardsWithdrawn:", rewardsWithdrawn, "\n   ",
            "addedToWhitelistTime:", addedToWhitelistTime, "tokenWithdrawalTimes:", tokenWithdrawalTimes, "\n   ",
            "lastRewardsWithdrawalTime:", lastRewardsWithdrawalTime, "lastRewardsUpdateTime:", lastRewardsUpdateTime, "isTeamWallet:", isTeamWallet,
            "isWhitelisted:", isWhitelisted, "isBlacklisted:", isBlacklisted);
    });
});