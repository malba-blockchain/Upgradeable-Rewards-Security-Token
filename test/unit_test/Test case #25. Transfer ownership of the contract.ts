import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #25. Transfer ownership of the contract", function () {
    async function deployUpgradeableHYAXRewardsFixture() {
        const [owner, addr1, addr2, rewardsUpdater] = await ethers.getSigners();

        //Deploy the HYAX token mock
        const hyaxToken = await ethers.deployContract("HYAXToken");

        //Asociate the smart contract with its name in the context
        const UpgradeableHYAXRewards = await ethers.getContractFactory('UpgradeableHYAXRewards');
        console.log("\n   [Log]: Deploying UpgradeableHYAXRewards...");

        // Deploy proxy with 'initialize' function
        const upgradeableHYAXRewards = await upgrades.deployProxy(UpgradeableHYAXRewards, [await hyaxToken.target], { initializer: 'initialize' });

        await upgradeableHYAXRewards.waitForDeployment();

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, rewardsUpdater };
    }

    it("25.1. Revert transfer of ownership if it's not the owner", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to transfer ownership without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).transferOwnership(addr1.address)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'AccessControlUnauthorizedAccount');
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
