// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICreditToken is IERC20 {
    struct CrossChainAsset {
        uint256 amountLockedFor;
        uint256 amountLockedFrom;
    }

    function chainIds() external view returns (uint256[] memory);

    function UNDERLYING_ASSET_ADDRESS() external view returns (address);

    function mint(address account, uint256 amount) external;

    function transferUnderlyingTo(address account, uint256 amount) external;

    function burn(address account, address receiver, uint256 amount) external;

    function collateralAmountOf(
        address account
    ) external view returns (uint256);

    function lockedBalanceOf(address account) external view returns (uint256);

    function unlockedBalanceOf(address account) external view returns (uint256);

    function burnLockedFor(
        address account,
        address receiver,
        uint256 amount,
        uint256 srcChainId
    ) external;

    function amountLockedFor(
        address account,
        uint256 chainId
    ) external view returns (uint256);

    function amountLockedFrom(
        address account,
        uint256 chainId
    ) external view returns (uint256);

    event LockCreated(
        address indexed account,
        uint256 amount,
        uint256 dstChainId
    );

    event Received(address indexed account, uint256 amount, uint256 srcChainId);

    function lockFor(
        address account,
        uint256 amount,
        uint256 dstChainId
    ) external;

    function unlockFor(
        address account,
        uint256 amount,
        uint256 srcChainId
    ) external;

    function setLendingPool(address _lendingPool) external;

    function setChainsight(address _chainsight) external;

    function onLockCreated(
        address account,
        uint256 amount,
        uint256 srcChainId
    ) external;

    function transferOnLiquidation(
        address from,
        address to,
        uint256 amount
    ) external;
}
