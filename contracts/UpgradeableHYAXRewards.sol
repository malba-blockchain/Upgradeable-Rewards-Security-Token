// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

 /**
 * @title ERC20TokenInterface
 * @dev Interface for interacting with the different tokens: USDC, USDT, WBTC and WETH
 */
interface ERC20TokenInterface {
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function balanceOf(address guy) external view returns (uint);
    function symbol() external view returns (string memory);
}

contract UpgradeableHYAXRewards is Ownable, Pausable, ReentrancyGuard {

    ////////////////// SMART CONTRACT EVENTS //////////////////

    /**
     * @dev Emitted when funding is added to the contract
     * @param _fundingType The type of funding added (GrowthTokens, TeamTokens, or HolderRewards)
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
     * @dev Emitted when holder rewards are withdrawn
     * @param _walletAddress The address of the wallet that withdrew the rewards
     * @param _amount The amount of rewards withdrawn
     */
    event HolderRewardsWithdrawn(address _walletAddress, uint256 _amount);

    /**
     * @dev Emitted when tokens are withdrawn to be burned
     * @param _fundingType The type of funding (GrowthTokens, TeamTokens, or HolderRewards)
     * @param _amount The amount of tokens withdrawn to be burned
     */
    event TokensToBurnWithdrawn(FundingType _fundingType, uint256 _amount);

    /**
     * @dev Emitted when a wallet is added to the whitelist
     * @param _sender The address that added the wallet to the whitelist
     * @param _walletAddress The address of the wallet added to the whitelist
     * @param _isTeamWallet Boolean indicating if the wallet is a team wallet
     * @param _bitcoinRewardsAddress The Bitcoin address for rewards
     * @param _hyaxHoldingAmount The amount of HYAX tokens held by the wallet
     */
    event WalletAddedToWhitelist(address _sender, address _walletAddress, bool _isTeamWallet, string _bitcoinRewardsAddress, uint256 _hyaxHoldingAmount);

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
     * @dev Emitted when rewards are updated for multiple wallets
     * @param _sender The address that updated the rewards
     * @param _walletAddresses An array of wallet addresses that had their rewards updated
     * @param _hyaxHoldingAmounts An array of the updated HYAX holding amounts for each wallet
     */
    event RewardsUpdated(address _sender, address[] _walletAddresses, uint256[] _hyaxHoldingAmounts);

    /**
     * @dev Emitted when a reward update fails for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update failed
     * @param _errorMessage A string describing the reason for the failure
     */
    event RewardUpdateFailed(address _sender, address _walletAddress, string _errorMessage);

    ////////////////// SMART CONTRACT VARIABLES //////////////////

    address public hyaxTokenAddress;

    ERC20TokenInterface public hyaxToken;

    enum FundingType {GrowthTokens, TeamTokens, HolderRewards}


    ////////////////// GROWTH TOKENS VARIABLES //////////////////

    uint256 public constant GROWTH_TOKENS_TOTAL = 2400000000 * 10**18; // Total of 2.4 Billion growth tokens
    
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

    uint256 public teamTokensLastWithdrawalTime; // Timestamp of the last team tokens withdrawal

    uint256 public teamTokensStartFundingTime; // Timestamp when team tokens funding started

    bool public teamTokensFundingStarted; // Flag to indicate if team tokens funding has begun


    ////////////////// HOLDERS REWARDS VARIABLES //////////////////

    uint256 public constant REWARD_TOKENS_TOTAL = 1200000000 * 10**18; // Total of 1.2 Billion as reward tokens
    
    uint256 public constant REWARD_TOKENS_WITHDRAWAL_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

    uint256 public constant REWARD_TOKENS_WITHDRAWAL_PER_WEEK =  REWARD_TOKENS_WITHDRAWAL_PER_YEAR / 52; // 150 Million tokens divided by 52 weeks

    uint256 public constant REWARD_TOKENS_HOLDING_PERIOD = 7 days; // 7 days

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
        
        string bitcoinRewardsAddress;               // Bitcoin address for receiving rewards

        uint256 addedToWhitelistTime;               // Timestamp when the wallet was added to the whitelist
        uint8 tokenWithdrawalTimes;                  // Times that there have been a token withdrawal
        uint256 lastRewardsWithdrawalTime;          // Timestamp of the last rewards withdrawal
        uint256 lastRewardsUpdateTime;            // Timestamp of the last rewards update

        bool isTeamWallet;                          // Flag indicating if this is a team wallet
        bool isWhitelisted;                         // Flag indicating if the wallet is whitelisted
        bool isBlacklisted;                         // Flag indicating if the wallet is blacklisted
    }

    uint256 public constant MAX_BATCH_SIZE_FOR_UPDATE_REWARDS = 100;
    
    uint256 public constant MIN_INTERVAL_FOR_UPDATE_REWARDS = 7 days;

    mapping(address => WalletData) public wallets;

    ////////////////// SMART CONTRACT CONSTRUCTOR /////////////////
    constructor(address _hyaxTokenAddress) Ownable (msg.sender)  {

        // Make the deployer of the contract the administrator
        hyaxTokenAddress = _hyaxTokenAddress;
        hyaxToken = ERC20TokenInterface(hyaxTokenAddress);

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
     * @param _bitcoinRewardsAddress The Bitcoin rewards address associated with the wallet
     */
    function addWalletToWhitelist(address _walletAddress, bool _isTeamWallet, string memory _bitcoinRewardsAddress, uint256 _hyaxHoldingAmountAtWhitelistTime) onlyOwnerOrWhitelister public {

        //Verify that the wallet is not already in the whitelist
        require(wallets[_walletAddress].isWhitelisted == false, "Wallet is already whitelisted");

        //Verify that the wallet is not in a blacklist
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");
        
        //Add the wallet to the whitelist with the provided parameters
        wallets[_walletAddress].isWhitelisted = true; // Mark the wallet as whitelisted
        wallets[_walletAddress].isBlacklisted = false; // Mark the wallet as not blacklisted
        wallets[_walletAddress].isTeamWallet = _isTeamWallet; // Set whether this is a team wallet or not
        wallets[_walletAddress].bitcoinRewardsAddress = _bitcoinRewardsAddress; // Store the Bitcoin address for rewards

        wallets[_walletAddress].addedToWhitelistTime = block.timestamp; // Set the time when the wallet was added to the whitelist
        
        wallets[_walletAddress].tokenWithdrawalTimes = 0; // Initialize the token withdrawal times to zero
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

        //Emit an event to notify that the wallet was added to the whitelist
        emit WalletAddedToWhitelist(msg.sender, _walletAddress, _isTeamWallet, _bitcoinRewardsAddress, _hyaxHoldingAmountAtWhitelistTime);
    }

    /**
     * @notice Updates the status of a wallet in the whitelist
     * @dev This function allows the owner or the whitelister address to update the status of a wallet in the whitelist
     * @param _walletAddress The address of the wallet to be updated
     */ 
    function updateWhitelistStatus(address _walletAddress, bool _newStatus) onlyOwnerOrWhitelister public {
        
        //Verify that the wallet is in the whitelist
        require(wallets[_walletAddress].isWhitelisted != _newStatus, "Wallet already has that status");

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
    function updateBlacklistStatus(address _walletAddress, bool _newStatus) onlyOwnerOrWhitelister public {
        
        //Verify that the wallet is in the blacklist
        require(wallets[_walletAddress].isBlacklisted != _newStatus, "Wallet already has that status");

        //Update the blacklist status
        wallets[_walletAddress].isBlacklisted = _newStatus; 

        //Emit an event to notify that the wallet blacklisted status has been updated
        emit BlacklistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }


    /**
     * @notice Funds the smart contract with tokens for different purposes
     * @dev This function can only be called by the contract owner
     * @param _fundingType The type of funding (GrowthTokens, TeamTokens, or HolderRewards)
     * @param _amount The amount of tokens to fund
     * @custom:events Emits a FundingAdded event upon successful funding
     */
    function fundSmartContract(FundingType _fundingType, uint256 _amount) onlyOwner() nonReentrant() public {

        // Check if the funding type is valid
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamTokens || _fundingType == FundingType.HolderRewards, "Invalid funding type");

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

        } else if (_fundingType == FundingType.HolderRewards) {
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

    modifier onlyOwnerOrWhitelister {
        // Ensure that the sender is the owner or the whitelister address
        require(msg.sender == owner() || msg.sender == whiteListerAddress, "Function reserved only for the whitelister or the owner");
        _;
    }

    modifier onlyOwnerOrRewardsUpdater{
        // Ensure that the sender is the owner or the rewards updater address
        require(msg.sender == owner() || msg.sender == rewardsUpdaterAddress, "Function reserved only for the rewards updater or the owner");
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
    function withdrawGrowthTokens() onlyOwner() nonReentrant() public {

        // Check if growth tokens funding has started
        require(growthTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
        
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
    function withdrawTeamTokens() isWhitelisted(msg.sender) isNotBlacklisted(msg.sender) nonReentrant() public {

        // Check if the sender is a team wallet
        require(wallets[msg.sender].isTeamWallet == true, "Only team wallets can withdraw tokens using this function");

        // Check if team tokens funding has started
        require(teamTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
        
        // Ensure that at least four years have passed since the team wallet was added to the whitelist
        require(block.timestamp >= wallets[msg.sender].addedToWhitelistTime + TEAM_TOKENS_LOCKED_PERIOD , "Cannot withdraw before 4 years after being added to the whitelist");
        
        // Verify that not all team tokens have been withdrawn yet
        require(teamTokensWithdrawn < TEAM_TOKENS_TOTAL, "All team tokens have been withdrawn");
        
        // Verify that the wallet has a hyax holding amount as team tokens greater than 0 to withdraw
        require(wallets[msg.sender].hyaxHoldingAmount > 0, "No hyax holding amount to withdraw");

        // Ensure that the number of token withdrawal times is greater than or equal to the calculated year for team tokens
        require(wallets[msg.sender].tokenWithdrawalTimes <  calculateYearForTeamTokens(), "Can only withdraw team tokens once per year");

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
        wallets[msg.sender].tokenWithdrawalTimes ++;
    
        // Transfer the calculated amount to the wallet
        require(hyaxToken.transfer(msg.sender, withdrawableAmount), "Failed to transfer team tokens");

        // Emit an event to notify that the team tokens were withdrawn    
        emit TeamTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    function calculateYearForTeamTokens() public view returns (uint8)  {

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
    
    /////////////HOLDER REWARDS FUNCTIONS///////////

    /*
     * @notice Allows the rewards updater or the owner to update the rewards for a list of wallets
     * @dev This function can only be called by the rewards updater or the owner
     * @param _walletAddresses The list of wallet addresses to update the rewards for
     * @param _hyaxHoldingAmounts The list of HYAX holding amounts for the wallets
     * @custom:events Emits a RewardsUpdated event upon successful update
     */
    function updateRewardsBatch(address[] calldata _walletAddresses, uint256[] calldata _hyaxRewards) onlyOwnerOrRewardsUpdater nonReentrant() public {

        // Validate the batch size limit
        require(_walletAddresses.length <= MAX_BATCH_SIZE_FOR_UPDATE_REWARDS, "Batch size exceeds limit. Max batch size is 100");

        // Validate the length of the arrays
        require(_walletAddresses.length == _hyaxRewards.length, "Array lengths must match.");

        // Iterate through the list of wallets
        for (uint256 i = 0; i < _walletAddresses.length; i++) {

            //Get the wallet address for the current iteration
            address walletAddress = _walletAddresses[i];

            //Get the hyax rewards for the current iteration
            uint256 hyaxRewards = _hyaxRewards[i];

            //Try to update the rewards for the current wallet
            try this.updateRewardsSingle(walletAddress, hyaxRewards) {

            } catch {
                // Handle the error (e.g., emit an event to log failure)
                emit RewardUpdateFailed(msg.sender, walletAddress, "Reward update failed for this wallet");
            }
        }
        // Emit an event to notify that the rewards were updated
        emit RewardsUpdated(msg.sender, _walletAddresses, _hyaxRewards);
    }

    /**
     * @notice Updates rewards for a single wallet
     * @dev This function can only be called by the rewards updater or the owner
     * @dev Implements nonReentrant guard to prevent reentrancy attacks
     * @param _walletAddress The address of the wallet to update rewards for
     * @param _hyaxRewards The amount of HYAX rewards to add
     * @custom:requirements Wallet must be whitelisted
     * @custom:requirements Minimum interval between updates must have passed
     * @custom:requirements Rewards must not exceed weekly withdrawal limit
     * @custom:requirements Contract must have sufficient tokens to distribute
     * @custom:requirements Wallet must have positive HYAX balance (or holding amount for team wallets)
     */
    function updateRewardsSingle(address _walletAddress, uint256 _hyaxRewards) onlyOwnerOrRewardsUpdater nonReentrant() public {

        // Validate that the wallet is whitelisted
        require(wallets[_walletAddress].isWhitelisted == true, "Wallet is not whitelisted");

        // Validate that the wallet is not blacklisted
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");

        //Timestamp validation
        require(block.timestamp >= wallets[_walletAddress].lastRewardsUpdateTime + MIN_INTERVAL_FOR_UPDATE_REWARDS, "Too soon to update rewards for this wallet");

        // Ensure rewards don't exceed the weekly withdrawal limit
        require(_hyaxRewards < REWARD_TOKENS_WITHDRAWAL_PER_WEEK, "A single wallet cannot have rewards higher than the weekly withdrawal limit");

        // Check if there are sufficient tokens in the contract to distribute as rewards
        require(rewardTokensDistributed + _hyaxRewards <= rewardTokensInSmartContract, "Insufficient tokens to distribute as rewards");

        // Check if the wallet is a team wallet and has a positive HYAX holding amount
        if(wallets[_walletAddress].isTeamWallet){
            // For team wallets, check if they have a positive HYAX holding amount
            require(wallets[_walletAddress].hyaxHoldingAmount > 0, "Team wallets must have a hyax holding amount greater than 0 to get rewards");
        }
        else{
            // For non-team wallets, check their current HYAX balance
            require(hyaxToken.balanceOf(_walletAddress) > 0, "Wallet must have a hyax balance greater than 0 to get rewards");
        }

        // Update the total rewards distributed
        rewardTokensDistributed += _hyaxRewards;

        // Update the last rewards update time
        wallets[_walletAddress].lastRewardsUpdateTime = block.timestamp;

        // Update the total rewards for the wallet
        wallets[_walletAddress].totalHyaxRewardsAmount += _hyaxRewards;

        // Update the HYAX holding amount for the wallet
        wallets[_walletAddress].currentRewardsAmount += _hyaxRewards;
    }

    /*
     * @notice Allows whitelisted holders to withdraw their accumulated rewards
     * @dev This function is restricted to whitelisted addresses and implements a nonReentrant guard
     * @dev Rewards can be withdrawn instantly once they are distributed
     * @dev The function checks for various conditions before allowing withdrawal
     * @dev Upon successful withdrawal, it updates relevant state variables and transfers tokens
     * @return None
     */
    function withdrawRewardTokens() isWhitelisted(msg.sender) nonReentrant() public {

        //Check if the wallet is whitelisted
        require(wallets[msg.sender].isWhitelisted == true, "Wallet is not whitelisted");

        // Validate that the wallet is not blacklisted
        require(wallets[msg.sender].isBlacklisted == false, "Wallet has been blacklisted");

        // Check if rewards funding has started
        require(rewardTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
        
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
        require(hyaxToken.transfer(msg.sender, withdrawableAmount), "Failed to transfer reward tokens");

        // Emit an event to notify that the holder rewards were withdrawn
        emit HolderRewardsWithdrawn(msg.sender, withdrawableAmount);
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
    function withdrawTokensToBurn(FundingType _fundingType, uint256 _amount) onlyOwner() nonReentrant() public {

        // Check if the funding type is valid
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamTokens || _fundingType == FundingType.HolderRewards, "Invalid funding type");

        // Verify that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");

        // Check if growth tokens funding has started
        if(_fundingType == FundingType.GrowthTokens){
            require(growthTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
            require(_amount <= growthTokensInSmartContract, "Insufficient growth tokens in the contract to withdraw");
            growthTokensInSmartContract -= _amount;
        }
        else if(_fundingType == FundingType.TeamTokens){
            require(teamTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
            require(_amount <= teamTokensInSmartContract, "Insufficient team tokens in the contract to withdraw");
            teamTokensInSmartContract -= _amount;

        }
        else if(_fundingType == FundingType.HolderRewards){
            require(rewardTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
            require(_amount <= rewardTokensInSmartContract, "Insufficient reward tokens in the contract to withdraw");
            rewardTokensInSmartContract -= _amount;
        }
        
        // Transfer the calculated amount to the owner
        require(hyaxToken.transfer(owner(), _amount), "Failed to transfer growth tokens");

        // Emit an event to notify that the growth tokens were withdrawn    
        emit TokensToBurnWithdrawn(_fundingType, _amount);
    }

    /**
     * @notice Updates the white lister address
     * @dev This function can only be called by the owner
     * @param _whiteListerAddress The address of the new white lister
     */
    function updateWhiteListerAddress(address _whiteListerAddress) onlyOwner() public {
        whiteListerAddress = _whiteListerAddress;
    }

    /**
     * @notice Updates the rewards updater address
     * @dev This function can only be called by the owner
     * @param _rewardsUpdaterAddress The address of the new rewards updater
     */
    function updateRewardsUpdaterAddress(address _rewardsUpdaterAddress) onlyOwner() public {
        rewardsUpdaterAddress = _rewardsUpdaterAddress;
    }

    /**
     * @notice Updates the hyax token address
     * @dev This function can only be called by the owner
     * @param _hyaxTokenAddress The address of the new hyax token
     */
    function updateHyaxTokenAddress(address _hyaxTokenAddress) onlyOwner() public {
        hyaxTokenAddress = _hyaxTokenAddress;
        hyaxToken = ERC20TokenInterface(hyaxTokenAddress);
    }

     /**
     * @dev Pauses all functionalities of the contract.
     * Can only be called by the owner.
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses all functionalities of the contract.
     * Can only be called by the owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     * @param newOwner The address of the new owner.
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {

        //Validate the new owner is not the zero address
        require(newOwner != address(0), "Ownable: new owner is the zero address");

        //Validate the new owner is not the same contract address, otherwise management of the smart contract will be lost
        require(newOwner != address(this), "Ownable: new owner cannot be the same contract address");
        
        _transferOwnership(newOwner);
    }
}