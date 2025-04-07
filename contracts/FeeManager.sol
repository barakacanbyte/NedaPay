// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./TSHC.sol";

/**
 * @title FeeManager
 * @notice Manages transaction fees for the NEDA Pay platform
 * @dev This contract handles fee collection, distribution, and discount tiers
 */
contract FeeManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ADMIN_ROLE = keccak256("FEE_ADMIN_ROLE");
    bytes32 public constant FEE_COLLECTOR_ROLE = keccak256("FEE_COLLECTOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // TSHC token contract
    TSHC public tshc;

    // Fee settings
    uint256 public baseFeeRate = 50; // 0.5% (in basis points, 1 bp = 0.01%)
    uint256 public constant MAX_FEE_RATE = 200; // 2% maximum fee
    
    // Fee distribution
    address public treasury;
    uint256 public treasuryShare = 7000; // 70% of fees go to treasury (basis points)
    uint256 public infrastructureShare = 3000; // 30% of fees go to infrastructure (basis points)
    
    // Fee discount tiers based on user volume
    struct DiscountTier {
        uint256 minimumVolume; // Minimum transaction volume to qualify
        uint256 discountRate;  // Discount rate in basis points (100 = 1%)
    }
    
    DiscountTier[] public discountTiers;
    
    // User transaction volumes
    mapping(address => uint256) public userVolume;
    
    // Collected fees
    uint256 public totalFeesCollected;
    uint256 public unclaimedTreasuryFees;
    uint256 public unclaimedInfrastructureFees;
    
    // Events
    event FeeCollected(address indexed user, uint256 amount, uint256 fee, uint256 discountApplied);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryShareUpdated(uint256 oldShare, uint256 newShare);
    event TreasuryAddressUpdated(address oldTreasury, address newTreasury);
    event DiscountTierAdded(uint256 minimumVolume, uint256 discountRate);
    event DiscountTierRemoved(uint256 minimumVolume);
    event TreasuryFeesWithdrawn(address indexed to, uint256 amount);
    event InfrastructureFeesWithdrawn(address indexed to, uint256 amount);

    /**
     * @dev Constructor initializes the contract with basic roles and TSHC token
     * @param _tshc The address of the TSHC token contract
     * @param _admin The address that will have the admin role
     * @param _treasury The address of the treasury
     */
    constructor(address _tshc, address _admin, address _treasury) {
        require(_tshc != address(0), "TSHC address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");
        require(_treasury != address(0), "Treasury address cannot be zero");

        tshc = TSHC(_tshc);
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FEE_ADMIN_ROLE, _admin);
        _grantRole(FEE_COLLECTOR_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _treasury);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(FEE_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(FEE_COLLECTOR_ROLE, FEE_ADMIN_ROLE);
        _setRoleAdmin(TREASURY_ROLE, FEE_ADMIN_ROLE);
        
        // Set up default discount tiers
        discountTiers.push(DiscountTier({minimumVolume: 1000 * 10**18, discountRate: 1000})); // 10% discount for 1000+ TSHC volume
        discountTiers.push(DiscountTier({minimumVolume: 10000 * 10**18, discountRate: 2000})); // 20% discount for 10,000+ TSHC volume
        discountTiers.push(DiscountTier({minimumVolume: 100000 * 10**18, discountRate: 5000})); // 50% discount for 100,000+ TSHC volume
    }

    /**
     * @dev Calculate fee for a given transaction amount
     * @param _user Address of the user making the transaction
     * @param _amount Transaction amount
     * @return fee The calculated fee amount
     * @return discountApplied The discount applied (in basis points)
     */
    function calculateFee(address _user, uint256 _amount) public view returns (uint256 fee, uint256 discountApplied) {
        // Get user's discount tier based on volume
        discountApplied = getUserDiscountRate(_user);
        
        // Calculate base fee
        uint256 baseFee = (_amount * baseFeeRate) / 10000;
        
        // Apply discount
        fee = baseFee * (10000 - discountApplied) / 10000;
        
        return (fee, discountApplied);
    }
    
    /**
     * @dev Get user's discount rate based on their transaction volume
     * @param _user Address of the user
     * @return discountRate The discount rate in basis points
     */
    function getUserDiscountRate(address _user) public view returns (uint256 discountRate) {
        uint256 volume = userVolume[_user];
        uint256 highestDiscount = 0;
        
        for (uint256 i = 0; i < discountTiers.length; i++) {
            if (volume >= discountTiers[i].minimumVolume && 
                discountTiers[i].discountRate > highestDiscount) {
                highestDiscount = discountTiers[i].discountRate;
            }
        }
        
        return highestDiscount;
    }

    /**
     * @dev Collect fee for a transaction
     * @param _user Address of the user making the transaction
     * @param _amount Transaction amount
     * @return netAmount The amount after fee deduction
     */
    function collectFee(address _user, uint256 _amount) 
        external 
        onlyRole(FEE_COLLECTOR_ROLE) 
        nonReentrant 
        returns (uint256 netAmount) 
    {
        (uint256 fee, uint256 discountApplied) = calculateFee(_user, _amount);
        
        // Update user's volume
        userVolume[_user] += _amount;
        
        // Calculate net amount
        netAmount = _amount - fee;
        
        // Update fee statistics
        totalFeesCollected += fee;
        
        // Distribute fees
        uint256 treasuryFee = (fee * treasuryShare) / 10000;
        uint256 infrastructureFee = fee - treasuryFee;
        
        unclaimedTreasuryFees += treasuryFee;
        unclaimedInfrastructureFees += infrastructureFee;
        
        emit FeeCollected(_user, _amount, fee, discountApplied);
        
        return netAmount;
    }

    /**
     * @dev Update the base fee rate
     * @param _newRate New fee rate in basis points
     */
    function updateFeeRate(uint256 _newRate) external onlyRole(FEE_ADMIN_ROLE) {
        require(_newRate <= MAX_FEE_RATE, "Fee rate exceeds maximum");
        
        uint256 oldRate = baseFeeRate;
        baseFeeRate = _newRate;
        
        emit FeeRateUpdated(oldRate, _newRate);
    }

    /**
     * @dev Update treasury share of fees
     * @param _newShare New treasury share in basis points
     */
    function updateTreasuryShare(uint256 _newShare) external onlyRole(FEE_ADMIN_ROLE) {
        require(_newShare <= 10000, "Share exceeds 100%");
        
        uint256 oldShare = treasuryShare;
        treasuryShare = _newShare;
        infrastructureShare = 10000 - _newShare;
        
        emit TreasuryShareUpdated(oldShare, _newShare);
    }

    /**
     * @dev Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasuryAddress(address _newTreasury) external onlyRole(FEE_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Treasury cannot be zero address");
        
        address oldTreasury = treasury;
        treasury = _newTreasury;
        
        // Revoke old treasury role and grant to new treasury
        _revokeRole(TREASURY_ROLE, oldTreasury);
        _grantRole(TREASURY_ROLE, _newTreasury);
        
        emit TreasuryAddressUpdated(oldTreasury, _newTreasury);
    }

    /**
     * @dev Add a new discount tier
     * @param _minimumVolume Minimum transaction volume to qualify
     * @param _discountRate Discount rate in basis points
     */
    function addDiscountTier(uint256 _minimumVolume, uint256 _discountRate) external onlyRole(FEE_ADMIN_ROLE) {
        require(_discountRate <= 10000, "Discount cannot exceed 100%");
        
        // Check if tier with this minimum volume already exists
        for (uint256 i = 0; i < discountTiers.length; i++) {
            require(discountTiers[i].minimumVolume != _minimumVolume, "Tier with this volume already exists");
        }
        
        discountTiers.push(DiscountTier({
            minimumVolume: _minimumVolume,
            discountRate: _discountRate
        }));
        
        emit DiscountTierAdded(_minimumVolume, _discountRate);
    }

    /**
     * @dev Remove a discount tier
     * @param _minimumVolume Minimum volume of the tier to remove
     */
    function removeDiscountTier(uint256 _minimumVolume) external onlyRole(FEE_ADMIN_ROLE) {
        for (uint256 i = 0; i < discountTiers.length; i++) {
            if (discountTiers[i].minimumVolume == _minimumVolume) {
                // Move the last element to the position of the element to delete
                discountTiers[i] = discountTiers[discountTiers.length - 1];
                // Remove the last element
                discountTiers.pop();
                
                emit DiscountTierRemoved(_minimumVolume);
                return;
            }
        }
        
        revert("Tier not found");
    }

    /**
     * @dev Withdraw treasury fees
     * @param _to Address to send fees to
     * @param _amount Amount to withdraw
     */
    function withdrawTreasuryFees(address _to, uint256 _amount) 
        external 
        onlyRole(TREASURY_ROLE) 
        nonReentrant 
    {
        require(_to != address(0), "Cannot withdraw to zero address");
        require(_amount > 0 && _amount <= unclaimedTreasuryFees, "Invalid amount");
        
        unclaimedTreasuryFees -= _amount;
        
        // Transfer TSHC from this contract to the recipient
        tshc.transfer(_to, _amount);
        
        emit TreasuryFeesWithdrawn(_to, _amount);
    }

    /**
     * @dev Withdraw infrastructure fees
     * @param _to Address to send fees to
     * @param _amount Amount to withdraw
     */
    function withdrawInfrastructureFees(address _to, uint256 _amount) 
        external 
        onlyRole(FEE_ADMIN_ROLE) 
        nonReentrant 
    {
        require(_to != address(0), "Cannot withdraw to zero address");
        require(_amount > 0 && _amount <= unclaimedInfrastructureFees, "Invalid amount");
        
        unclaimedInfrastructureFees -= _amount;
        
        // Transfer TSHC from this contract to the recipient
        tshc.transfer(_to, _amount);
        
        emit InfrastructureFeesWithdrawn(_to, _amount);
    }
}
