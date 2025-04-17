// Stablecoins data from stablecoins.earth
export const stablecoins = [
  {
    region: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    baseToken: 'TSHC',
    name: 'Tanzania Shilling Coin',
    address: '0x123456789abcdef123456789abcdef123456789a', // Placeholder address
    issuer: 'NEDA Pay',
    description: 'Stablecoin pegged 1:1 to the Tanzania Shilling (TZS)',
    website: 'https://nedapay.app'
  },
  {
    region: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    baseToken: 'cNGN',
    name: 'Nigerian Naira Coin',
    address: '0x9e469e1fc7fb4c5d17897212d1c175a7e8493ede', // Real address from stablecoins.earth
    issuer: 'Convexity',
    description: 'Stablecoin pegged 1:1 to the Nigerian Naira (NGN)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    baseToken: 'NGNC',
    name: 'Nigerian Naira Coin',
    address: '0x182c76e977a3f0c1e5e5a9268c8438a07e427e17', // Real address from stablecoins.earth
    issuer: 'Link',
    description: 'Stablecoin pegged 1:1 to the Nigerian Naira (NGN)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    baseToken: 'ZARP',
    name: 'South African Rand Coin',
    address: '0xb755a4e14a1cdf9a7e4b9511b98f56a0ce4bc214', // Real address from stablecoins.earth
    issuer: 'inv.es',
    description: 'Stablecoin pegged 1:1 to the South African Rand (ZAR)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    baseToken: 'MXNe',
    name: 'Mexican Peso Coin',
    address: '0x69c744d3444202d35f2783d5a1a1525e9f37fb58', // Real address from stablecoins.earth
    issuer: 'Etherfuse/Brale',
    description: 'Stablecoin pegged 1:1 to the Mexican Peso (MXN)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    baseToken: 'IDRX',
    name: 'Indonesian Rupiah Coin',
    address: '0x7e62d4d282a5b5e2d0c1b293bcba53b3b4b65680', // Real address from stablecoins.earth
    issuer: 'IDRX.co',
    description: 'Stablecoin pegged 1:1 to the Indonesian Rupiah (IDR)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Europe',
    flag: '🇪🇺',
    currency: 'EUR',
    baseToken: 'EURC',
    name: 'Euro Coin',
    address: '0x1a7e4e63778b4f12a199c062f3efdd288afcbce8', // Real address from stablecoins.earth
    issuer: 'Circle',
    description: 'Stablecoin pegged 1:1 to the Euro (EUR)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    baseToken: 'CADC',
    name: 'Canadian Dollar Coin',
    address: '0x0a9f693fce6f00a51a8e0db4351b5a8078b4242e', // Real address from stablecoins.earth
    issuer: 'PayTrie',
    description: 'Stablecoin pegged 1:1 to the Canadian Dollar (CAD)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    baseToken: 'BRZ',
    name: 'Brazilian Real Coin',
    address: '0x491a4eb4f1fc3bff8e1d2fc856a6a46663ad556f', // Real address from stablecoins.earth
    issuer: 'Transfero',
    description: 'Stablecoin pegged 1:1 to the Brazilian Real (BRL)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'Turkey',
    flag: '🇹🇷',
    currency: 'TRY',
    baseToken: 'TRYB',
    name: 'Turkish Lira Coin',
    address: '0x2e6c25f2ce6b3c7f5a0c9968136e9304016b0a4a', // Real address from stablecoins.earth
    issuer: 'BiLira',
    description: 'Stablecoin pegged 1:1 to the Turkish Lira (TRY)',
    website: 'https://stablecoins.earth'
  },
  {
    region: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    baseToken: 'NZDD',
    name: 'New Zealand Dollar Coin',
    address: '0xfb0adcb3c6b2bb0bbf81b2c5c6c0e1e8b9f2f1cc', // Real address from stablecoins.earth
    issuer: 'Easy Crypto',
    description: 'Stablecoin pegged 1:1 to the New Zealand Dollar (NZD)',
    website: 'https://stablecoins.earth'
  }
];

// Mock balances for demonstration purposes
export const mockBalances = {
  'TSHC': '25,000',
  'cNGN': '8,500',
  'IDRX': '12,000'
};

// Mock transaction data
export const mockTransactions = [
  { 
    id: '0x123abc456def789ghi0123456789abcdef0123', 
    shortId: '0x123...abc',
    date: '2025-04-11 10:23', 
    amount: '5,000', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'John Doe',
    sender: '0x7890abcdef123456789abcdef123456789abcde',
    senderShort: '0x789...cde',
    blockExplorerUrl: 'https://basescan.org/tx/0x123abc456def789ghi0123456789abcdef0123'
  },
  { 
    id: '0x456def789ghi0123456789abcdef0123456789', 
    shortId: '0x456...def',
    date: '2025-04-10 15:45', 
    amount: '2,500', 
    currency: 'cNGN', 
    status: 'Completed', 
    customer: 'Jane Smith',
    sender: '0xabcdef123456789abcdef123456789abcdef01',
    senderShort: '0xabc...f01',
    blockExplorerUrl: 'https://basescan.org/tx/0x456def789ghi0123456789abcdef0123456789'
  },
  { 
    id: '0x789ghi0123456789abcdef0123456789abcdef', 
    shortId: '0x789...ghi',
    date: '2025-04-10 09:12', 
    amount: '10,000', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'Acme Corp',
    sender: '0xdef123456789abcdef123456789abcdef01234',
    senderShort: '0xdef...234',
    blockExplorerUrl: 'https://basescan.org/tx/0x789ghi0123456789abcdef0123456789abcdef'
  },
  { 
    id: '0xabc0123456789abcdef0123456789abcdef0123', 
    shortId: '0xabc...123',
    date: '2025-04-09 14:30', 
    amount: '1,200', 
    currency: 'IDRX', 
    status: 'Completed', 
    customer: 'Bob Johnson',
    sender: '0x123456789abcdef123456789abcdef12345678',
    senderShort: '0x123...678',
    blockExplorerUrl: 'https://basescan.org/tx/0xabc0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xdef0123456789abcdef0123456789abcdef0123', 
    shortId: '0xdef...456',
    date: '2025-04-09 11:05', 
    amount: '7,500', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'Tech Solutions Ltd',
    sender: '0x456789abcdef123456789abcdef123456789ab',
    senderShort: '0x456...9ab',
    blockExplorerUrl: 'https://basescan.org/tx/0xdef0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xghi0123456789abcdef0123456789abcdef0123', 
    shortId: '0xghi...789',
    date: '2025-04-08 16:20', 
    amount: '3,800', 
    currency: 'cNGN', 
    status: 'Completed', 
    customer: 'Sarah Williams',
    sender: '0x789abcdef123456789abcdef123456789abcde',
    senderShort: '0x789...cde',
    blockExplorerUrl: 'https://basescan.org/tx/0xghi0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xjkl0123456789abcdef0123456789abcdef0123', 
    shortId: '0xjkl...012',
    date: '2025-04-08 09:45', 
    amount: '4,200', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'Global Traders',
    sender: '0xabcdef123456789abcdef123456789abcdef01',
    senderShort: '0xabc...f01',
    blockExplorerUrl: 'https://basescan.org/tx/0xjkl0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xmno0123456789abcdef0123456789abcdef0123', 
    shortId: '0xmno...345',
    date: '2025-04-07 14:15', 
    amount: '6,300', 
    currency: 'IDRX', 
    status: 'Completed', 
    customer: 'Local Market',
    sender: '0xdef123456789abcdef123456789abcdef01234',
    senderShort: '0xdef...234',
    blockExplorerUrl: 'https://basescan.org/tx/0xmno0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xpqr0123456789abcdef0123456789abcdef0123', 
    shortId: '0xpqr...678',
    date: '2025-04-07 10:30', 
    amount: '9,100', 
    currency: 'TSHC', 
    status: 'Completed', 
    customer: 'David Miller',
    sender: '0x123456789abcdef123456789abcdef12345678',
    senderShort: '0x123...678',
    blockExplorerUrl: 'https://basescan.org/tx/0xpqr0123456789abcdef0123456789abcdef0123'
  },
  { 
    id: '0xstu0123456789abcdef0123456789abcdef0123', 
    shortId: '0xstu...901',
    date: '2025-04-06 17:40', 
    amount: '1,800', 
    currency: 'cNGN', 
    status: 'Completed', 
    customer: 'Emma Davis',
    sender: '0x456789abcdef123456789abcdef123456789ab',
    senderShort: '0x456...9ab',
    blockExplorerUrl: 'https://basescan.org/tx/0xstu0123456789abcdef0123456789abcdef0123'
  }
];
