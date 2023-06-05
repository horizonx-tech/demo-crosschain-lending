// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDebtToken is IERC20 {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);

    function mint(address account, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}
