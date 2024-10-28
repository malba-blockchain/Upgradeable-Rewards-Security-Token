import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #21. Update rewardsUpdater address", function () {
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
