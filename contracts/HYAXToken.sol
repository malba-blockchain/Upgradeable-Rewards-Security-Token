// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HYAXToken is ERC20 {
    constructor( ) ERC20("HYAXToken", "HYAX") {
        //Ten billion tokens 10,000,000,000
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}