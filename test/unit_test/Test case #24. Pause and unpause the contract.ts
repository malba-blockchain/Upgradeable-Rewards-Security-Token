import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network, upgrades } from "hardhat"
import { expect } from "chai"

describe("Test case #24. Pause and unpause the contract", function () {

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

        // Transfer tokens to the addresses
        await hyaxToken.connect(owner).transfer(addr1.address, ethers.parseUnits("100000000", 18));
        await hyaxToken.connect(owner).transfer(addr2.address, ethers.parseUnits("200000000", 18));
        await hyaxToken.connect(owner).transfer(addr3.address, ethers.parseUnits("300000000", 18));

        // Fund the smart contract with reward tokens
        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Fixtures can return anything you consider useful for your tests
        return { upgradeableHYAXRewards, hyaxToken, owner, addr1, addr2, addr3, whitelisterAddress, rewardsUpdaterAddress };
    }

    it("24.1. Revert pause of the smart contract because its not the owner", async function () {
        const { upgradeableHYAXRewards, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Attempt to pause the contract without being the owner
        await expect(
            upgradeableHYAXRewards.connect(addr1).pause()
        ).to.be.revertedWithCustomError(upgradeableHYAXRewards, 'OwnableUnauthorizedAccount');
    });

    it("24.2. Successfully pause the smart contract", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        const isPaused = await upgradeableHYAXRewards.paused();
        expect(isPaused).to.be.true;
    });

    it("24.3. Revert funding smart contract transaction because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner, hyaxToken } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        const fundingAmount = ethers.parseUnits("1000000000", 18); // Fund with (1B) 1,000,000,000 reward Tokens

        // Approve the UpgradeableHYAXRewards contract to spend tokens on behalf of the owner
        await hyaxToken.approve(upgradeableHYAXRewards.target, fundingAmount);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Attempt to fund the smart contract
        await expect(
            upgradeableHYAXRewards.connect(owner).fundSmartContract(2, fundingAmount)
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.4. Revert withdraw of growth tokens because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Attempt to withdraw growth tokens
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawGrowthTokens()
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.5. Revert withdraw of team tokens because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, true, ethers.parseUnits("1000000", 18))

        // Attempt to withdraw team tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawTeamTokens()
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.6. Revert withdraw of reward tokens because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner, addr1 } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        // Add the address to the whitelist
        await upgradeableHYAXRewards.connect(owner).addWalletToWhitelist(addr1.address, false, 0)

        // Attempt to withdraw reward tokens
        await expect(
            upgradeableHYAXRewards.connect(addr1).withdrawRewardTokens()
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.7. Revert withdraw of tokens to burn because the contract is paused", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        const withdrawAmount = ethers.parseUnits("100000000", 18);

        // Attempt to withdraw tokens to burn
        await expect(
            upgradeableHYAXRewards.connect(owner).withdrawTokensToBurn(0, withdrawAmount)
        ).to.be.revertedWith('Contract is paused');
    });

    it("24.8. Unpause the smart contract", async function () {
        const { upgradeableHYAXRewards, owner } = await loadFixture(deployUpgradeableHYAXRewardsFixture);

        // Pause the contract
        await upgradeableHYAXRewards.connect(owner).pause();

        const isPaused = await upgradeableHYAXRewards.paused();
        expect(isPaused).to.be.true;

        // Unpause the contract
        await upgradeableHYAXRewards.connect(owner).unpause();

        const isUnpaused = await upgradeableHYAXRewards.paused();
        expect(isUnpaused).to.be.false;
    });
});
