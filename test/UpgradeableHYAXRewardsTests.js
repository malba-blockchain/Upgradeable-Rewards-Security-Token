const { loadFixture, } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

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

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(addr1).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("4.2. Should fail to fund the contract with growth tokens because its not approved", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount)
        ).to.be.revertedWithCustomError(hyaxToken, 'ERC20InsufficientAllowance');
    });

    it("4.3. Should revert when funding with an invalid type of funding", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(3, fundingAmount)
        ).to.be.reverted;
    });
    
    it("4.4. Should revert when funding with an invalid amount", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const invalidAmount = ethers.parseUnits("0", 18); // Invalid amount

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(0, invalidAmount)
        ).to.be.revertedWith('Amount must be greater than 0');
    });

    it("4.5. Should successfully fund the contract with growth tokens with a specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the current balance of growth tokens in the contract
        const contractBalance = await upgradeableHYAXRewards.growthTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(contractBalance).to.equal(fundingAmount);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1000000000", 18));
        
        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);  
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("4.6. Should update the growthTokensFundingStarted variable to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Check if the growthTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.growthTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("4.7. Should update the total value of growthTokensFunded", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevGrowthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the value of growthTokensFunded
        const newGrowthTokensFunded = prevGrowthTokensFunded + fundingAmount;

        const growthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();
    
        // Check if the growthTokensStartFundingTime and growthTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(growthTokensFunded).to.equal(newGrowthTokensFunded);
    });

    it("4.8. Should update the times of growthTokensStartFundingTime and growthTokensLastWithdrawalTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore.timestamp;

        // Get the growthTokensStartFundingTime and growthTokensLastWithdrawalTime
        const growthTokensStartFundingTime = await upgradeableHYAXRewards.growthTokensStartFundingTime();
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
    
        // Check if the growthTokensStartFundingTime and growthTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(growthTokensStartFundingTime).to.equal(timestampOfBlockBefore);
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);
    });

});


describe("Testing Use Case #5: Fund Smart Contract with growth tokens after having already funded the first time", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Deploy the UpgradeableHYAXRewards contract
        const upgradeableHYAXRewards = await ethers.deployContract("UpgradeableHYAXRewards", [await hyaxToken.target]);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);
        
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken };
    }

    it("5.1. Should update the total value of growthTokensFunded with the specified amount", async function () {
        const { upgradeableHYAXRewards, hyaxToken, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        const prevGrowthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.connect(owner).fundSmartContract(0, fundingAmount);

        // Get the value of growthTokensFunded
        const newGrowthTokensFunded = prevGrowthTokensFunded + fundingAmount;

        const growthTokensFunded = await upgradeableHYAXRewards.growthTokensFunded();

        // Verify that the contract balance matches the funding amount
        expect(growthTokensFunded).to.equal(newGrowthTokensFunded);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        expect(newSmartContractBalance - prevSmartContractBalance).to.equal(ethers.parseUnits("1000000000", 18));
        
        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        expect(prevOwnerTokenBalance - newOwnerTokenBalance).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("5.2. Should continue with the same growthTokensFundingStarted variable equal to true", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Check if the growthTokensFundingStarted variable is true
        const isFundingStarted = await upgradeableHYAXRewards.growthTokensFundingStarted();
        expect(isFundingStarted).to.be.true;
    });

    it("5.3. Should not have updated the times of growthTokensStartFundingTime and growthTokensLastWithdrawalTime", async function () {
        const { upgradeableHYAXRewards, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the timestamp of the block before
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore.timestamp;

        // Get the growthTokensStartFundingTime and growthTokensLastWithdrawalTime
        const growthTokensStartFundingTime = await upgradeableHYAXRewards.growthTokensStartFundingTime();
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
    
        // Check if the growthTokensStartFundingTime and growthTokensLastWithdrawalTime are equal to the timestamp of the block before
        expect(growthTokensStartFundingTime).to.not.equal(timestampOfBlockBefore);
        expect(growthTokensLastWithdrawalTime).to.not.equal(timestampOfBlockBefore);
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

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);
        
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
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

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);
        
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const lessThanOneYear = 365 * 24 * 60 * 60; // One year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [lessThanOneYear]);
        await network.provider.send("evm_mine");
        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);

        // Withdraw growth tokens
        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const growthTokensWithdrawn = await upgradeableHYAXRewards.growthTokensWithdrawn();
        expect(growthTokensWithdrawn).to.equal(ethers.parseUnits("120000000", 18));

        // Verify that the last withdrawal time was updated correctly
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);

        // Check if the remaining tokens in the smart contract are correct
        const growthTokensInSmartContract = await upgradeableHYAXRewards.growthTokensInSmartContract();
        expect(growthTokensInSmartContract).to.equal(fundingAmount - growthTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("120000000", 18));

        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        expect(newOwnerTokenBalance - prevOwnerTokenBalance).to.equal(ethers.parseUnits("120000000", 18));
    });

    it("6.6. Should revert if attempting to withdraw before a year has passed since last withdrawal", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);
        
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
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

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);
        
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        const firstYear = 365 * 24 * 60 * 60; // Less than one year in seconds

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [firstYear]);
        await network.provider.send("evm_mine");

        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);

        const secondYear = 365 * 24 * 60 * 60; // Less than one year in seconds
        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [secondYear]);
        await network.provider.send("evm_mine");

        await upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens();

        // Get the timestamp of the block after withdrawal
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const timestampOfBlockBefore = blockBefore.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const growthTokensWithdrawn = await upgradeableHYAXRewards.growthTokensWithdrawn();
        expect(growthTokensWithdrawn).to.equal(ethers.parseUnits("240000000", 18));

        // Verify that the last withdrawal time was updated correctly
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);

        // Check if the remaining tokens in the smart contract are correct
        const growthTokensInSmartContract = await upgradeableHYAXRewards.growthTokensInSmartContract();
        expect(growthTokensInSmartContract).to.equal(fundingAmount - growthTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("120000000", 18));

        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
        expect(newOwnerTokenBalance - prevOwnerTokenBalance).to.equal(ethers.parseUnits("120000000", 18));
    });


    it("6.8. Should revert after withdrawing all growth tokens", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        const fundingAmount = ethers.parseUnits("2400000000", 18); // Fund with (1B) 1,000,000,000 Growth Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.connect(owner).approve(upgradeableHYAXRewards.target, fundingAmount);
        
        //enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}
        await upgradeableHYAXRewards.fundSmartContract(0, fundingAmount);

        // Get the initial balance of the smart contract
        const prevSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);

        // Get the initial balance of the owner
        const prevOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);

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
        const timestampOfBlockBefore = blockBefore.timestamp;

        // Check if the correct amount of tokens was withdrawn
        const growthTokensWithdrawn = await upgradeableHYAXRewards.growthTokensWithdrawn();
        expect(growthTokensWithdrawn).to.equal(ethers.parseUnits("2400000000", 18));

        // Verify that the last withdrawal time was updated correctly
        const growthTokensLastWithdrawalTime = await upgradeableHYAXRewards.growthTokensLastWithdrawalTime();
        expect(growthTokensLastWithdrawalTime).to.equal(timestampOfBlockBefore);

        // Check if the remaining tokens in the smart contract are correct
        const growthTokensInSmartContract = await upgradeableHYAXRewards.growthTokensInSmartContract();
        expect(growthTokensInSmartContract).to.equal(fundingAmount - growthTokensWithdrawn);

        // Verify that the smart contract balance decreased by the correct amount
        const newSmartContractBalance = await hyaxToken.balanceOf(upgradeableHYAXRewards.target);
        expect(prevSmartContractBalance - newSmartContractBalance).to.equal(ethers.parseUnits("2400000000", 18));

        // Check if the owner's balance increased by the correct amount
        const newOwnerTokenBalance = await hyaxToken.balanceOf(owner.address);
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