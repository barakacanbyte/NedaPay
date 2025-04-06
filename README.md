# NEDA Pay - Tanzania Shilling Stablecoin (TSHC)

![NEDA Pay](https://i.imgur.com/placeholder-image.png)

NEDA Pay is a decentralized payment platform built on Base that introduces the Tanzania Shilling Stablecoin (TSHC), a fully backed 1:1 stablecoin pegged to the Tanzania Shilling (TSH). The platform provides a secure, fast, and affordable payment solution for Tanzania and East Africa.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

NEDA Pay leverages blockchain technology to provide a stablecoin solution for Tanzania and East Africa. The TSHC stablecoin is fully backed by TSH reserves, including government bonds and other secure assets, ensuring stability and trust in the system.

The platform offers various features such as wallet management, sending and receiving TSHC, and integration with local payment methods like mobile money services (e.g., M-Pesa) and bank accounts.

## Features

- **TSHC Stablecoin**: A digital token pegged 1:1 to the Tanzania Shilling (TSH)
- **Wallet Management**: Create and manage your TSHC wallet
- **Send & Receive**: Transfer TSHC to anyone with a wallet
- **Multiple Funding Options**:
  - Cryptocurrency deposits
  - Mobile money transfers (coming soon)
  - Bank account connections (coming soon)
- **Dashboard**: View transaction history, balances, and analytics
- **Multi-wallet Support**: Connect with MetaMask and Coinbase Wallet
- **Dark/Light Mode**: User-friendly interface with theme options

## Project Structure

```
Neda Pay/
├── frontend/               # Next.js frontend application
│   ├── app/                # App directory structure
│   │   ├── components/     # Reusable UI components
│   │   ├── dashboard/      # Dashboard page
│   │   ├── wallet/         # Wallet management page
│   │   ├── send/           # Send TSHC page
│   │   └── ...             # Other pages
├── backend/                # Node.js backend services
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
├── contracts/              # Smart contracts
│   ├── TSHC.sol            # TSHC token contract
│   ├── NedaPaymaster.sol   # Account abstraction paymaster
│   └── ...                 # Other contracts
└── scripts/                # Deployment and utility scripts
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: TailwindCSS
- **Web3 Integration**: OnchainKit by Coinbase
- **Wallet Connectivity**: MetaMask, Coinbase Wallet

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT

### Blockchain
- **Network**: Base (Coinbase L2 on Ethereum)
- **Smart Contract Language**: Solidity
- **Development Framework**: Hardhat
- **Account Abstraction**: ERC-4337

## Smart Contracts

### TSHC Token (ERC-20)

The TSHC token is an ERC-20 compliant token with additional features for stability and security:

- Minting and burning controlled by authorized entities
- Pausable functionality for emergency situations
- Blacklisting capabilities for regulatory compliance
- 1:1 backing with TSH reserves

### NedaPaymaster

The NedaPaymaster contract enables gasless transactions through account abstraction (ERC-4337), allowing users to pay transaction fees in TSHC instead of ETH.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MetaMask or Coinbase Wallet browser extension

### Installation

1. Clone the repository:

```bash
git clone https://github.com/0xMgwan/NedaPay.git
cd NedaPay
```

2. Install frontend dependencies:

```bash
cd frontend/Neda\ Pay
npm install
```

3. Install backend dependencies:

```bash
cd ../../backend
npm install
```

4. Set up environment variables:

Create `.env.local` in the frontend directory with the following variables:

```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

5. Start the development server:

```bash
# In the frontend directory
npm run dev

# In a separate terminal, in the backend directory
npm run dev
```

## Development

### Frontend Development

The frontend is built with Next.js and uses the App Router for routing. Key components include:

- `WalletSelector`: Handles wallet connections (MetaMask, Coinbase Wallet)
- `Header`: Navigation and wallet status display
- Page components: Dashboard, Wallet, Send, etc.

### Smart Contract Development

Smart contracts are developed using Hardhat:

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Deployment

### Frontend Deployment

The frontend can be deployed to Vercel:

```bash
cd frontend/Neda\ Pay
vercel
```

### Smart Contract Deployment

Deploy smart contracts to Base Testnet or Mainnet:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network base-testnet
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built by David Machuche (0xMgwan) | [GitHub](https://github.com/0xMgwan)
