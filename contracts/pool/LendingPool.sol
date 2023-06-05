// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "../interfaces/ILendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/ICreditToken.sol";
import "../interfaces/IDebtToken.sol";
import "../interfaces/IPriceOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingPool is ILendingPool, Ownable {
    struct Asset {
        IERC20Metadata underlying;
        ICreditToken creditToken;
        IDebtToken debtToken;
        string symbol;
        uint256 liquidationThreshold;
    }

    uint256 internal constant BASE = 1e18;

    mapping(address => Asset) public assets;
    Asset[] public assetList;
    mapping(string => address) public assetAddresses;

    IPriceOracle priceOracle;
    address public chainsight;

    modifier onlyChainsight() {
        require(msg.sender == chainsight, "only chainsight");
        _;
    }

    function setOracle(address _priceOracle) external onlyOwner {
        priceOracle = IPriceOracle(_priceOracle);
    }

    function creditTokenAddress(
        address asset
    ) external view override returns (address) {
        return address(assets[asset].creditToken);
    }

    function debtTokenAddress(
        address asset
    ) external view override returns (address) {
        return address(assets[asset].debtToken);
    }

    function setChainsight(address _chainsight) external onlyOwner {
        chainsight = _chainsight;
    }

    function priceOf(address _asset) internal view returns (uint256) {
        return priceOracle.getPriceInUsd(assets[_asset].underlying.symbol());
    }

    function amountInUsd(
        address _asset,
        uint256 amount
    ) internal view returns (uint256) {
        return
            (amount * priceOf(_asset)) /
            (10 ** assets[_asset].underlying.decimals());
    }

    function deposit(address _asset, uint256 amount) external override {
        Asset memory asset = assets[_asset];
        asset.underlying.transferFrom(
            msg.sender,
            address(asset.creditToken),
            amount
        );
        asset.creditToken.mint(msg.sender, amount);
    }

    function withdraw(
        address _asset,
        uint256 amount
    ) external override returns (uint256) {
        Asset memory asset = assets[_asset];
        asset.creditToken.burn(msg.sender, msg.sender, amount);
        return 0;
    }

    function borrow(address _asset, uint256 amount) external override {
        Asset memory asset = assets[_asset];
        require(
            _healthFactorAfterDecrease(msg.sender, _asset, 0, amount) >= BASE,
            "health factor too low"
        );
        asset.debtToken.mint(msg.sender, amount);
        asset.creditToken.transferUnderlyingTo(msg.sender, amount);
    }

    function repay(address _asset, uint256 amount) external override {
        Asset memory asset = assets[_asset];
        asset.debtToken.burn(msg.sender, amount);
        asset.underlying.transferFrom(
            msg.sender,
            address(asset.creditToken),
            amount
        );
    }

    function healthFactorOf(
        address user
    ) external view override returns (uint256) {
        return _healthFactorOf(user);
    }

    function _healthFactorOf(address user) internal view returns (uint256) {
        return _healthFactorAfterDecrease(user, address(0), 0, 0);
    }

    function _healthFactorAfterDecrease(
        address user,
        address _asset,
        uint256 collateralDecreased,
        uint256 borrowAdded
    ) internal view returns (uint256) {
        uint256 totalBorrowsInUsd = 0;
        uint256 totalCollateral = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            Asset memory asset = assetList[i];
            totalBorrowsInUsd += amountInUsd(
                address(asset.underlying),
                asset.debtToken.balanceOf(user)
            );
            uint256 collateralAmountInUsd = amountInUsd(
                address(asset.underlying),
                asset.creditToken.collateralAmountOf(user)
            );
            uint256 collateralizable = collateralAmountInUsd *
                asset.liquidationThreshold;
            totalCollateral += collateralizable;
            if (_asset == address(asset.underlying)) {
                totalBorrowsInUsd += amountInUsd(
                    address(asset.underlying),
                    borrowAdded
                );
                totalCollateral -= amountInUsd(
                    address(asset.underlying),
                    collateralDecreased
                );
            }
        }
        if (totalBorrowsInUsd == 0) {
            return type(uint256).max;
        }
        return totalCollateral / totalBorrowsInUsd;
    }

    function initReserve(
        address reserve,
        address creditToken,
        address debtToken
    ) external override onlyOwner {
        Asset memory asset = Asset({
            underlying: IERC20Metadata(reserve),
            creditToken: ICreditToken(creditToken),
            debtToken: IDebtToken(debtToken),
            symbol: IERC20Metadata(reserve).symbol(),
            liquidationThreshold: (80 * BASE) / 100 // 80%
        });
        assets[reserve] = asset;
        assetList.push(asset);
        assetAddresses[asset.symbol] = reserve;
    }

    function liquidationCall(
        address collateral,
        address debt,
        address user,
        uint256 debtToCover
    ) external override {
        Asset memory debtAsset = assets[debt];
        debtAsset.underlying.transferFrom(
            msg.sender,
            address(debtAsset.creditToken),
            _liquidationCallOnBehalfOf(
                collateral,
                debt,
                user,
                debtToCover,
                msg.sender
            )
        );
    }

    //function liquidationCallByChainsight(
    //    address collateral,
    //    address debt,
    //    address user,
    //    uint256 debtToCover,
    //    address onBehalfOf
    //) external override onlyChainsight returns (uint256) {
    //    return
    //        _liquidationCallOnBehalfOf(
    //            collateral,
    //            debt,
    //            user,
    //            debtToCover,
    //            onBehalfOf
    //        );
    //}

    function amountNeededToLiquidate(
        address collateral,
        address debt,
        address user,
        uint256 debtToCover
    ) external view override returns (uint256) {
        (, uint256 act) = _actualDebtToLiquidate(
            collateral,
            debt,
            user,
            debtToCover
        );
        return act;
    }

    function lockFor(
        address asset,
        uint256 amount,
        uint256 dstChainId
    ) external override {
        assets[asset].creditToken.lockFor(msg.sender, amount, dstChainId);
        emit LockCreated(
            msg.sender,
            asset,
            assets[asset].underlying.symbol(),
            amount,
            dstChainId
        );
    }

    function _actualDebtToLiquidate(
        address collateral,
        address debt,
        address user,
        uint256 debtToCover
    ) internal view returns (uint256 max, uint256 act) {
        Asset memory collateralAsset = assets[collateral];
        Asset memory debtAsset = assets[debt];
        uint256 debtAmount = debtAsset.debtToken.balanceOf(user);
        uint256 maxLiquidatable = debtAmount / 2;
        act = debtToCover > maxLiquidatable ? maxLiquidatable : debtToCover;
        (
            uint256 maxAmountCollateralToLiquidate,
            uint256 debtAmountNeeded
        ) = _calculateAvailableCollateralToLiquidate(
                collateral,
                debt,
                act,
                collateralAsset.creditToken.collateralAmountOf(user)
            );
        if (debtAmountNeeded < act) {
            act = debtAmountNeeded;
        }
        return (maxAmountCollateralToLiquidate, act);
    }

    function _liquidationCallOnBehalfOf(
        address collateral,
        address debt,
        address user,
        uint256 debtToCover,
        address onBehalfOf
    ) internal returns (uint256) {
        require(
            _healthFactorOf(user) < BASE,
            "health factor is not low enough"
        );
        Asset memory collateralAsset = assets[collateral];
        Asset memory debtAsset = assets[debt];
        (
            uint256 maxAmountCollateralToLiquidate,
            uint256 act
        ) = _actualDebtToLiquidate(collateral, debt, user, debtToCover);
        uint256 currentAvailableCollateral = collateralAsset
            .underlying
            .balanceOf(address(collateralAsset.creditToken));
        require(
            currentAvailableCollateral >= maxAmountCollateralToLiquidate,
            "not enough collateral to liquidate"
        );
        debtAsset.debtToken.burn(user, act);
        uint256 releaseableOnCurrentChain = collateralAsset
            .creditToken
            .unlockedBalanceOf(user);
        if (releaseableOnCurrentChain > 0) {
            collateralAsset.creditToken.burn(
                user,
                onBehalfOf,
                releaseableOnCurrentChain > maxAmountCollateralToLiquidate
                    ? maxAmountCollateralToLiquidate
                    : releaseableOnCurrentChain
            );
        }
        // if enough collateral on curre1nt chain, it's done
        if (releaseableOnCurrentChain >= maxAmountCollateralToLiquidate) {
            return act;
        }
        // burn CreditToken on other chains
        uint256 amountToBurn = maxAmountCollateralToLiquidate -
            releaseableOnCurrentChain;
        _liquidateOnOtherChain(user, onBehalfOf, collateral, amountToBurn);
        return act;
    }

    function unLockFor(
        address asset,
        uint256 amount,
        uint256 srcChainId
    ) external override {
        require(
            _healthFactorAfterDecrease(msg.sender, asset, amount, 0) >= BASE,
            "health factor is too low"
        );
        assets[asset].creditToken.unlockFor(msg.sender, amount, srcChainId);
        emit LockReleased(
            msg.sender,
            asset,
            assets[asset].underlying.symbol(),
            amount,
            srcChainId,
            msg.sender
        );
    }

    function _liquidateOnOtherChain(
        address user,
        address onBehalfOf,
        address asset,
        uint256 amountToBurn
    ) internal {
        Asset memory collateralAsset = assets[asset];
        uint256[] memory _chainIds = collateralAsset.creditToken.chainIds();
        for (uint256 i = 0; i < _chainIds.length; i++) {
            uint256 chainId = _chainIds[i];
            uint256 lockedFrom = collateralAsset.creditToken.amountLockedFrom(
                user,
                chainId
            );
            if (lockedFrom == 0) {
                continue;
            }
            uint256 amountToBurnFromChain = amountToBurn > lockedFrom
                ? lockedFrom
                : amountToBurn;
            amountToBurn -= amountToBurnFromChain;
            collateralAsset.creditToken.unlockFor(
                user,
                amountToBurnFromChain,
                chainId
            );
            emit LockReleased(
                user,
                asset,
                collateralAsset.symbol,
                amountToBurnFromChain,
                chainId,
                onBehalfOf
            );
            if (amountToBurn == 0) {
                break;
            }
        }
    }

    struct AvailableCollateralToLiquidateLocalVars {
        uint256 userCompoundedBorrowBalance;
        uint256 liquidationBonus;
        uint256 collateralPrice;
        uint256 debtAssetPrice;
        uint256 maxAmountCollateralToLiquidate;
        uint256 debtAssetDecimals;
        uint256 collateralDecimals;
    }

    function _calculateAvailableCollateralToLiquidate(
        address collateralAsset,
        address debtAsset,
        uint256 debtToCover,
        uint256 userCollateralBalance
    ) internal view returns (uint256, uint256) {
        uint256 collateralAmount = 0;
        uint256 debtAmountNeeded = 0;
        AvailableCollateralToLiquidateLocalVars memory vars;
        vars.collateralPrice = priceOracle.getPriceInUsd(
            assets[collateralAsset].symbol
        );
        vars.debtAssetPrice = priceOracle.getPriceInUsd(
            assets[debtAsset].symbol
        );
        vars.collateralDecimals = assets[collateralAsset].underlying.decimals();
        vars.debtAssetDecimals = assets[debtAsset].underlying.decimals();
        vars.maxAmountCollateralToLiquidate =
            (vars.debtAssetPrice *
                debtToCover *
                (10 ** vars.collateralDecimals)) /
            (vars.collateralPrice * (10 ** vars.debtAssetDecimals));
        if (vars.maxAmountCollateralToLiquidate > userCollateralBalance) {
            collateralAmount = userCollateralBalance;
            debtAmountNeeded =
                (vars.collateralPrice *
                    collateralAmount *
                    (10 ** vars.debtAssetDecimals)) /
                (vars.debtAssetPrice * (10 ** vars.collateralDecimals));
        } else {
            collateralAmount = vars.maxAmountCollateralToLiquidate;
            debtAmountNeeded = debtToCover;
        }
        return (collateralAmount, debtAmountNeeded);
    }
}
