// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IAccountAssetOracle {
    function getDeposit(
        address _account,
        string memory _symbol
    ) external view returns (uint256);

    function getBorrow(
        address _account,
        string memory _symbol
    ) external view returns (uint256);
}
