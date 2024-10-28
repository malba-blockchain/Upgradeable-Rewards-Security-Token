import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #18. Calculate year for team tokens", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
        console.log("\n   [Log]: Deploying UpgradeableHYAXRewards...");

        // Deploy proxy with 'initialize' function
        const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [await hyaxToken.target], { initializer: 'initialize' });

        await upgradeableHYAXRewards.waitForDeployment();

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
        await network.provider.send("evm_increaseTime", [oneYear * 2]);
        await network.provider.send("evm_mine");

        // Day 4016: Eleven years after funding should be 5
        const yearForTeamTokens_elevenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_elevenYearsAfterFunding).to.equal(5);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear * 4]);
        await network.provider.send("evm_mine");

        // Day 5476: Fifteen years after funding should be 5
        const yearForTeamTokens_fifteenYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_fifteenYearsAfterFunding).to.equal(5);

        // Wait for the specified time period to elapse (simulate one year)
        await network.provider.send("evm_increaseTime", [oneYear * 5]);
        await network.provider.send("evm_mine");

        // Day 6206: Twenty years after funding should be 5
        const yearForTeamTokens_twentyYearsAfterFunding = await upgradeableHYAXRewards.connect(owner).calculateYearForTeamTokens();
        expect(yearForTeamTokens_twentyYearsAfterFunding).to.equal(5);
    });
});
