// Global type declarations for the application

interface Window {
  ethereum?: any;
  connectCoinbaseWallet?: () => Promise<boolean>;
}
