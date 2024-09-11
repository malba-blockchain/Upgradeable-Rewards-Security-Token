// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

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

contract UpgradeableHYAXRewards is Ownable {

    ////////////////// SMART CONTRACT EVENTS //////////////////

    // Emitted when the stored value changes
    event FundingAdded(FundingType _fundingType, uint256 _amount);

    // Emitted when the stored value changes
    event GrowthTokensWithdrawn(uint256 _amount);

    ////////////////// SMART CONTRACT VARIABLES //////////////////

    address public hyaxTokenAddress;

    ERC20TokenInterface public hyaxToken;

    enum FundingType {GrowthTokens, TeamRewards, InvestorRewards}


    ////////////////// GROWTH TOKENS VARIABLES //////////////////

    uint256 public constant GROWTH_TOKENS_TOTAL = 2400000000 * 10**18; // Total of 2.4 Billion tokens (adjust decimals if necessary)
    
    uint256 public constant GROWTH_TOKENS_WITHDRAWAL_PER_YEAR = 120000000 * 10**18; // 120 Million tokens per year

    uint256 public constant GROWTH_TOKENS_WITHDRAWAL_PERIOD = 365 days; // 1 year

    uint256 public growthTokensFunded;

    uint256 public growthTokensWithdrawn;

    uint256 public growthTokensInSmartContract;

    uint256 public growthTokensLastWithdrawalTime;

    uint256 public growthTokensStartFundingTime;

    bool public growthTokensFundingStarted;


    ////////////////// TEAM AND INVESTOR REWARDS VARIABLES //////////////////

    uint256 public tokenInvestorRewards;

    uint256 public tokenTeamRewards;
   
    address public whiteListerAddress;

    struct WalletData {
        uint256 hyaxHoldingAmount;
        uint256 holdingTime;
        uint256 totalHyaxRewardsAmount;
        uint256 currentRewardsAmount;
        string bitcoinRewardsAddress;
        uint256 rewardsWithdrawn;
        bool isTeamWallet;
        bool isWhitelisted;
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
        tokenTeamRewards = 0;
        tokenInvestorRewards = 0;
        growthTokensFunded = 0;
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////
    /**
     * @notice Adds a wallet to the whitelist
     * @dev This function allows the owner or the white lister address to add a wallet to the whitelist
     * @param _walletAddress The address of the wallet to be added to the whitelist
     * @param _isTeamWallet A boolean indicating if the wallet is a team wallet
     * @param _bitcoinRewardsAddress The Bitcoin rewards address associated with the wallet
     */
    function addWalletToWhitelist(address _walletAddress, bool _isTeamWallet, string memory _bitcoinRewardsAddress) onlyOwnerOrWhitelister public {

        //Verify that the wallet is not already in the whitelist
        require(wallets[_walletAddress].isWhitelisted == false, "Wallet already in the whitelist");

        //Add the wallet to the whitelist
        wallets[_walletAddress].isWhitelisted = true; // Mark the wallet as whitelisted
        wallets[_walletAddress].isTeamWallet = _isTeamWallet; // Set whether this is a team wallet or not
        wallets[_walletAddress].bitcoinRewardsAddress = _bitcoinRewardsAddress; // Store the Bitcoin address for rewards

        wallets[_walletAddress].hyaxHoldingAmount = 0; // Initialize the wallet's HYAX holding amount to 0
        wallets[_walletAddress].holdingTime = 0; // Set the initial holding time to 0
        wallets[_walletAddress].currentRewardsAmount = 0; // Initialize the current rewards amount to 0
        wallets[_walletAddress].totalHyaxRewardsAmount = 0; // Set the total HYAX rewards amount to 0
        wallets[_walletAddress].rewardsWithdrawn = 0; // Initialize the rewards withdrawn to 0
    }

    function fundSmartContract(FundingType _fundingType, uint256 _amount) onlyOwner() public {

        // Check if the funding type is valid
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamRewards || _fundingType == FundingType.InvestorRewards, "Invalid funding type");

        // Verify that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer the specified token to this contract
        require(hyaxToken.transferFrom(msg.sender, address(this), _amount), "There was an error on receiving the token funding");

        // Add the amount to the corresponding token
        if (_fundingType == FundingType.GrowthTokens) {
            // Increase the total amount of growth tokens funded
            growthTokensFunded += _amount;
            // Increase the current balance of growth tokens in the smart contract
            growthTokensInSmartContract += _amount;
        
            // If growth tokens funding has not started yet, start it
            if (!growthTokensFundingStarted) {
                growthTokensFundingStarted = true;
                growthTokensStartFundingTime = block.timestamp; // Start the funding time
                growthTokensLastWithdrawalTime = block.timestamp; // Initialize withdrawal time
            }
            
        } else if (_fundingType == FundingType.TeamRewards) {
            tokenTeamRewards += _amount;
        } else if (_fundingType == FundingType.InvestorRewards) {
            tokenInvestorRewards += _amount;
        }

        // Emit an event to notify that the funding was successful
        emit FundingAdded(_fundingType, _amount);
    }

    modifier onlyOwnerOrWhitelister {
        // Ensure that the sender is the owner or the white lister address
        require(msg.sender == owner() || msg.sender == whiteListerAddress, "Function reserved only for the white lister address or the owner");
        _;
    }

    /////////////GROWTH TOKENS FUNCTIONS///////////
    function withdrawGrowthTokens() onlyOwner() public {

        // Check if growth tokens funding has started
        require(growthTokensFundingStarted, "Funding has not started yet, no tokens to withdraw");
        
        // Ensure that at least one year has passed since the funding start time
        require(block.timestamp >= growthTokensStartFundingTime + GROWTH_TOKENS_WITHDRAWAL_PERIOD , "Cannot withdraw before 1 year after funding start");
        
        // Verify that not all growth tokens have been withdrawn yet
        require(growthTokensWithdrawn < GROWTH_TOKENS_TOTAL, "All growth tokens have been withdrawn");
        
        // Ensure that at least one year has passed since the last withdrawal
        require(block.timestamp >= growthTokensLastWithdrawalTime + GROWTH_TOKENS_WITHDRAWAL_PERIOD, "Can only withdraw once per year");
        
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
        emit GrowthTokensWithdrawn(withdrawableAmount);
    }
}