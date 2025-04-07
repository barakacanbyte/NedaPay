// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./TSHC.sol";
import "./PriceOracle.sol";

/**
 * @title LiquidityPool
 * @notice Manages liquidity for the TSHC stablecoin
 * @dev This contract handles liquidity provision, swaps, and incentives
 */
contract LiquidityPool is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant POOL_ADMIN_ROLE = keccak256("POOL_ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // TSHC token contract
    TSHC public tshc;
    
    // Price oracle contract
    PriceOracle public priceOracle;
    
    // LP token (receipt token for liquidity providers)
    ERC20Burnable public lpToken;
    
    // Supported tokens for swaps
    struct SupportedToken {
        bool isSupported;
        uint256 swapFee; // In basis points (100 = 1%)
        uint256 maxSlippage; // In basis points (100 = 1%)
        uint256 balance; // Current balance in the pool
    }
    
    mapping(address => SupportedToken) public supportedTokens;
    address[] public tokenList;
    
    // Liquidity provider data
    struct LiquidityProvider {
        uint256 lpTokens; // Amount of LP tokens held
        uint256 lastDepositTime; // Timestamp of last deposit
        uint256 rewardDebt; // For reward calculations
    }
    
    mapping(address => LiquidityProvider) public liquidityProviders;
    
    // Pool parameters
    uint256 public totalLpTokens;
    uint256 public minLockPeriod = 1 days; // Minimum time liquidity must remain locked
    uint256 public rewardRate = 500; // 5% annual reward rate in basis points
    uint256 public lastRewardUpdate; // Last time rewards were calculated
    uint256 public accumulatedRewardsPerShare; // Accumulated rewards per share
    
    // Events
    event TokenAdded(address indexed token, uint256 swapFee, uint256 maxSlippage);
    event TokenRemoved(address indexed token);
    event SwapFeeUpdated(address indexed token, uint256 oldFee, uint256 newFee);
    event MaxSlippageUpdated(address indexed token, uint256 oldSlippage, uint256 newSlippage);
    event LiquidityAdded(address indexed provider, address indexed token, uint256 amount, uint256 lpTokens);
    event LiquidityRemoved(address indexed provider, address indexed token, uint256 amount, uint256 lpTokens);
    event Swapped(address indexed user, address indexed fromToken, address indexed toToken, uint256 fromAmount, uint256 toAmount);
    event RewardClaimed(address indexed provider, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event MinLockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    /**
     * @dev Constructor initializes the contract with basic roles and tokens
     * @param _tshc The address of the TSHC token contract
     * @param _priceOracle The address of the price oracle contract
     * @param _lpToken The address of the LP token contract
     * @param _admin The address that will have the admin role
     */
    constructor(
        address _tshc,
        address _priceOracle,
        address _lpToken,
        address _admin
    ) {
        require(_tshc != address(0), "TSHC address cannot be zero");
        require(_priceOracle != address(0), "Price oracle address cannot be zero");
        require(_lpToken != address(0), "LP token address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        tshc = TSHC(_tshc);
        priceOracle = PriceOracle(_priceOracle);
        lpToken = ERC20Burnable(_lpToken);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(POOL_ADMIN_ROLE, _admin);
        _grantRole(EMERGENCY_ROLE, _admin);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(POOL_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(EMERGENCY_ROLE, POOL_ADMIN_ROLE);
        
        // Initialize reward tracking
        lastRewardUpdate = block.timestamp;
    }

    /**
     * @dev Add a supported token for swaps
     * @param _token Address of the token to add
     * @param _swapFee Swap fee in basis points
     * @param _maxSlippage Maximum allowed slippage in basis points
     */
    function addSupportedToken(
        address _token,
        uint256 _swapFee,
        uint256 _maxSlippage
    ) 
        external 
        onlyRole(POOL_ADMIN_ROLE) 
    {
        require(_token != address(0), "Token address cannot be zero");
        require(!supportedTokens[_token].isSupported, "Token already supported");
        require(_swapFee <= 500, "Swap fee too high"); // Max 5%
        require(_maxSlippage <= 1000, "Max slippage too high"); // Max 10%

        supportedTokens[_token] = SupportedToken({
            isSupported: true,
            swapFee: _swapFee,
            maxSlippage: _maxSlippage,
            balance: 0
        });
        
        tokenList.push(_token);
        
        emit TokenAdded(_token, _swapFee, _maxSlippage);
    }

    /**
     * @dev Remove a supported token
     * @param _token Address of the token to remove
     */
    function removeSupportedToken(address _token) 
        external 
        onlyRole(POOL_ADMIN_ROLE) 
    {
        require(supportedTokens[_token].isSupported, "Token not supported");
        require(supportedTokens[_token].balance == 0, "Token has balance in pool");

        supportedTokens[_token].isSupported = false;
        
        // Remove from token list
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == _token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }

    /**
     * @dev Update swap fee for a token
     * @param _token Address of the token
     * @param _newFee New swap fee in basis points
     */
    function updateSwapFee(address _token, uint256 _newFee) 
        external 
        onlyRole(POOL_ADMIN_ROLE) 
    {
        require(supportedTokens[_token].isSupported, "Token not supported");
        require(_newFee <= 500, "Swap fee too high"); // Max 5%
        
        uint256 oldFee = supportedTokens[_token].swapFee;
        supportedTokens[_token].swapFee = _newFee;
        
        emit SwapFeeUpdated(_token, oldFee, _newFee);
    }

    /**
     * @dev Update max slippage for a token
     * @param _token Address of the token
     * @param _newSlippage New max slippage in basis points
     */
    function updateMaxSlippage(address _token, uint256 _newSlippage) 
        external 
        onlyRole(POOL_ADMIN_ROLE) 
    {
        require(supportedTokens[_token].isSupported, "Token not supported");
        require(_newSlippage <= 1000, "Max slippage too high"); // Max 10%
        
        uint256 oldSlippage = supportedTokens[_token].maxSlippage;
        supportedTokens[_token].maxSlippage = _newSlippage;
        
        emit MaxSlippageUpdated(_token, oldSlippage, _newSlippage);
    }

    /**
     * @dev Add liquidity to the pool
     * @param _token Address of the token to add
     * @param _amount Amount of tokens to add
     * @return lpAmount Amount of LP tokens minted
     */
    function addLiquidity(address _token, uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 lpAmount) 
    {
        require(supportedTokens[_token].isSupported, "Token not supported");
        require(_amount > 0, "Amount must be greater than zero");
        
        // Update rewards before changing state
        _updateRewards();
        
        // Calculate LP tokens to mint
        // If first liquidity provider for this token, use direct amount
        // Otherwise, calculate based on current pool value
        if (totalLpTokens == 0) {
            lpAmount = _amount;
        } else {
            // Get token value in TSHC
            bytes32 tokenPair = keccak256(abi.encodePacked(_token, "/TSHC"));
            (uint256 tokenPrice, ) = priceOracle.getLatestPrice(tokenPair);
            require(tokenPrice > 0, "Invalid token price");
            
            // Calculate value relative to pool
            uint256 tokenValue = (_amount * tokenPrice) / 1e8; // Price has 8 decimals
            lpAmount = (tokenValue * totalLpTokens) / _getTotalPoolValue();
        }
        
        // Transfer tokens from user to pool
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update token balance in pool
        supportedTokens[_token].balance += _amount;
        
        // Mint LP tokens to user
        // Note: In a real implementation, the LP token would be a separate contract
        // For simplicity, we're tracking LP tokens in this contract
        liquidityProviders[msg.sender].lpTokens += lpAmount;
        liquidityProviders[msg.sender].lastDepositTime = block.timestamp;
        
        // Update reward debt
        liquidityProviders[msg.sender].rewardDebt = 
            (liquidityProviders[msg.sender].lpTokens * accumulatedRewardsPerShare) / 1e12;
        
        // Update total LP tokens
        totalLpTokens += lpAmount;
        
        emit LiquidityAdded(msg.sender, _token, _amount, lpAmount);
        
        return lpAmount;
    }

    /**
     * @dev Remove liquidity from the pool
     * @param _token Address of the token to withdraw
     * @param _lpAmount Amount of LP tokens to burn
     * @return tokenAmount Amount of tokens withdrawn
     */
    function removeLiquidity(address _token, uint256 _lpAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 tokenAmount) 
    {
        require(supportedTokens[_token].isSupported, "Token not supported");
        require(_lpAmount > 0 && _lpAmount <= liquidityProviders[msg.sender].lpTokens, "Invalid LP amount");
        require(
            block.timestamp >= liquidityProviders[msg.sender].lastDepositTime + minLockPeriod,
            "Liquidity still locked"
        );
        
        // Update rewards before changing state
        _updateRewards();
        
        // Claim pending rewards
        _claimRewards(msg.sender);
        
        // Calculate token amount to withdraw
        tokenAmount = (_lpAmount * supportedTokens[_token].balance) / totalLpTokens;
        
        // Update LP tokens
        liquidityProviders[msg.sender].lpTokens -= _lpAmount;
        totalLpTokens -= _lpAmount;
        
        // Update token balance in pool
        supportedTokens[_token].balance -= tokenAmount;
        
        // Update reward debt
        liquidityProviders[msg.sender].rewardDebt = 
            (liquidityProviders[msg.sender].lpTokens * accumulatedRewardsPerShare) / 1e12;
        
        // Transfer tokens to user
        IERC20(_token).safeTransfer(msg.sender, tokenAmount);
        
        emit LiquidityRemoved(msg.sender, _token, tokenAmount, _lpAmount);
        
        return tokenAmount;
    }

    /**
     * @dev Swap tokens
     * @param _fromToken Address of the token to swap from
     * @param _toToken Address of the token to swap to
     * @param _fromAmount Amount of tokens to swap
     * @param _minToAmount Minimum amount of tokens to receive
     * @return toAmount Amount of tokens received
     */
    function swap(
        address _fromToken,
        address _toToken,
        uint256 _fromAmount,
        uint256 _minToAmount
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 toAmount) 
    {
        require(supportedTokens[_fromToken].isSupported, "From token not supported");
        require(supportedTokens[_toToken].isSupported, "To token not supported");
        require(_fromAmount > 0, "Amount must be greater than zero");
        
        // Calculate swap amount based on price oracle
        bytes32 fromPair = keccak256(abi.encodePacked(_fromToken, "/TSHC"));
        bytes32 toPair = keccak256(abi.encodePacked(_toToken, "/TSHC"));
        
        (uint256 fromPrice, ) = priceOracle.getLatestPrice(fromPair);
        (uint256 toPrice, ) = priceOracle.getLatestPrice(toPair);
        
        require(fromPrice > 0 && toPrice > 0, "Invalid price data");
        
        // Calculate equivalent value
        uint256 fromValue = (_fromAmount * fromPrice) / 1e8; // Price has 8 decimals
        
        // Apply swap fee
        uint256 fee = (fromValue * supportedTokens[_fromToken].swapFee) / 10000;
        uint256 valueAfterFee = fromValue - fee;
        
        // Calculate output amount
        toAmount = (valueAfterFee * 1e8) / toPrice;
        
        // Check slippage
        require(toAmount >= _minToAmount, "Slippage too high");
        
        // Check if pool has enough liquidity
        require(toAmount <= supportedTokens[_toToken].balance, "Insufficient liquidity");
        
        // Transfer tokens from user to pool
        IERC20(_fromToken).safeTransferFrom(msg.sender, address(this), _fromAmount);
        
        // Update token balances
        supportedTokens[_fromToken].balance += _fromAmount;
        supportedTokens[_toToken].balance -= toAmount;
        
        // Transfer tokens to user
        IERC20(_toToken).safeTransfer(msg.sender, toAmount);
        
        emit Swapped(msg.sender, _fromToken, _toToken, _fromAmount, toAmount);
        
        return toAmount;
    }

    /**
     * @dev Claim liquidity provider rewards
     * @return rewardAmount Amount of rewards claimed
     */
    function claimRewards() 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 rewardAmount) 
    {
        // Update rewards before claiming
        _updateRewards();
        
        // Calculate and transfer rewards
        rewardAmount = _claimRewards(msg.sender);
        
        return rewardAmount;
    }

    /**
     * @dev Internal function to claim rewards
     * @param _provider Address of the liquidity provider
     * @return rewardAmount Amount of rewards claimed
     */
    function _claimRewards(address _provider) 
        internal 
        returns (uint256 rewardAmount) 
    {
        LiquidityProvider storage provider = liquidityProviders[_provider];
        
        // Calculate pending rewards
        uint256 pending = 
            (provider.lpTokens * accumulatedRewardsPerShare) / 1e12 - 
            provider.rewardDebt;
        
        if (pending > 0) {
            // Mint TSHC rewards to provider
            tshc.mint(_provider, pending);
            
            // Update reward debt
            provider.rewardDebt = 
                (provider.lpTokens * accumulatedRewardsPerShare) / 1e12;
            
            emit RewardClaimed(_provider, pending);
        }
        
        return pending;
    }

    /**
     * @dev Update reward calculations
     */
    function _updateRewards() internal {
        if (block.timestamp <= lastRewardUpdate) {
            return;
        }
        
        if (totalLpTokens == 0) {
            lastRewardUpdate = block.timestamp;
            return;
        }
        
        // Calculate time elapsed since last update
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        
        // Calculate rewards for this period
        // Annual rate converted to per-second rate
        uint256 rewardPerSecond = (rewardRate * _getTotalPoolValue()) / (10000 * 365 days);
        uint256 rewards = timeElapsed * rewardPerSecond;
        
        // Update accumulated rewards per share
        accumulatedRewardsPerShare += (rewards * 1e12) / totalLpTokens;
        
        // Update last reward time
        lastRewardUpdate = block.timestamp;
    }

    /**
     * @dev Get total value of the pool in TSHC
     * @return totalValue Total pool value
     */
    function _getTotalPoolValue() internal view returns (uint256 totalValue) {
        totalValue = 0;
        
        for (uint256 i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            if (supportedTokens[token].isSupported && supportedTokens[token].balance > 0) {
                bytes32 tokenPair = keccak256(abi.encodePacked(token, "/TSHC"));
                (uint256 tokenPrice, ) = priceOracle.getLatestPrice(tokenPair);
                
                if (tokenPrice > 0) {
                    totalValue += (supportedTokens[token].balance * tokenPrice) / 1e8;
                }
            }
        }
        
        return totalValue;
    }

    /**
     * @dev Get pending rewards for a liquidity provider
     * @param _provider Address of the liquidity provider
     * @return pending Pending rewards
     */
    function getPendingRewards(address _provider) 
        external 
        view 
        returns (uint256 pending) 
    {
        LiquidityProvider storage provider = liquidityProviders[_provider];
        
        uint256 accRewardsPerShare = accumulatedRewardsPerShare;
        
        if (block.timestamp > lastRewardUpdate && totalLpTokens > 0) {
            uint256 timeElapsed = block.timestamp - lastRewardUpdate;
            uint256 rewardPerSecond = (rewardRate * _getTotalPoolValue()) / (10000 * 365 days);
            uint256 rewards = timeElapsed * rewardPerSecond;
            accRewardsPerShare += (rewards * 1e12) / totalLpTokens;
        }
        
        pending = 
            (provider.lpTokens * accRewardsPerShare) / 1e12 - 
            provider.rewardDebt;
        
        return pending;
    }

    /**
     * @dev Update reward rate
     * @param _newRate New reward rate in basis points
     */
    function updateRewardRate(uint256 _newRate) 
        external 
        onlyRole(POOL_ADMIN_ROLE) 
    {
        require(_newRate <= 2000, "Rate too high"); // Max 20%
        
        // Update rewards before changing rate
        _updateRewards();
        
        uint256 oldRate = rewardRate;
        rewardRate = _newRate;
        
        emit RewardRateUpdated(oldRate, _newRate);
    }

    /**
     * @dev Update minimum lock period
     * @param _newPeriod New lock period in seconds
     */
    function updateMinLockPeriod(uint256 _newPeriod) 
        external 
        onlyRole(POOL_ADMIN_ROLE) 
    {
        require(_newPeriod <= 30 days, "Lock period too long");
        
        uint256 oldPeriod = minLockPeriod;
        minLockPeriod = _newPeriod;
        
        emit MinLockPeriodUpdated(oldPeriod, _newPeriod);
    }

    /**
     * @dev Emergency withdraw token (only for emergency role)
     * @param _token Address of the token to withdraw
     * @param _to Address to send tokens to
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, address _to, uint256 _amount) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        require(_to != address(0), "Cannot withdraw to zero address");
        require(_amount > 0, "Amount must be greater than zero");
        
        // Transfer tokens
        IERC20(_token).safeTransfer(_to, _amount);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(POOL_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(POOL_ADMIN_ROLE) {
        _unpause();
    }
}
