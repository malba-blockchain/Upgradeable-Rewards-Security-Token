// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";

/**
 * @dev Implementation based on the whitepaper requirements for rewards distribution
 * Developer: Carlos Alba
 */

/**
 * @title IHyaxToken based on the SafeERC20 interface
 * @dev Interface for interacting with the HYAX token
 */
interface IHyaxToken is IERC20 {
    function symbol() external view returns (string memory);
}

/**
 * @title UpgradeableHYAXRewards
 * @dev This contract is designed to manage the distribution of rewards in the HYAX ecosystem.
 * It inherits from AccessControlEnumerableUpgradeable, PausableUpgradeable, and ReentrancyGuardUpgradeable
 * to ensure secure and controlled access to its functions.
 */
contract UpgradeableHYAXRewards is
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Placeholder to maintain storage compatibility with AccessControlEnumerableUpgradeable
    struct Placeholder {
        uint256 _unused;
    }

    // Required annotation to maintain storage location compatibility
    /// @custom:storage-location erc7201:openzeppelin.storage.AccessControlEnumerable
    Placeholder private _placeholder;

    ////////////////// SMART CONTRACT EVENTS //////////////////
    /**
     * @dev Emitted when funding is added to the contract
     * @param _fundingTypeAdded The type of funding added (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amountAdded The amount of tokens added
     */
    event FundingAdded(FundingType _fundingTypeAdded, uint256 _amountAdded);

    /**
     * @dev Emitted when growth tokens are withdrawn
     * @param _walletAddressGrowthTokensWithdrawn The address of the wallet that withdrew the tokens
     * @param _amountWithdrawn The amount of growth tokens withdrawn
     */
    event GrowthTokensWithdrawn(
        address _walletAddressGrowthTokensWithdrawn,
        uint256 _amountWithdrawn
    );

    /**
     * @dev Emitted when team tokens are withdrawn
     * @param _walletAddressTeamTokensWithdrawn The address of the wallet that withdrew the tokens
     * @param _amountWithdrawn The amount of team tokens withdrawn
     */
    event TeamTokensWithdrawn(
        address _walletAddressTeamTokensWithdrawn,
        uint256 _amountWithdrawn
    );

    /**
     * @dev Emitted when reward tokens are withdrawn
     * @param _walletAddressRewardTokensWithdrawn The address of the wallet that withdrew the rewards
     * @param _amountWithdrawn The amount of rewards withdrawn
     */
    event RewardTokensWithdrawn(
        address _walletAddressRewardTokensWithdrawn,
        uint256 _amountWithdrawn
    );

    /**
     * @dev Emitted when tokens are withdrawn to be burned
     * @param _fundingTypeWithdrawn The type of funding (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens withdrawn to be burned
     */
    event TokensToBurnWithdrawn(
        FundingType _fundingTypeWithdrawn,
        uint256 _amount
    );

    /**
     * @dev Emitted when a wallet is added to the whitelist
     * @param _sender The address that added the wallet to the whitelist
     * @param _walletAddress The address of the wallet added to the whitelist
     * @param _isTeamWallet Boolean indicating if the wallet is a team wallet
     * @param _hyaxHoldingAmount The amount of HYAX tokens held by the wallet
     */
    event WalletAddedToWhitelist(
        address _sender,
        address _walletAddress,
        bool _isTeamWallet,
        uint256 _hyaxHoldingAmount
    );

    /**
     * @dev Emitted when a wallet whitelist status is updated
     * @param _senderWhitelistStatusUpdated The address that updated the whitelist status
     * @param _walletAddressWhitelistStatusUpdated The address of the wallet
     * @param _newStatusWhitelistStatusUpdated The new status of the wallet in the whitelist
     */
    event WhitelistStatusUpdated(
        address _senderWhitelistStatusUpdated,
        address _walletAddressWhitelistStatusUpdated,
        bool _newStatusWhitelistStatusUpdated
    );

    /**
     * @dev Emitted when a wallet blacklist status is updated
     * @param _senderBlacklistStatusUpdated The address that updated the blacklist status
     * @param _walletAddressBlacklistStatusUpdated The address of the wallet
     * @param _newStatusBlacklistStatusUpdated The new status of the wallet in the blacklist
     */
    event BlacklistStatusUpdated(
        address _senderBlacklistStatusUpdated,
        address _walletAddressBlacklistStatusUpdated,
        bool _newStatusBlacklistStatusUpdated
    );

    /**
     * @dev Emitted when a reward update is successful for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update was successful
     * @param _hyaxReward The amount of HYAX rewards updated for the wallet
     */
    event RewardUpdateSuccess(
        address _sender,
        address _walletAddress,
        uint256 _hyaxReward
    );
    
    /**
     * @dev Emitted when a reward update batch is sent
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddresses The addresses of the wallets sent for the update
     * @param _hyaxRewards The amount of HYAX rewards sent for the update
     */
    event RewardUpdateBatchSent(
        address _sender,
        address[] _walletAddresses,
        uint256[] _hyaxRewards
    );

    /**
     * @dev Emitted when a reward update fails for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update failed
     * @param _errorMessage A string describing the reason for the failure
     */
    event RewardUpdateFailed(
        address _sender,
        address _walletAddress,
        string _errorMessage
    );

    /**
     * @dev Emitted when a team member wallet is updated
     * @param _oldTeamMemberWalletAddress The address of the old team member wallet
     * @param _newTeamMemberWalletAddress The address of the new team member wallet
     */
    event TeamMemberWalletUpdated(
        address _oldTeamMemberWalletAddress,
        address _newTeamMemberWalletAddress,
        uint256 _hyaxHoldingAmount
    );

    /**
     * @dev Emitted when the white lister address is updated
     * @param _newWhiteListerAddress The address of the new white lister
     */
    event WhiteListerAddressUpdated(address _newWhiteListerAddress);

    /**
     * @dev Emitted when the rewards updater address is updated
     * @param _newRewardsUpdaterAddress The address of the new rewards updater
     */
    event RewardsUpdaterAddressUpdated(address _newRewardsUpdaterAddress);

    /**
     * @dev Emitted when the hyax token address is updated
     * @param _hyaxTokenAddress The address of the new hyax token
     */
    event HyaxTokenAddressUpdated(address _hyaxTokenAddress);

    /**
     * @dev Emitted when the maximum batch size for update rewards is updated
     * @param _maximumBatchSizeForUpdateRewards The new maximum batch size for update rewards
     */
    event MaximumBatchSizeForUpdateRewardsUpdated(
        uint8 _maximumBatchSizeForUpdateRewards
    );

    ////////////////// SMART CONTRACT VARIABLES & CONSTANTS //////////////////

    /**
     * @dev The address of the HYAX token contract.
     */
    address public hyaxTokenAddress;

    /**
     * @dev An instance of the HYAX token contract.
     */
    IHyaxToken public hyaxToken; // Instance of the HYAX token

    /**
     * @dev Enum {uint256} for defining the type of funding.
     */
    enum FundingType {
        GrowthTokens, //GrowthTokens Represents funding for growth tokens.
        TeamTokens, //TeamTokens Represents funding for team tokens.
        RewardTokens //RewardTokens Represents funding for reward tokens.
    } 

    /**
     * @dev The minimum interval in seconds required before rewards can be updated again.
     */
    uint256 public constant MIN_INTERVAL_FOR_UPDATE_REWARDS = 6 days; // Minimum interval for update rewards

    /**
     * @dev The role identifier for the rewards updater.
     */
    bytes32 public constant REWARDS_UPDATER_ROLE =
        keccak256("REWARDS_UPDATER_ROLE"); // Role for the rewards updater

    /**
     * @dev The role identifier for the whitelister.
     */
    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE"); // Role for the whitelister

    ////////////////// GROWTH TOKENS VARIABLES //////////////////
    /**
     * @dev The total supply of growth tokens. 2.4 Billion growth tokens. 60% of 4B.
     */
    uint256 public constant GROWTH_TOKENS_TOTAL = 2400000000 * 10 ** 18;

    /**
     * @dev The amount of growth tokens that can be withdrawn per year. 120 Million tokens per year.
     */
    uint256 public constant GROWTH_TOKENS_WITHDRAWAL_PER_YEAR =
        120000000 * 10 ** 18;

    /**
     * @dev The period in which growth tokens can be withdrawn.
     * 1 year.
     */
    uint256 public constant TOKENS_WITHDRAWAL_PERIOD = 365 days;

    /**
     * @dev The total amount of growth tokens funded to the contract.
     */
    uint256 public growthTokensFunded;

    /**
     * @dev The total amount of growth tokens withdrawn from the contract.
     */
    uint256 public growthTokensWithdrawn;

    /**
     * @dev The current balance of growth tokens in the contract.
     */
    uint256 public growthTokensInSmartContract;

    /**
     * @dev The timestamp of the last growth tokens withdrawal.
     */
    uint256 public growthTokensLastWithdrawalTime;

    /**
     * @dev The timestamp when growth tokens funding started.
     */
    uint256 public growthTokensStartFundingTime;

    /**
     * @dev A flag to indicate if growth tokens funding has begun.
     */
    bool public growthTokensFundingStarted;

    /**
     * @dev The total supply of team tokens.
     * 1.5 Billion as team tokens.
     */
    uint256 public constant TEAM_TOKENS_TOTAL = 1500000000 * 10 ** 18;

    /**
     * @dev The amount of team tokens that can be withdrawn per year. 300 Million tokens per year.
     */
    uint256 public constant TEAM_TOKENS_WITHDRAWAL_PER_YEAR =
        300000000 * 10 ** 18;

    /**
     * @dev The period in which team tokens can be withdrawn. 4 years. 1460 days.
     */
    uint256 public constant TEAM_TOKENS_LOCKED_PERIOD = 1460 days;

    /**
     * @dev The total amount of team tokens funded to the contract.
     */
    uint256 public teamTokensFunded;

    /**
     * @dev The total amount of team tokens withdrawn from the contract.
     */
    uint256 public teamTokensWithdrawn;

    /**
     * @dev The current balance of team tokens in the contract.
     */
    uint256 public teamTokensInSmartContract;

    /**
     * @dev The timestamp when team tokens funding started.
     */
    uint256 public teamTokensStartFundingTime;

    /**
     * @dev A flag to indicate if team tokens funding has begun.
     */
    bool public teamTokensFundingStarted;

    /**
     * @dev The total supply of reward tokens. 1.2 Billion as reward tokens.
     */
    uint256 public constant REWARD_TOKENS_TOTAL = 1200000000 * 10 ** 18;

    /**
     * @dev The amount of reward tokens that can be distributed per year. 150 Million tokens per year.
     */
    uint256 public constant REWARD_TOKENS_PER_YEAR = 150000000 * 10 ** 18;

    /**
     * @dev The amount of reward tokens that can be distributed per week. 150 Million tokens divided by 52 weeks.
     */
    uint256 public constant REWARD_TOKENS_PER_WEEK = REWARD_TOKENS_PER_YEAR / 52;

    /**
     * @dev The total amount of reward tokens funded to the contract.
     */
    uint256 public rewardTokensFunded;

    /**
     * @dev The total amount of reward tokens distributed to the wallets.
     */
    uint256 public rewardTokensDistributed;

    /**
     * @dev The total amount of reward tokens withdrawn from the contract.
     */
    uint256 public rewardTokensWithdrawn;

    /**
     * @dev The current balance of reward tokens in the contract.
     */
    uint256 public rewardTokensInSmartContract;

    /**
     * @dev The timestamp when reward tokens funding started.
     */
    uint256 public rewardTokensStartFundingTime;

    /**
     * @dev A flag to indicate if reward tokens funding has begun.
     */
    bool public rewardTokensFundingStarted;

    ////////////////// DATA VARIABLES & MAPPINGS //////////////////

    /**
     * @dev The address of the whitelister, responsible for managing the whitelist of wallets.
     */
    address public whiteListerAddress;
    
    /**
     * @dev The address of the rewards updater, responsible for updating the rewards for wallets.
     */
    address public rewardsUpdaterAddress;

    /**
     * @dev Struct to hold wallet data.
     * This struct contains information about a wallet's HYAX token holdings, rewards, and whitelist/blacklist status.
     */
    struct WalletData {
        uint256 hyaxHoldingAmount; // Current amount of HYAX tokens held by the wallet
        uint256 hyaxHoldingAmountAtWhitelistTime; // Amount of HYAX tokens held when the wallet was whitelisted. Useful for the team wallets
        uint256 totalHyaxRewardsAmount; // Total amount of HYAX rewards earned by the wallet
        uint256 currentRewardsAmount; // Current amount of rewards available for withdrawal
        uint256 rewardsWithdrawn; // Total amount of rewards withdrawn by the wallet
        uint256 addedToWhitelistTime; // Timestamp when the wallet was added to the whitelist
        uint8 teamTokenWithdrawalTimes; // Times that there have been a team token withdrawal
        uint256 lastRewardsWithdrawalTime; // Timestamp of the last rewards withdrawal
        uint256 lastRewardsUpdateTime; // Timestamp of the last rewards update
        bool isTeamWallet; // Flag indicating if this is a team wallet
        bool isWhitelisted; // Flag indicating if the wallet is whitelisted
        bool isBlacklisted; // Flag indicating if the wallet is blacklisted
    }
    /**
     * @dev The maximum number of wallets that can be processed in a single batch for reward updates.
     * This variable controls the size of the batch for reward updates to prevent gas issues.
     */
    uint8 public maximumBatchSizeForUpdateRewards;

    /**
     * @dev Mapping to store data for each wallet interacting with the contract.
     * This mapping associates each wallet address with its corresponding WalletData struct.
     */
    mapping(address => WalletData) public wallets;

    /**
     * @dev An array to reserve space for future upgrades.
     * This array is intentionally left unused to ensure that future upgrades can be implemented without affecting the storage layout.
     */
    uint256[50] private __gap;

    ////////////////// SMART CONTRACT CONSTRUCTOR /////////////////

    /**
     * @dev Initializer function instead of constructor.
     * This function will initialize the contract's state variables and call initializers for inherited contracts.
     */
    function initialize(address _hyaxTokenAddress) public initializer {
        // Initialize inherited contracts
        __AccessControlEnumerable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        //Grant the default admin role to the admin
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Set up the whitelister address
        whiteListerAddress = 0x01c2f012de19e6436744c3F81f56E9e70C93a8C3;

        // Add whitelister role to the whitelister address
        _grantRole(WHITELISTER_ROLE, whiteListerAddress);

        // Set up the rewards updater address
        rewardsUpdaterAddress = 0x01c2f012de19e6436744c3F81f56E9e70C93a8C3;

        // Add rewards updater role to the rewards updater address
        _grantRole(REWARDS_UPDATER_ROLE, rewardsUpdaterAddress);

        // Set the HYAX token address
        hyaxTokenAddress = _hyaxTokenAddress;

        // Create an instance of the HYAX token
        hyaxToken = IHyaxToken(hyaxTokenAddress);

        // Set the initial values for growth tokens to prevent Uninitialized State Variable errors
        growthTokensFunded = 0;
        growthTokensWithdrawn = 0;
        growthTokensInSmartContract = 0;
        growthTokensLastWithdrawalTime = 0;
        growthTokensStartFundingTime = 0;
        growthTokensFundingStarted = false;

        // Set the initial values for team tokens to prevent Uninitialized State Variable errors
        teamTokensFunded = 0;
        teamTokensWithdrawn = 0;
        teamTokensInSmartContract = 0;
        teamTokensStartFundingTime = 0;
        teamTokensFundingStarted = false;

        // Set the initial values for reward tokens to prevent Uninitialized State Variable errors
        rewardTokensFunded = 0;
        rewardTokensDistributed = 0;
        rewardTokensWithdrawn = 0;
        rewardTokensInSmartContract = 0;
        rewardTokensStartFundingTime = 0;
        rewardTokensFundingStarted = false;

        // Set the initial maximum batch size for update rewards
        maximumBatchSizeForUpdateRewards = 100;

        //Validate that the hyax token is valid based on the symbol
        require(
            keccak256(abi.encodePacked(hyaxToken.symbol())) ==
                keccak256(abi.encodePacked("HYAX")),
            "Hyax token address is not valid"
        );
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////

    /**
     * @dev Adds a wallet to the whitelist with specified parameters.
     * This function can only be called by the admin or the whitelister.
     * It validates the wallet address, its whitelist status, and the HYAX holding amount.
     * If the wallet is a team wallet, it requires a HYAX holding amount greater than 0 and less than or equal to the total team tokens.
     * If the wallet is not a team wallet, it requires a HYAX holding amount of 0.
     * It then updates the wallet's status in the whitelist and emits an event to notify of the addition.
     * @param _walletAddress The address of the wallet to be added to the whitelist.
     * @param _isTeamWallet Boolean indicating if the wallet is a team wallet.
     * @param _hyaxHoldingAmountAtWhitelistTime The amount of HYAX tokens held by the wallet at the time of whitelisting.
     */
    function addWalletToWhitelist(
        address _walletAddress,
        bool _isTeamWallet,
        uint256 _hyaxHoldingAmountAtWhitelistTime
    ) public onlyAdminOrWhitelister {
        // Validate the wallet address and its whitelist status
        require(
            _walletAddress != address(0),
            "Address cannot be the zero address"
        );
        require(
            address(_walletAddress).code.length == 0,
            "Invalid address length or contract address"
        );
        require(
            !wallets[_walletAddress].isWhitelisted,
            "Wallet is already whitelisted"
        );
        require(
            wallets[_walletAddress].isBlacklisted == false,
            "Wallet has been blacklisted"
        );
        require(
            wallets[_walletAddress].addedToWhitelistTime == 0,
            "Wallet has already been added to the whitelist"
        );

        //Add the wallet to the whitelist with the provided parameters
        wallets[_walletAddress].isWhitelisted = true; // Mark the wallet as whitelisted
        wallets[_walletAddress].isBlacklisted = false; // Mark the wallet as not blacklisted
        wallets[_walletAddress].isTeamWallet = _isTeamWallet; // Set whether this is a team wallet or not

        wallets[_walletAddress].addedToWhitelistTime = block.timestamp; // Set the time when the wallet was added to the whitelist

        wallets[_walletAddress].teamTokenWithdrawalTimes = 0; // Initialize the token withdrawal times to zero
        wallets[_walletAddress].lastRewardsWithdrawalTime = 0; // Initialize the last rewards withdrawal time to zero

        wallets[_walletAddress].currentRewardsAmount = 0; // Initialize the current rewards amount to zero
        wallets[_walletAddress].totalHyaxRewardsAmount = 0; // Set the total HYAX rewards amount to zero
        wallets[_walletAddress].rewardsWithdrawn = 0; // Initialize the rewards withdrawn to zero

        if (_isTeamWallet) {
            require(
                _hyaxHoldingAmountAtWhitelistTime > 0,
                "Team wallets must be added with a hyax holding amount greater than 0"
            );
            require(
                _hyaxHoldingAmountAtWhitelistTime <= TEAM_TOKENS_TOTAL,
                "Team wallets must be added with a hyax holding amount less than the total team tokens"
            );
            wallets[_walletAddress]
                .hyaxHoldingAmountAtWhitelistTime = _hyaxHoldingAmountAtWhitelistTime; // Set the wallet's HYAX holding amount
            wallets[_walletAddress]
                .hyaxHoldingAmount = _hyaxHoldingAmountAtWhitelistTime; // Set the wallet's HYAX holding amount
        } else {
            require(
                _hyaxHoldingAmountAtWhitelistTime == 0,
                "Non team wallets can only be added with holding amount equal to 0"
            );
            wallets[_walletAddress].hyaxHoldingAmountAtWhitelistTime = 0; // Set the wallet's HYAX holding amount
            wallets[_walletAddress].hyaxHoldingAmount = 0; // Set the wallet's HYAX holding amount
        }

        // Final validation of the wallet whitelist status
        require(
            wallets[_walletAddress].isWhitelisted == true &&
                wallets[_walletAddress].addedToWhitelistTime != 0,
            "Failed to whitelist the wallet"
        );

        //Emit an event to notify that the wallet was added to the whitelist
        emit WalletAddedToWhitelist(
            msg.sender,
            _walletAddress,
            _isTeamWallet,
            _hyaxHoldingAmountAtWhitelistTime
        );
    }


    /**
     * @dev Updates the whitelist status of a wallet.
     * @param _walletAddress The address of the wallet to update.
     * @param _newStatus The new whitelist status to set.
     * This function can only be called by the admin or the whitelister.
     */
    function updateWhitelistStatus(
        address _walletAddress,
        bool _newStatus
    ) public onlyAdminOrWhitelister {
        // Verify that the wallet is currently in a different status and the wallet has been added to the whitelist
        require(
            wallets[_walletAddress].isWhitelisted != _newStatus,
            "Wallet has already been updated to that status"
        );
        require(
            wallets[_walletAddress].addedToWhitelistTime != 0,
            "Wallet has not been added to the whitelist"
        );

        // Update the whitelist status
        wallets[_walletAddress].isWhitelisted = _newStatus;

        // Emit an event to notify that the wallet whitelist status has been updated
        emit WhitelistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }

    /**
     * @dev Updates the blacklist status of a wallet.
     * @param _walletAddress The address of the wallet to update.
     * @param _newStatus The new blacklist status to set.
     * This function can only be called by the admin or the whitelister.
     */
    function updateBlacklistStatus(
        address _walletAddress,
        bool _newStatus
    ) public onlyAdminOrWhitelister {
        // Verify that the wallet is currently in a different status
        require(
            wallets[_walletAddress].isBlacklisted != _newStatus,
            "Wallet has already been updated to that status"
        );

        // Update the blacklist status
        wallets[_walletAddress].isBlacklisted = _newStatus;

        // If the wallet blacklist new status is true (add to blacklist), set the whitelist status to false (remove from whitelist)
        if (_newStatus == true) {
            wallets[_walletAddress].isWhitelisted = false;
        }

        // Emit an event to notify that the wallet blacklisted status has been updated
        emit BlacklistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }

    /**
     * @dev Allows the owner to fund the smart contract with HYAX tokens.
     * This function can only be called by the owner of the contract and is protected against reentrancy.
     * It also checks if the contract is not paused before executing.
     * @param _fundingType The type of funding to be added, which can be GrowthTokens, TeamTokens, or RewardTokens.
     * @param _amount The amount of HYAX tokens to be funded.
     */
    function fundSmartContract(
        FundingType _fundingType,
        uint256 _amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant isNotPaused {
        // Validate the funding request
        require(
            msg.sender == owner(),
            "Only the owner can fund the smart contract"
        );
        require(
            _fundingType == FundingType.GrowthTokens ||
                _fundingType == FundingType.TeamTokens ||
                _fundingType == FundingType.RewardTokens,
            "Invalid funding type"
        );
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer the specified token to this contract
        require(
            hyaxToken.transferFrom(msg.sender, address(this), _amount),
            "There was an error on receiving the token funding"
        );

        // Add the amount to the corresponding token
        if (_fundingType == FundingType.GrowthTokens) {
            //Require that the amount is less than the total growth tokens
            require(
                growthTokensFunded + _amount <= GROWTH_TOKENS_TOTAL,
                "Amount to fund is greater than the total intended for growth tokens"
            );

            // Increase the total amount of growth tokens funded
            growthTokensFunded += _amount;

            // Increase the current balance of growth tokens in the smart contract
            growthTokensInSmartContract += _amount;

            // If growth tokens funding has not started yet, start it
            if (!growthTokensFundingStarted) {
                growthTokensFundingStarted = true; // Set the funding started flag to true
                growthTokensStartFundingTime = block.timestamp; // Start the funding time
                growthTokensLastWithdrawalTime = block.timestamp; // Initialize withdrawal time
            }
        } else if (_fundingType == FundingType.TeamTokens) {
            //Require that the amount is less than the total growth tokens
            require(
                teamTokensFunded + _amount <= TEAM_TOKENS_TOTAL,
                "Amount to fund is greater than the total intended for team tokens"
            );

            // Increase the total amount of team tokens funded
            teamTokensFunded += _amount;

            // Increase the current balance of team tokens tokens in the smart contract
            teamTokensInSmartContract += _amount;

            // If team tokens funding has not started yet, start it
            if (!teamTokensFundingStarted) {
                teamTokensFundingStarted = true; // Set the funding started flag to true
                teamTokensStartFundingTime = block.timestamp; // Start the funding time
            }
        } else if (_fundingType == FundingType.RewardTokens) {
            //Require that the amount is less than the total growth tokens
            require(
                rewardTokensFunded + _amount <= REWARD_TOKENS_TOTAL,
                "Amount to fund is greater than the total intended for reward tokens"
            );

            //Increase the total amount of reward tokens funded
            rewardTokensFunded += _amount;

            // Increase the current balance of reward tokens tokens in the smart contract
            rewardTokensInSmartContract += _amount;

            // If reward tokens funding has not started yet, start it
            if (!rewardTokensFundingStarted) {
                rewardTokensFundingStarted = true; // Set the funding started flag to true
                rewardTokensStartFundingTime = block.timestamp; // Start the funding time
            }
        }
        // Emit an event to notify that the funding was successful
        emit FundingAdded(_fundingType, _amount);
    }

    /**
     * @dev Modifier to ensure that the function can only be called by the owner or the whitelister.
     * This modifier is used to restrict access to certain functions within the contract.
     * It checks if the message sender has the role of either the whitelister or the default admin.
     * If the sender does not have either of these roles, it reverts the transaction.
     */
    modifier onlyAdminOrWhitelister() {
        // Ensure that the sender is the owner or the whitelister address
        require(
            hasRole(WHITELISTER_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Function reserved only for the whitelister or the owner"
        );
        _;
    }

    /**
     * @dev Modifier to ensure that the function can only be called by the owner, the rewards updater, or the contract itself.
     * This modifier is used to restrict access to certain functions within the contract.
     * It checks if the message sender has the role of either the rewards updater, the default admin, or if the sender is the contract itself.
     * If the sender does not have either of these roles or is not the contract itself, it reverts the transaction.
     */
    modifier onlyAdminOrRewardsUpdater() {
        // Ensure that the sender is the owner, the rewards updater address or the contract itself
        require(
            hasRole(REWARDS_UPDATER_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                msg.sender == address(this),
            "Function reserved only for the rewards updater, the owner, or the contract itself"
        );
        _;
    }
    
    /**
     * @dev Modifier to ensure that the function can only be called by a whitelisted wallet.
     * This modifier is used to restrict access to certain functions within the contract.
     * It checks if the wallet address is whitelisted.
     * If the wallet address is not whitelisted, it reverts the transaction.
     */
    modifier isWhitelisted(address _walletAddress) {
        // Ensure that the sender is the owner or the white lister address
        require(
            wallets[_walletAddress].isWhitelisted == true,
            "Wallet is not whitelisted"
        );
        _;
    }

    /**
     * @dev Modifier to ensure that the function can only be called by a wallet that is not blacklisted.
     * This modifier is used to restrict access to certain functions within the contract.
     * It checks if the wallet address is not blacklisted.
     * If the wallet address is blacklisted, it reverts the transaction.
     */
    modifier isNotBlacklisted(address _walletAddress) {
        // Ensure that the wallet address is not blacklisted
        require(
            wallets[_walletAddress].isBlacklisted == false,
            "Wallet has been blacklisted"
        );
        _;
    }

    /**
     * @dev Modifier to ensure that the function can only be called when the contract is not paused.
     * This modifier is used to restrict access to certain functions within the contract.
     * It checks if the contract is paused. If the contract is paused, it reverts the transaction.
     */
    modifier isNotPaused() {
        // Ensure that the smart contract is not paused
        require(paused() == false, "Contract is paused");
        _;
    }

    /////////////GROWTH TOKENS FUNCTIONS///////////
    /**
     * @notice Allows the owner to withdraw growth tokens
     * @dev This function can only be called by the owner
     * @dev Withdrawals are limited to once per year and a fixed amount per withdrawal
     * @dev The function checks various conditions before allowing the withdrawal
     * @custom:requirements Caller must be the owner
     * @custom:requirements Growth tokens funding must have started
     * @custom:requirements At least one year must have passed since the last withdrawal
     * @custom:requirements Not all growth tokens have been withdrawn
     * @custom:events Emits a GrowthTokensWithdrawn event upon successful withdrawal
     */
    function withdrawGrowthTokens()
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        isNotPaused
    {
        // Validate the conditions for growth tokens withdrawal
        require(
            msg.sender == owner(),
            "Only the owner can withdraw growth tokens"
        );
        require(
            growthTokensFundingStarted,
            "Growth tokens funding has not started yet, no tokens to withdraw"
        );
        require(
            block.timestamp >=
                growthTokensStartFundingTime + TOKENS_WITHDRAWAL_PERIOD,
            "Cannot withdraw before 1 year after funding start"
        );
        require(
            growthTokensWithdrawn < GROWTH_TOKENS_TOTAL,
            "All growth tokens have been withdrawn"
        );
        require(
            block.timestamp >=
                growthTokensLastWithdrawalTime + TOKENS_WITHDRAWAL_PERIOD,
            "Can only withdraw once per year"
        );

        // Set the initial withdrawable amount to the yearly withdrawal limit
        uint256 withdrawableAmount = GROWTH_TOKENS_WITHDRAWAL_PER_YEAR;

        // Check if withdrawing the full yearly amount would exceed the total growth tokens
        uint256 totalWithdrawn = growthTokensWithdrawn + withdrawableAmount;

        // If so, adjust the withdrawable amount to the remaining balance
        if (totalWithdrawn > GROWTH_TOKENS_TOTAL) {
            withdrawableAmount = GROWTH_TOKENS_TOTAL - growthTokensWithdrawn;
        }

        // Update the growth tokens withdrawn amount
        growthTokensWithdrawn += withdrawableAmount;

        // Update the growth tokens in the smart contract
        growthTokensInSmartContract -= withdrawableAmount;

        // Update the last withdrawal time
        growthTokensLastWithdrawalTime = block.timestamp;

        // Transfer the calculated amount to the owner
        require(
            hyaxToken.transfer(owner(), withdrawableAmount),
            "Failed to transfer growth tokens"
        );

        // Emit an event to notify that the growth tokens were withdrawn
        emit GrowthTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /////////////TEAM TOKENS FUNCTIONS///////////

    /**
     * @notice Allows team wallets to withdraw their allocated team tokens.
     * @dev This function is restricted to team wallets and implements a nonReentrant guard to prevent reentrancy attacks.
     * It also checks if the contract is not paused to ensure that the function can only be called when the contract is operational.
     * The function validates various conditions before allowing team token withdrawal, including:
     * - The wallet calling the function is a team wallet.
     * - Team tokens funding has started.
     * - The wallet has waited at least 4 years after being added to the whitelist before attempting to withdraw.
     * - Not all team tokens have been withdrawn.
     * - The wallet has a positive HYAX holding amount.
     * - The wallet has not exceeded the maximum number of team token withdrawals per year.
     * Upon successful validation, it calculates the withdrawable amount based on the wallet's HYAX holding amount at whitelist time,
     * updates the wallet's HYAX holding amount, team tokens withdrawn amount, and team tokens in the smart contract,
     * increases the wallet's team token withdrawal times, transfers the calculated amount to the wallet,
     * and emits an event to notify that the team tokens were withdrawn.
     */
    function withdrawTeamTokens()
        public
        isWhitelisted(msg.sender)
        isNotBlacklisted(msg.sender)
        nonReentrant
        isNotPaused
    {
        // Validate the conditions for team tokens withdrawal
        require(
            wallets[msg.sender].isTeamWallet == true,
            "Only team wallets can withdraw tokens using this function"
        );
        require(
            teamTokensFundingStarted,
            "Team tokens funding has not started yet, no tokens to withdraw"
        );
        require(
            block.timestamp >=
                wallets[msg.sender].addedToWhitelistTime +
                    TEAM_TOKENS_LOCKED_PERIOD,
            "Cannot withdraw before 4 years after being added to the whitelist"
        );
        require(
            teamTokensWithdrawn < TEAM_TOKENS_TOTAL,
            "All team tokens have been withdrawn"
        );
        require(
            wallets[msg.sender].hyaxHoldingAmount > 0,
            "No hyax holding amount to withdraw"
        );
        require(
            wallets[msg.sender].teamTokenWithdrawalTimes <
                calculateYearForTeamTokens(),
            "Can only withdraw team tokens once per year"
        );

        // Set the initial withdrawable amount to the limit per year (20% of the hyax holding amount at whitelist time)
        uint256 withdrawableAmount = wallets[msg.sender]
            .hyaxHoldingAmountAtWhitelistTime / 5;

        // Check if withdrawing the yearly amount would exceed the total team tokens
        if (teamTokensWithdrawn + withdrawableAmount > TEAM_TOKENS_TOTAL) {
            // If so, adjust the withdrawable amount to the remaining balance
            withdrawableAmount = TEAM_TOKENS_TOTAL - teamTokensWithdrawn;
        }

        //Update the hyax holding amount
        wallets[msg.sender].hyaxHoldingAmount -= withdrawableAmount;

        // Update the team tokens withdrawn amount
        teamTokensWithdrawn += withdrawableAmount;

        // Update the team tokens in the smart contract
        teamTokensInSmartContract -= withdrawableAmount;

        //Increase the times that the team member has done a token withdrawal
        wallets[msg.sender].teamTokenWithdrawalTimes++;

        // Transfer the calculated amount to the wallet
        require(
            hyaxToken.transfer(msg.sender, withdrawableAmount),
            "Failed to transfer team tokens"
        );

        // Emit an event to notify that the team tokens were withdrawn
        emit TeamTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /**
     * @dev Calculates the number of years that have elapsed since team tokens funding started.
     * This function is used to determine the number of team tokens that can be withdrawn.
     * It takes into account the maximum year cap for team token withdrawals.
     * 
     * @return The number of years that have elapsed since team tokens funding started, capped at 5.
     */
    function calculateYearForTeamTokens() public view returns (uint8) {
        // Check if team tokens funding has started
        require(
            teamTokensFundingStarted,
            "Team tokens funding has not started yet"
        );

        // Calculate the time elapsed since the funding start time
        uint256 timeElapsed = block.timestamp - teamTokensStartFundingTime;
        uint256 yearsElapsed = timeElapsed / 365 days;

        // Ensure the maximum year cap is respected
        if (yearsElapsed >= 8) {
            return 5; // Year 8 and beyond can withdraw
        } else if (yearsElapsed >= 7) {
            return 4; // Year 7 can withdraw
        } else if (yearsElapsed >= 6) {
            return 3; // Year 6 can withdraw
        } else if (yearsElapsed >= 5) {
            return 2; // Year 5 can withdraw
        } else if (yearsElapsed >= 4) {
            return 1; // Year 4 can withdraw
        } else {
            return 0; // Less than 4 years elapsed
        }
    }

    /////////////REWARD TOKENS FUNCTIONS///////////

    /**
     * @notice Updates the rewards for a batch of wallets
     * @dev This function updates the rewards for a batch of wallet addresses.
     * It iterates through the list of wallets and tries to update the rewards for each wallet.
     * If an error occurs during the update, it emits a RewardUpdateFailed event.
     * @param _walletAddresses The addresses of the wallets to update rewards for.
     * @param _hyaxRewards The amounts of HYAX rewards to update for the wallets.
     */
    function updateRewardsBatch(
        address[] calldata _walletAddresses,
        uint256[] calldata _hyaxRewards
    ) public onlyAdminOrRewardsUpdater nonReentrant {
        //Validate the conditions for batch reward token update
        require(
            rewardTokensFundingStarted,
            "Reward tokens funding has not started yet, no tokens to update"
        );
        require(_walletAddresses.length > 0, "Batch size cannot be 0");
        require(
            _walletAddresses.length <= maximumBatchSizeForUpdateRewards,
            "Batch size exceeds the defined limit"
        );
        require(
            _walletAddresses.length == _hyaxRewards.length,
            "Array lengths must match"
        );

        // Iterate through the list of wallets
        for (uint256 i = 0; i < _walletAddresses.length; i++) {
            //Try to update the rewards for the current wallet address
            try
                this.updateRewardsSingle(_walletAddresses[i], _hyaxRewards[i])
            {} catch Error(string memory _errorMessage) {
                emit RewardUpdateFailed(
                    msg.sender,
                    _walletAddresses[i],
                    _errorMessage
                );
            }
        }

        emit RewardUpdateBatchSent(msg.sender, _walletAddresses, _hyaxRewards);
    }

    /**
     * @notice Updates the rewards for a single wallet
     * @dev This function updates the rewards for a single wallet address.
     * It validates the conditions for the reward token update and ensures that the wallet is whitelisted, not blacklisted,
     * and that the rewards do not exceed the allowed limits.
     * If an error occurs during the update, it emits a RewardUpdateFailed event.
     * @param _walletAddress The address of the wallet to update rewards for.
     * @param _hyaxRewards The amount of HYAX rewards to update for the wallet.
     */
    function updateRewardsSingle(
        address _walletAddress,
        uint256 _hyaxRewards
    ) public onlyAdminOrRewardsUpdater {
        // Validate the conditions for single reward token update
        require(
            rewardTokensFundingStarted,
            "Reward tokens funding has not started yet, no tokens to update"
        );
        require(
            wallets[_walletAddress].isWhitelisted == true,
            "Wallet is not whitelisted"
        );
        require(
            wallets[_walletAddress].isBlacklisted == false,
            "Wallet has been blacklisted"
        );
        require(
            block.timestamp >=
                wallets[_walletAddress].lastRewardsUpdateTime +
                    MIN_INTERVAL_FOR_UPDATE_REWARDS,
            "Too soon to update rewards for this wallet"
        );

        // Additional validation to ensure rewards do not exceed allowed limits
        require(
            _hyaxRewards <= REWARD_TOKENS_PER_WEEK,
            "A single wallet cannot have rewards higher than the weekly limit"
        );
        require(
            _hyaxRewards <= rewardTokensInSmartContract,
            "Insufficient reward tokens to distribute as rewards"
        );
        require(
            rewardTokensDistributed + _hyaxRewards <= REWARD_TOKENS_TOTAL,
            "All the reward tokens have been already distributed"
        );

        // Update the last rewards update time
        wallets[_walletAddress].lastRewardsUpdateTime = block.timestamp;

        // Update the total rewards distributed
        rewardTokensDistributed += _hyaxRewards;

        // Update the total rewards for the wallet
        wallets[_walletAddress].totalHyaxRewardsAmount += _hyaxRewards;

        // Update the current rewards amount for the wallet
        wallets[_walletAddress].currentRewardsAmount += _hyaxRewards;

        // Emit an event to notify that the rewards were updated successfully
        emit RewardUpdateSuccess(msg.sender, _walletAddress, _hyaxRewards);
    }

    /**
     * @dev Allows a whitelisted and not blacklisted user to withdraw their reward tokens.
     * This function can only be called when the contract is not paused and the user has not been blacklisted.
     * It validates various conditions before allowing the withdrawal, including ensuring reward tokens funding has started,
     * not all reward tokens have been withdrawn, there are sufficient reward tokens in the contract, and the user has rewards available to withdraw.
     * It then updates the user's wallet state, transfers the reward tokens, and emits an event to notify of the withdrawal.
     */
    function withdrawRewardTokens()
        public
        isWhitelisted(msg.sender)
        isNotBlacklisted(msg.sender)
        nonReentrant
        isNotPaused
    {
        // Validate various conditions before allowing reward token withdrawal
        require(
            rewardTokensFundingStarted,
            "Reward tokens funding has not started yet, no tokens to withdraw"
        );
        require(
            rewardTokensWithdrawn < REWARD_TOKENS_TOTAL,
            "All reward tokens have been withdrawn"
        );

        uint256 withdrawableAmount = wallets[msg.sender].currentRewardsAmount;
        require(withdrawableAmount > 0, "No rewards available to withdraw");
        require(
            withdrawableAmount <= rewardTokensInSmartContract,
            "Insufficient reward tokens in the contract to withdraw"
        );

        // Reset the current rewards amount
        wallets[msg.sender].currentRewardsAmount = 0;

        // Update the rewards withdrawn amount
        wallets[msg.sender].rewardsWithdrawn += withdrawableAmount;

        // Update the last rewards withdrawal time
        wallets[msg.sender].lastRewardsWithdrawalTime = block.timestamp;

        // Update the reward tokens in the smart contract
        rewardTokensInSmartContract -= withdrawableAmount;

        // Update the total reward tokens withdrawn
        rewardTokensWithdrawn += withdrawableAmount;

        // Transfer the calculated amount to the wallet
        bool transferSuccess = hyaxToken.transfer(
            msg.sender,
            withdrawableAmount
        );
        require(transferSuccess, "Failed to transfer reward tokens");

        // Emit an event to notify that the reward tokens were withdrawn
        emit RewardTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /////////////SMART CONTRACT MANAGEMENT FUNCTIONS///////////
    /**
     * @dev This function is used to withdraw tokens to be burned.
     * It can only be called by the default admin role, is non-reentrant, and is not paused.
     * @param _fundingType The type of funding to be withdrawn (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens to be withdrawn
     */
    function withdrawTokensToBurn(
        FundingType _fundingType,
        uint256 _amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant isNotPaused {
        //Validate the conditions for tokens to burn withdrawal
        require(msg.sender == owner(), "Only the owner can withdraw tokens");
        require(
            _fundingType == FundingType.GrowthTokens ||
                _fundingType == FundingType.TeamTokens ||
                _fundingType == FundingType.RewardTokens,
            "Invalid funding type"
        );
        require(_amount > 0, "Amount must be greater than 0");

        // Check the funding type and perform the necessary actions
        if (_fundingType == FundingType.GrowthTokens) {
            // Ensure that growth tokens funding has started and there are sufficient growth tokens in the contract to withdraw
            require(
                growthTokensFundingStarted,
                "Growth tokens funding has not started yet, no tokens to withdraw"
            );
            require(
                _amount <= growthTokensInSmartContract,
                "Insufficient growth tokens in the contract to withdraw"
            );
            // Update the growth tokens in the smart contract
            growthTokensInSmartContract -= _amount;
        } else if (_fundingType == FundingType.TeamTokens) {
            // Ensure that team tokens funding has started and there are sufficient team tokens in the contract to withdraw
            require(
                teamTokensFundingStarted,
                "Team tokens funding has not started yet, no tokens to withdraw"
            );
            require(
                _amount <= teamTokensInSmartContract,
                "Insufficient team tokens in the contract to withdraw"
            );
            // Update the team tokens in the smart contract
            teamTokensInSmartContract -= _amount;
        } else if (_fundingType == FundingType.RewardTokens) {
            // Ensure that reward tokens funding has started and there are sufficient reward tokens in the contract to withdraw
            require(
                rewardTokensFundingStarted,
                "Reward tokens funding has not started yet, no tokens to withdraw"
            );
            require(
                _amount <= rewardTokensInSmartContract,
                "Insufficient reward tokens in the contract to withdraw"
            );
            // Update the reward tokens in the smart contract
            rewardTokensInSmartContract -= _amount;
        }
        
        // Transfer the calculated amount to the owner
        require(
            hyaxToken.transfer(owner(), _amount),
            "Failed to withdraw tokens"
        );

        // Emit an event to notify that the growth tokens were withdrawn
        emit TokensToBurnWithdrawn(_fundingType, _amount);
    }

    /**
     * @dev Updates the wallet address of a team member.
     * This function can only be called by the contract owner and is used to update the wallet address of a team member.
     * It ensures that the old wallet address is no longer considered a team wallet and the new wallet address is marked as a team wallet.
     * It also transfers the wallet data from the old wallet to the new wallet.
     * 
     * @param _oldTeamMemberWalletAddress The address of the old team member wallet.
     * @param _newTeamMemberWalletAddress The address of the new team member wallet.
     */
    function updateTeamMemberWallet(
        address _oldTeamMemberWalletAddress,
        address _newTeamMemberWalletAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require( 
            msg.sender == owner(),
            "Only the owner can update the team member wallet"
        );
        require(
            teamTokensFundingStarted,
            "Team tokens funding has not started yet, no tokens to recover"
        );

        // Validation checks for the old and new wallet addresses
        require(
            wallets[_oldTeamMemberWalletAddress].isTeamWallet,
            "Old wallet address is not a team wallet"
        );
        require(
            wallets[_oldTeamMemberWalletAddress].isWhitelisted,
            "Old team member wallet address is not whitelisted"
        );
        require(
            !wallets[_oldTeamMemberWalletAddress].isBlacklisted,
            "Old team member wallet address is blacklisted"
        );
        require(
            _newTeamMemberWalletAddress != address(0),
            "New team member wallet address cannot be the zero address"
        );
        require(
            _newTeamMemberWalletAddress != _oldTeamMemberWalletAddress,
            "New team member wallet address cannot be the same as the old team member wallet address"
        );
        require(
            !wallets[_newTeamMemberWalletAddress].isWhitelisted,
            "New team member wallet address is already whitelisted"
        );
        require(
            !wallets[_newTeamMemberWalletAddress].isTeamWallet,
            "New team member wallet address is already a team wallet"
        );
        require(
            !wallets[_newTeamMemberWalletAddress].isBlacklisted,
            "New team member wallet address is blacklisted"
        );

        // Consolidate wallet data transfer to the new address
        WalletData storage oldWallet = wallets[_oldTeamMemberWalletAddress];
        WalletData storage newWallet = wallets[_newTeamMemberWalletAddress];

        //Lock the old wallet in order to prevent potential race conditions
        oldWallet.isWhitelisted = false;
        oldWallet.isTeamWallet = false;
        oldWallet.isBlacklisted = true;

        //Update the new wallet status
        newWallet.isWhitelisted = true;
        newWallet.isTeamWallet = true;
        newWallet.isBlacklisted = false;

        //Update the new wallet with the values of the old wallet
        newWallet.hyaxHoldingAmountAtWhitelistTime = oldWallet
            .hyaxHoldingAmountAtWhitelistTime;
        newWallet.hyaxHoldingAmount = oldWallet.hyaxHoldingAmount;
        newWallet.addedToWhitelistTime = oldWallet.addedToWhitelistTime;
        newWallet.teamTokenWithdrawalTimes = oldWallet.teamTokenWithdrawalTimes;

        // Clear the old wallet’s data in a single step
        oldWallet.hyaxHoldingAmountAtWhitelistTime = 0;
        oldWallet.hyaxHoldingAmount = 0;
        oldWallet.teamTokenWithdrawalTimes = 0;

        //Validate the new status of the wallets
        require(
            wallets[_newTeamMemberWalletAddress].isWhitelisted == true &&
                wallets[_newTeamMemberWalletAddress].addedToWhitelistTime !=
                0 &&
                wallets[_oldTeamMemberWalletAddress]
                    .hyaxHoldingAmountAtWhitelistTime ==
                0 &&
                wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmount == 0,
            "Failed to update the team member wallet"
        );

        // Emit an event to notify of the update
        emit TeamMemberWalletUpdated(
            _oldTeamMemberWalletAddress,
            _newTeamMemberWalletAddress,
            newWallet.hyaxHoldingAmount
        );
    }


    /**
     * @dev Updates the address of the white lister.
     * This function can only be called by the admin.
     * It validates that the new white lister address is not the zero address,
     * revokes the white lister role from the previous address,
     * grants the white lister role to the new address,
     * updates the white lister address, and emits an event to notify of the update.
     * @param _whiteListerAddress The address of the new white lister.
     */
    function updateWhiteListerAddress(
        address _whiteListerAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Validate that the white lister address is not the zero address
        require(
            _whiteListerAddress != address(0),
            "White lister address cannot be the zero address"
        );

        //Revoke role to the previous white lister address
        revokeRole(WHITELISTER_ROLE, whiteListerAddress);

        //Grant the role to the new white lister address
        grantRole(WHITELISTER_ROLE, _whiteListerAddress);

        // Update the white lister address
        whiteListerAddress = _whiteListerAddress;

        emit WhiteListerAddressUpdated(_whiteListerAddress);
    }

    /**
     * @dev Updates the address of the rewards updater.
     * This function can only be called by the admin.
     * It validates that the new rewards updater address is not the zero address,
     * revokes the rewards updater role from the previous address,
     * grants the rewards updater role to the new address,
     * updates the rewards updater address, and emits an event to notify of the update.
     * @param _rewardsUpdaterAddress The address of the new rewards updater.
     */
    function updateRewardsUpdaterAddress(
        address _rewardsUpdaterAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Validate that the rewards updater address is not the zero address
        require(
            _rewardsUpdaterAddress != address(0),
            "Rewards updater address cannot be the zero address"
        );

        //Revoke role to the previous rewards updater address
        revokeRole(REWARDS_UPDATER_ROLE, rewardsUpdaterAddress);

        //Grant the role to the new rewards updater address
        grantRole(REWARDS_UPDATER_ROLE, _rewardsUpdaterAddress);

        // Update the rewards updater address
        rewardsUpdaterAddress = _rewardsUpdaterAddress;

        emit RewardsUpdaterAddressUpdated(_rewardsUpdaterAddress);
    }

    /**
     * @dev Updates the address of the HYAX token contract.
     * This function can only be called by the admin.
     * It validates that the new HYAX token address is not the zero address,
     * ensures the caller is the owner of the contract,
     * verifies that the token at the new address is a valid HYAX token,
     * updates the HYAX token address, updates the HYAX token instance,
     * and emits an event to notify of the update.
     * @param _hyaxTokenAddress The address of the new HYAX token contract.
     */
    function updateHyaxTokenAddress(
        address _hyaxTokenAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Validate the conditions for hyax token address update
        require(
            msg.sender == owner(),
            "Only the owner can update the hyax token address"
        );
        require(
            _hyaxTokenAddress != address(0),
            "Hyax token address cannot be the zero address"
        );

        // Validate that the token is a valid HYAX token
        IHyaxToken newHyaxToken = IHyaxToken(_hyaxTokenAddress);

        // Validate that the token is a valid HYAX token
        require(
            keccak256(abi.encodePacked(newHyaxToken.symbol())) ==
                keccak256(abi.encodePacked("HYAX")),
            "Token address must be a valid HYAX token address"
        );

        // Update the hyax token address
        hyaxTokenAddress = _hyaxTokenAddress;

        // Update the hyax token
        hyaxToken = IHyaxToken(hyaxTokenAddress);

        emit HyaxTokenAddressUpdated(_hyaxTokenAddress);
    }

    /**
     * @dev Updates the maximum batch size for updating rewards.
     * This function can only be called by the admin.
     * It validates that the new maximum batch size is within the allowed range (1 to 100),
     * updates the maximum batch size for update rewards, and emits an event to notify of the update.
     * @param _maximumBatchSizeForUpdateRewards The new maximum batch size for update rewards.
     */
    function updateMaximumBatchSizeForUpdateRewards(
        uint8 _maximumBatchSizeForUpdateRewards
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Validate that the maximum batch size is greater than 0 and does not exceed 100
        require(
            _maximumBatchSizeForUpdateRewards > 0,
            "Maximum batch size cannot be 0"
        );
        require(
            _maximumBatchSizeForUpdateRewards <= 100,
            "Maximum batch size cannot be greater than 100"
        );

        // Update the maximum batch size for update rewards
        maximumBatchSizeForUpdateRewards = _maximumBatchSizeForUpdateRewards;

        emit MaximumBatchSizeForUpdateRewardsUpdated(
            _maximumBatchSizeForUpdateRewards
        );
    }


    /**
     * @dev Returns the address of the owner of the contract.
     * This function is view-only and does not modify the state of the contract.
     * It retrieves the first account that has been assigned the DEFAULT_ADMIN_ROLE.
     * @return The address of the owner of the contract.
     */
    function owner() public view returns (address) {
        // Returns the first account with the DEFAULT_ADMIN_ROLE
        return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    }


    /**
     * @dev Pauses all functionalities of the contract.
     * This function can only be called by the admin.
     * It calls the internal _pause function to pause the contract.
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }


    /**
     * @dev Unpauses the contract, allowing normal functionality to resume.
     * This function can only be called by the admin.
     * It calls the internal _unpause function to unpause the contract.
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Transfers the ownership of the contract to a new address.
     * This function can only be called by the admin.
     * It validates the conditions for ownership transfer and revokes the role from the current owner.
     * @param newOwner The address of the new owner.
     */
    function transferOwnership(
        address newOwner
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        // Validate the conditions for ownership transfer
        require(msg.sender == owner(), "Only the owner can transfer ownership");
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        require(
            newOwner != address(this),
            "Ownable: new owner cannot be the same contract address"
        );

        // Grant the role to the new owner
        grantRole(DEFAULT_ADMIN_ROLE, newOwner);

        // Revoke the role from the current owner
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
