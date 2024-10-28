import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #22. Update hyax token address", function () {
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
