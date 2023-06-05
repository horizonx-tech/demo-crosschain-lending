// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IRiskModel {
    struct RiskParameter {
        uint256 ltv;
        uint256 liquidationThreshold;
        uint256 liquidationBonus;
    }

    function riskParameters(
        address token
    ) external view returns (RiskParameter memory);

    function supportToken(
        address token,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external;

    function BASE() external view returns (uint256);
}
