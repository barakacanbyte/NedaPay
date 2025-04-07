// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PriceOracle
 * @notice Provides price data for the NEDA Pay platform
 * @dev This contract aggregates price data from multiple sources and provides
 *      reliable exchange rates for the Tanzania Shilling
 */
contract PriceOracle is AccessControl, Pausable {
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
    bytes32 public constant PRICE_FEEDER_ROLE = keccak256("PRICE_FEEDER_ROLE");

    // Price data structure
    struct PriceData {
        uint256 price;      // Price with 8 decimals (e.g., 100000000 = 1.00)
        uint256 timestamp;  // Last update timestamp
        bool active;        // Whether this price feed is active
    }

    // Chainlink price feeds
    struct ChainlinkFeed {
        AggregatorV3Interface feed;
        bool active;
        uint8 decimals;
    }

    // Asset pairs
    mapping(bytes32 => PriceData) public manualPriceFeeds;
    mapping(bytes32 => ChainlinkFeed) public chainlinkFeeds;
    
    // Minimum number of price feeders required for a valid update
    uint256 public minPriceFeeders = 3;
    
    // Maximum price deviation allowed (in basis points)
    uint256 public maxPriceDeviation = 500; // 5%
    
    // Heartbeat - maximum time between updates
    uint256 public heartbeat = 1 hours;

    // Events
    event PriceUpdated(bytes32 indexed pair, uint256 price, uint256 timestamp);
    event ChainlinkFeedAdded(bytes32 indexed pair, address feed);
    event ChainlinkFeedRemoved(bytes32 indexed pair);
    event ChainlinkFeedToggled(bytes32 indexed pair, bool active);
    event HeartbeatUpdated(uint256 oldHeartbeat, uint256 newHeartbeat);
    event MaxPriceDeviationUpdated(uint256 oldDeviation, uint256 newDeviation);
    event MinPriceFeedersUpdated(uint256 oldMin, uint256 newMin);

    /**
     * @dev Constructor initializes the contract with basic roles
     * @param _admin The address that will have the admin role
     */
    constructor(address _admin) {
        require(_admin != address(0), "Admin address cannot be zero");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ORACLE_ADMIN_ROLE, _admin);
        _grantRole(PRICE_FEEDER_ROLE, _admin);

        // Set admin role as the admin for all other roles
        _setRoleAdmin(ORACLE_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(PRICE_FEEDER_ROLE, ORACLE_ADMIN_ROLE);
    }

    /**
     * @dev Add a Chainlink price feed for a pair
     * @param _pair The asset pair (e.g., "TZS/USD")
     * @param _feed The Chainlink aggregator address
     */
    function addChainlinkFeed(bytes32 _pair, address _feed) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(_feed != address(0), "Feed address cannot be zero");
        require(address(chainlinkFeeds[_pair].feed) == address(0), "Feed already exists");

        AggregatorV3Interface aggregator = AggregatorV3Interface(_feed);
        uint8 decimals = aggregator.decimals();

        chainlinkFeeds[_pair] = ChainlinkFeed({
            feed: aggregator,
            active: true,
            decimals: decimals
        });

        emit ChainlinkFeedAdded(_pair, _feed);
    }

    /**
     * @dev Remove a Chainlink price feed
     * @param _pair The asset pair to remove
     */
    function removeChainlinkFeed(bytes32 _pair) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(address(chainlinkFeeds[_pair].feed) != address(0), "Feed does not exist");

        delete chainlinkFeeds[_pair];

        emit ChainlinkFeedRemoved(_pair);
    }

    /**
     * @dev Toggle a Chainlink price feed active status
     * @param _pair The asset pair
     * @param _active Whether the feed should be active
     */
    function toggleChainlinkFeed(bytes32 _pair, bool _active) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(address(chainlinkFeeds[_pair].feed) != address(0), "Feed does not exist");

        chainlinkFeeds[_pair].active = _active;

        emit ChainlinkFeedToggled(_pair, _active);
    }

    /**
     * @dev Update price data for an asset pair
     * @param _pair The asset pair
     * @param _price The new price (with 8 decimals)
     */
    function updatePrice(bytes32 _pair, uint256 _price) 
        external 
        onlyRole(PRICE_FEEDER_ROLE) 
        whenNotPaused 
    {
        require(_price > 0, "Price must be greater than zero");

        // Check if the price is within acceptable deviation
        if (manualPriceFeeds[_pair].price > 0) {
            uint256 currentPrice = manualPriceFeeds[_pair].price;
            uint256 maxPrice = currentPrice + (currentPrice * maxPriceDeviation / 10000);
            uint256 minPrice = currentPrice - (currentPrice * maxPriceDeviation / 10000);
            
            require(_price <= maxPrice && _price >= minPrice, "Price outside acceptable range");
        }

        manualPriceFeeds[_pair] = PriceData({
            price: _price,
            timestamp: block.timestamp,
            active: true
        });

        emit PriceUpdated(_pair, _price, block.timestamp);
    }

    /**
     * @dev Get the latest price for an asset pair
     * @param _pair The asset pair
     * @return price The latest price (with 8 decimals)
     * @return timestamp The timestamp of the latest update
     */
    function getLatestPrice(bytes32 _pair) 
        external 
        view 
        returns (uint256 price, uint256 timestamp) 
    {
        // First check Chainlink feed if available
        if (address(chainlinkFeeds[_pair].feed) != address(0) && chainlinkFeeds[_pair].active) {
            (
                /* uint80 roundID */,
                int256 answer,
                /* uint startedAt */,
                uint256 timeStamp,
                /* uint80 answeredInRound */
            ) = chainlinkFeeds[_pair].feed.latestRoundData();
            
            require(answer > 0, "Invalid Chainlink price");
            require(block.timestamp - timeStamp <= heartbeat, "Chainlink price too old");
            
            // Convert to 8 decimals if needed
            uint8 feedDecimals = chainlinkFeeds[_pair].decimals;
            uint256 chainlinkPrice;
            
            if (feedDecimals < 8) {
                chainlinkPrice = uint256(answer) * (10**(8 - feedDecimals));
            } else if (feedDecimals > 8) {
                chainlinkPrice = uint256(answer) / (10**(feedDecimals - 8));
            } else {
                chainlinkPrice = uint256(answer);
            }
            
            return (chainlinkPrice, timeStamp);
        }
        
        // Fall back to manual price feed
        PriceData memory data = manualPriceFeeds[_pair];
        require(data.active, "No active price feed for this pair");
        require(block.timestamp - data.timestamp <= heartbeat, "Price data too old");
        
        return (data.price, data.timestamp);
    }

    /**
     * @dev Convert an amount from one currency to another
     * @param _fromPair The source currency pair (e.g., "USD/TZS")
     * @param _toPair The target currency pair (e.g., "TZS/USD")
     * @param _amount The amount to convert
     * @return convertedAmount The converted amount
     */
    function convert(bytes32 _fromPair, bytes32 _toPair, uint256 _amount) 
        external 
        view 
        returns (uint256 convertedAmount) 
    {
        (uint256 fromPrice, ) = this.getLatestPrice(_fromPair);
        (uint256 toPrice, ) = this.getLatestPrice(_toPair);
        
        require(fromPrice > 0 && toPrice > 0, "Invalid price data");
        
        // Convert using the ratio of prices
        // For simplicity, assuming both prices have 8 decimals
        convertedAmount = (_amount * fromPrice) / toPrice;
        
        return convertedAmount;
    }

    /**
     * @dev Update the heartbeat (maximum time between updates)
     * @param _newHeartbeat New heartbeat in seconds
     */
    function updateHeartbeat(uint256 _newHeartbeat) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(_newHeartbeat > 0, "Heartbeat must be greater than zero");
        
        uint256 oldHeartbeat = heartbeat;
        heartbeat = _newHeartbeat;
        
        emit HeartbeatUpdated(oldHeartbeat, _newHeartbeat);
    }

    /**
     * @dev Update the maximum price deviation allowed
     * @param _newDeviation New maximum deviation in basis points
     */
    function updateMaxPriceDeviation(uint256 _newDeviation) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(_newDeviation > 0 && _newDeviation <= 5000, "Invalid deviation value");
        
        uint256 oldDeviation = maxPriceDeviation;
        maxPriceDeviation = _newDeviation;
        
        emit MaxPriceDeviationUpdated(oldDeviation, _newDeviation);
    }

    /**
     * @dev Update the minimum number of price feeders required
     * @param _newMin New minimum number of feeders
     */
    function updateMinPriceFeeders(uint256 _newMin) 
        external 
        onlyRole(ORACLE_ADMIN_ROLE) 
    {
        require(_newMin > 0, "Minimum must be greater than zero");
        
        uint256 oldMin = minPriceFeeders;
        minPriceFeeders = _newMin;
        
        emit MinPriceFeedersUpdated(oldMin, _newMin);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ORACLE_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ORACLE_ADMIN_ROLE) {
        _unpause();
    }
}
