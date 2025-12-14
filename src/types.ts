/**
 * XSRN SDK Type Definitions
 */

import { BigNumberish } from 'ethers';

/**
 * XSRN Client Configuration
 */
export interface XsrnConfig {
  /** RPC URL for blockchain connection */
  rpcUrl: string;
  /** Chain ID (97 for BSC Testnet, 56 for BSC Mainnet) */
  chainId: number;
  /** Contract addresses */
  contracts: XsrnContractAddresses;
  /** Private key for signing transactions (optional) */
  privateKey?: string;
}

/**
 * Contract address configuration
 */
export interface XsrnContractAddresses {
  treasury: string;
  feeSplitter: string;
  sessionManager: string;
  receiptRegistry: string;
  epochManager: string;
  merkleDistributor: string;
  attestationRegistry: string;
  usdt?: string;
}

/**
 * Epoch information
 */
export interface EpochInfo {
  id: number;
  startTime: Date;
  endTime: Date;
  merkleRoot: string;
  finalized: boolean;
  totalRewards: bigint;
}

/**
 * Epoch statistics
 */
export interface EpochStats {
  epochId: number;
  totalReceipts: number;
  totalVolume: bigint;
  totalFees: bigint;
}

/**
 * User rewards balance
 */
export interface RewardsBalance {
  totalClaimable: bigint;
  totalClaimed: bigint;
  epochs: EpochReward[];
}

/**
 * Per-epoch reward
 */
export interface EpochReward {
  epochId: number;
  amount: bigint;
  claimed: boolean;
  proof?: string[];
}

/**
 * Merkle proof data
 */
export interface MerkleProof {
  epochId: number;
  amount: bigint;
  proof: string[];
}

/**
 * Claim data for batch claims
 */
export interface ClaimData {
  epochId: number;
  amount: bigint;
  proof: string[];
}

/**
 * Transaction result
 */
export interface TxResult {
  success: boolean;
  txHash: string;
  blockNumber?: number;
  gasUsed?: bigint;
  error?: string;
}

/**
 * Attestation status enum
 */
export enum AttestationStatus {
  Pending = 0,
  Validated = 1,
  Challenged = 2,
  Slashed = 3,
  Withdrawn = 4,
}

/**
 * Attestation data
 */
export interface Attestation {
  id: string;
  attester: string;
  contentHash: string;
  bondAmount: bigint;
  timestamp: Date;
  challengeDeadline: Date;
  status: AttestationStatus;
  challenger?: string;
  challengeReason?: string;
}

/**
 * Attester statistics
 */
export interface AttesterStats {
  validCount: number;
  slashCount: number;
  reputation: number;
}

/**
 * Receipt data
 */
export interface Receipt {
  paymentId: string;
  payer: string;
  merchant: string;
  agent: string;
  token: string;
  amount: bigint;
  protocolFee: bigint;
  timestamp: Date;
  epochId: number;
  routeRefHash: string;
}

/**
 * Reward entry for Merkle tree generation
 */
export interface RewardEntry {
  address: string;
  amount: bigint;
  epochId: number;
}

/**
 * Generated Merkle tree result
 */
export interface MerkleTreeResult {
  root: string;
  proofs: Map<string, string[]>;
  entries: RewardEntry[];
}

/**
 * Session data
 */
export interface Session {
  id: string;
  signer: string;
  owner: string;
  singleLimit: bigint;
  dailyLimit: bigint;
  usedToday: bigint;
  expiry: Date;
  isActive: boolean;
}

/**
 * Payment split event
 */
export interface PaymentSplitEvent {
  token: string;
  merchant: string;
  totalAmount: bigint;
  commissionAmount: bigint;
  protocolFeeAmount: bigint;
  routeRefHash: string;
  txHash: string;
  blockNumber: number;
}
