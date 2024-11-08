import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #13. Update rewards for a batch of non team wallets", function () {
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

        console.log("Rewards updater address expected: ", rewardsUpdaterAddress.address);
        console.log("Rewards updater address real: ", await upgradeableHYAXRewards.rewardsUpdaterAddress());
        
        console.log("Whitelister address expected: ", whitelisterAddress.address);
        console.log("Whitelister address real: ", await upgradeableHYAXRewards.whiteListerAddress());
        
        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
            
        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
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

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
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

        //Add only two wallets to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet is not whitelisted');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
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

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr2.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr3.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
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

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, true);
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr2.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
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

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr2.address, true);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Wallet has been blacklisted');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
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
        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 1.1) / divisor) * divisor];

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('A single wallet cannot have rewards higher than the weekly limit');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
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

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

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
        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

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
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Insufficient reward tokens to distribute as rewards');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
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
        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

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

        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        console.log("   [Log]: walletAddresses: ", walletAddresses);
        console.log("   [Log]: walletRewards: ", walletRewards);

        // Call the updateRewards function
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);

        for (const walletAddress of walletAddresses) {
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
        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

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
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('Too soon to update rewards for this wallet');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 3 events where the update reverted
        expect(numberOfFailedUpdates).to.equal(3);

        //There should be 0 events where the update was successful
        expect(numberOfSuccessfulUpdates).to.equal(0);
    });

    it("13.13. Should revert because all reward tokens have been distributed", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr2.address, false, 0);
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr3.address, false, 0);

        const walletAddresses = [addr1.address, addr2.address, addr3.address];

        let totalRewards = 2884615384615384615384615;
        const divisor = BigInt(10 ** 18); // 18 digits

        //The last wallet has rewards that exceed the weekly limit by 10%
        const walletRewards = [(BigInt(totalRewards * 0.16) / divisor) * divisor,
        (BigInt(totalRewards * 0.33) / divisor) * divisor, (BigInt(totalRewards * 0.5) / divisor) * divisor];

        const oneWeek = 7 * 24 * 60 * 60; // One week in seconds

        const totalWeeks = 430; // 8 years * 52 weeks = 416 weeks + 14 weeks for rounding errors

        //Initial successful update of wallet rewards
        for (let i = 0; i < totalWeeks; i++) {

            await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);

            const rewardTokensDistributed = await upgradeableHYAXRewards.rewardTokensDistributed();
            console.log("   [Log]: Year: ", Math.floor(i / 52), ". Week in year: ", i % 52, ". Absolute week: ", i, ". Total distributed rewards: ", rewardTokensDistributed);

            // Wait for the specified time period to elapse (simulate one week)
            await network.provider.send("evm_increaseTime", [oneWeek]);
            await network.provider.send("evm_mine");
        }

        // Call the updateRewards function
        const updateRewardsBatchTx = await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsBatch(walletAddresses, walletRewards);
        const updateRewardsBatchReceipt = await updateRewardsBatchTx.wait();
        const events = updateRewardsBatchReceipt?.logs || [];

        let numberOfFailedUpdates = 0;
        let numberOfSuccessfulUpdates = 0;

        for (const event of events) {
            //'Wallet is not whitelisted'
            if (event.fragment.name === "RewardUpdateFailed") {
                expect(event.args[2]).to.equal('All the reward tokens have been already distributed');
                numberOfFailedUpdates++;
            }
            else if (event.fragment.name === "RewardUpdateSuccess") {
                numberOfSuccessfulUpdates++;
            }
        }
        //There should be 3 events where the update reverted
        expect(numberOfFailedUpdates).to.equal(3);

        //There should be 0 events where the update was successful
        expect(numberOfSuccessfulUpdates).to.equal(0);
    });

});
