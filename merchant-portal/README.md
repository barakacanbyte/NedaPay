# NEDA Pay Merchant Portal Dashboard

A robust, multi-chain merchant dashboard for the NEDA Pay ecosystem. Built with Next.js, React, ethers.js, and wagmi, it allows merchants to view real-time balances and manage stablecoins across supported EVM networks.

---

## Features

- **Multi-Wallet Support:**
  - Connect with MetaMask or Coinbase Wallet (via wagmi connectors).
  - Persistent wallet connection state across all pages.
- **Stablecoin Balances:**
  - Real-time fetching of ERC-20 balances for supported stablecoins (e.g., cNGN, ZARP, EURC, etc.).
  - Shows all stablecoins, but only fetches balances for tokens deployed on the connected network.
- **Network Detection:**
  - Detects the connected network and prompts users to switch if not on Base Mainnet.
  - Only fetches balances for tokens on the current chain (using `chainId`).
- **Error Handling:**
  - Per-token error icons and tooltips for contract call failures (e.g., missing `decimals()` function).
  - Suppresses uncaught contract errors in the browser console.
- **User Experience:**
  - Clean, modern UI with clear feedback for network and token issues.
  - Always displays all tokens, with '0' balance for those not on the current network.

---

## Getting Started

### Prerequisites
- Node.js (>=18)
- npm, yarn, or pnpm

### Installation
```bash
cd merchant-portal
npm install
# or
yarn install
```

### Running Locally
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables
- Configure RPC endpoints and wallet connection settings in `.env.local` if needed.
- No sensitive keys are stored in the frontend.

---

## Stablecoin Configuration
- All supported stablecoins are listed in `app/data/stablecoins.ts`.
- Each token includes a `chainId` property (e.g., `8453` for Base Mainnet, `11155111` for Sepolia Testnet).
- Only tokens matching the connected network are queried for balances.

---

## Wallet Connection & Persistence
- Connection state is managed globally via `GlobalWalletContext`.
- Users only need to connect once; state persists across navigation.
- Supports network switching and smart wallet features.

---

## Error Handling
- Token contract errors (e.g., failed `decimals()` or `balanceOf`) are handled gracefully.
- UI shows a warning icon and tooltip for affected tokens.
- Errors are logged as warnings (not as uncaught exceptions).

---

## Contributing
1. Fork the repo and create your branch (`git checkout -b feature/my-feature`).
2. Commit your changes (`git commit -am 'Add new feature'`).
3. Push to the branch (`git push origin feature/my-feature`).
4. Create a Pull Request.

---

## License
MIT

---

## Contact
For support or questions, contact the NEDA Pay team at [https://nedapay.app](https://nedapay.app)
