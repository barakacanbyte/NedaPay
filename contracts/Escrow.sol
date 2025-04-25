// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TSHC.sol";

/**
 * @title Escrow
 * @notice Manages escrow payments for NEDA Pay platform
 * @dev This contract handles secure payments between buyers and sellers with
 *      dispute resolution capabilities
 */
contract Escrow is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ESCROW_ADMIN_ROLE = keccak256("ESCROW_ADMIN_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    // TSHC token contract
    TSHC public tshc;

    // Escrow states
    enum EscrowState {
        Created,
        Funded,
        Completed,
        Refunded,
        Disputed,
        Resolved
    }

    // Dispute resolution options
    enum Resolution {
        None,
        ReleaseToBuyer,
        ReleaseToSeller,
        Split
    }

    // Escrow data structure
    struct EscrowData {
        address buyer;
        address seller;
        uint256 amount;
        uint256 fee;
        uint256 createdAt;
        uint256 expiresAt;
        string metadata;
        EscrowState state;
        Resolution resolution;
        string disputeReason;
    }

    // Escrow storage
    uint256 public escrowCount;
    mapping(uint256 => EscrowData) public escrows;

    // Platform fee
    uint256 public platformFeeRate = 100; // 1% in basis points
    address public feeCollector;

    // Dispute resolution timeframe
    uint256 public disputeResolutionPeriod = 7 days;

    // Events
    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 expiresAt);
    event EscrowFunded(uint256 indexed escrowId, uint256 amount);
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowRefunded(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId, string reason);
    event EscrowResolved(uint256 indexed escrowId, Resolution resolution);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event DisputeResolutionPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    /**
     * @dev Constructor initializes the contract with basic roles and TSHC token
     * @param _tshc The address of the TSHC token contract
     * @param _admin The address that will have the admin role
     * @param _feeCollector The address that will collect platform fees
     */
    constructor(address _tshc, address _admin, address _feeCollector) {
        require(_tshc != address(0), "TSHC address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");
        require(_feeCollector != address(0), "Fee collector address cannot be zero");

        tshc = TSHC(_tshc);
        feeCollector = _feeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ESCROW_ADMIN_ROLE, _admin);
        _grantRole(ARBITRATOR_ROLE, _admin);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(ESCROW_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ARBITRATOR_ROLE, ESCROW_ADMIN_ROLE);
    }

    /**
     * @dev Create a new escrow
     * @param _seller The address of the seller
     * @param _amount The amount to be escrowed
     * @param _expiresAt The expiration timestamp
     * @param _metadata Additional metadata about the transaction
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address _seller,
        uint256 _amount,
        uint256 _expiresAt,
        string calldata _metadata
    ) 
        external 
        whenNotPaused 
        returns (uint256 escrowId) 
    {
        require(_seller != address(0), "Seller cannot be zero address");
        require(_seller != msg.sender, "Seller cannot be buyer");
        require(_amount > 0, "Amount must be greater than zero");
        require(_expiresAt > block.timestamp, "Expiration must be in the future");

        // Calculate platform fee
        uint256 fee = (_amount * platformFeeRate) / 10000;
        
        // Create escrow
        escrowId = escrowCount++;
        escrows[escrowId] = EscrowData({
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            fee: fee,
            createdAt: block.timestamp,
            expiresAt: _expiresAt,
            metadata: _metadata,
            state: EscrowState.Created,
            resolution: Resolution.None,
            disputeReason: ""
        });

        emit EscrowCreated(escrowId, msg.sender, _seller, _amount, _expiresAt);
        
        return escrowId;
    }

    /**
     * @dev Fund an escrow with TSHC
     * @param _escrowId The ID of the escrow to fund
     */
    function fundEscrow(uint256 _escrowId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        EscrowData storage escrow = escrows[_escrowId];
        
        require(escrow.buyer == msg.sender, "Only buyer can fund escrow");
        require(escrow.state == EscrowState.Created, "Escrow not in Created state");
        require(block.timestamp < escrow.expiresAt, "Escrow has expired");

        // Total amount including fee
        uint256 totalAmount = escrow.amount + escrow.fee;
        
        // Transfer TSHC from buyer to this contract
        tshc.transferFrom(msg.sender, address(this), totalAmount);
        
        // Update escrow state
        escrow.state = EscrowState.Funded;
        
        emit EscrowFunded(_escrowId, escrow.amount);
    }

    /**
     * @dev Complete an escrow and release funds to the seller
     * @param _escrowId The ID of the escrow to complete
     */
    function completeEscrow(uint256 _escrowId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        EscrowData storage escrow = escrows[_escrowId];
        
        require(escrow.buyer == msg.sender, "Only buyer can complete escrow");
        require(escrow.state == EscrowState.Funded, "Escrow not in Funded state");

        // Transfer fee to fee collector
        tshc.transfer(feeCollector, escrow.fee);
        
        // Transfer amount to seller
        tshc.transfer(escrow.seller, escrow.amount);
        
        // Update escrow state
        escrow.state = EscrowState.Completed;
        
        emit EscrowCompleted(_escrowId);
    }

    /**
     * @dev Refund an escrow to the buyer
     * @param _escrowId The ID of the escrow to refund
     */
    function refundEscrow(uint256 _escrowId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        EscrowData storage escrow = escrows[_escrowId];
        
        // Can be called by seller or admin if expired
        bool isSellerOrAdmin = escrow.seller == msg.sender || hasRole(ESCROW_ADMIN_ROLE, msg.sender);
        bool isExpired = block.timestamp >= escrow.expiresAt;
        
        require(
            (isSellerOrAdmin && escrow.state == EscrowState.Funded) || 
            (escrow.buyer == msg.sender && isExpired && escrow.state == EscrowState.Funded),
            "Not authorized to refund or escrow not in correct state"
        );

        // Transfer total amount back to buyer
        tshc.transfer(escrow.buyer, escrow.amount + escrow.fee);
        
        // Update escrow state
        escrow.state = EscrowState.Refunded;
        
        emit EscrowRefunded(_escrowId);
    }

    /**
     * @dev Raise a dispute for an escrow
     * @param _escrowId The ID of the escrow
     * @param _reason The reason for the dispute
     */
    function raiseDispute(uint256 _escrowId, string calldata _reason) 
        external 
        whenNotPaused 
    {
        EscrowData storage escrow = escrows[_escrowId];
        
        require(
            escrow.buyer == msg.sender || escrow.seller == msg.sender,
            "Only buyer or seller can raise dispute"
        );
        require(escrow.state == EscrowState.Funded, "Escrow not in Funded state");
        require(bytes(_reason).length > 0, "Reason cannot be empty");

        // Update escrow state
        escrow.state = EscrowState.Disputed;
        escrow.disputeReason = _reason;
        
        emit EscrowDisputed(_escrowId, _reason);
    }

    /**
     * @dev Resolve a disputed escrow
     * @param _escrowId The ID of the escrow
     * @param _resolution The resolution decision
     */
    function resolveDispute(uint256 _escrowId, Resolution _resolution) 
        external 
        nonReentrant 
        onlyRole(ARBITRATOR_ROLE) 
        whenNotPaused 
    {
        EscrowData storage escrow = escrows[_escrowId];
        
        require(escrow.state == EscrowState.Disputed, "Escrow not in Disputed state");
        require(_resolution != Resolution.None, "Invalid resolution");

        // Apply resolution
        if (_resolution == Resolution.ReleaseToBuyer) {
            // Return full amount including fee to buyer
            tshc.transfer(escrow.buyer, escrow.amount + escrow.fee);
        } else if (_resolution == Resolution.ReleaseToSeller) {
            // Transfer fee to fee collector
            tshc.transfer(feeCollector, escrow.fee);
            // Transfer amount to seller
            tshc.transfer(escrow.seller, escrow.amount);
        } else if (_resolution == Resolution.Split) {
            // Split the amount 50/50 between buyer and seller
            uint256 halfAmount = escrow.amount / 2;
            // Transfer fee to fee collector
            tshc.transfer(feeCollector, escrow.fee);
            // Transfer half to seller
            tshc.transfer(escrow.seller, halfAmount);
            // Transfer half to buyer
            tshc.transfer(escrow.buyer, escrow.amount - halfAmount);
        }
        
        // Update escrow state
        escrow.state = EscrowState.Resolved;
        escrow.resolution = _resolution;
        
        emit EscrowResolved(_escrowId, _resolution);
    }

    /**
     * @dev Update the platform fee rate
     * @param _newFeeRate New fee rate in basis points
     */
    function updatePlatformFee(uint256 _newFeeRate) 
        external 
        onlyRole(ESCROW_ADMIN_ROLE) 
    {
        require(_newFeeRate <= 1000, "Fee cannot exceed 10%");
        
        uint256 oldFee = platformFeeRate;
        platformFeeRate = _newFeeRate;
        
        emit PlatformFeeUpdated(oldFee, _newFeeRate);
    }

    /**
     * @dev Update the fee collector address
     * @param _newFeeCollector New fee collector address
     */
    function updateFeeCollector(address _newFeeCollector) 
        external 
        onlyRole(ESCROW_ADMIN_ROLE) 
    {
        require(_newFeeCollector != address(0), "Fee collector cannot be zero address");
        
        address oldCollector = feeCollector;
        feeCollector = _newFeeCollector;
        
        emit FeeCollectorUpdated(oldCollector, _newFeeCollector);
    }

    /**
     * @dev Update the dispute resolution period
     * @param _newPeriod New period in seconds
     */
    function updateDisputeResolutionPeriod(uint256 _newPeriod) 
        external 
        onlyRole(ESCROW_ADMIN_ROLE) 
    {
        require(_newPeriod >= 1 days, "Period must be at least 1 day");
        
        uint256 oldPeriod = disputeResolutionPeriod;
        disputeResolutionPeriod = _newPeriod;
        
        emit DisputeResolutionPeriodUpdated(oldPeriod, _newPeriod);
    }

    /**
     * @dev Get escrow details
     * @param _escrowId The ID of the escrow
     * @return buyer The buyer address
     * @return seller The seller address
     * @return amount The amount held in escrow
     * @return fee The escrow fee
     * @return createdAt The escrow creation timestamp
     * @return expiresAt The escrow expiration timestamp
     * @return metadata The metadata string
     * @return state The escrow state
     * @return resolution The dispute resolution
     * @return disputeReason The reason for dispute, if any
     */
    function getEscrow(uint256 _escrowId) 
        external 
        view 
        returns (
            address buyer,
            address seller,
            uint256 amount,
            uint256 fee,
            uint256 createdAt,
            uint256 expiresAt,
            string memory metadata,
            EscrowState state,
            Resolution resolution,
            string memory disputeReason
        ) 
    {
        EscrowData storage escrow = escrows[_escrowId];
        
        return (
            escrow.buyer,
            escrow.seller,
            escrow.amount,
            escrow.fee,
            escrow.createdAt,
            escrow.expiresAt,
            escrow.metadata,
            escrow.state,
            escrow.resolution,
            escrow.disputeReason
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ESCROW_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ESCROW_ADMIN_ROLE) {
        _unpause();
    }
}
