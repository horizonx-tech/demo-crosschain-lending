// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "../interfaces/IChainsigtAdapter.sol";
import "../interfaces/ILendingPool.sol";
import "../interfaces/ICreditToken.sol";

contract ChainsightAdapter is IChainsigtAdapter {
    address public lendingPool;

    constructor(address _lendingPool) {
        lendingPool = _lendingPool;
    }

    function symbolToAddress(
        string calldata symbol
    ) external view override returns (address) {
        return _symbolToAddress(symbol);
    }

    function _symbolToAddress(
        string memory symbol
    ) internal view returns (address) {
        return ILendingPool(lendingPool).assetAddresses(symbol);
    }

    function unlockAssetOf(
        address user,
        address to,
        string memory symbol,
        uint256 amount,
        uint256 dstChainId
    ) external override {
        address asset = _symbolToAddress(symbol);
        require(asset != address(0), "invalid asset");
        address creditTokenAddress = ILendingPool(lendingPool)
            .creditTokenAddress(asset);
        ICreditToken(creditTokenAddress).burnLockedFor(
            user,
            to,
            amount,
            dstChainId
        );
    }

    function onLockCreated(
        address user,
        string memory symbol,
        uint256 amount,
        uint256 srcChainId
    ) external override {
        address asset = _symbolToAddress(symbol);
        require(asset != address(0), "invalid asset");
        address creditTokenAddress = ILendingPool(lendingPool)
            .creditTokenAddress(asset);
        require(creditTokenAddress != address(0), "invalid credit token");
        ICreditToken(creditTokenAddress).onLockCreated(
            user,
            amount,
            srcChainId
        );
    }
}
