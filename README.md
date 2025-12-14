# XSRN - X402 Service Routing Network

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@xsrn%2Fprotocol.svg)](https://badge.fury.io/js/@xsrn%2Fprotocol)
[![Build Status](https://github.com/Agentrix2025/XSRN/workflows/CI/badge.svg)](https://github.com/Agentrix2025/XSRN/actions)

> Decentralized service routing and incentive protocol for the x402 payment ecosystem

## 🌟 Overview

XSRN (X402 Service Routing Network) is the incentive and quality assurance layer for the x402 payment protocol. It provides:

- **📊 Protocol Fee Distribution** - 0.3% fee on x402 transactions distributed to network participants
- **🏆 Epoch-based Rewards** - Weekly reward cycles with Merkle tree distribution
- **✅ Quality Assurance** - Bond/Challenge mechanism to ensure service quality
- **🔗 Service Routing** - Intelligent routing for optimal payment paths

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Payment                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     XsrnSessionManager                           │
│                  (Session Key Payment Entry)                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       XsrnFeeSplitter                            │
│               (Core Fee Distribution Contract)                   │
│                                                                  │
│  • Deducts 0.3% protocol fee → Treasury                         │
│  • Records receipt → ReceiptRegistry                            │
│  • Forwards 99.7% → Commission contract                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────────┐     ┌───────────────────┐
│   XsrnTreasury    │     │    Commission     │
│  (Protocol Fees)  │     │ (Merchant Split)  │
│                   │     │                   │
│ • 40% Watcher     │     │ • Merchant        │
│ • 30% Operator    │     │ • Agent/Referrer  │
│ • 20% Public Good │     │ • Platform        │
│ • 10% Reserve     │     │ • Off-ramp        │
└───────────────────┘     └───────────────────┘
```

## 📦 Contracts

| Contract | Description | Status |
|----------|-------------|--------|
| `XsrnSessionManager` | Session key payment management (ERC-8004) | ✅ Deployed |
| `XsrnFeeSplitter` | Core fee splitting (0.3% protocol fee) | ✅ Deployed |
| `XsrnTreasury` | Protocol fee treasury (40/30/20/10 distribution) | ✅ Deployed |
| `ReceiptRegistry` | On-chain payment receipts | ✅ Deployed |
| `EpochManager` | 7-day epoch cycle management | ✅ Deployed |
| `MerkleDistributor` | Merkle tree reward distribution | ✅ Deployed |
| `AttestationRegistry` | Quality attestation with Bond/Challenge | ✅ Deployed |

## 🚀 Quick Start

### Installation

```bash
npm install @xsrn/protocol
# or
yarn add @xsrn/protocol
```

### Using the SDK

```typescript
import { XsrnClient, EpochService, MerkleGenerator } from '@xsrn/protocol';

// Initialize client
const client = new XsrnClient({
  rpcUrl: 'https://bsc-testnet.nodereal.io/v1/...',
  chainId: 97,
  contracts: {
    treasury: '0x3FDfB8408cdd91B5692E68F07B8937fD5F62fC01',
    feeSplitter: '0x371E206CA565f5713b8Cd1f8922A2eb8FB0F98F7',
    // ... other contract addresses
  }
});

// Get epoch info
const epochInfo = await client.getEpochInfo();
console.log(`Current Epoch: ${epochInfo.id}, Ends: ${epochInfo.endTime}`);

// Claim rewards
const proof = await client.getMerkleProof(userAddress, epochId);
await client.claimRewards(epochId, proof);
```

### Deploy Contracts

```bash
# Clone repository
git clone https://github.com/Agentrix2025/XSRN.git
cd XSRN

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your private key and RPC URL

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to BSC Testnet
npm run deploy:testnet
```

## 💰 Fee Structure

### Protocol Fee (0.3%)

Every x402 payment deducts 0.3% as protocol fee, distributed as:

| Role | Share | Purpose |
|------|-------|---------|
| **Watcher** | 40% | On-chain monitoring and alerts |
| **Operator** | 30% | Node operation and maintenance |
| **Public Goods** | 20% | Ecosystem public goods funding |
| **Security Reserve** | 10% | Security reserve fund |

### Epoch Rewards

- **Cycle**: 7 days
- **Distribution**: Merkle tree proofs
- **Claim**: Users call `claim()` or `claimMultiple()`

## ✅ Quality Assurance (Bond/Challenge)

### Workflow

1. **Submit Attestation**: Agent submits service quality proof + optional bond
2. **Challenge Period**: 7-day window for challenges
3. **Arbitration**: If challenged, arbiter makes decision
4. **Outcome**:
   - Challenge succeeds: 50% bond goes to challenger
   - Challenge fails: Agent keeps bond, gets validation badge

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Min Bond | 10 USDT | Minimum stake for attestation |
| Challenge Period | 7 days | Time window for challenges |
| Slash Percentage | 50% | Penalty for failed attestation |

## 🔧 Development

### Project Structure

```
xsrn-protocol/
├── contracts/           # Solidity smart contracts
│   ├── XsrnFeeSplitter.sol
│   ├── XsrnTreasury.sol
│   ├── XsrnSessionManager.sol
│   ├── ReceiptRegistry.sol
│   ├── EpochManager.sol
│   ├── MerkleDistributor.sol
│   └── AttestationRegistry.sol
├── src/                 # TypeScript SDK source
│   ├── client.ts
│   ├── services/
│   └── types/
├── test/               # Test files
├── scripts/            # Deployment scripts
├── frontend/           # React components
└── docs/               # Documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/XsrnProtocol.test.ts
```

### Code Style

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

## 📖 API Reference

### XsrnClient

```typescript
class XsrnClient {
  constructor(config: XsrnConfig);
  
  // Epoch methods
  getEpochInfo(): Promise<EpochInfo>;
  getEpochStats(epochId: number): Promise<EpochStats>;
  
  // Rewards methods
  getRewardsBalance(address: string): Promise<RewardsBalance>;
  getMerkleProof(address: string, epochId: number): Promise<MerkleProof>;
  claimRewards(epochId: number, proof: MerkleProof): Promise<TxResult>;
  claimMultipleRewards(claims: ClaimData[]): Promise<TxResult>;
  
  // Attestation methods
  submitAttestation(contentHash: string, bondAmount?: bigint): Promise<TxResult>;
  challenge(attestationId: string, reason: string): Promise<TxResult>;
  getAttestationStatus(attestationId: string): Promise<AttestationStatus>;
}
```

See [API Documentation](./docs/api/README.md) for full reference.

## 🌐 Deployed Contracts

### BSC Testnet (Chain ID: 97)

| Contract | Address |
|----------|---------|
| XsrnTreasury | `0x3FDfB8408cdd91B5692E68F07B8937fD5F62fC01` |
| XsrnFeeSplitter | `0x371E206CA565f5713b8Cd1f8922A2eb8FB0F98F7` |
| XsrnSessionManager | `0x85F03Ca00307f4F7C218CF88aC15Ae7FdD6b0F95` |
| ReceiptRegistry | `0x1BBEeb73AC8bbDC9D5063B6E53470D3234B7240c` |
| EpochManager | `0xAe969539b6c840798658dd2e141e6a5F898C9f00` |
| MerkleDistributor | `0xC72d761b6dE93F33Dcba2fA150316F6E1F63f6E2` |
| AttestationRegistry | `0x6BfDDeBbF72E32f4d9fd87452da3fFDe58341267` |

### BSC Mainnet (Chain ID: 56)

Coming soon after security audit.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Write comprehensive tests for new features
- Update documentation as needed
- Keep commits atomic and well-documented

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Website**: [https://xsrn.x402.org](https://xsrn.x402.org)
- **Documentation**: [https://docs.xsrn.x402.org](https://docs.xsrn.x402.org)
- **x402 Protocol**: [https://x402.org](https://x402.org)
- **Agentrix**: [https://agentrix.top](https://agentrix.top)
- **Twitter**: [@x402protocol](https://twitter.com/x402protocol)
- **Discord**: [Join our Discord](https://discord.gg/x402)

## 📧 Contact

- **Email**: dev@agentrix.top
- **GitHub Issues**: [Report a bug](https://github.com/Agentrix2025/XSRN/issues)

---

<p align="center">
  Built with ❤️ by the <a href="https://agentrix.top">Agentrix</a> team
</p>
