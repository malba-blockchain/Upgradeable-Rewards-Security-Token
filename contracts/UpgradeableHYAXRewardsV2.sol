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

contract UpgradeableHYAXRewardsV2 is AccessControlEnumerableUpgradeable,  PausableUpgradeable, ReentrancyGuardUpgradeable {
    
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
     * @param _fundingType The type of funding added (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens added
     */
    event FundingAdded(FundingType _fundingType, uint256 _amount);
    
    /**
     * @dev Emitted when growth tokens are withdrawn
     * @param _walletAddress The address of the wallet that withdrew the tokens
     * @param _amount The amount of growth tokens withdrawn
     */
    event GrowthTokensWithdrawn(address _walletAddress, uint256 _amount);

    /**
     * @dev Emitted when team tokens are withdrawn
     * @param _walletAddress The address of the wallet that withdrew the tokens
     * @param _amount The amount of team tokens withdrawn
     */
    event TeamTokensWithdrawn(address _walletAddress, uint256 _amount);

    /**
     * @dev Emitted when reward tokens are withdrawn
     * @param _walletAddress The address of the wallet that withdrew the rewards
     * @param _amount The amount of rewards withdrawn
     */
    event RewardTokensWithdrawn(address _walletAddress, uint256 _amount);

    /**
     * @dev Emitted when tokens are withdrawn to be burned
     * @param _fundingType The type of funding (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens withdrawn to be burned
     */
    event TokensToBurnWithdrawn(FundingType _fundingType, uint256 _amount);

    /**
     * @dev Emitted when a wallet is added to the whitelist
     * @param _sender The address that added the wallet to the whitelist
     * @param _walletAddress The address of the wallet added to the whitelist
     * @param _isTeamWallet Boolean indicating if the wallet is a team wallet
     * @param _hyaxHoldingAmount The amount of HYAX tokens held by the wallet
     */
    event WalletAddedToWhitelist(address _sender, address _walletAddress, bool _isTeamWallet, uint256 _hyaxHoldingAmount);

    /**
     * @dev Emitted when a wallet whitelist status is updated
     * @param _sender The address that updated the whitelist status
     * @param _walletAddress The address of the wallet 
     * @param _newStatus The new status of the wallet in the whitelist
     */
    event WhitelistStatusUpdated(address _sender, address _walletAddress, bool _newStatus);

    /**
     * @dev Emitted when a wallet blacklist status is updated
     * @param _sender The address that updated the blacklist status
     * @param _walletAddress The address of the wallet 
     * @param _newStatus The new status of the wallet in the blacklist
     */
    event BlacklistStatusUpdated(address _sender, address _walletAddress, bool _newStatus);

    /**
     * @dev Emitted when a reward update is successful for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update was successful
     * @param _hyaxReward The amount of HYAX rewards updated for the wallet
     */
    event RewardUpdateSuccess(address _sender, address _walletAddress, uint256 _hyaxReward);

    /**
     * @dev Emitted when a reward update batch is sent
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddresses The addresses of the wallets sent for the update
     * @param _hyaxRewards The amount of HYAX rewards sent for the update
     */
    event RewardUpdateBatchSent(address _sender, address[] _walletAddresses, uint256[] _hyaxRewards);

    /**
     * @dev Emitted when a reward update fails for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update failed
     * @param _errorMessage A string describing the reason for the failure
     */
    event RewardUpdateFailed(address _sender, address _walletAddress, string _errorMessage);

    /**
     * @dev Emitted when a function is called, logging the sender and origin of the transaction
     * @param _sender The address that initiated the transaction
     * @param _origin The origin of the transaction (tx.origin)
     */
    event LogSenderAndOrigin(address _sender, address _origin);

    /**
     * @dev Emitted when a team member wallet is updated
     * @param _oldTeamMemberWalletAddress The address of the old team member wallet
     * @param _newTeamMemberWalletAddress The address of the new team member wallet
     */
    event TeamMemberWalletUpdated(address _oldTeamMemberWalletAddress, address _newTeamMemberWalletAddress, 
        uint256 _hyaxHoldingAmount);

    /**
     * @dev Emitted when the white lister address is updated
     * @param _whiteListerAddress The address of the new white lister
     */
    event WhiteListerAddressUpdated(address _whiteListerAddress);

    /**
     * @dev Emitted when the rewards updater address is updated
     * @param _rewardsUpdaterAddress The address of the new rewards updater
     */
    event RewardsUpdaterAddressUpdated(address _rewardsUpdaterAddress);

    /**
     * @dev Emitted when the hyax token address is updated
     * @param _hyaxTokenAddress The address of the new hyax token
     */
    event HyaxTokenAddressUpdated(address _hyaxTokenAddress);

    /**
     * @dev Emitted when the maximum batch size for update rewards is updated
     * @param _maximumBatchSizeForUpdateRewards The new maximum batch size for update rewards
     */
    event MaximumBatchSizeForUpdateRewardsUpdated(uint8 _maximumBatchSizeForUpdateRewards);

    ////////////////// SMART CONTRACT VARIABLES & CONSTANTS //////////////////

    address public hyaxTokenAddress;

    IHyaxToken public hyaxToken;

    enum FundingType {GrowthTokens, TeamTokens, RewardTokens}

    uint256 public constant MIN_INTERVAL_FOR_UPDATE_REWARDS = 6 days;

    bytes32 public constant REWARDS_UPDATER_ROLE = keccak256("REWARDS_UPDATER_ROLE");

    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

    ////////////////// GROWTH TOKENS VARIABLES //////////////////

    uint256 public constant GROWTH_TOKENS_TOTAL = 2400000000 * 10**18; // Total of 2.4 Billion growth tokens. 60% of 4B.
    
    uint256 public constant GROWTH_TOKENS_WITHDRAWAL_PER_YEAR = 120000000 * 10**18; // 120 Million tokens per year

    uint256 public constant TOKENS_WITHDRAWAL_PERIOD = 365 days; // 1 year

    uint256 public growthTokensFunded; // Total amount of growth tokens funded to the contract

    uint256 public growthTokensWithdrawn; // Total amount of growth tokens withdrawn from the contract

    uint256 public growthTokensInSmartContract; // Current balance of growth tokens in the contract

    uint256 public growthTokensLastWithdrawalTime; // Timestamp of the last growth tokens withdrawal

    uint256 public growthTokensStartFundingTime; // Timestamp when growth tokens funding started

    bool public growthTokensFundingStarted; // Flag to indicate if growth tokens funding has begun


    ////////////////// TEAM TOKENS VARIABLES //////////////////

    uint256 public constant TEAM_TOKENS_TOTAL = 1500000000 * 10**18; // Total of 1.5 Billion as team tokens
    
    uint256 public constant TEAM_TOKENS_WITHDRAWAL_PER_YEAR = 300000000 * 10**18; // 300 Million tokens per year

    uint256 public constant TEAM_TOKENS_LOCKED_PERIOD = 1460 days; // 4 years

    uint256 public teamTokensFunded; // Total amount of team tokens funded to the contract

    uint256 public teamTokensWithdrawn; // Total amount of team tokens withdrawn from the contract

    uint256 public teamTokensInSmartContract; // Current balance of team tokens in the contract

    uint256 public teamTokensStartFundingTime; // Timestamp when team tokens funding started

    bool public teamTokensFundingStarted; // Flag to indicate if team tokens funding has begun

    
    ////////////////// REWARD TOKENS VARIABLES //////////////////

    uint256 public constant REWARD_TOKENS_TOTAL = 1200000000 * 10**18; // Total of 1.2 Billion as reward tokens
    
    uint256 public constant REWARD_TOKENS_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

    uint256 public constant REWARD_TOKENS_PER_WEEK =  REWARD_TOKENS_PER_YEAR / 52; // 150 Million tokens divided by 52 weeks

    uint256 public rewardTokensFunded; // Total amount of reward tokens funded to the contract

    uint256 public rewardTokensDistributed; // Total amount of reward tokens distributed to the wallets 

    uint256 public rewardTokensWithdrawn; // Total amount of reward tokens withdrawn from the contract

    uint256 public rewardTokensInSmartContract; // Current balance of reward tokens in the contract

    uint256 public rewardTokensStartFundingTime; // Timestamp when team tokens funding started

    bool public rewardTokensFundingStarted; // Flag to indicate if team tokens funding has begun


    ////////////////// DATA VARIABLES & MAPPINGS //////////////////
   
    address public whiteListerAddress;

    address public rewardsUpdaterAddress;

    struct WalletData {
        uint256 hyaxHoldingAmount;                  // Current amount of HYAX tokens held by the wallet
        uint256 hyaxHoldingAmountAtWhitelistTime;   // Amount of HYAX tokens held when the wallet was whitelisted. Useful for the team wallets

        uint256 totalHyaxRewardsAmount;             // Total amount of HYAX rewards earned by the wallet
        uint256 currentRewardsAmount;               // Current amount of rewards available for withdrawal
        uint256 rewardsWithdrawn;                   // Total amount of rewards withdrawn by the wallet
        
        uint256 addedToWhitelistTime;               // Timestamp when the wallet was added to the whitelist
        uint8 teamTokenWithdrawalTimes;            // Times that there have been a team token withdrawal
        uint256 lastRewardsWithdrawalTime;          // Timestamp of the last rewards withdrawal
        uint256 lastRewardsUpdateTime;              // Timestamp of the last rewards update

        bool isTeamWallet;                          // Flag indicating if this is a team wallet
        bool isWhitelisted;                         // Flag indicating if the wallet is whitelisted
        bool isBlacklisted;                         // Flag indicating if the wallet is blacklisted
    }
    
    uint8 public maximumBatchSizeForUpdateRewards;
    
    mapping(address => WalletData) public wallets;

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

        // Set the initial maximum batch size for update rewards
        maximumBatchSizeForUpdateRewards = 100;

        //Validate that the hyax token is valid based on the symbol
        require(keccak256(abi.encodePacked(hyaxToken.symbol())) == keccak256(abi.encodePacked("HYAX"))  , "Hyax token address is not valid");
        
        // Set the initial rewards amounts to 0
        growthTokensFunded = 0;
        teamTokensFunded = 0;
        rewardTokensFunded = 0;
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////
    /**
     * @notice Adds a wallet to the whitelist
     * @dev This function allows the owner or the whitelister address to add a wallet to the whitelist
     * @param _walletAddress The address of the wallet to be added to the whitelist
     * @param _isTeamWallet A boolean indicating if the wallet is a team wallet
     */
    function addWalletToWhitelist(address _walletAddress, bool _isTeamWallet, uint256 _hyaxHoldingAmountAtWhitelistTime) onlyAdminOrWhitelister public {

        //Verify that the wallet is not already in the whitelist
        require(wallets[_walletAddress].isWhitelisted == false, "Wallet is already whitelisted");

        //Verify that the wallet is not in a blacklist
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");

        //Verify that the wallet has not been added to the whitelist
        require(wallets[_walletAddress].addedToWhitelistTime == 0, "Wallet has already been added to the whitelist");
        
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

        if(_isTeamWallet){
            require(_hyaxHoldingAmountAtWhitelistTime > 0, "Team wallets must be added with a hyax holding amount greater than 0");
            require(_hyaxHoldingAmountAtWhitelistTime <= TEAM_TOKENS_TOTAL, "Team wallets must be added with a hyax holding amount less than the total team tokens");
            wallets[_walletAddress].hyaxHoldingAmountAtWhitelistTime = _hyaxHoldingAmountAtWhitelistTime; // Set the wallet's HYAX holding amount
            wallets[_walletAddress].hyaxHoldingAmount = _hyaxHoldingAmountAtWhitelistTime; // Set the wallet's HYAX holding amount
        }
        else {
            require(_hyaxHoldingAmountAtWhitelistTime == 0, "Non team wallets can only be added with holding amount equal to 0");
            wallets[_walletAddress].hyaxHoldingAmountAtWhitelistTime = 0; // Set the wallet's HYAX holding amount
            wallets[_walletAddress].hyaxHoldingAmount = 0; // Set the wallet's HYAX holding amount
        }

        //Emit an event to notify that the wallet was added to the whitelist
        emit WalletAddedToWhitelist(msg.sender, _walletAddress, _isTeamWallet, _hyaxHoldingAmountAtWhitelistTime);
    }
    
    /**
     * @notice Updates the status of a wallet in the whitelist
     * @dev This function allows the owner or the whitelister address to update the status of a wallet in the whitelist
     * @param _walletAddress The address of the wallet to be updated
     */ 
    function updateWhitelistStatus(address _walletAddress, bool _newStatus) onlyAdminOrWhitelister public {
        
        //Verify that the wallet is currently in a different status
        require(wallets[_walletAddress].isWhitelisted != _newStatus, "Wallet has already been updated to that status");

        //Verify that the wallet has been added to the whitelist
        require(wallets[_walletAddress].addedToWhitelistTime != 0, "Wallet has not been added to the whitelist");

        //Update the whitelist status
        wallets[_walletAddress].isWhitelisted = _newStatus; 

        //Emit an event to notify that the wallet whitelist status has been updated
        emit WhitelistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }

    /**
     * @notice Updates the status of a wallet in the blacklist
     * @dev This function allows the owner or the whitelister address to update the status of a wallet in the blacklist
     * @param _walletAddress The address of the wallet to be updated
     */ 
    function updateBlacklistStatus(address _walletAddress, bool _newStatus) onlyAdminOrWhitelister public {
        
        //Verify that the wallet is currently in a different status
        require(wallets[_walletAddress].isBlacklisted != _newStatus, "Wallet has already been updated to that status");
    
        //Update the blacklist status
        wallets[_walletAddress].isBlacklisted = _newStatus; 

        //Emit an event to notify that the wallet blacklisted status has been updated
        emit BlacklistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }

    /**
     * @notice Funds the smart contract with tokens for different purposes
     * @dev This function can only be called by the contract owner
     * @param _fundingType The type of funding (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens to fund
     * @custom:events Emits a FundingAdded event upon successful funding
     */
    function fundSmartContract(FundingType _fundingType, uint256 _amount) onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() isNotPaused() public {

        // Check if the funding type is valid
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamTokens || _fundingType == FundingType.RewardTokens, "Invalid funding type");

        // Verify that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer the specified token to this contract
        require(hyaxToken.transferFrom(msg.sender, address(this), _amount), "There was an error on receiving the token funding");

        // Add the amount to the corresponding token
        if (_fundingType == FundingType.GrowthTokens) {
            //Require that the amount is less than the total growth tokens
            require(growthTokensFunded + _amount <= GROWTH_TOKENS_TOTAL, "Amount to fund is greater than the total intented for growth tokens");

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
            require(teamTokensFunded + _amount <= TEAM_TOKENS_TOTAL, "Amount to fund is greater than the total intented for team tokens");
            
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
            require(rewardTokensFunded + _amount <= REWARD_TOKENS_TOTAL, "Amount to fund is greater than the total intented for reward tokens");

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

    modifier onlyAdminOrWhitelister {
        // Ensure that the sender is the owner or the whitelister address
        require(hasRole(WHITELISTER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender)  , "Function reserved only for the whitelister or the owner");
        
        // Emit an event to log the sender and origin of the transaction
        emit LogSenderAndOrigin(msg.sender, tx.origin);
        _;
    }

    modifier onlyAdminOrRewardsUpdater {
        // Ensure that the sender is the owner, the rewards updater address or the contract itself
        require(hasRole(REWARDS_UPDATER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || msg.sender == address(this), "Function reserved only for the rewards updater, the owner, or the contract itself");
        
        // Emit an event to log the sender and origin of the transaction
        emit LogSenderAndOrigin(msg.sender, tx.origin);
        _;
    }

    modifier isWhitelisted(address _walletAddress) {
        // Ensure that the sender is the owner or the white lister address
        require(wallets[_walletAddress].isWhitelisted == true, "Wallet is not whitelisted");
        _;
    }

    modifier isNotBlacklisted(address _walletAddress) {
        // Ensure that the sender is the owner or the white lister address
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");
        _;
    }

    modifier isNotPaused() {
        // Ensure that the smart contract is not paused
        require(paused() == false, "Contract is paused");
        _;
    }
    
    /////////////GROWTH TOKENS FUNCTIONS///////////
    /**
     * @notice Allows the owner to withdraw growth tokens
     * @dev This function can only be called by the contract owner
     * @dev Withdrawals are limited to once per year and a fixed amount per withdrawal
     * @dev The function checks various conditions before allowing the withdrawal
     * @custom:requirements Funding must have started
     * @custom:requirements At least one year must have passed since funding start
     * @custom:requirements Not all growth tokens have been withdrawn
     * @custom:requirements At least one year has passed since the last withdrawal
     * @custom:events Emits a GrowthTokensWithdrawn event upon successful withdrawal
     */
    function withdrawGrowthTokens() onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() isNotPaused() public {

        // Check if growth tokens funding has started
        require(growthTokensFundingStarted, "Growth tokens funding has not started yet, no tokens to withdraw");
        
        // Ensure that at least one year has passed since the funding start time
        require(block.timestamp >= growthTokensStartFundingTime + TOKENS_WITHDRAWAL_PERIOD , "Cannot withdraw before 1 year after funding start");
        
        // Verify that not all growth tokens have been withdrawn yet
        require(growthTokensWithdrawn < GROWTH_TOKENS_TOTAL, "All growth tokens have been withdrawn");
        
        // Ensure that at least one year has passed since the last withdrawal
        require(block.timestamp >= growthTokensLastWithdrawalTime + TOKENS_WITHDRAWAL_PERIOD, "Can only withdraw once per year");
        
        // Set the initial withdrawable amount to the yearly withdrawal limit
        uint256 withdrawableAmount = GROWTH_TOKENS_WITHDRAWAL_PER_YEAR;
        
        // Check if withdrawing the full yearly amount would exceed the total growth tokens
        if (growthTokensWithdrawn + withdrawableAmount > GROWTH_TOKENS_TOTAL) {
            // If so, adjust the withdrawable amount to the remaining balance
            withdrawableAmount = GROWTH_TOKENS_TOTAL - growthTokensWithdrawn;
        }
        // Update the growth tokens withdrawn amount
        growthTokensWithdrawn += withdrawableAmount;

        // Update the growth tokens in the smart contract
        growthTokensInSmartContract -= withdrawableAmount;

        // Update the last withdrawal time
        growthTokensLastWithdrawalTime = block.timestamp;

        // Transfer the calculated amount to the owner
        require(hyaxToken.transfer(owner(), withdrawableAmount), "Failed to transfer growth tokens");

        // Emit an event to notify that the growth tokens were withdrawn    
        emit GrowthTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /////////////TEAM TOKENS FUNCTIONS///////////

    /**
     * @notice Allows team members to withdraw their allocated tokens
     * @dev This function can only be called by whitelisted team wallets
     * @dev Withdrawals are limited to once per year and a fixed amount per withdrawal
     * @dev The function checks various conditions before allowing the withdrawal
     * @custom:requirements Caller must be a whitelisted team wallet
     * @custom:requirements Team tokens funding must have started
     * @custom:requirements At least four years must have passed since the wallet was added to the whitelist
     * @custom:requirements At least one year must have passed since the last withdrawal
     * @custom:requirements Not all team tokens have been withdrawn
     * @custom:requirements The wallet must have a positive HYAX holding amount
     * @custom:events Emits a TeamTokensWithdrawn event upon successful withdrawal
     */
    function withdrawTeamTokens() isWhitelisted(msg.sender) isNotBlacklisted(msg.sender) nonReentrant() isNotPaused() public {

        // Check if the sender is a team wallet
        require(wallets[msg.sender].isTeamWallet == true, "Only team wallets can withdraw tokens using this function");

        // Check if team tokens funding has started
        require(teamTokensFundingStarted, "Team tokens funding has not started yet, no tokens to withdraw");
        
        // Ensure that at least four years have passed since the team wallet was added to the whitelist
        require(block.timestamp >= wallets[msg.sender].addedToWhitelistTime + TEAM_TOKENS_LOCKED_PERIOD , "Cannot withdraw before 4 years after being added to the whitelist");
        
        // Verify that not all team tokens have been withdrawn yet
        require(teamTokensWithdrawn < TEAM_TOKENS_TOTAL, "All team tokens have been withdrawn");
        
        // Verify that the wallet has a hyax holding amount as team tokens greater than 0 to withdraw
        require(wallets[msg.sender].hyaxHoldingAmount > 0, "No hyax holding amount to withdraw");

        // Ensure that the number of token withdrawal times is greater than or equal to the calculated year for team tokens
        require(wallets[msg.sender].teamTokenWithdrawalTimes <  calculateYearForTeamTokens(), "Can only withdraw team tokens once per year");

        // Set the initial withdrawable amount to the limit per year (20% of the hyax holding amount at whitelist time) 
        uint256 withdrawableAmount = wallets[msg.sender].hyaxHoldingAmountAtWhitelistTime / 5;
        
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
        wallets[msg.sender].teamTokenWithdrawalTimes ++;
    
        // Transfer the calculated amount to the wallet
        require(hyaxToken.transfer(msg.sender, withdrawableAmount), "Failed to transfer team tokens");

        // Emit an event to notify that the team tokens were withdrawn    
        emit TeamTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /**
     * @notice Calculates the year for team tokens based on the funding start time
     * @dev This function calculates the year for team tokens based on the funding start time
     * @return The year for team tokens as a uint8
     */
    function calculateYearForTeamTokens() public view returns (uint8)  {

        // Check if team tokens funding has started
        require(teamTokensFundingStarted, "Team tokens funding has not started yet");

        uint256 timeElapsed = block.timestamp - teamTokensStartFundingTime;

        if (timeElapsed >= 8 * 365 days) { //After 8 years elapsed since funding you get into year 8 to withdraw
            return 5;
        } else if (timeElapsed >= 7 * 365 days) { //After 7 years elapsed since funding you get into year 4 to withdraw
            return 4;
        } else if (timeElapsed >= 6 * 365 days) { //After 6 years elapsed since funding you get into year 3 to withdraw
            return 3;
        } else if (timeElapsed >= 5 * 365 days) { //After 5 years elapsed since funding you get into year 2 to withdraw
            return 2;
        } else if (timeElapsed >= 4 * 365 days) { //After 4 years elapsed since funding you get into year 1 to withdraw
            return 1;
        } else {
            return 0;
        }
    }
    
    /////////////REWARD TOKENS FUNCTIONS///////////

    /**
     * @notice Updates the rewards for a batch of wallets
     * @dev This function updates the rewards for a list of wallets in a single transaction.
     * @param _walletAddresses The list of wallet addresses to update rewards for.
     * @param _hyaxRewards The list of HYAX rewards to be updated for each wallet.
     */
    function updateRewardsBatch(address[] calldata _walletAddresses, uint256[] calldata _hyaxRewards) public onlyAdminOrRewardsUpdater nonReentrant {
        
        // Check if rewards funding has started
        require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to update");

        // Validate the batch size limit in the lower limit
        require(_walletAddresses.length > 0, "Batch size cannot be 0");
    
        // Validate the batch size limit in the upper limit
        require(_walletAddresses.length <= maximumBatchSizeForUpdateRewards, "Batch size exceeds the defined limit");
        
        // Validate the length of the arrays
        require(_walletAddresses.length == _hyaxRewards.length, "Array lengths must match");

        // Iterate through the list of wallets
        for (uint256 i = 0; i < _walletAddresses.length; i++) {

            //Try to update the rewards for the current wallet address
            try this.updateRewardsSingle(_walletAddresses[i], _hyaxRewards[i]) {

            } catch Error(string memory _errorMessage) {
                emit RewardUpdateFailed(msg.sender, _walletAddresses[i], _errorMessage);
            }
        }

        emit RewardUpdateBatchSent(msg.sender, _walletAddresses, _hyaxRewards);
    }

    /**
     * @notice Updates the rewards for a single wallet internally
     * @dev This function updates the rewards for a single wallet address internally.
     * @param _walletAddress The address of the wallet to update rewards for.
     * @param _hyaxRewards The amount of HYAX rewards to update for the wallet.
     */
     function updateRewardsSingle(address _walletAddress, uint256 _hyaxRewards) public onlyAdminOrRewardsUpdater {
        
        // Check if rewards funding has started
        require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to update");

        // Validate that the wallet is whitelisted
        require(wallets[_walletAddress].isWhitelisted == true, "Wallet is not whitelisted");

        // Validate that the wallet is not blacklisted
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");
    
        //Timestamp validation
        require(block.timestamp >= wallets[_walletAddress].lastRewardsUpdateTime + MIN_INTERVAL_FOR_UPDATE_REWARDS, "Too soon to update rewards for this wallet");

        // Ensure rewards don't exceed the weekly withdrawal limit
        require(_hyaxRewards <= REWARD_TOKENS_PER_WEEK, "A single wallet cannot have rewards higher than the weekly limit");

        // Check if there are sufficient tokens in the contract to distribute as rewards
        require(_hyaxRewards <= rewardTokensInSmartContract, "Insufficient reward tokens to distribute as rewards");

        //Check that the token rewards already distributed is not higher than the total rewards that should be distributed
        require(rewardTokensDistributed + _hyaxRewards <= REWARD_TOKENS_TOTAL, "All the reward tokens have been already distributed");

        // Update the total rewards distributed
        rewardTokensDistributed += _hyaxRewards;

        // Update the last rewards update time
        wallets[_walletAddress].lastRewardsUpdateTime = block.timestamp;

        // Update the total rewards for the wallet
        wallets[_walletAddress].totalHyaxRewardsAmount += _hyaxRewards;
    
        // Update the current rewards amount for the wallet
        wallets[_walletAddress].currentRewardsAmount += _hyaxRewards;

        // Emit an event to notify that the rewards were updated successfully
        emit RewardUpdateSuccess(msg.sender, _walletAddress, _hyaxRewards);
    }
    
    /*
     * @notice Allows whitelisted holders to withdraw their accumulated rewards
     * @dev This function is restricted to whitelisted addresses and implements a nonReentrant guard
     * @dev Rewards can be withdrawn instantly once they are distributed
     * @dev The function checks for various conditions before allowing withdrawal
     * @dev Upon successful withdrawal, it updates relevant state variables and transfers tokens
     * @return None
     */
    function withdrawRewardTokens() isWhitelisted(msg.sender) nonReentrant() isNotPaused() public {

        //Check if the wallet is whitelisted
        require(wallets[msg.sender].isWhitelisted == true, "Wallet is not whitelisted");

        // Validate that the wallet is not blacklisted
        require(wallets[msg.sender].isBlacklisted == false, "Wallet has been blacklisted");

        // Check if rewards funding has started
        require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to withdraw");
        
        // Verify that not all reward tokens have been withdrawn yet
        require(rewardTokensWithdrawn < REWARD_TOKENS_TOTAL, "All reward tokens have been withdrawn");
        
        // Verify that the wallet has rewards to withdraw
        uint256 withdrawableAmount = wallets[msg.sender].currentRewardsAmount;

        // Validate that the wallet has rewards to withdraw
        require(withdrawableAmount > 0, "No rewards available to withdraw");
        
        // Verify that there are sufficient tokens in the contract to withdraw
        require(withdrawableAmount <= rewardTokensInSmartContract, "Insufficient reward tokens in the contract to withdraw");

        // Update the rewards withdrawn amount
        wallets[msg.sender].rewardsWithdrawn += withdrawableAmount;

        // Reset the current rewards amount
        wallets[msg.sender].currentRewardsAmount = 0;

        // Update the last rewards withdrawal time
        wallets[msg.sender].lastRewardsWithdrawalTime = block.timestamp;

        // Update the reward tokens in the smart contract
        rewardTokensInSmartContract -= withdrawableAmount;

        // Update the total reward tokens withdrawn
        rewardTokensWithdrawn += withdrawableAmount;

        // Transfer the calculated amount to the wallet
        bool transferSuccess = hyaxToken.transfer(msg.sender, withdrawableAmount);
        require(transferSuccess, "Failed to transfer reward tokens");

        // Emit an event to notify that the reward tokens were withdrawn
        emit RewardTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /////////////SMART CONTRACT MANAGEMENT FUNCTIONS///////////
    /**
     * @notice Allows the owner to withdraw tokens to be burned
     * @dev This function can only be called by the owner
     * @param _fundingType The type of funding to withdraw from
     * @param _amount The amount of tokens to withdraw
     * @custom:requirements Funding must have started
     * @custom:requirements Amount must be greater than 0
     */

    function withdrawTokensToBurn(FundingType _fundingType, uint256 _amount) onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() isNotPaused() public {

        // Check if the funding type is valid
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamTokens || _fundingType == FundingType.RewardTokens, "Invalid funding type");

        // Verify that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");
        
        // Check the funding type and perform the necessary actions
        if(_fundingType == FundingType.GrowthTokens){
            // Ensure that growth tokens funding has started
            require(growthTokensFundingStarted, "Growth tokens funding has not started yet, no tokens to withdraw");
            // Verify that there are sufficient growth tokens in the contract to withdraw
            require(_amount <= growthTokensInSmartContract, "Insufficient growth tokens in the contract to withdraw");
            // Update the growth tokens in the smart contract
            growthTokensInSmartContract -= _amount;
        }
        else if(_fundingType == FundingType.TeamTokens){
            // Ensure that team tokens funding has started
            require(teamTokensFundingStarted, "Team tokens funding has not started yet, no tokens to withdraw");
            // Verify that there are sufficient team tokens in the contract to withdraw
            require(_amount <= teamTokensInSmartContract, "Insufficient team tokens in the contract to withdraw");
            // Update the team tokens in the smart contract
            teamTokensInSmartContract -= _amount;

        }
        else if(_fundingType == FundingType.RewardTokens){
            // Ensure that reward tokens funding has started
            require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to withdraw");
            // Verify that there are sufficient reward tokens in the contract to withdraw
            require(_amount <= rewardTokensInSmartContract, "Insufficient reward tokens in the contract to withdraw");
            // Update the reward tokens in the smart contract
            rewardTokensInSmartContract -= _amount;
        }
        
        // Transfer the calculated amount to the owner
        require(hyaxToken.transfer(owner(), _amount), "Failed to transfer growth tokens");

        // Emit an event to notify that the growth tokens were withdrawn    
        emit TokensToBurnWithdrawn(_fundingType, _amount);
    }

    function updateTeamMemberWallet(address _oldTeamMemberWalletAddress, address _newTeamMemberWalletAddress) onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() public {
        // Ensure that team tokens funding has started
        require(teamTokensFundingStarted, "Team tokens funding has not started yet, no tokens to recover");

        // Validate that the old team member wallet address is a team wallet
        require(wallets[_oldTeamMemberWalletAddress].isTeamWallet == true, "Old wallet address is not a team wallet");

        // Validate that the old team member wallet address is whitelisted
        require(wallets[_oldTeamMemberWalletAddress].isWhitelisted == true, "Old team member wallet address is not whitelisted");

        // Validate that the old team member wallet address is not blacklisted
        require(wallets[_oldTeamMemberWalletAddress].isBlacklisted == false, "Old team member wallet address is blacklisted");

        // Validate that the new team member wallet address is not the zero address
        require(_newTeamMemberWalletAddress != address(0), "New team member wallet address cannot be the zero address");

        // Validate that the new team member wallet address is not the same as the old team member wallet address
        require(_newTeamMemberWalletAddress != _oldTeamMemberWalletAddress, "New team member wallet address cannot be the same as the old team member wallet address");

        //Validate that the new team member wallet address is not already whitelisted
        require(wallets[_newTeamMemberWalletAddress].isWhitelisted == false, "New team member wallet address is already whitelisted");

        //Validate that the new team member wallet address is not already a team wallet
        require(wallets[_newTeamMemberWalletAddress].isTeamWallet == false, "New team member wallet address is already a team wallet");

        //Validate that the new team member wallet address is not already blacklisted
        require(wallets[_newTeamMemberWalletAddress].isBlacklisted == false, "New team member wallet address is blacklisted");

        //In case it passes all validations, register the new team member wallet address
        wallets[_newTeamMemberWalletAddress].isWhitelisted = true;
        wallets[_newTeamMemberWalletAddress].isTeamWallet = true;
        wallets[_newTeamMemberWalletAddress].isBlacklisted = false;
        
        //Do the transfer of the previous values to the new team member wallet address
        wallets[_newTeamMemberWalletAddress].hyaxHoldingAmountAtWhitelistTime = wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmountAtWhitelistTime;
        wallets[_newTeamMemberWalletAddress].hyaxHoldingAmount = wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmount;
                wallets[_newTeamMemberWalletAddress].addedToWhitelistTime = wallets[_oldTeamMemberWalletAddress].addedToWhitelistTime;
        wallets[_newTeamMemberWalletAddress].teamTokenWithdrawalTimes = wallets[_oldTeamMemberWalletAddress].teamTokenWithdrawalTimes;

        //Remove the old team member wallet address from the lists
        wallets[_oldTeamMemberWalletAddress].isWhitelisted = false;
        wallets[_oldTeamMemberWalletAddress].isTeamWallet = false;
        wallets[_oldTeamMemberWalletAddress].isBlacklisted = true;
        
        //Update values of the old team member wallet address to 0 
        wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmountAtWhitelistTime = 0;
        wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmount = 0; 
        wallets[_oldTeamMemberWalletAddress].teamTokenWithdrawalTimes = 0;
        
        //Emit an event to notify that the team tokens were recovered
        emit TeamMemberWalletUpdated(_oldTeamMemberWalletAddress, _newTeamMemberWalletAddress,
            wallets[_newTeamMemberWalletAddress].hyaxHoldingAmount);
    }
    
    /**
     * @notice Updates the white lister address
     * @dev This function can only be called by the admin
     * @param _whiteListerAddress The address of the new white lister
     */
    function updateWhiteListerAddress(address _whiteListerAddress) onlyRole(DEFAULT_ADMIN_ROLE) public {
        // Validate that the white lister address is not the zero address
        require(_whiteListerAddress != address(0), "White lister address cannot be the zero address");

        //Revoke role to the previous white lister address
        revokeRole(WHITELISTER_ROLE, whiteListerAddress);

        //Grant the role to the new white lister address
        grantRole(WHITELISTER_ROLE, _whiteListerAddress);

        // Update the white lister address
        whiteListerAddress = _whiteListerAddress;

        emit WhiteListerAddressUpdated(_whiteListerAddress);
    }

    /**
     * @notice Updates the rewards updater address
     * @dev This function can only be called by the admin
     * @param _rewardsUpdaterAddress The address of the new rewards updater
     */
    function updateRewardsUpdaterAddress(address _rewardsUpdaterAddress) onlyRole(DEFAULT_ADMIN_ROLE) public {
        // Validate that the rewards updater address is not the zero address
        require(_rewardsUpdaterAddress != address(0), "Rewards updater address cannot be the zero address");

        //Revoke role to the previous rewards updater address
        revokeRole(REWARDS_UPDATER_ROLE, rewardsUpdaterAddress);

        //Grant the role to the new rewards updater address
        grantRole(REWARDS_UPDATER_ROLE, _rewardsUpdaterAddress);

        // Update the rewards updater address
        rewardsUpdaterAddress = _rewardsUpdaterAddress;

        emit RewardsUpdaterAddressUpdated(_rewardsUpdaterAddress);
    }

    /**
     * @notice Updates the hyax token address
     * @dev This function can only be called by the admin
     * @param _hyaxTokenAddress The address of the new hyax token
     */
    function updateHyaxTokenAddress(address _hyaxTokenAddress) onlyRole(DEFAULT_ADMIN_ROLE) public {
        require(_hyaxTokenAddress != address(0), "Hyax token address cannot be the zero address");

        // Validate that the token is a valid HYAX token
        IHyaxToken newHyaxToken = IHyaxToken(_hyaxTokenAddress);

        // Validate that the token is a valid HYAX token    
        require(keccak256(abi.encodePacked(newHyaxToken.symbol())) == keccak256(abi.encodePacked("HYAX")), 
            "Token address must be a valid HYAX token address");

        // Update the hyax token address
        hyaxTokenAddress = _hyaxTokenAddress;

        // Update the hyax token
        hyaxToken = IHyaxToken(hyaxTokenAddress);

        emit HyaxTokenAddressUpdated(_hyaxTokenAddress);
    }

    /**
     * @notice Updates the maximum batch size for update rewards
     * @dev This function can only be called by the admin
     * @param _maximumBatchSizeForUpdateRewards The maximum batch size for update rewards
     */
    function updateMaximumBatchSizeForUpdateRewards(uint8 _maximumBatchSizeForUpdateRewards) onlyRole(DEFAULT_ADMIN_ROLE) public {
        // Validate that the maximum batch size is greater than 0
        require(_maximumBatchSizeForUpdateRewards > 0, "Maximum batch size cannot be 0");

        // Validate that the maximum batch size does not exceed 100
        require(_maximumBatchSizeForUpdateRewards <= 100, "Maximum batch size cannot be greater than 100");
        
        // Update the maximum batch size for update rewards
        maximumBatchSizeForUpdateRewards = _maximumBatchSizeForUpdateRewards;

        emit MaximumBatchSizeForUpdateRewardsUpdated(_maximumBatchSizeForUpdateRewards);
    }
    

    /**
     * @notice Returns the owner of the contract
     * @dev This function can only be called by the owner
     * @return The address of the owner
     */
    function owner() public view returns (address) {
    // Returns the first account with the DEFAULT_ADMIN_ROLE
        return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    }

     /**
     * @dev Pauses all functionalities of the contract.
     * Can only be called by the admin.
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all functionalities of the contract.
     * Can only be called by the owner.
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current admin.
     * @param newOwner The address of the new admin.
     */
    function transferOwnership(address newOwner) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {

        //Validate the new owner is not the zero address
        require(newOwner != address(0), "Ownable: new owner is the zero address");

        //Validate the new owner is not the same contract address, otherwise management of the smart contract will be lost
        require(newOwner != address(this), "Ownable: new owner cannot be the same contract address");
        
        // Grant the role to the new owner
        grantRole(DEFAULT_ADMIN_ROLE, newOwner);

        // Revoke the role from the current owner
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Returns a string indicating a new function.
     * @return A string indicating a new function.
     */
    function newFunction() public pure returns (string memory) {
        return "New function in V2";
    }
}