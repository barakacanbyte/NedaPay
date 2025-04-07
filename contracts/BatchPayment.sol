// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TSHC.sol";
import "./FeeManager.sol";

/**
 * @title BatchPayment
 * @notice Enables efficient batch payments for the NEDA Pay platform
 * @dev This contract allows users to send TSHC to multiple recipients in a single transaction
 */
contract BatchPayment is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant BATCH_ADMIN_ROLE = keccak256("BATCH_ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // TSHC token contract
    TSHC public tshc;
    
    // Fee manager contract
    FeeManager public feeManager;

    // Batch payment data
    struct BatchPaymentData {
        address sender;
        address[] recipients;
        uint256[] amounts;
        string reference;
        uint256 timestamp;
        bool processed;
        uint256 totalAmount;
        uint256 totalFee;
    }

    // Batch payment storage
    uint256 public batchCount;
    mapping(uint256 => BatchPaymentData) public batchPayments;

    // Limits
    uint256 public maxRecipientsPerBatch = 100;
    uint256 public minAmountPerRecipient = 1 * 10**18; // 1 TSHC

    // Events
    event BatchPaymentCreated(uint256 indexed batchId, address indexed sender, uint256 totalAmount, uint256 totalFee, string reference);
    event BatchPaymentProcessed(uint256 indexed batchId);
    event MaxRecipientsUpdated(uint256 oldMax, uint256 newMax);
    event MinAmountUpdated(uint256 oldMin, uint256 newMin);
    event FeeManagerUpdated(address oldManager, address newManager);

    /**
     * @dev Constructor initializes the contract with basic roles and TSHC token
     * @param _tshc The address of the TSHC token contract
     * @param _feeManager The address of the fee manager contract
     * @param _admin The address that will have the admin role
     */
    constructor(address _tshc, address _feeManager, address _admin) {
        require(_tshc != address(0), "TSHC address cannot be zero");
        require(_feeManager != address(0), "Fee manager address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        tshc = TSHC(_tshc);
        feeManager = FeeManager(_feeManager);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(BATCH_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(BATCH_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(OPERATOR_ROLE, BATCH_ADMIN_ROLE);
    }

    /**
     * @dev Create a new batch payment
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to send to each recipient
     * @param _reference Reference information for the batch payment
     * @return batchId The ID of the created batch payment
     */
    function createBatchPayment(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _reference
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 batchId) 
    {
        require(_recipients.length == _amounts.length, "Recipients and amounts length mismatch");
        require(_recipients.length > 0, "Empty batch");
        require(_recipients.length <= maxRecipientsPerBatch, "Too many recipients");

        uint256 totalAmount = 0;
        
        // Validate recipients and amounts
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Recipient cannot be zero address");
            require(_amounts[i] >= minAmountPerRecipient, "Amount below minimum");
            totalAmount += _amounts[i];
        }
        
        require(totalAmount > 0, "Total amount must be greater than zero");
        
        // Calculate total fee
        (uint256 totalFee, ) = feeManager.calculateFee(msg.sender, totalAmount);
        
        // Create batch payment
        batchId = batchCount++;
        batchPayments[batchId] = BatchPaymentData({
            sender: msg.sender,
            recipients: _recipients,
            amounts: _amounts,
            reference: _reference,
            timestamp: block.timestamp,
            processed: false,
            totalAmount: totalAmount,
            totalFee: totalFee
        });
        
        // Transfer total amount plus fee from sender to this contract
        tshc.transferFrom(msg.sender, address(this), totalAmount + totalFee);
        
        emit BatchPaymentCreated(batchId, msg.sender, totalAmount, totalFee, _reference);
        
        return batchId;
    }

    /**
     * @dev Process a batch payment
     * @param _batchId The ID of the batch payment to process
     */
    function processBatchPayment(uint256 _batchId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        BatchPaymentData storage batch = batchPayments[_batchId];
        
        require(!batch.processed, "Batch already processed");
        require(
            batch.sender == msg.sender || hasRole(OPERATOR_ROLE, msg.sender),
            "Not authorized to process batch"
        );
        
        // Mark as processed
        batch.processed = true;
        
        // Transfer fee to fee manager
        tshc.transfer(address(feeManager), batch.totalFee);
        
        // Process the fee in the fee manager
        feeManager.collectFee(batch.sender, batch.totalAmount);
        
        // Transfer amounts to recipients
        for (uint256 i = 0; i < batch.recipients.length; i++) {
            tshc.transfer(batch.recipients[i], batch.amounts[i]);
        }
        
        emit BatchPaymentProcessed(_batchId);
    }

    /**
     * @dev Get batch payment details
     * @param _batchId The ID of the batch payment
     * @return Full batch payment data
     */
    function getBatchPayment(uint256 _batchId) 
        external 
        view 
        returns (
            address sender,
            address[] memory recipients,
            uint256[] memory amounts,
            string memory reference,
            uint256 timestamp,
            bool processed,
            uint256 totalAmount,
            uint256 totalFee
        ) 
    {
        BatchPaymentData storage batch = batchPayments[_batchId];
        
        return (
            batch.sender,
            batch.recipients,
            batch.amounts,
            batch.reference,
            batch.timestamp,
            batch.processed,
            batch.totalAmount,
            batch.totalFee
        );
    }

    /**
     * @dev Update the maximum number of recipients per batch
     * @param _newMax New maximum number of recipients
     */
    function updateMaxRecipients(uint256 _newMax) 
        external 
        onlyRole(BATCH_ADMIN_ROLE) 
    {
        require(_newMax > 0 && _newMax <= 500, "Invalid maximum value");
        
        uint256 oldMax = maxRecipientsPerBatch;
        maxRecipientsPerBatch = _newMax;
        
        emit MaxRecipientsUpdated(oldMax, _newMax);
    }

    /**
     * @dev Update the minimum amount per recipient
     * @param _newMin New minimum amount
     */
    function updateMinAmount(uint256 _newMin) 
        external 
        onlyRole(BATCH_ADMIN_ROLE) 
    {
        require(_newMin > 0, "Minimum must be greater than zero");
        
        uint256 oldMin = minAmountPerRecipient;
        minAmountPerRecipient = _newMin;
        
        emit MinAmountUpdated(oldMin, _newMin);
    }

    /**
     * @dev Update the fee manager contract
     * @param _newFeeManager New fee manager address
     */
    function updateFeeManager(address _newFeeManager) 
        external 
        onlyRole(BATCH_ADMIN_ROLE) 
    {
        require(_newFeeManager != address(0), "Fee manager cannot be zero address");
        
        address oldManager = address(feeManager);
        feeManager = FeeManager(_newFeeManager);
        
        emit FeeManagerUpdated(oldManager, _newFeeManager);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(BATCH_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(BATCH_ADMIN_ROLE) {
        _unpause();
    }
}
