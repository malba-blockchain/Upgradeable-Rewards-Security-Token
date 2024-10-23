start cmd.exe @cmd /k "D:&cd D:\USER\Downloads\ATLAS\Projects\HYAX-Upgradeable-Token&npx hardhat node"
timeout 20
start cmd.exe @cmd /k "D:&cd D:\USER\Downloads\ATLAS\Projects\HYAX-Upgradeable-Token&npx hardhat run --network localhost scripts\deploy_local_token_environment.js"
timeout 20
start cmd.exe @cmd /k "D:&cd D:\USER\Downloads\ATLAS\Projects\HYAX-Upgradeable-Rewards&npx hardhat run --network localhost scripts\deploy_local_rewards_environment.ts"