import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #17. Withdraw Rewards Tokens of team wallets", function () {
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

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("17.1. Should revert if trying to withdraw before being funded", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        //Add the whitelisted addresses
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Try to withdraw reward tokens 
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Reward tokens funding has not started yet, no tokens to withdraw');
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

        // Change the wallet whitelist status to true because when you add to the blacklist, the whitelist status is set to false
        await upgradeableHYAXRewards.connect(whitelisterAddress).updateWhitelistStatus(addr1.address, true);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Wallet has been blacklisted');
    });

    it("17.4. Should revert if trying to withdraw reward tokens before being distributed by the rewards updater to the wallet", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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

    it("17.6. Should revert if trying to withdraw team tokens after withdrawing the reward tokens that wallet has", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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

        // Withdraw all reward tokens that wallet has
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('No rewards available to withdraw');
    });

    it("17.7. Should withdraw the correct amount of team tokens after being distributed by the rewards updater", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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
        const [, , totalHyaxRewardsAmount1, currentRewardsAmount1, rewardsWithdrawn1, , , , , , ,]
            = await upgradeableHYAXRewards.wallets(addr1.address);

        // Withdraw rewards tokens for the wallet  
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [, , totalHyaxRewardsAmount2, currentRewardsAmount2, rewardsWithdrawn2, , , , , , ,]
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

    it("17.8. Should withdraw all reward tokens after being distributed by the rewards updater after 8 years", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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
        //Withdraw the remaining reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('No rewards available to withdraw');
    });

    it("17.9. Should revert if trying to withdraw reward tokens after all the reward tokens have been already distributed", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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


    it("17.10. Should withdraw the correct amount of team tokens after being distributed by the rewards updater and recovering the wallet", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Update the rewards for the wallet
        const rewardAmount = "1442307000000000000000000"; //Equivalent to 1'442.307 M Tokens or 50% of the total reward tokens per week
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

        // Recover the wallet
        await upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("\n   [Log]: PrevSmartContractBalance:", prevSmartContractBalance);

        // Get the initial balance of the wallet
        const prevWalletTokenBalance = await hyaxToken.balanceOf(addr2.address);
        console.log("   [Log]: PrevWalletTokenBalance:", prevWalletTokenBalance);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [, , totalHyaxRewardsAmount1, currentRewardsAmount1, rewardsWithdrawn1, , , , , , ,]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [, , totalHyaxRewardsAmount2, currentRewardsAmount2, rewardsWithdrawn2, , , , , , ,]
            = await upgradeableHYAXRewards.wallets(addr2.address);

        // Check if the correct amount of tokens was withdrawn
        const rewardTokensWithdrawn = await upgradeableHYAXRewards.rewardTokensWithdrawn();
        expect(rewardTokensWithdrawn).to.equal(rewardsWithdrawn2);
        console.log("\n   [Log]: RewardTokensWithdrawn:", rewardsWithdrawn2);

        // Check if the reward amount is 0
        console.log("   [Log]: NewCurrentRewardsAmount:", currentRewardsAmount2);
        console.log("   [Log]: PrevCurrentRewardsAmount:", currentRewardsAmount1);
        expect(currentRewardsAmount2).to.equal(0);
        // Verify that the total hyax rewards amount is 0
        expect(totalHyaxRewardsAmount2).to.equal(0);

        // Check if the remaining tokens in the smart contract are correct
        const rewardTokensInSmartContract = await upgradeableHYAXRewards.rewardTokensInSmartContract();
        console.log("\n   [Log]: RewardTokensInSmartContract:", rewardTokensInSmartContract);
        expect(rewardTokensInSmartContract).to.equal(fundingAmount - rewardTokensWithdrawn);
    });

    it("17.11. Should revert when trying to withdraw tokens after recovering the wallet after withdrawing all reward tokens that wallet has", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount * BigInt(2));

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount);

        const oneMillionTokens = ethers.parseUnits("1000000", 18);

        // Add the wallet to the whitelist
        await upgradeableHYAXRewards.connect(whitelisterAddress).addWalletToWhitelist(addr1.address, true, oneMillionTokens);

        // Update the rewards for the wallet
        const rewardAmount = "1442307000000000000000000"; //Equivalent to 1'442.307 M Tokens or 50% of the total reward tokens per week
        await upgradeableHYAXRewards.connect(rewardsUpdaterAddress).updateRewardsSingle(addr1.address, rewardAmount);

        // Withdraw all reward tokens that wallet has
        await upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens();

        // Recover the wallet
        await upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        // Try to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr2).withdrawRewardTokens()
        ).to.be.revertedWith('No rewards available to withdraw');
    });
});
