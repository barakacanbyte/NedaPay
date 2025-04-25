// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TSHC.sol";
import "./PriceOracle.sol";

/**
 * @title FiatOnRamp
 * @notice Facilitates on/off-ramping between TSHC and fiat TZS
 * @dev This contract handles the bridge between crypto and traditional finance
 */
contract FiatOnRamp is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ONRAMP_ADMIN_ROLE = keccak256("ONRAMP_ADMIN_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // TSHC token contract
    TSHC public tshc;
    
    // Price oracle contract
    PriceOracle public priceOracle;

    // Transaction types
    enum TransactionType { Deposit, Withdrawal }
    
    // Transaction states
    enum TransactionState { 
        Pending,
        Processing,
        Completed,
        Rejected,
        Cancelled
    }
    
    // Transaction data
    struct Transaction {
        address user;
        uint256 amount;
        uint256 fiatAmount;
        TransactionType txType;
        TransactionState state;
        string paymentReference;
        string paymentMethod;
        uint256 timestamp;
        address processor;
        string rejectionReason;
    }
    
    // Transaction storage
    uint256 public transactionCount;
    mapping(uint256 => Transaction) public transactions;
    
    // User transaction mapping
    mapping(address => uint256[]) public userTransactions;
    
    // Limits
    struct Limits {
        uint256 minDeposit;
        uint256 maxDeposit;
        uint256 minWithdrawal;
        uint256 maxWithdrawal;
        uint256 dailyLimit;
        uint256 monthlyLimit;
    }
    
    Limits public limits;
    
    // User limits tracking
    struct UserLimits {
        uint256 dailyVolume;
        uint256 monthlyVolume;
        uint256 lastDailyReset;
        uint256 lastMonthlyReset;
    }
    
    mapping(address => UserLimits) public userLimits;
    
    // Supported payment methods
    struct PaymentMethod {
        bool isSupported;
        uint256 fee; // In basis points
    }
    
    mapping(string => PaymentMethod) public paymentMethods;
    string[] public supportedPaymentMethods;
    
    // Events
    event TransactionCreated(uint256 indexed txId, address indexed user, TransactionType txType, uint256 amount, uint256 fiatAmount);
    event TransactionUpdated(uint256 indexed txId, TransactionState newState, address processor);
    event TransactionRejected(uint256 indexed txId, string reason);
    event PaymentMethodAdded(string method, uint256 fee);
    event PaymentMethodRemoved(string method);
    event PaymentMethodFeeUpdated(string method, uint256 oldFee, uint256 newFee);
    event LimitsUpdated(string limitType, uint256 oldValue, uint256 newValue);

    /**
     * @dev Constructor initializes the contract with basic roles and tokens
     * @param _tshc The address of the TSHC token contract
     * @param _priceOracle The address of the price oracle contract
     * @param _admin The address that will have the admin role
     */
    constructor(
        address _tshc,
        address _priceOracle,
        address _admin
    ) {
        require(_tshc != address(0), "TSHC address cannot be zero");
        require(_priceOracle != address(0), "Price oracle address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        tshc = TSHC(_tshc);
        priceOracle = PriceOracle(_priceOracle);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ONRAMP_ADMIN_ROLE, _admin);
        _grantRole(PROCESSOR_ROLE, _admin);
        _grantRole(COMPLIANCE_ROLE, _admin);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(ONRAMP_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PROCESSOR_ROLE, ONRAMP_ADMIN_ROLE);
        _setRoleAdmin(COMPLIANCE_ROLE, ONRAMP_ADMIN_ROLE);
        
        // Set default limits
        limits = Limits({
            minDeposit: 10 * 10**18, // 10 TSHC
            maxDeposit: 10000 * 10**18, // 10,000 TSHC
            minWithdrawal: 10 * 10**18, // 10 TSHC
            maxWithdrawal: 10000 * 10**18, // 10,000 TSHC
            dailyLimit: 50000 * 10**18, // 50,000 TSHC
            monthlyLimit: 500000 * 10**18 // 500,000 TSHC
        });
        
        // Add default payment methods
        _addPaymentMethod("Mobile Money", 100); // 1% fee
        _addPaymentMethod("Bank Transfer", 50); // 0.5% fee
    }

    /**
     * @dev Create a deposit request (fiat to TSHC)
     * @param _fiatAmount Amount of fiat to deposit
     * @param _paymentMethod Payment method to use
     * @param _paymentReference Reference for the payment
     * @return txId Transaction ID
     */
    function createDepositRequest(
        uint256 _fiatAmount,
        string calldata _paymentMethod,
        string calldata _paymentReference
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 txId) 
    {
        require(_fiatAmount > 0, "Amount must be greater than zero");
        require(paymentMethods[_paymentMethod].isSupported, "Payment method not supported");
        require(bytes(_paymentReference).length > 0, "Payment reference required");
        
        // Calculate TSHC amount based on current exchange rate
        bytes32 pair = keccak256(abi.encodePacked("TZS/TSHC"));
        (uint256 exchangeRate, ) = priceOracle.getLatestPrice(pair);
        require(exchangeRate > 0, "Invalid exchange rate");
        
        // Convert fiat amount to TSHC amount
        uint256 tshcAmount = (_fiatAmount * 10**18) / exchangeRate;
        
        // Check limits
        require(tshcAmount >= limits.minDeposit, "Amount below minimum deposit");
        require(tshcAmount <= limits.maxDeposit, "Amount above maximum deposit");
        
        // Update and check user limits
        _updateUserLimits(msg.sender);
        require(
            userLimits[msg.sender].dailyVolume + tshcAmount <= limits.dailyLimit,
            "Daily limit exceeded"
        );
        require(
            userLimits[msg.sender].monthlyVolume + tshcAmount <= limits.monthlyLimit,
            "Monthly limit exceeded"
        );
        
        // Create transaction
        txId = transactionCount++;
        transactions[txId] = Transaction({
            user: msg.sender,
            amount: tshcAmount,
            fiatAmount: _fiatAmount,
            txType: TransactionType.Deposit,
            state: TransactionState.Pending,
            paymentReference: _paymentReference,
            paymentMethod: _paymentMethod,
            timestamp: block.timestamp,
            processor: address(0),
            rejectionReason: ""
        });
        
        // Add to user transactions
        userTransactions[msg.sender].push(txId);
        
        // Update user limits
        userLimits[msg.sender].dailyVolume += tshcAmount;
        userLimits[msg.sender].monthlyVolume += tshcAmount;
        
        emit TransactionCreated(txId, msg.sender, TransactionType.Deposit, tshcAmount, _fiatAmount);
        
        return txId;
    }

    /**
     * @dev Create a withdrawal request (TSHC to fiat)
     * @param _tshcAmount Amount of TSHC to withdraw
     * @param _paymentMethod Payment method to use
     * @param _paymentReference Reference for the payment
     * @return txId Transaction ID
     */
    function createWithdrawalRequest(
        uint256 _tshcAmount,
        string calldata _paymentMethod,
        string calldata _paymentReference
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 txId) 
    {
        require(_tshcAmount > 0, "Amount must be greater than zero");
        require(paymentMethods[_paymentMethod].isSupported, "Payment method not supported");
        require(bytes(_paymentReference).length > 0, "Payment reference required");
        
        // Check limits
        require(_tshcAmount >= limits.minWithdrawal, "Amount below minimum withdrawal");
        require(_tshcAmount <= limits.maxWithdrawal, "Amount above maximum withdrawal");
        
        // Update and check user limits
        _updateUserLimits(msg.sender);
        require(
            userLimits[msg.sender].dailyVolume + _tshcAmount <= limits.dailyLimit,
            "Daily limit exceeded"
        );
        require(
            userLimits[msg.sender].monthlyVolume + _tshcAmount <= limits.monthlyLimit,
            "Monthly limit exceeded"
        );
        
        // Calculate fiat amount based on current exchange rate
        bytes32 pair = keccak256(abi.encodePacked("TZS/TSHC"));
        (uint256 exchangeRate, ) = priceOracle.getLatestPrice(pair);
        require(exchangeRate > 0, "Invalid exchange rate");
        
        // Convert TSHC amount to fiat amount
        uint256 fiatAmount = (_tshcAmount * exchangeRate) / 10**18;
        
        // Transfer TSHC from user to contract
        tshc.transferFrom(msg.sender, address(this), _tshcAmount);
        
        // Create transaction
        txId = transactionCount++;
        transactions[txId] = Transaction({
            user: msg.sender,
            amount: _tshcAmount,
            fiatAmount: fiatAmount,
            txType: TransactionType.Withdrawal,
            state: TransactionState.Pending,
            paymentReference: _paymentReference,
            paymentMethod: _paymentMethod,
            timestamp: block.timestamp,
            processor: address(0),
            rejectionReason: ""
        });
        
        // Add to user transactions
        userTransactions[msg.sender].push(txId);
        
        // Update user limits
        userLimits[msg.sender].dailyVolume += _tshcAmount;
        userLimits[msg.sender].monthlyVolume += _tshcAmount;
        
        emit TransactionCreated(txId, msg.sender, TransactionType.Withdrawal, _tshcAmount, fiatAmount);
        
        return txId;
    }

    /**
     * @dev Process a transaction
     * @param _txId Transaction ID
     * @param _newState New transaction state
     */
    function processTransaction(uint256 _txId, TransactionState _newState) 
        external 
        onlyRole(PROCESSOR_ROLE) 
        nonReentrant 
    {
        Transaction storage tx = transactions[_txId];
        
        require(tx.state == TransactionState.Pending, "Transaction not in pending state");
        require(
            _newState == TransactionState.Processing || 
            _newState == TransactionState.Completed || 
            _newState == TransactionState.Rejected,
            "Invalid new state"
        );
        
        // Update transaction state
        tx.state = _newState;
        tx.processor = msg.sender;
        
        // If completing a deposit, mint TSHC to user
        if (_newState == TransactionState.Completed && tx.txType == TransactionType.Deposit) {
            // Apply fee
            uint256 fee = (tx.amount * paymentMethods[tx.paymentMethod].fee) / 10000;
            uint256 amountAfterFee = tx.amount - fee;
            
            // Mint TSHC to user
            tshc.mint(tx.user, amountAfterFee);
        }
        
        emit TransactionUpdated(_txId, _newState, msg.sender);
    }

    /**
     * @dev Reject a transaction with reason
     * @param _txId Transaction ID
     * @param _reason Rejection reason
     */
    function rejectTransaction(uint256 _txId, string calldata _reason) 
        external 
        onlyRole(PROCESSOR_ROLE) 
        nonReentrant 
    {
        Transaction storage tx = transactions[_txId];
        
        require(tx.state == TransactionState.Pending, "Transaction not in pending state");
        require(bytes(_reason).length > 0, "Reason required");
        
        // Update transaction state
        tx.state = TransactionState.Rejected;
        tx.processor = msg.sender;
        tx.rejectionReason = _reason;
        
        // If rejecting a withdrawal, return TSHC to user
        if (tx.txType == TransactionType.Withdrawal) {
            tshc.transfer(tx.user, tx.amount);
        }
        
        emit TransactionRejected(_txId, _reason);
    }

    /**
     * @dev Cancel a pending transaction (user can only cancel their own transactions)
     * @param _txId Transaction ID
     */
    function cancelTransaction(uint256 _txId) 
        external 
        nonReentrant 
    {
        Transaction storage tx = transactions[_txId];
        
        require(tx.user == msg.sender, "Not transaction owner");
        require(tx.state == TransactionState.Pending, "Transaction not in pending state");
        
        // Update transaction state
        tx.state = TransactionState.Cancelled;
        
        // If cancelling a withdrawal, return TSHC to user
        if (tx.txType == TransactionType.Withdrawal) {
            tshc.transfer(tx.user, tx.amount);
        }
        
        emit TransactionUpdated(_txId, TransactionState.Cancelled, address(0));
    }

    /**
     * @dev Add a new payment method
     * @param _method Payment method name
     * @param _fee Fee in basis points
     */
    function addPaymentMethod(string calldata _method, uint256 _fee) 
        external 
        onlyRole(ONRAMP_ADMIN_ROLE) 
    {
        _addPaymentMethod(_method, _fee);
    }

    /**
     * @dev Internal function to add a payment method
     * @param _method Payment method name
     * @param _fee Fee in basis points
     */
    function _addPaymentMethod(string memory _method, uint256 _fee) 
        internal 
    {
        require(bytes(_method).length > 0, "Method name required");
        require(!paymentMethods[_method].isSupported, "Method already supported");
        require(_fee <= 500, "Fee too high"); // Max 5%
        
        paymentMethods[_method] = PaymentMethod({
            isSupported: true,
            fee: _fee
        });
        
        supportedPaymentMethods.push(_method);
        
        emit PaymentMethodAdded(_method, _fee);
    }

    /**
     * @dev Remove a payment method
     * @param _method Payment method name
     */
    function removePaymentMethod(string calldata _method) 
        external 
        onlyRole(ONRAMP_ADMIN_ROLE) 
    {
        require(paymentMethods[_method].isSupported, "Method not supported");
        
        paymentMethods[_method].isSupported = false;
        
        // Remove from supported methods array
        for (uint256 i = 0; i < supportedPaymentMethods.length; i++) {
            if (keccak256(bytes(supportedPaymentMethods[i])) == keccak256(bytes(_method))) {
                supportedPaymentMethods[i] = supportedPaymentMethods[supportedPaymentMethods.length - 1];
                supportedPaymentMethods.pop();
                break;
            }
        }
        
        emit PaymentMethodRemoved(_method);
    }

    /**
     * @dev Update payment method fee
     * @param _method Payment method name
     * @param _newFee New fee in basis points
     */
    function updatePaymentMethodFee(string calldata _method, uint256 _newFee) 
        external 
        onlyRole(ONRAMP_ADMIN_ROLE) 
    {
        require(paymentMethods[_method].isSupported, "Method not supported");
        require(_newFee <= 500, "Fee too high"); // Max 5%
        
        uint256 oldFee = paymentMethods[_method].fee;
        paymentMethods[_method].fee = _newFee;
        
        emit PaymentMethodFeeUpdated(_method, oldFee, _newFee);
    }

    /**
     * @dev Update transaction limits
     * @param _minDeposit Minimum deposit amount
     * @param _maxDeposit Maximum deposit amount
     * @param _minWithdrawal Minimum withdrawal amount
     * @param _maxWithdrawal Maximum withdrawal amount
     * @param _dailyLimit Daily limit
     * @param _monthlyLimit Monthly limit
     */
    function updateLimits(
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _minWithdrawal,
        uint256 _maxWithdrawal,
        uint256 _dailyLimit,
        uint256 _monthlyLimit
    ) 
        external 
        onlyRole(ONRAMP_ADMIN_ROLE) 
    {
        require(_minDeposit <= _maxDeposit, "Min deposit must be <= max deposit");
        require(_minWithdrawal <= _maxWithdrawal, "Min withdrawal must be <= max withdrawal");
        require(_dailyLimit <= _monthlyLimit, "Daily limit must be <= monthly limit");
        
        if (_minDeposit != limits.minDeposit) {
            emit LimitsUpdated("minDeposit", limits.minDeposit, _minDeposit);
            limits.minDeposit = _minDeposit;
        }
        
        if (_maxDeposit != limits.maxDeposit) {
            emit LimitsUpdated("maxDeposit", limits.maxDeposit, _maxDeposit);
            limits.maxDeposit = _maxDeposit;
        }
        
        if (_minWithdrawal != limits.minWithdrawal) {
            emit LimitsUpdated("minWithdrawal", limits.minWithdrawal, _minWithdrawal);
            limits.minWithdrawal = _minWithdrawal;
        }
        
        if (_maxWithdrawal != limits.maxWithdrawal) {
            emit LimitsUpdated("maxWithdrawal", limits.maxWithdrawal, _maxWithdrawal);
            limits.maxWithdrawal = _maxWithdrawal;
        }
        
        if (_dailyLimit != limits.dailyLimit) {
            emit LimitsUpdated("dailyLimit", limits.dailyLimit, _dailyLimit);
            limits.dailyLimit = _dailyLimit;
        }
        
        if (_monthlyLimit != limits.monthlyLimit) {
            emit LimitsUpdated("monthlyLimit", limits.monthlyLimit, _monthlyLimit);
            limits.monthlyLimit = _monthlyLimit;
        }
    }

    /**
     * @dev Update user limits based on time passed
     * @param _user User address
     */
    function _updateUserLimits(address _user) internal {
        UserLimits storage userLimit = userLimits[_user];
        
        // Reset daily limit if a day has passed
        if (block.timestamp >= userLimit.lastDailyReset + 1 days) {
            userLimit.dailyVolume = 0;
            userLimit.lastDailyReset = block.timestamp;
        }
        
        // Reset monthly limit if a month has passed
        if (block.timestamp >= userLimit.lastMonthlyReset + 30 days) {
            userLimit.monthlyVolume = 0;
            userLimit.lastMonthlyReset = block.timestamp;
        }
    }

    /**
     * @dev Get user transactions
     * @param _user User address
     * @return txIds Array of transaction IDs
     */
    function getUserTransactions(address _user) 
        external 
        view 
        returns (uint256[] memory txIds) 
    {
        return userTransactions[_user];
    }

    /**
     * @dev Get transaction details
     * @param _txId Transaction ID
     * @return user The user involved in the transaction
     * @return amount The amount of TSHC
     * @return fiatAmount The amount of fiat
     * @return txType The type of transaction
     * @return state The state of the transaction
     * @return paymentReference The payment reference
     * @return paymentMethod The payment method
     * @return timestamp The timestamp of the transaction
     * @return processor The processor address
     * @return rejectionReason The reason for rejection
     */
    function getTransaction(uint256 _txId) 
        external 
        view 
        returns (
            address user,
            uint256 amount,
            uint256 fiatAmount,
            TransactionType txType,
            TransactionState state,
            string memory paymentReference,
            string memory paymentMethod,
            uint256 timestamp,
            address processor,
            string memory rejectionReason
        ) 
    {
        Transaction storage tx = transactions[_txId];
        
        return (
            tx.user,
            tx.amount,
            tx.fiatAmount,
            tx.txType,
            tx.state,
            tx.paymentReference,
            tx.paymentMethod,
            tx.timestamp,
            tx.processor,
            tx.rejectionReason
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ONRAMP_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ONRAMP_ADMIN_ROLE) {
        _unpause();
    }
}
