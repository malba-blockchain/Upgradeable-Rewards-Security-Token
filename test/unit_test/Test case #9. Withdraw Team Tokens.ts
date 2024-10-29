import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #9. Withdraw Team Tokens", function () {
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

        // Try to withdraw team tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Team tokens funding has not started yet, no tokens to withdraw');
    });

    it("9.2. Should revert if trying to withdraw without being whitelisted", async function () {
        const { upgradeableHYAXRewards, owner, addr1, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamTokens, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(1, fundingAmount);

        // Try to withdraw team tokens
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

        // Try to withdraw team tokens
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

        // Try to withdraw team tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Cannot withdraw before 4 years after being added to the whitelist');

        const fourYearsMinusOneDay = 1459 * 24 * 60 * 60; // 4 years minus 1 day in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [fourYearsMinusOneDay]);
        await network.provider.send("evm_mine");

        // Try to withdraw team tokens just 1 day before 4 years
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
        const [newHyaxHoldingAmount, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(teamTokenWithdrawalTimes).to.equal(1);

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

        // Try to withdraw team tokens just 1 day before 4 years
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
        const [newHyaxHoldingAmount, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("200000", 18));
        console.log("\n   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        // Verify that the last withdrawal time was updated correctly
        expect(teamTokenWithdrawalTimes).to.equal(2);

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
        const [, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("\n   [Log]: Token Withdrawal Times:", teamTokenWithdrawalTimes);
        expect(teamTokenWithdrawalTimes).to.equal(5);

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
        const [newHyaxHoldingAmount, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("\n   [Log]: Last Token Withdrawal Time:", teamTokenWithdrawalTimes);
        expect(teamTokenWithdrawalTimes).to.equal(5);

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
        const [newHyaxHoldingAmount, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("400000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(teamTokenWithdrawalTimes).to.equal(2);

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
        const [newHyaxHoldingAmount, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr1.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(teamTokenWithdrawalTimes).to.equal(5);

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


    it("9.13. Should withdraw tokens after being added to the whitelist and recovering the wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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

        // Recover the wallet
        await upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        // Withdraw team tokens for the wallet the first time
        await upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the second time
        await upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the third time
        await upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the fourth time
        await upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens();

        // Withdraw team tokens for the wallet the fifth time
        await upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens();

        // Check if the correct amount of tokens was withdrawn
        const teamTokensWithdrawn = await upgradeableHYAXRewards.teamTokensWithdrawn();
        expect(teamTokensWithdrawn).to.equal(ethers.parseUnits("1000000", 18));
        console.log("\n   [Log]: TeamTokensWithdrawn:", teamTokensWithdrawn);

        // Check if the correct amount of tokens was withdrawn for the wallet
        const [newHyaxHoldingAmount, , , , , , teamTokenWithdrawalTimes, , ,] = await upgradeableHYAXRewards.wallets(addr2.address);
        console.log("   [Log]: NewHyaxHoldingAmount:", newHyaxHoldingAmount);
        console.log("   [Log]: PrevHyaxHoldingAmount:", prevHyaxHoldingAmount);
        expect(prevHyaxHoldingAmount - newHyaxHoldingAmount).to.equal(ethers.parseUnits("1000000", 18));
        // Verify that the last withdrawal time was updated correctly
        expect(teamTokenWithdrawalTimes).to.equal(5);

        // Check if the remaining tokens in the smart contract are correct
        const teamTokensInSmartContract = await upgradeableHYAXRewards.teamTokensInSmartContract();
        console.log("   [Log]: TeamTokensInSmartContract:", teamTokensInSmartContract);
        expect(teamTokensInSmartContract).to.equal(fundingAmount - teamTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        console.log("   [Log]: NewSmartContractBalance:", newSmartContractBalance);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("1000000", 18));

        // Check if the team member's balance increased by the correct amount
        const newTeamMemberWalletTokenBalance = await hyaxToken.balanceOf(addr2.address);
        console.log("   [Log]: NewTeamMemberWalletTokenBalance:", newTeamMemberWalletTokenBalance);
        console.log("   [Log]: PrevTeamMemberWalletTokenBalance:", prevTeamMemberWalletTokenBalance);
        expect(newTeamMemberWalletTokenBalance - prevTeamMemberWalletTokenBalance).to.equal(ethers.parseUnits("1000000", 18));
    });

    it("9.14. Should revert if trying to withdraw team tokens before 1 year after first withdrawal after recovering the wallet", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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

        // Recover the wallet
        await upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        const lessThanOneYear = 364 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");

        // Try to withdraw team tokens just 1 day before 4 years
        await expect(
            upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens()
        ).to.be.revertedWith('Can only withdraw team tokens once per year');
    });

    it("9.15. Should revert when trying to withdraw tokens after recovering the wallet after withdrawing team tokens", async function () {
        const { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

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

        // Recover the wallet
        await upgradeableHYAXRewards.connect(owner).updateTeamMemberWallet(addr1.address, addr2.address);

        // Try to withdraw team tokens for the wallet the sixth time
        await expect(
            upgradeableHYAXRewards.connect(addr2).withdrawTeamTokens()
        ).to.be.revertedWith("No hyax holding amount to withdraw");
    });
});
