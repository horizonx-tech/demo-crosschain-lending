// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IPriceOracle {
    function getPriceInUsd(
        string memory symbol
    ) external view returns (uint256);

    function BASE() external view returns (uint256);

    function setPrice(string memory symbol, uint256 price) external;
}
