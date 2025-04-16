// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TSHC.sol";

/**
 * @title Reserve
 * @notice Manages the collateral backing the TSHC stablecoin
 * @dev This contract handles deposits and withdrawals of collateral assets,
 *      and minting/burning of TSHC based on collateral changes
 */
contract Reserve is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant RESERVE_ADMIN_ROLE = keccak256("RESERVE_ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // TSHC token contract
    TSHC public tshc;

    // Supported collateral assets
    struct CollateralAsset {
        bool isSupported;
        uint256 collateralRatio; // Represented as percentage * 100 (e.g., 150% = 15000)
        uint256 totalDeposited;
    }

    mapping(address => CollateralAsset) public collateralAssets;
    address[] public supportedCollaterals;

    // Minimum collateralization ratio (150% = 15000)
    uint256 public minimumCollateralRatio = 15000;

    // Events
    event CollateralAdded(address indexed token, uint256 collateralRatio);
    event CollateralRemoved(address indexed token);
    event CollateralRatioUpdated(address indexed token, uint256 oldRatio, uint256 newRatio);
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount, uint256 tshcMinted);
    event CollateralWithdrawn(address indexed user, address indexed token, uint256 amount, uint256 tshcBurned);
    event MinimumCollateralRatioUpdated(uint256 oldRatio, uint256 newRatio);

    /**
     * @dev Constructor initializes the contract with basic roles and TSHC token
     * @param _tshc The address of the TSHC token contract
     * @param _admin The address that will have the admin role
     */
    constructor(address _tshc, address _admin) {
        require(_tshc != address(0), "TSHC address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        tshc = TSHC(_tshc);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RESERVE_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(RESERVE_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(OPERATOR_ROLE, RESERVE_ADMIN_ROLE);
    }

    /**
     * @dev Add a new collateral asset
     * @param _token Address of the collateral token
     * @param _collateralRatio Initial collateral ratio for the token
     */
    function addCollateralAsset(address _token, uint256 _collateralRatio) 
        external 
        onlyRole(RESERVE_ADMIN_ROLE) 
    {
        require(_token != address(0), "Token address cannot be zero");
        require(!collateralAssets[_token].isSupported, "Collateral already supported");
        require(_collateralRatio >= minimumCollateralRatio, "Collateral ratio too low");

        collateralAssets[_token] = CollateralAsset({
            isSupported: true,
            collateralRatio: _collateralRatio,
            totalDeposited: 0
        });

        supportedCollaterals.push(_token);
        
        emit CollateralAdded(_token, _collateralRatio);
    }

    /**
     * @dev Remove a collateral asset
     * @param _token Address of the collateral token to remove
     */
    function removeCollateralAsset(address _token) 
        external 
        onlyRole(RESERVE_ADMIN_ROLE) 
    {
        require(collateralAssets[_token].isSupported, "Collateral not supported");
        require(collateralAssets[_token].totalDeposited == 0, "Collateral still in use");

        collateralAssets[_token].isSupported = false;

        // Remove from supported collaterals array
        for (uint256 i = 0; i < supportedCollaterals.length; i++) {
            if (supportedCollaterals[i] == _token) {
                supportedCollaterals[i] = supportedCollaterals[supportedCollaterals.length - 1];
                supportedCollaterals.pop();
                break;
            }
        }

        emit CollateralRemoved(_token);
    }

    /**
     * @dev Update collateral ratio for a specific asset
     * @param _token Address of the collateral token
     * @param _newRatio New collateral ratio
     */
    function updateCollateralRatio(address _token, uint256 _newRatio) 
        external 
        onlyRole(RESERVE_ADMIN_ROLE) 
    {
        require(collateralAssets[_token].isSupported, "Collateral not supported");
        require(_newRatio >= minimumCollateralRatio, "Collateral ratio too low");

        uint256 oldRatio = collateralAssets[_token].collateralRatio;
        collateralAssets[_token].collateralRatio = _newRatio;

        emit CollateralRatioUpdated(_token, oldRatio, _newRatio);
    }

    /**
     * @dev Update minimum collateral ratio
     * @param _newMinRatio New minimum collateral ratio
     */
    function updateMinimumCollateralRatio(uint256 _newMinRatio) 
        external 
        onlyRole(RESERVE_ADMIN_ROLE) 
    {
        require(_newMinRatio >= 10000, "Minimum ratio must be at least 100%");
        
        uint256 oldRatio = minimumCollateralRatio;
        minimumCollateralRatio = _newMinRatio;

        emit MinimumCollateralRatioUpdated(oldRatio, _newMinRatio);
    }

    /**
     * @dev Deposit collateral and mint TSHC
     * @param _token Address of the collateral token
     * @param _amount Amount of collateral to deposit
     * @return tshcAmount Amount of TSHC minted
     */
    function depositCollateralAndMintTSHC(address _token, uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 tshcAmount) 
    {
        require(collateralAssets[_token].isSupported, "Collateral not supported");
        require(_amount > 0, "Amount must be greater than zero");

        // Calculate TSHC to mint based on collateral ratio
        // For simplicity, assuming 1:1 value between collateral and TSHC
        // In a real implementation, would use an oracle for price conversion
        tshcAmount = (_amount * 10000) / collateralAssets[_token].collateralRatio;

        // Transfer collateral from user to reserve
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Update total deposited
        collateralAssets[_token].totalDeposited += _amount;

        // Mint TSHC to user
        tshc.mint(msg.sender, tshcAmount);

        emit CollateralDeposited(msg.sender, _token, _amount, tshcAmount);

        return tshcAmount;
    }

    /**
     * @dev Burn TSHC and withdraw collateral
     * @param _token Address of the collateral token
     * @param _tshcAmount Amount of TSHC to burn
     * @return collateralAmount Amount of collateral withdrawn
     */
    function burnTSHCAndWithdrawCollateral(address _token, uint256 _tshcAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 collateralAmount) 
    {
        require(collateralAssets[_token].isSupported, "Collateral not supported");
        require(_tshcAmount > 0, "Amount must be greater than zero");

        // Calculate collateral to withdraw based on collateral ratio
        // For simplicity, assuming 1:1 value between collateral and TSHC
        collateralAmount = (_tshcAmount * collateralAssets[_token].collateralRatio) / 10000;

        require(collateralAmount <= collateralAssets[_token].totalDeposited, "Insufficient collateral in reserve");

        // Burn TSHC from user
        tshc.burnFrom(msg.sender, _tshcAmount);

        // Update total deposited
        collateralAssets[_token].totalDeposited -= collateralAmount;

        // Transfer collateral to user
        IERC20(_token).safeTransfer(msg.sender, collateralAmount);

        emit CollateralWithdrawn(msg.sender, _token, collateralAmount, _tshcAmount);

        return collateralAmount;
    }

    /**
     * @dev Get total collateral value in the reserve
     * @return totalValue Total value of all collateral assets
     */
    function getTotalCollateralValue() external view returns (uint256 totalValue) {
        totalValue = 0;
        
        for (uint256 i = 0; i < supportedCollaterals.length; i++) {
            address token = supportedCollaterals[i];
            if (collateralAssets[token].isSupported) {
                // In a real implementation, would use an oracle for price conversion
                totalValue += collateralAssets[token].totalDeposited;
            }
        }
        
        return totalValue;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(RESERVE_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(RESERVE_ADMIN_ROLE) {
        _unpause();
    }
}
