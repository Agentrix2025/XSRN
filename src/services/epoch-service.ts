/**
 * Epoch Settlement Service
 * 
 * Handles epoch finalization, reward calculation, and settlement
 */

import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import { EpochInfo, EpochStats, RewardEntry } from '../types';
import { ABIS } from '../constants';

export interface EpochServiceConfig {
  provider: JsonRpcProvider;
  signer?: Wallet;
  contracts: {
    epochManager: string;
    receiptRegistry: string;
    merkleDistributor: string;
    treasury: string;
  };
}

export interface SettlementResult {
  epochId: number;
  merkleRoot: string;
  totalRewards: bigint;
  rewardEntries: RewardEntry[];
  txHash?: string;
}

/**
 * Service for epoch settlement and reward distribution
 */
export class EpochService {
  private provider: JsonRpcProvider;
  private signer?: Wallet;
  private epochManager: Contract;
  private receiptRegistry: Contract;
  private merkleDistributor: Contract;

  constructor(config: EpochServiceConfig) {
    this.provider = config.provider;
    this.signer = config.signer;

    const signerOrProvider = this.signer || this.provider;

    this.epochManager = new Contract(
      config.contracts.epochManager,
      ABIS.EpochManager,
      signerOrProvider
    );

    this.receiptRegistry = new Contract(
      config.contracts.receiptRegistry,
      ABIS.ReceiptRegistry,
      signerOrProvider
    );

    this.merkleDistributor = new Contract(
      config.contracts.merkleDistributor,
      ABIS.MerkleDistributor,
      signerOrProvider
    );
  }

  /**
   * Get current epoch info
   */
  async getCurrentEpoch(): Promise<EpochInfo> {
    const epoch = await this.epochManager.getCurrentEpoch();
    return {
      id: Number(epoch.id),
      startTime: new Date(Number(epoch.startTime) * 1000),
      endTime: new Date(Number(epoch.endTime) * 1000),
      merkleRoot: epoch.merkleRoot,
      finalized: epoch.finalized,
      totalRewards: epoch.totalRewards,
    };
  }

  /**
   * Get epoch statistics
   */
  async getEpochStats(epochId: number): Promise<EpochStats> {
    const stats = await this.receiptRegistry.getEpochStats(epochId);
    return {
      epochId,
      totalReceipts: Number(stats[0]),
      totalVolume: stats[1],
      totalFees: stats[2],
    };
  }

  /**
   * Check if epoch is ready for settlement
   */
  async isReadyForSettlement(epochId: number): Promise<boolean> {
    const canAdvance = await this.epochManager.canAdvanceEpoch();
    const isFinalized = await this.epochManager.isEpochFinalized(epochId);
    return canAdvance && !isFinalized;
  }

  /**
   * Calculate rewards for an epoch
   * 
   * This aggregates all payment data and calculates distribution
   */
  async calculateEpochRewards(epochId: number): Promise<RewardEntry[]> {
    const stats = await this.getEpochStats(epochId);
    const totalFees = stats.totalFees;

    // Distribution ratios (40/30/20/10)
    const rewards: RewardEntry[] = [];

    // In production, this would:
    // 1. Fetch all receipts for the epoch
    // 2. Aggregate by agent/participant
    // 3. Calculate proportional rewards

    // For now, return mock data structure
    // Real implementation would query events and aggregate

    console.log(`Epoch ${epochId} total fees: ${ethers.formatUnits(totalFees, 18)}`);
    
    return rewards;
  }

  /**
   * Finalize epoch with merkle root
   */
  async finalizeEpoch(
    epochId: number,
    merkleRoot: string,
    totalRewards: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for finalization');
    }

    const tx = await this.epochManager.finalizeEpoch(
      epochId,
      merkleRoot,
      totalRewards
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Advance to next epoch
   */
  async advanceEpoch(): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for advancement');
    }

    const tx = await this.epochManager.advanceEpoch();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Full settlement process
   * 
   * 1. Calculate rewards
   * 2. Generate Merkle tree
   * 3. Finalize epoch
   * 4. Set Merkle root in distributor
   */
  async settleEpoch(
    epochId: number,
    merkleRoot: string,
    totalRewards: bigint,
    tokenAddress: string
  ): Promise<SettlementResult> {
    if (!this.signer) {
      throw new Error('Signer required for settlement');
    }

    // 1. Finalize epoch
    const finalizeTxHash = await this.finalizeEpoch(epochId, merkleRoot, totalRewards);
    console.log(`Epoch ${epochId} finalized: ${finalizeTxHash}`);

    // 2. Set Merkle root in distributor
    const setRootTx = await this.merkleDistributor.setMerkleRoot(
      epochId,
      tokenAddress,
      merkleRoot
    );
    const setRootReceipt = await setRootTx.wait();
    console.log(`Merkle root set: ${setRootReceipt.hash}`);

    return {
      epochId,
      merkleRoot,
      totalRewards,
      rewardEntries: [],
      txHash: finalizeTxHash,
    };
  }
}
