import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #1. Constructor", function () {

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

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');

        await expect(upgrades.deployProxy(UpgradeableHYAXRewards, [invalidHyaxTokenAddress], { initializer: 'initialize' })
        ).to.be.revertedWith("Hyax token address is not valid");
    });
});