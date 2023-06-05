// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IChainsigtAdapter {
    function onLockCreated(
        address user,
        string memory symbol,
        uint256 amount,
        uint256 srcChainId
    ) external;

    // unlock withdraw of asset.
    function unlockAssetOf(
        address user,
        address to,
        string memory symbol,
        uint256 amount,
        uint256 dstChainId
    ) external;

    function symbolToAddress(
        string calldata symbol
    ) external view returns (address);
}
