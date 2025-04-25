// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NedaPaySmartWallet
 * @notice Implementation of a smart wallet for NEDA Pay that supports ERC-4337 account abstraction
 */
contract NedaPaySmartWallet {
    IEntryPoint public immutable entryPoint;
    address public owner;
    
    // Events
    event WalletInitialized(address indexed owner);
    event TransactionExecuted(address indexed target, uint256 value, bytes data);
    
    /**
     * @dev Constructor initializes the smart wallet
     * @param _entryPoint The EntryPoint contract address
     * @param _owner The wallet owner address
     */
    constructor(IEntryPoint _entryPoint, address _owner) {
        entryPoint = _entryPoint;
        owner = _owner;
        emit WalletInitialized(_owner);
    }
    
    /**
     * @dev Modifier to restrict access to the owner or the EntryPoint
     */
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || msg.sender == address(entryPoint),
            "NedaPaySmartWallet: not authorized"
        );
        _;
    }
    
    /**
     * @dev Execute a transaction from this wallet
     * @param target The target address for the transaction
     * @param value The amount of ETH to send
     * @param data The calldata for the transaction
     * @return result The result of the transaction
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyAuthorized returns (bytes memory result) {
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        require(success, "NedaPaySmartWallet: transaction failed");
        
        emit TransactionExecuted(target, value, data);
        return returnData;
    }
    
    /**
     * @dev Validate a user operation through the EntryPoint
     * @param userOp The user operation to validate
     * @param userOpHash The hash of the user operation
     * @param missingAccountFunds The missing funds that need to be paid to the EntryPoint
     * @return validationData The validation data
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        require(msg.sender == address(entryPoint), "NedaPaySmartWallet: only EntryPoint can validate");
        
        // Verify the signature is from the owner
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));
        address signer = recoverSigner(hash, userOp.signature);
        
        if (signer != owner) {
            return 1; // Invalid signature
        }
        
        // Pay for the transaction if needed
        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "NedaPaySmartWallet: failed to pay missing funds");
        }
        
        return 0; // Valid signature
    }
    
    /**
     * @dev Utility function to recover signer from signature
     * @param hash The hash that was signed
     * @param signature The signature
     * @return The address of the signer
     */
    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "NedaPaySmartWallet: invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        return ecrecover(hash, v, r, s);
    }
    
    /**
     * @dev Function to receive ETH
     */
    receive() external payable {}
}

/**
 * @title NedaPaySmartWalletFactory
 * @notice Factory contract for creating NedaPaySmartWallet instances
 */
contract NedaPaySmartWalletFactory is Ownable {
    EntryPoint public immutable entryPoint;
    
    // Events
    event WalletCreated(address indexed wallet, address indexed owner);
    
    /**
     * @dev Constructor initializes the factory with the EntryPoint
     * @param _entryPoint The EntryPoint contract address
     */
    constructor(EntryPoint _entryPoint) Ownable() {
        entryPoint = _entryPoint;
    }
    
    /**
     * @dev Create a new wallet for an owner
     * @param owner The owner of the new wallet
     * @param salt A salt for deterministic address generation
     * @return wallet The address of the new wallet
     */
    function createWallet(address owner, uint256 salt) external returns (address wallet) {
        // Compute the wallet address
        wallet = getWalletAddress(owner, salt);
        
        // Check if the wallet already exists
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(wallet)
        }
        
        if (codeSize == 0) {
            // Deploy the wallet
            wallet = address(new NedaPaySmartWallet{salt: bytes32(salt)}(entryPoint, owner));
            emit WalletCreated(wallet, owner);
        }
        
        return wallet;
    }
    
    /**
     * @dev Get the address of a wallet before it is deployed
     * @param owner The owner of the wallet
     * @param salt A salt for deterministic address generation
     * @return The address of the wallet
     */
    function getWalletAddress(address owner, uint256 salt) public view returns (address) {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(
                abi.encodePacked(
                    type(NedaPaySmartWallet).creationCode,
                    abi.encode(entryPoint, owner)
                )
            )
        );
    }
}

// UserOperation struct is imported from @account-abstraction/contracts/interfaces/IEntryPoint.sol
