import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #23. Update maximum batch size for update rewards", function () {
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

    it("23.1. Revert update of maximum batch size for update rewards because it's not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the maximum batch size without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateMaximumBatchSizeForUpdateRewards(50)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'AccessControlUnauthorizedAccount');
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
