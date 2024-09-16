// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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

contract UpgradeableHYAXRewards is Ownable, Pausable {

    ////////////////// SMART CONTRACT EVENTS //////////////////

    // Emitted when the stored value changes
    event FundingAdded(FundingType _fundingType, uint256 _amount);

    // Emitted when the stored value changes
    event GrowthTokensWithdrawn(address _walletAddress, uint256 _amount);

    // Emitted when the stored value changes
    event TeamTokensWithdrawn(address _walletAddress, uint256 _amount);

    // Emitted when the stored value changes
    event HolderRewardsWithdrawn(address _walletAddress, uint256 _amount);

    // Emitted when the stored value changes
    event WalletAddedToWhitelist(address _sender, address _walletAddress, bool _isTeamWallet, string _bitcoinRewardsAddress, uint256 _hyaxHoldingAmount);

    // Emitted when the stored value changes
    event WalletRemovedFromWhitelist(address _sender, address _walletAddress);

    // Emitted when the stored value changes
    event RewardsUpdated(address[] _walletAddresses, uint256[] _hyaxHoldingAmounts);

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

    uint256 public teamTokensStartFundingTime; // Timestamp when team tokens funding started

    bool public teamTokensFundingStarted; // Flag to indicate if team tokens funding has begun


    ////////////////// HOLDERS REWARDS VARIABLES //////////////////

    uint256 public constant REWARD_TOKENS_TOTAL = 1200000000 * 10**18; // Total of 1.2 Billion as reward tokens
    
    uint256 public constant REWARD_TOKENS_WITHDRAWAL_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

    uint256 public constant REWARD_TOKENS_HOLDING_PERIOD = 7 days; // 7 years

    uint256 public rewardTokensFunded; // Total amount of reward tokens funded to the contract

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
        uint256 lastTokenWithdrawalTime;            // Timestamp of the last token withdrawal
        uint256 lastRewardsWithdrawalTime;          // Timestamp of the last rewards withdrawal

        bool isTeamWallet;                          // Flag indicating if this is a team wallet
        bool isWhitelisted;                         // Flag indicating if the wallet is whitelisted
    }

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
        
        //Add the wallet to the whitelist with the provided parameters
        wallets[_walletAddress].isWhitelisted = true; // Mark the wallet as whitelisted
        wallets[_walletAddress].isTeamWallet = _isTeamWallet; // Set whether this is a team wallet or not
        wallets[_walletAddress].bitcoinRewardsAddress = _bitcoinRewardsAddress; // Store the Bitcoin address for rewards

        wallets[_walletAddress].addedToWhitelistTime = block.timestamp; // Set the time when the wallet was added to the whitelist
        
        wallets[_walletAddress].lastTokenWithdrawalTime = 0; // Initialize the last token withdrawal time to zero
        wallets[_walletAddress].lastRewardsWithdrawalTime = 0; // Initialize the last rewards withdrawal time to zero
        
        wallets[_walletAddress].currentRewardsAmount = 0; // Initialize the current rewards amount to 0
        wallets[_walletAddress].totalHyaxRewardsAmount = 0; // Set the total HYAX rewards amount to 0
        wallets[_walletAddress].rewardsWithdrawn = 0; // Initialize the rewards withdrawn to 0

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
     * @notice Removes a wallet from the whitelist
     * @dev This function allows the owner or the whitelister address to remove a wallet from the whitelist
     * @param _walletAddress The address of the wallet to be removed from the whitelist
     */ 
    function removeWalletFromWhitelist(address _walletAddress) onlyOwnerOrWhitelister public {
        
        //Verify that the wallet is in the whitelist
        require(wallets[_walletAddress].isWhitelisted == true, "Wallet is not currently whitelisted");

        //Remove the wallet from the whitelist
        wallets[_walletAddress].isWhitelisted = false; // Mark the wallet as whitelisted

        //Emit an event to notify that the wallet was removed from the whitelist
        emit WalletRemovedFromWhitelist(msg.sender, _walletAddress);
    }

    /**
     * @notice Funds the smart contract with tokens for different purposes
     * @dev This function can only be called by the contract owner
     * @param _fundingType The type of funding (GrowthTokens, TeamTokens, or HolderRewards)
     * @param _amount The amount of tokens to fund
     * @custom:events Emits a FundingAdded event upon successful funding
     */
    function fundSmartContract(FundingType _fundingType, uint256 _amount) onlyOwner() public {

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
    function withdrawGrowthTokens() onlyOwner() public {

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
    function withdrawTeamTokens() isWhitelisted(msg.sender) public {

        // Check if the sender is a team wallet
        require(wallets[msg.sender].isTeamWallet == true, "Only team wallets can withdraw tokens using this function");

        // Check if team tokens funding has started
        require(teamTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
        
        // Ensure that at least four years have passed since the team wallet was added to the whitelist
        require(block.timestamp >= wallets[msg.sender].addedToWhitelistTime + TEAM_TOKENS_LOCKED_PERIOD , "Cannot withdraw before 4 years after being added to the whitelist");
        
        // Ensure that at least one year has passed since the last withdrawal from this wallet
        require(block.timestamp >= wallets[msg.sender].lastTokenWithdrawalTime + TOKENS_WITHDRAWAL_PERIOD, "Can only withdraw team tokens once per year");

        // Verify that not all team tokens have been withdrawn yet
        require(teamTokensWithdrawn < TEAM_TOKENS_TOTAL, "All team tokens have been withdrawn");
        
        // Verify that the wallet has a hyax holding amount as team tokens greater than 0 to withdraw
        require(wallets[msg.sender].hyaxHoldingAmount > 0, "No hyax holding amount to withdraw");

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

        // Update the last withdrawal time
        wallets[msg.sender].lastTokenWithdrawalTime = block.timestamp;
    
        // Transfer the calculated amount to the wallet
        require(hyaxToken.transfer(msg.sender, withdrawableAmount), "Failed to transfer team tokens");

        // Emit an event to notify that the team tokens were withdrawn    
        emit TeamTokensWithdrawn(msg.sender, withdrawableAmount);
    }
    
    /////////////HOLDER REWARDS FUNCTIONS///////////

    /**
     * @notice Allows the rewards updater or the owner to update the rewards for a list of wallets
     * @dev This function can only be called by the rewards updater or the owner
     * @param _walletAddresses The list of wallet addresses to update the rewards for
     * @param _hyaxHoldingAmounts The list of HYAX holding amounts for the wallets
     * @custom:events Emits a RewardsUpdated event upon successful update
     */
    function updateRewards(address[] calldata _walletAddresses, uint256[] calldata _hyaxHoldingAmounts) onlyOwnerOrRewardsUpdater public {

        // Validate the length of the arrays
        require(_walletAddresses.length == _hyaxHoldingAmounts.length, "Array lengths must match");

        // Iterate through the list of wallets
        for (uint256 i = 0; i < _walletAddresses.length; i++) {
            address walletAddress = _walletAddresses[i];
            uint256 hyaxHoldingAmount = _hyaxHoldingAmounts[i];

            // Update the HYAX holding amount for the wallet
            wallets[walletAddress].hyaxHoldingAmount = hyaxHoldingAmount;
        }

        // Emit an event to notify that the rewards were updated
        emit RewardsUpdated(_walletAddresses, _hyaxHoldingAmounts);
    }

    /**
     * @notice Allows the rewards updater or the owner to update the rewards for a list of wallets
     * @dev This function can only be called by the rewards updater or the owner
     * @custom:requirements Caller must be a whitelisted team wallet
     * @custom:requirements Team tokens funding must have started
     * @custom:requirements At least four years must have passed since the wallet was added to the whitelist
     * @custom:requirements At least one year must have passed since the last withdrawal
     * @custom:requirements Not all team tokens have been withdrawn
     * @custom:requirements The wallet must have a positive HYAX holding amount
     * @custom:events Emits a TeamTokensWithdrawn event upon successful withdrawal
     */


    function withdrawHolderRewards() isWhitelisted(msg.sender) public {

    }

    /////////////SMART CONTRACT MANAGEMENT FUNCTIONS///////////

    function updateWhiteListerAddress(address _whiteListerAddress) onlyOwner() public {
        whiteListerAddress = _whiteListerAddress;
    }

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