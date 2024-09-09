// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UpgradeableHYAXRewards {

    ////////////////// SMART CONTRACT EVENTS //////////////////

    // Emitted when the stored value changes
    event ValueChanged(uint256 value);


    ////////////////// SMART CONTRACT VARIABLES //////////////////

    uint256 public tokenInvestorRewards;

    uint256 public tokenTeamRewards;

    uint256 public tokenGrowthTokens;

    enum FundingType {TeamRewards, InvestorRewards, GrowthTokens}

    ////////////////// SMART CONTRACT CONSTRUCTOR /////////////////

    constructor()  {
        // Make the deployer of the contract the administrator
 
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////

    function fundSmartContract(FundingType _fundingType, uint256 _amount) onlyOwner public {
        
    }

    /////////////GROWTH TOKENS FUNCTIONS///////////


}