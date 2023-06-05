// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../interfaces/IMintableERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MintableErc20 is ERC20, IMintableERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external override {
        _mint(to, amount);
    }
}
