// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title NedaPaymaster
 * @notice A paymaster contract that allows users to pay for gas fees using TSHC tokens
 * @dev This paymaster follows the ERC-4337 standard
 */
contract NedaPaymaster is Ownable, BasePaymaster {
    using ECDSA for bytes32;

    // The TSHC token contract
    IERC20 public tshcToken;
    
    // Exchange rate of TSHC to ETH (in wei)
    // 1 TSHC = exchangeRate wei
    uint256 public exchangeRate;
    
    // Minimum and maximum gas price the paymaster is willing to pay
    uint256 public minGasPrice;
    uint256 public maxGasPrice;
    
    // Events
    event TokensCharged(address indexed account, uint256 tokenAmount, uint256 ethAmount);
    event ExchangeRateChanged(uint256 oldRate, uint256 newRate);
    event GasPriceLimitsChanged(uint256 minGasPrice, uint256 maxGasPrice);
    
    /**
     * @dev Constructor initializes the paymaster
     * @param _entryPoint The EntryPoint contract address
     * @param _tshcToken The TSHC token contract address
     * @param _exchangeRate Initial exchange rate (1 TSHC = _exchangeRate wei)
     */
    constructor(
        IEntryPoint _entryPoint,
        IERC20 _tshcToken,
        uint256 _exchangeRate
    ) Ownable() BasePaymaster(_entryPoint) {
        tshcToken = _tshcToken;
        exchangeRate = _exchangeRate;
        minGasPrice = 1 gwei;
        maxGasPrice = 500 gwei;
    }
    
    /**
     * @dev Set a new exchange rate
     * @param _exchangeRate New exchange rate (1 TSHC = _exchangeRate wei)
     */
    function setExchangeRate(uint256 _exchangeRate) external onlyOwner {
        require(_exchangeRate > 0, "NedaPaymaster: exchange rate must be positive");
        
        emit ExchangeRateChanged(exchangeRate, _exchangeRate);
        exchangeRate = _exchangeRate;
    }
    
    /**
     * @dev Set new gas price limits
     * @param _minGasPrice New minimum gas price
     * @param _maxGasPrice New maximum gas price
     */
    function setGasPriceLimits(uint256 _minGasPrice, uint256 _maxGasPrice) external onlyOwner {
        require(_minGasPrice < _maxGasPrice, "NedaPaymaster: min must be less than max");
        
        minGasPrice = _minGasPrice;
        maxGasPrice = _maxGasPrice;
        
        emit GasPriceLimitsChanged(_minGasPrice, _maxGasPrice);
    }
    
    /**
     * @dev Withdraw tokens from the paymaster
     * @param token The token to withdraw (use address(0) for ETH)
     * @param to The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "NedaPaymaster: ETH transfer failed");
        } else {
            require(IERC20(token).transfer(to, amount), "NedaPaymaster: token transfer failed");
        }
    }
    
    /**
     * @dev Calculate the required token amount for a given gas cost
     * @param gasUsed The amount of gas used
     * @param maxFeePerGas The maximum fee per gas
     * @return The amount of tokens required
     */
    function calculateTokenAmount(uint256 gasUsed, uint256 maxFeePerGas) public view returns (uint256) {
        uint256 ethCost = gasUsed * maxFeePerGas;
        // Convert ETH cost to token amount using exchange rate
        // tokenAmount = ethCost / exchangeRate
        return (ethCost * 1e18) / exchangeRate;
    }
    
    /**
     * @dev Validate the paymaster data and calculate the required token payment
     * @param userOp The user operation
     * @param userOpHash The hash of the user operation
     * @param maxCost The maximum cost of the transaction
     * @return context The validation context
     * @return validationData The validation data
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Verify gas price is within limits
        require(
            userOp.maxFeePerGas >= minGasPrice && userOp.maxFeePerGas <= maxGasPrice,
            "NedaPaymaster: gas price out of bounds"
        );
        
        // Extract sender from the user operation
        address sender = userOp.sender;
        
        // Calculate the required token amount
        uint256 tokenAmount = calculateTokenAmount(
            userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas,
            userOp.maxFeePerGas
        );
        
        // Add a 10% buffer to account for potential price fluctuations
        tokenAmount = (tokenAmount * 110) / 100;
        
        // Check if the sender has enough tokens and has approved the paymaster
        require(
            tshcToken.balanceOf(sender) >= tokenAmount,
            "NedaPaymaster: insufficient token balance"
        );
        require(
            tshcToken.allowance(sender, address(this)) >= tokenAmount,
            "NedaPaymaster: insufficient token allowance"
        );
        
        // Return the token amount as context for post-op
        return (abi.encode(sender, tokenAmount), 0);
    }
    
    /**
     * @dev Process the payment after the operation is executed
     * @param mode The processing mode
     * @param context The context from validatePaymasterUserOp
     * @param actualGasCost The actual gas cost of the transaction
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        // Only charge the user if the operation succeeded or reverted
        if (mode != PostOpMode.postOpReverted) {
            // Extract sender and token amount from context
            (address sender, uint256 tokenAmount) = abi.decode(context, (address, uint256));
            
            // Calculate the actual token amount based on actual gas cost
            uint256 actualTokenAmount = calculateTokenAmount(actualGasCost, tx.gasprice);
            
            // Ensure we don't charge more than the pre-approved amount
            uint256 chargeAmount = actualTokenAmount < tokenAmount ? actualTokenAmount : tokenAmount;
            
            // Transfer tokens from the sender to the paymaster
            bool success = tshcToken.transferFrom(sender, address(this), chargeAmount);
            require(success, "NedaPaymaster: token transfer failed");
            
            emit TokensCharged(sender, chargeAmount, actualGasCost);
        }
    }
    
    /**
     * @dev Function to receive ETH
     */
    receive() external payable {}
}
