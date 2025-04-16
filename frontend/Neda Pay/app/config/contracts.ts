// Contract addresses for NEDA Pay on Base Sepolia testnet
export const contractAddresses = {
  // Core contracts
  tshc: '0x0859D42FD008D617c087DD386667da51570B1aAB',
  reserve: '0x72Ff093CEA6035fa395c0910B006af2DC4D4E9F5',
  testUSDC: '0x4ecD2810a6A412fdc95B71c03767068C35D23fE3',
  
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
  ]
};

// Helper functions for interacting with contracts
export const getContractConfig = (contractName: 'tshc' | 'reserve' | 'testUSDC') => {
  return {
    address: contractAddresses[contractName],
    abi: abis[contractName]
  };
};
