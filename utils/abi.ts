const PROXY_ADMIN_ABI = [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"UPGRADE_INTERFACE_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ITransparentUpgradeableProxy","name":"proxy","type":"address"},{"internalType":"address","name":"implementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeAndCall","outputs":[],"stateMutability":"payable","type":"function"}]

const REWARDS_SMART_CONTRACT_ABI = [{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[],"name":"InvalidInitialization","type":"error"},{"inputs":[],"name":"NotInitializing","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_senderBlacklistStatusUpdated","type":"address"},{"indexed":false,"internalType":"address","name":"_walletAddressBlacklistStatusUpdated","type":"address"},{"indexed":false,"internalType":"bool","name":"_newStatusBlacklistStatusUpdated","type":"bool"}],"name":"BlacklistStatusUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum UpgradeableHYAXRewards.FundingType","name":"_fundingTypeAdded","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"_amountAdded","type":"uint256"}],"name":"FundingAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_walletAddressGrowthTokensWithdrawn","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amountWithdrawn","type":"uint256"}],"name":"GrowthTokensWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_hyaxTokenAddress","type":"address"}],"name":"HyaxTokenAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"_maximumBatchSizeForUpdateRewards","type":"uint8"}],"name":"MaximumBatchSizeForUpdateRewardsUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_walletAddressRewardTokensWithdrawn","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amountWithdrawn","type":"uint256"}],"name":"RewardTokensWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_sender","type":"address"},{"indexed":false,"internalType":"address[]","name":"_walletAddresses","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"_hyaxRewards","type":"uint256[]"}],"name":"RewardUpdateBatchSent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_sender","type":"address"},{"indexed":false,"internalType":"address","name":"_walletAddress","type":"address"},{"indexed":false,"internalType":"string","name":"_errorMessage","type":"string"}],"name":"RewardUpdateFailed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_sender","type":"address"},{"indexed":false,"internalType":"address","name":"_walletAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"_hyaxReward","type":"uint256"}],"name":"RewardUpdateSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_newRewardsUpdaterAddress","type":"address"}],"name":"RewardsUpdaterAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_oldTeamMemberWalletAddress","type":"address"},{"indexed":false,"internalType":"address","name":"_newTeamMemberWalletAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"_hyaxHoldingAmount","type":"uint256"}],"name":"TeamMemberWalletUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_walletAddressTeamTokensWithdrawn","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amountWithdrawn","type":"uint256"}],"name":"TeamTokensWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum UpgradeableHYAXRewards.FundingType","name":"_fundingTypeWithdrawn","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"TokensToBurnWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_sender","type":"address"},{"indexed":false,"internalType":"address","name":"_walletAddress","type":"address"},{"indexed":false,"internalType":"bool","name":"_isTeamWallet","type":"bool"},{"indexed":false,"internalType":"uint256","name":"_hyaxHoldingAmount","type":"uint256"}],"name":"WalletAddedToWhitelist","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_newWhiteListerAddress","type":"address"}],"name":"WhiteListerAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_senderWhitelistStatusUpdated","type":"address"},{"indexed":false,"internalType":"address","name":"_walletAddressWhitelistStatusUpdated","type":"address"},{"indexed":false,"internalType":"bool","name":"_newStatusWhitelistStatusUpdated","type":"bool"}],"name":"WhitelistStatusUpdated","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GROWTH_TOKENS_TOTAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GROWTH_TOKENS_WITHDRAWAL_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_INTERVAL_FOR_UPDATE_REWARDS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARDS_UPDATER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARD_TOKENS_PER_WEEK","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARD_TOKENS_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARD_TOKENS_TOTAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TEAM_TOKENS_LOCKED_PERIOD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TEAM_TOKENS_TOTAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TEAM_TOKENS_WITHDRAWAL_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOKENS_WITHDRAWAL_PERIOD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"WHITELISTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_walletAddress","type":"address"},{"internalType":"bool","name":"_isTeamWallet","type":"bool"},{"internalType":"uint256","name":"_hyaxHoldingAmountAtWhitelistTime","type":"uint256"}],"name":"addWalletToWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"calculateYearForTeamTokens","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"enum UpgradeableHYAXRewards.FundingType","name":"_fundingType","type":"uint8"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"fundSmartContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getRoleMember","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleMemberCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleMembers","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"growthTokensFunded","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"growthTokensFundingStarted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"growthTokensInSmartContract","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"growthTokensLastWithdrawalTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"growthTokensStartFundingTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"growthTokensWithdrawn","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"hyaxToken","outputs":[{"internalType":"contract IHyaxToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"hyaxTokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_hyaxTokenAddress","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"maximumBatchSizeForUpdateRewards","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardTokensDistributed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardTokensFunded","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardTokensFundingStarted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardTokensInSmartContract","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardTokensStartFundingTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardTokensWithdrawn","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardsUpdaterAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"teamTokensFunded","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"teamTokensFundingStarted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"teamTokensInSmartContract","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"teamTokensStartFundingTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"teamTokensWithdrawn","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_walletAddress","type":"address"},{"internalType":"bool","name":"_newStatus","type":"bool"}],"name":"updateBlacklistStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_hyaxTokenAddress","type":"address"}],"name":"updateHyaxTokenAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"_maximumBatchSizeForUpdateRewards","type":"uint8"}],"name":"updateMaximumBatchSizeForUpdateRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_walletAddresses","type":"address[]"},{"internalType":"uint256[]","name":"_hyaxRewards","type":"uint256[]"}],"name":"updateRewardsBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_walletAddress","type":"address"},{"internalType":"uint256","name":"_hyaxRewards","type":"uint256"}],"name":"updateRewardsSingle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_rewardsUpdaterAddress","type":"address"}],"name":"updateRewardsUpdaterAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oldTeamMemberWalletAddress","type":"address"},{"internalType":"address","name":"_newTeamMemberWalletAddress","type":"address"}],"name":"updateTeamMemberWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_whiteListerAddress","type":"address"}],"name":"updateWhiteListerAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_walletAddress","type":"address"},{"internalType":"bool","name":"_newStatus","type":"bool"}],"name":"updateWhitelistStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"wallets","outputs":[{"internalType":"uint256","name":"hyaxHoldingAmount","type":"uint256"},{"internalType":"uint256","name":"hyaxHoldingAmountAtWhitelistTime","type":"uint256"},{"internalType":"uint256","name":"totalHyaxRewardsAmount","type":"uint256"},{"internalType":"uint256","name":"currentRewardsAmount","type":"uint256"},{"internalType":"uint256","name":"rewardsWithdrawn","type":"uint256"},{"internalType":"uint256","name":"addedToWhitelistTime","type":"uint256"},{"internalType":"uint8","name":"teamTokenWithdrawalTimes","type":"uint8"},{"internalType":"uint256","name":"lastRewardsWithdrawalTime","type":"uint256"},{"internalType":"uint256","name":"lastRewardsUpdateTime","type":"uint256"},{"internalType":"bool","name":"isTeamWallet","type":"bool"},{"internalType":"bool","name":"isWhitelisted","type":"bool"},{"internalType":"bool","name":"isBlacklisted","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"whiteListerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdrawGrowthTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawRewardTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawTeamTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"enum UpgradeableHYAXRewards.FundingType","name":"_fundingType","type":"uint8"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawTokensToBurn","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const TOKEN_SMART_CONTRACT_ABI = [
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "owner",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Approval",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "bool",
              "name": "_isBlacklisted",
              "type": "bool"
          }
      ],
      "name": "BlacklistStatusUpdated",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "uint8",
              "name": "version",
              "type": "uint8"
          }
      ],
      "name": "Initialized",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "enum HYAXUpgradeable.TokenType",
              "name": "tokenType",
              "type": "uint8"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokenAmount",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "totalInvestmentInUsd",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "hyaxAmount",
              "type": "uint256"
          }
      ],
      "name": "InvestFromCryptoToken",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "maticAmount",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "totalInvestmentInUsd",
              "type": "uint256"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "hyaxAmount",
              "type": "uint256"
          }
      ],
      "name": "InvestFromMatic",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          }
      ],
      "name": "InvestorAddedToWhiteList",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "Paused",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "_QualifiedInvestorAddress",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "bool",
              "name": "_isQualifiedInvestor",
              "type": "bool"
          }
      ],
      "name": "QualifiedInvestorStatusUpdated",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "TokenIssuance",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "from",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Transfer",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "Unpaused",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "_newHyaxPrice",
              "type": "uint256"
          }
      ],
      "name": "UpdatedHyaxPrice",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newMaticPriceFeedAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedMaticPriceFeedAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "_newMaximumInvestmentAllowedInUSD",
              "type": "uint256"
          }
      ],
      "name": "UpdatedMaximumInvestmentAllowedInUSD",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "_newMinimumInvestmentAllowedInUSD",
              "type": "uint256"
          }
      ],
      "name": "UpdatedMinimumInvestmentAllowedInUSD",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newTreasuryAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedTreasuryAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newUsdcPriceFeedAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedUsdcPriceFeedAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newUsdcTokenAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedUsdcTokenAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newUsdtPriceFeedAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedUsdtPriceFeedAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newUsdtTokenAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedUsdtTokenAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newWbtcPriceFeedAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedWbtcPriceFeedAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newWbtcTokenAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedWbtcTokenAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newWethPriceFeedAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedWethPriceFeedAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newWethTokenAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedWethTokenAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "_newWhiteListerAddress",
              "type": "address"
          }
      ],
      "name": "UpdatedWhiteListerAddress",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "bool",
              "name": "_isWhiteListed",
              "type": "bool"
          }
      ],
      "name": "WhitelistStatusUpdated",
      "type": "event"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          }
      ],
      "name": "addToWhiteList",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "owner",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          }
      ],
      "name": "allowance",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "approve",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "balanceOf",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "_currentCryptocurrencyPrice",
              "type": "uint256"
          }
      ],
      "name": "calculateTotalHyaxTokenToReturn",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "totalInvestmentInUsd",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "totalHyaxTokenToReturn",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "decimals",
      "outputs": [
          {
              "internalType": "uint8",
              "name": "",
              "type": "uint8"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "subtractedValue",
              "type": "uint256"
          }
      ],
      "name": "decreaseAllowance",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum HYAXUpgradeable.TokenType",
              "name": "tokenType",
              "type": "uint8"
          }
      ],
      "name": "getCurrentTokenPrice",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "hyaxPrice",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "spender",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "addedValue",
              "type": "uint256"
          }
      ],
      "name": "increaseAllowance",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum HYAXUpgradeable.TokenType",
              "name": "tokenType",
              "type": "uint8"
          },
          {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
          }
      ],
      "name": "investFromCryptoToken",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "investFromMatic",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "payable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "name": "investorData",
      "outputs": [
          {
              "internalType": "bool",
              "name": "isWhiteListed",
              "type": "bool"
          },
          {
              "internalType": "bool",
              "name": "isBlacklisted",
              "type": "bool"
          },
          {
              "internalType": "bool",
              "name": "isQualifiedInvestor",
              "type": "bool"
          },
          {
              "internalType": "uint256",
              "name": "totalHyaxBoughtByInvestor",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "totalUsdDepositedByInvestor",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "maticPriceFeedAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "maximumInvestmentAllowedInUSD",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "minimumInvestmentAllowedInUSD",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "name",
      "outputs": [
          {
              "internalType": "string",
              "name": "",
              "type": "string"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "owner",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "pause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "paused",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "symbol",
      "outputs": [
          {
              "internalType": "string",
              "name": "",
              "type": "string"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "_amount",
              "type": "uint256"
          }
      ],
      "name": "tokenIssuance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
          {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "to",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "transfer",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "from",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "to",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
          }
      ],
      "name": "transferFrom",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "treasuryAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "unpause",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          },
          {
              "internalType": "bool",
              "name": "_newStatus",
              "type": "bool"
          }
      ],
      "name": "updateBlacklistStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "_newHyaxPrice",
              "type": "uint256"
          }
      ],
      "name": "updateHyaxPrice",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "_newMaximumInvestmentAllowedInUSD",
              "type": "uint256"
          }
      ],
      "name": "updateMaximumInvestmentAllowedInUSD",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "_newMinimumInvestmentAllowedInUSD",
              "type": "uint256"
          }
      ],
      "name": "updateMinimumInvestmentAllowedInUSD",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum HYAXUpgradeable.TokenType",
              "name": "tokenType",
              "type": "uint8"
          },
          {
              "internalType": "address",
              "name": "newPriceFeedAddress",
              "type": "address"
          }
      ],
      "name": "updatePriceFeedAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_qualifiedInvestorAddress",
              "type": "address"
          },
          {
              "internalType": "bool",
              "name": "_newStatus",
              "type": "bool"
          }
      ],
      "name": "updateQualifiedInvestorStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "enum HYAXUpgradeable.TokenType",
              "name": "tokenType",
              "type": "uint8"
          },
          {
              "internalType": "address",
              "name": "newTokenAddress",
              "type": "address"
          }
      ],
      "name": "updateTokenAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_newTreasuryAddress",
              "type": "address"
          }
      ],
      "name": "updateTreasuryAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_newWhiteListerAddress",
              "type": "address"
          }
      ],
      "name": "updateWhiteListerAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          },
          {
              "internalType": "bool",
              "name": "_newStatus",
              "type": "bool"
          }
      ],
      "name": "updateWhitelistStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "usdcPriceFeedAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "usdcToken",
      "outputs": [
          {
              "internalType": "contract ERC20TokenInterface",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "usdcTokenAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "usdtPriceFeedAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "usdtToken",
      "outputs": [
          {
              "internalType": "contract ERC20TokenInterface",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "usdtTokenAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "_totalInvestmentInUsd",
              "type": "uint256"
          },
          {
              "internalType": "address",
              "name": "_investorAddress",
              "type": "address"
          }
      ],
      "name": "validateMaximumInvestedAmountAndInvestorLimit",
      "outputs": [],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "wbtcPriceFeedAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "wbtcToken",
      "outputs": [
          {
              "internalType": "contract ERC20TokenInterface",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "wbtcTokenAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "wethPriceFeedAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "wethToken",
      "outputs": [
          {
              "internalType": "contract ERC20TokenInterface",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "wethTokenAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "whiteListerAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "stateMutability": "payable",
      "type": "receive"
  }
];


module.exports = { PROXY_ADMIN_ABI, TOKEN_SMART_CONTRACT_ABI, REWARDS_SMART_CONTRACT_ABI };