// Contract addresses for NEDA Pay on Base Sepolia testnet
export const contractAddresses = {
  // Core contracts
  tshc: '0x0859D42FD008D617c087DD386667da51570B1aAB',
  reserve: '0x72Ff093CEA6035fa395c0910B006af2DC4D4E9F5',
  testUSDC: '0x4ecD2810a6A412fdc95B71c03767068C35D23fE3',
  
  // Additional contracts
  priceOracle: '0xe4A05fca88C4F10fe6d844B75025E3415dFe6170',
  feeManager: '0x46358DA741d3456dBAEb02995979B2722C3b8722',
  batchPayment: '0x9E1e03b06FB36364b3A6cbb6AbEC4f6f2B9C8DdC',
  
  // Account abstraction contracts
  paymaster: '0x7d9687c95831874926bbc9476844674D6B943464',
  smartWalletFactory: '0x10dE41927cdD093dA160E562630e0efC19423869',
  
  // Network information
  network: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org'
  }
};

// ABIs for interacting with the contracts
export const abis = {
  // SimpleTSHC ABI - only essential functions
  tshc: [
    // Read functions
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    // Write functions
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],
  
  // SimpleReserve ABI - only essential functions
  reserve: [
    // Collateral management
    'function addCollateralAsset(address _token, uint256 _collateralRatio)',
    'function depositCollateralAndMintTSHC(address _token, uint256 _amount) returns (uint256)',
    'function burnTSHCAndWithdrawCollateral(address _token, uint256 _tshcAmount) returns (uint256)',
    // Read functions
    'function collateralAssets(address) view returns (bool isSupported, uint256 collateralRatio, uint256 totalDeposited)',
    'function supportedCollaterals(uint256) view returns (address)',
    'function minimumCollateralRatio() view returns (uint256)'
  ],
  
  // TestUSDC ABI - only essential functions
  testUSDC: [
    // Read functions
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    // Write functions
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],
  priceOracle: [
    'function getLatestPrice(bytes32 _pair) external view returns (uint256 price, uint256 timestamp)',
    'function updatePrice(bytes32 _pair, uint256 _price) external'
  ],
  feeManager: [
    'function calculateFee(uint256 _amount) public view returns (uint256 fee)',
    'function collectFee(address _from, uint256 _amount) external'
  ],
  batchPayment: [
    'function createBatchPayment(address[] calldata _recipients, uint256[] calldata _amounts, string calldata _paymentReference) external returns (uint256 batchId)',
    'function processBatchPayment(uint256 _batchId) external'
  ],
  paymaster: [
    'function deposit(uint256 _amount) external',
    'function withdraw(uint256 _amount) external',
    'function deposits(address) public view returns (uint256)',
    'function calculateTSHCCost(uint256 _gasAmount) external view returns (uint256)',
    'function sponsorTransaction(address _user, uint256 _gasUsed) external'
  ],
  smartWalletFactory: [
    'function createWallet(address _owner) external returns (address wallet)',
    'function getWallet(address _owner) external view returns (address)',
    'function hasWallet(address _owner) external view returns (bool)'
  ]
};

// Helper functions for interacting with contracts
export function getContractConfig(contractName: 'tshc' | 'reserve' | 'testUSDC' | 'priceOracle' | 'feeManager' | 'batchPayment' | 'paymaster' | 'smartWalletFactory') {
  return {
    address: contractAddresses[contractName],
    abi: abis[contractName]
  };
};
