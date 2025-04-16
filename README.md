# NEDA Pay - Tanzania Shilling Stablecoin (TSHC)

![NEDA Pay](https://i.imgur.com/placeholder-image.png)

NEDA Pay is a decentralized payment platform built on Base (Coinbase's Layer 2 solution) that introduces the Tanzania Shilling Stablecoin (TSHC), a fully backed 1:1 stablecoin pegged to the Tanzania Shilling (TZS). The platform provides a secure, fast, and affordable payment solution for Tanzania and East Africa, leveraging blockchain technology to enable financial inclusion and cross-border payments.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Smart Contracts](#smart-contracts)
  - [TSHC Token](#tshc-token)
  - [Reserve System](#reserve-system)
  - [Price Oracle](#price-oracle)
  - [Fee Manager](#fee-manager)
  - [Batch Payment](#batch-payment)
  - [Account Abstraction](#account-abstraction)
- [Deployed Contracts](#deployed-contracts)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Admin Portal](#admin-portal)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

NEDA Pay leverages blockchain technology to provide a comprehensive stablecoin solution for Tanzania and East Africa. The TSHC stablecoin is fully backed by TZS reserves, including government bonds and other secure assets, ensuring stability and trust in the system.

The platform is built on Base, Coinbase's Ethereum Layer 2 solution, which provides fast and low-cost transactions while maintaining security and decentralization. NEDA Pay implements account abstraction (ERC-4337) to enable gasless transactions, allowing users to pay transaction fees in TSHC instead of ETH, making the platform more accessible to users without cryptocurrency experience.

The ecosystem consists of several components:

1. **Core Protocol**: Smart contracts for TSHC issuance, reserves management, and price stability
2. **User Interface**: Web application for wallet management and transactions
3. **Admin Portal**: Dashboard for administrators to manage the system
4. **Integration Layer**: APIs for connecting with local payment methods and financial services

NEDA Pay aims to bridge the gap between traditional finance and blockchain technology, providing a stable, efficient, and accessible payment solution for the region.

## Features

### Core Features
- **TSHC Stablecoin**: A digital token pegged 1:1 to the Tanzania Shilling (TZS)
- **Wallet Management**: Create and manage your TSHC wallet
- **Send & Receive**: Transfer TSHC to anyone with a wallet
- **Batch Payments**: Send TSHC to multiple recipients in a single transaction
- **Gasless Transactions**: Pay transaction fees in TSHC instead of ETH

### User Experience
- **Smart Contract Wallets**: Non-custodial wallets with advanced security features
- **Multi-wallet Support**: Connect with MetaMask, Coinbase Wallet, and more
- **Dark/Light Mode**: User-friendly interface with theme options
- **Mobile Responsive**: Access from any device with a responsive design

### Financial Services
- **Multiple Funding Options**:
  - Cryptocurrency deposits (ETH, USDC)
  - Mobile money transfers (M-Pesa, Airtel Money, Tigo Pesa)
  - Bank account connections
- **Merchant Solutions**: Payment processing for businesses
- **Remittances**: Low-cost cross-border transfers

### Analytics & Management
- **Dashboard**: View transaction history, balances, and analytics
- **Export Data**: Download transaction history in various formats
- **Notifications**: Real-time alerts for transactions and account activity

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
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React Context API and SWR for data fetching
- **Web3 Integration**: OnchainKit by Coinbase, ethers.js v6
- **Wallet Connectivity**: MetaMask, Coinbase Wallet, WalletConnect
- **Internationalization**: next-intl for multi-language support

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for high-performance caching
- **Authentication**: JWT with refresh token rotation
- **API Documentation**: Swagger/OpenAPI
- **Monitoring**: Prometheus and Grafana

### Blockchain
- **Network**: Base (Coinbase L2 on Ethereum)
- **Smart Contract Language**: Solidity v0.8.20+
- **Development Framework**: Hardhat with TypeScript
- **Testing**: Hardhat, Chai, Waffle
- **Account Abstraction**: ERC-4337 implementation
- **Security Tools**: Slither, Mythril, OpenZeppelin Test Helpers

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Deployment**: Vercel (Frontend), AWS (Backend)
- **Monitoring**: Datadog, Sentry
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Smart Contracts

NEDA Pay's blockchain infrastructure consists of several interconnected smart contracts that work together to provide a secure, stable, and efficient stablecoin ecosystem.

### TSHC Token

The TSHC token (Tanzania Shilling Stablecoin) is an ERC-20 compliant token with enhanced functionality:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
```

**Key Features:**
- **Minting & Burning**: Controlled by authorized entities with MINTER_ROLE
- **Access Control**: Role-based permissions for different operations
- **Pausable**: Can be paused in emergency situations
- **Blacklisting**: Addresses can be blacklisted for regulatory compliance
- **Metadata**: Name: "Tanzania Shilling Stablecoin", Symbol: "TSHC", 18 decimals

### Reserve System

The Reserve contract manages the collateral backing the TSHC stablecoin:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
```

**Key Features:**
- **Multi-Collateral Support**: Can accept various ERC-20 tokens as collateral
- **Collateralization Ratio**: Maintains a minimum collateralization ratio
- **Deposit & Withdrawal**: Controlled deposit and withdrawal of collateral
- **Price Oracle Integration**: Uses price oracle for collateral valuation

### Price Oracle

The PriceOracle contract provides price data for different assets:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
```

**Key Features:**
- **Multiple Price Sources**: Can aggregate prices from different sources
- **Chainlink Integration**: Uses Chainlink price feeds for reliable data
- **Heartbeat Monitoring**: Ensures price data is fresh and valid
- **Fallback Mechanisms**: Redundancy in case of price feed failures

### Fee Manager

The FeeManager contract handles fee collection and distribution:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
```

**Key Features:**
- **Fee Calculation**: Configurable fee rates for different operations
- **Fee Collection**: Collects fees from various operations
- **Fee Distribution**: Distributes fees to stakeholders
- **Fee Adjustment**: Allows adjustment of fee parameters

### Batch Payment

The BatchPayment contract enables efficient batch transactions:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
```

**Key Features:**
- **Multiple Recipients**: Send to multiple addresses in one transaction
- **Gas Optimization**: Reduces gas costs for bulk payments
- **Reference Information**: Includes reference data for payments
- **Batch Processing**: Can process batches asynchronously

### Account Abstraction

NEDA Pay implements ERC-4337 for account abstraction through several contracts:

#### Paymaster

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
```

**Key Features:**
- **Gasless Transactions**: Users pay fees in TSHC instead of ETH
- **Deposit System**: Users deposit TSHC to cover gas costs
- **Gas Price Management**: Dynamically adjusts to network conditions
- **Exchange Rate**: Manages the exchange rate between ETH and TSHC

#### Smart Wallet Factory

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
```

**Key Features:**
- **Wallet Creation**: Creates smart contract wallets for users
- **Counterfactual Deployment**: Wallets can be deployed on first use
- **Wallet Registry**: Keeps track of deployed wallets
- **Wallet Recovery**: Supports social recovery mechanisms

## Deployed Contracts

All NEDA Pay smart contracts are deployed on the Base Sepolia testnet:

| Contract | Address | Description |
|----------|---------|-------------|
| SimpleTSHC | `0x0859D42FD008D617c087DD386667da51570B1aAB` | Tanzania Shilling Stablecoin |
| SimpleReserve | `0x72Ff093CEA6035fa395c0910B006af2DC4D4E9F5` | Collateral reserve system |
| TestUSDC | `0x4ecD2810a6A412fdc95B71c03767068C35D23fE3` | Test USDC for collateral |
| SimplePriceOracle | `0xe4A05fca88C4F10fe6d844B75025E3415dFe6170` | Price feed oracle |
| SimpleFeeManager | `0x46358DA741d3456dBAEb02995979B2722C3b8722` | Fee management system |
| SimpleBatchPayment | `0x9E1e03b06FB36364b3A6cbb6AbEC4f6f2B9C8DdC` | Batch payment processor |
| SimplePaymaster | `0x7d9687c95831874926bbc9476844674D6B943464` | Account abstraction paymaster |
| SimpleSmartWalletFactory | `0x10dE41927cdD093dA160E562630e0efC19423869` | Smart wallet factory |

## Architecture

NEDA Pay follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│            User Interface            │
│  ┌─────────────┐    ┌─────────────┐ │
│  │   Frontend  │    │ Admin Portal │ │
│  └─────────────┘    └─────────────┘ │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│            API Gateway               │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│         Backend Services             │
│  ┌─────────────┐    ┌─────────────┐ │
│  │  User API   │    │ Payment API  │ │
│  └─────────────┘    └─────────────┘ │
│  ┌─────────────┐    ┌─────────────┐ │
│  │ Wallet API  │    │   KYC API   │ │
│  └─────────────┘    └─────────────┘ │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│         Blockchain Layer             │
│  ┌─────────────┐    ┌─────────────┐ │
│  │ TSHC Token  │    │   Reserve   │ │
│  └─────────────┘    └─────────────┘ │
│  ┌─────────────┐    ┌─────────────┐ │
│  │Price Oracle │    │ Fee Manager │ │
│  └─────────────┘    └─────────────┘ │
│  ┌─────────────┐    ┌─────────────┐ │
│  │Batch Payment│    │  Paymaster  │ │
│  └─────────────┘    └─────────────┘ │
└─────────────────────────────────────┘
```

### Data Flow

1. **User Interaction**: Users interact with the frontend or admin portal
2. **API Gateway**: Requests are routed through the API gateway
3. **Backend Services**: Business logic is processed by appropriate services
4. **Blockchain Interaction**: Services interact with smart contracts
5. **Smart Contract Execution**: Transactions are executed on the Base network

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MetaMask or Coinbase Wallet browser extension
- Git

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
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

Create `.env` in the root directory for contract deployment:

```
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_basescan_api_key_here
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
- `TransactionForm`: Handles sending TSHC to recipients
- `Dashboard`: Displays user balance and transaction history

```tsx
// Example of connecting to wallet
import { useConnect } from '@onchainkit/react';

function WalletConnect() {
  const { connect, isConnecting } = useConnect();
  
  return (
    <button 
      onClick={() => connect()}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
```

### Smart Contract Development

Smart contracts are developed using Hardhat:

```bash
cd minimal-test
npm install
npx hardhat compile
npx hardhat test
```

Example test for TSHC token:

```javascript
const { expect } = require("chai");

describe("TSHC", function () {
  let tshc;
  let owner;
  let minter;
  let user;

  beforeEach(async function () {
    [owner, minter, user] = await ethers.getSigners();
    
    const TSHC = await ethers.getContractFactory("SimpleTSHC");
    tshc = await TSHC.deploy(owner.address);
    await tshc.waitForDeployment();
    
    // Grant minter role
    const MINTER_ROLE = await tshc.MINTER_ROLE();
    await tshc.grantRole(MINTER_ROLE, minter.address);
  });

  it("Should allow minting by authorized minter", async function () {
    const mintAmount = ethers.parseEther("1000");
    await tshc.connect(minter).mint(user.address, mintAmount);
    expect(await tshc.balanceOf(user.address)).to.equal(mintAmount);
  });
});
```

## Deployment

### Frontend Deployment

The frontend can be deployed to Vercel:

```bash
cd frontend/Neda\ Pay
vercel
```

### Smart Contract Deployment

Deploy smart contracts to Base Sepolia testnet:

```bash
cd minimal-test
npx hardhat run scripts/deploy-all.js --network baseSepolia
```

Deploy individual contracts:

```bash
# Deploy TSHC and Reserve
npx hardhat run scripts/deploy.js --network baseSepolia

# Deploy Price Oracle
npx hardhat run scripts/deploy-oracle.js --network baseSepolia

# Deploy Fee Manager
npx hardhat run scripts/deploy-fee-manager.js --network baseSepolia

# Deploy Batch Payment
npx hardhat run scripts/deploy-batch-payment.js --network baseSepolia

# Deploy Account Abstraction contracts
npx hardhat run scripts/deploy-account-abstraction.js --network baseSepolia
```

## Admin Portal

The NEDA Pay Admin Portal provides administrative functionality for managing the TSHC ecosystem:

### Features

- **Dashboard**: Overview of system metrics and statistics
- **Mint/Burn**: Mint new TSHC tokens or burn existing ones
- **Reserves**: Manage collateral reserves and monitor collateralization ratio
- **User Management**: Manage user accounts and permissions
- **Transaction Monitoring**: View and analyze transaction activity

### Installation

```bash
cd admin-portal
npm install
npm run dev
```

### Access Control

The admin portal implements role-based access control:

- **Admin**: Full access to all features
- **Operator**: Limited access to day-to-day operations
- **Viewer**: Read-only access to monitoring and reporting

## Security

NEDA Pay implements multiple security measures to protect user funds and data:

### Smart Contract Security

- **Role-Based Access Control**: Granular permissions for different operations
- **Pausable Contracts**: Emergency pause functionality
- **Upgradeable Design**: Ability to fix vulnerabilities while preserving state
- **Security Audits**: Regular third-party security audits

### Application Security

- **Authentication**: Multi-factor authentication for admin access
- **API Security**: Rate limiting, CORS protection, and input validation
- **Data Encryption**: Encryption of sensitive data at rest and in transit
- **Monitoring**: Real-time monitoring for suspicious activity

## Roadmap

### Q2 2025
- Launch on Base Mainnet
- Mobile app beta release
- Integration with major mobile money providers in Tanzania

### Q3 2025
- Expand to additional East African countries
- Merchant payment solutions
- Enhanced account abstraction features

### Q4 2025
- Cross-border payment corridors
- DeFi integrations
- Governance framework implementation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Contribution Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style and formatting
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

### Development Process

1. **Issues**: Check existing issues or create a new one
2. **Discussion**: Discuss implementation approach if needed
3. **Implementation**: Code your solution
4. **Testing**: Ensure all tests pass
5. **Review**: Submit for code review
6. **Merge**: Changes will be merged after approval

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2025 NEDA Pay. All rights reserved.

---

Built by David Machuche (0xMgwan) | [GitHub](https://github.com/0xMgwan)
