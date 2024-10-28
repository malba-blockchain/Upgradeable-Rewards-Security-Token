import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #20. Update whiteLister address", function () {
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

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, owner, addr1, addr2, hyaxToken, whitelisterAddress };
    }

    it("20.1. Revert update of whitelister address because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the whiteLister address without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).updateWhiteListerAddress(whitelisterAddress.address)
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("20.2. Revert update of whitelister address because it's the zero address", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to update the whiteLister address to the zero address
        await expect(
            upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(ethers.ZeroAddress)
        ).to.be.revertedWith("White lister address cannot be the zero address");
    });

    it("20.3. Successfully update whitelister address", async function () {
        const { upgradeableHYAXRewards, owner, whitelisterAddress } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Update the whiteLister address
        await upgradeableHYAXRewards.connect(owner).updateWhiteListerAddress(whitelisterAddress.address);

        const updatedWhiteListerAddress = await upgradeableHYAXRewards.whiteListerAddress();
        expect(updatedWhiteListerAddress).to.equal(whitelisterAddress.address);
    });
});
