// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TSHC - Tanzania Shilling Stablecoin
 * @notice A stablecoin pegged 1:1 to the Tanzania Shilling (TSH)
 * @dev This contract implements a stablecoin with batch operations, automated minting,
 *      and emergency controls through a multisig system
 */
contract TSHC is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BATCH_APPROVER_ROLE = keccak256("BATCH_APPROVER_ROLE");
    
    // Batch operation tracking
    struct BatchOperation {
        address[] recipients;
        uint256[] amounts;
        bool isMint; // true for mint, false for burn
        bool executed;
        uint256 approvals;
        uint256 requiredApprovals;
        mapping(address => bool) hasApproved;
    }
    
    uint256 public batchOperationCount;
    mapping(uint256 => BatchOperation) public batchOperations;
    
    // Multisig requirements
    uint256 public requiredApprovals = 2; // Default: 2 approvals needed
    
    // Events
    event BatchOperationCreated(uint256 indexed batchId, bool isMint);
    event BatchOperationApproved(uint256 indexed batchId, address approver);
    event BatchOperationExecuted(uint256 indexed batchId);
    event RequiredApprovalsChanged(uint256 oldValue, uint256 newValue);
    
    /**
     * @dev Constructor initializes the contract with basic roles
     * @param defaultAdmin The address that will have the DEFAULT_ADMIN_ROLE
     */
    constructor(address defaultAdmin) ERC20("Tanzania Shilling Stablecoin", "TSHC") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(BATCH_APPROVER_ROLE, defaultAdmin);
        
        // Set admin role as the admin for all other roles
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(BATCH_APPROVER_ROLE, ADMIN_ROLE);
    }
    
    /**
     * @dev Mint tokens to a specified address
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
    }
    
    /**
     * @dev Pause all token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause all token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Override the _beforeTokenTransfer function to add pausable functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Create a new batch mint operation
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of token amounts to mint
     * @return batchId The ID of the created batch operation
     */
    function createBatchMint(
        address[] memory recipients, 
        uint256[] memory amounts
    ) public onlyRole(BATCH_APPROVER_ROLE) returns (uint256) {
        require(recipients.length == amounts.length, "Recipients and amounts length mismatch");
        require(recipients.length > 0, "Empty batch");
        
        uint256 batchId = batchOperationCount++;
        BatchOperation storage batch = batchOperations[batchId];
        
        batch.recipients = recipients;
        batch.amounts = amounts;
        batch.isMint = true;
        batch.executed = false;
        batch.approvals = 1; // Creator automatically approves
        batch.requiredApprovals = requiredApprovals;
        batch.hasApproved[msg.sender] = true;
        
        emit BatchOperationCreated(batchId, true);
        
        // Auto-execute if only one approval is required
        if (batch.approvals >= batch.requiredApprovals) {
            _executeBatchOperation(batchId);
        }
        
        return batchId;
    }
    
    /**
     * @dev Create a new batch burn operation
     * @param holders Array of addresses whose tokens will be burned
     * @param amounts Array of token amounts to burn
     * @return batchId The ID of the created batch operation
     */
    function createBatchBurn(
        address[] memory holders, 
        uint256[] memory amounts
    ) public onlyRole(BATCH_APPROVER_ROLE) returns (uint256) {
        require(holders.length == amounts.length, "Holders and amounts length mismatch");
        require(holders.length > 0, "Empty batch");
        
        uint256 batchId = batchOperationCount++;
        BatchOperation storage batch = batchOperations[batchId];
        
        batch.recipients = holders; // In burn case, these are the holders
        batch.amounts = amounts;
        batch.isMint = false;
        batch.executed = false;
        batch.approvals = 1; // Creator automatically approves
        batch.requiredApprovals = requiredApprovals;
        batch.hasApproved[msg.sender] = true;
        
        emit BatchOperationCreated(batchId, false);
        
        // Auto-execute if only one approval is required
        if (batch.approvals >= batch.requiredApprovals) {
            _executeBatchOperation(batchId);
        }
        
        return batchId;
    }
    
    /**
     * @dev Approve a batch operation
     * @param batchId The ID of the batch operation to approve
     */
    function approveBatchOperation(uint256 batchId) public onlyRole(BATCH_APPROVER_ROLE) {
        require(batchId < batchOperationCount, "Batch operation does not exist");
        
        BatchOperation storage batch = batchOperations[batchId];
        require(!batch.executed, "Batch operation already executed");
        require(!batch.hasApproved[msg.sender], "Already approved");
        
        batch.hasApproved[msg.sender] = true;
        batch.approvals += 1;
        
        emit BatchOperationApproved(batchId, msg.sender);
        
        // Execute if enough approvals
        if (batch.approvals >= batch.requiredApprovals) {
            _executeBatchOperation(batchId);
        }
    }
    
    /**
     * @dev Internal function to execute a batch operation
     * @param batchId The ID of the batch operation to execute
     */
    function _executeBatchOperation(uint256 batchId) internal {
        BatchOperation storage batch = batchOperations[batchId];
        require(!batch.executed, "Batch operation already executed");
        require(batch.approvals >= batch.requiredApprovals, "Not enough approvals");
        
        batch.executed = true;
        
        if (batch.isMint) {
            // Execute batch mint
            for (uint256 i = 0; i < batch.recipients.length; i++) {
                _mint(batch.recipients[i], batch.amounts[i]);
            }
        } else {
            // Execute batch burn
            for (uint256 i = 0; i < batch.recipients.length; i++) {
                // Check if the contract has allowance to burn
                uint256 allowance = allowance(batch.recipients[i], address(this));
                require(allowance >= batch.amounts[i], "Not enough allowance for burn");
                
                // Burn from the holder's account
                _burn(batch.recipients[i], batch.amounts[i]);
            }
        }
        
        emit BatchOperationExecuted(batchId);
    }
    
    /**
     * @dev Change the number of required approvals for batch operations
     * @param newRequiredApprovals The new number of required approvals
     */
    function setRequiredApprovals(uint256 newRequiredApprovals) public onlyRole(ADMIN_ROLE) {
        require(newRequiredApprovals > 0, "Required approvals must be greater than 0");
        
        emit RequiredApprovalsChanged(requiredApprovals, newRequiredApprovals);
        requiredApprovals = newRequiredApprovals;
    }
    
    /**
     * @dev Emergency batch burn function that bypasses the approval process
     * @param holders Array of addresses whose tokens will be burned
     * @param amounts Array of token amounts to burn
     */
    function emergencyBatchBurn(
        address[] memory holders, 
        uint256[] memory amounts
    ) public onlyRole(ADMIN_ROLE) whenPaused {
        require(holders.length == amounts.length, "Holders and amounts length mismatch");
        
        for (uint256 i = 0; i < holders.length; i++) {
            _burn(holders[i], amounts[i]);
        }
    }
}
