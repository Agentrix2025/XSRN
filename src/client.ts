/**
 * XSRN Client - Main SDK entry point
 */

import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import {
  XsrnConfig,
  EpochInfo,
  EpochStats,
  RewardsBalance,
  EpochReward,
  MerkleProof,
  ClaimData,
  TxResult,
  Attestation,
  AttestationStatus,
  AttesterStats,
} from './types';
import { ABIS, BSC_TESTNET_CONTRACTS, CHAIN_IDS, RPC_URLS } from './constants';

/**
 * XSRN Client for interacting with the protocol
 * 
 * @example
 * ```typescript
 * const client = new XsrnClient({
 *   rpcUrl: 'https://bsc-testnet.nodereal.io/v1/...',
 *   chainId: 97,
 *   contracts: BSC_TESTNET_CONTRACTS,
 * });
 * 
 * const epochInfo = await client.getEpochInfo();
 * console.log(`Current Epoch: ${epochInfo.id}`);
 * ```
 */
export class XsrnClient {
  private provider: JsonRpcProvider;
  private signer?: Wallet;
  private contracts: {
    epochManager: Contract;
    merkleDistributor: Contract;
    receiptRegistry: Contract;
    attestationRegistry: Contract;
    feeSplitter: Contract;
    treasury: Contract;
  };
  private config: XsrnConfig;

  constructor(config: XsrnConfig) {
    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl);

    if (config.privateKey) {
      this.signer = new Wallet(config.privateKey, this.provider);
    }

    const signerOrProvider = this.signer || this.provider;

    this.contracts = {
      epochManager: new Contract(
        config.contracts.epochManager,
        ABIS.EpochManager,
        signerOrProvider
      ),
      merkleDistributor: new Contract(
        config.contracts.merkleDistributor,
        ABIS.MerkleDistributor,
        signerOrProvider
      ),
      receiptRegistry: new Contract(
        config.contracts.receiptRegistry,
        ABIS.ReceiptRegistry,
        signerOrProvider
      ),
      attestationRegistry: new Contract(
        config.contracts.attestationRegistry,
        ABIS.AttestationRegistry,
        signerOrProvider
      ),
      feeSplitter: new Contract(
        config.contracts.feeSplitter,
        ABIS.XsrnFeeSplitter,
        signerOrProvider
      ),
      treasury: new Contract(
        config.contracts.treasury,
        ABIS.XsrnTreasury,
        signerOrProvider
      ),
    };
  }

  /**
   * Create a client with default BSC Testnet configuration
   */
  static forTestnet(privateKey?: string): XsrnClient {
    return new XsrnClient({
      rpcUrl: RPC_URLS.BSC_TESTNET,
      chainId: CHAIN_IDS.BSC_TESTNET,
      contracts: BSC_TESTNET_CONTRACTS,
      privateKey,
    });
  }

  // ============ Epoch Methods ============

  /**
   * Get current epoch information
   */
  async getEpochInfo(): Promise<EpochInfo> {
    const epoch = await this.contracts.epochManager.getCurrentEpoch();
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
   * Get epoch statistics from receipt registry
   */
  async getEpochStats(epochId: number): Promise<EpochStats> {
    const stats = await this.contracts.receiptRegistry.getEpochStats(epochId);
    return {
      epochId,
      totalReceipts: Number(stats.totalReceipts),
      totalVolume: stats.totalVolume,
      totalFees: stats.totalFees,
    };
  }

  /**
   * Check if epoch can be advanced
   */
  async canAdvanceEpoch(): Promise<boolean> {
    return this.contracts.epochManager.canAdvanceEpoch();
  }

  /**
   * Advance to next epoch (requires finalization first)
   */
  async advanceEpoch(): Promise<TxResult> {
    this.requireSigner();
    try {
      const tx = await this.contracts.epochManager.advanceEpoch();
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  // ============ Rewards Methods ============

  /**
   * Get user's rewards balance
   */
  async getRewardsBalance(
    address: string,
    tokenAddress: string
  ): Promise<RewardsBalance> {
    const totalClaimed = await this.contracts.merkleDistributor.totalClaimed(
      address,
      tokenAddress
    );

    // Get current epoch to determine range
    const currentEpochId = await this.contracts.epochManager.getCurrentEpochId();
    const epochs: EpochReward[] = [];

    // Check last 10 epochs (can be adjusted)
    const startEpoch = Math.max(1, Number(currentEpochId) - 10);
    for (let i = startEpoch; i <= Number(currentEpochId); i++) {
      const claimed = await this.contracts.merkleDistributor.isClaimed(
        i,
        tokenAddress,
        address
      );
      epochs.push({
        epochId: i,
        amount: BigInt(0), // Would need merkle data to get actual amount
        claimed,
      });
    }

    return {
      totalClaimable: BigInt(0), // Would need merkle data
      totalClaimed,
      epochs,
    };
  }

  /**
   * Check if user can claim for an epoch
   */
  async canClaim(
    epochId: number,
    tokenAddress: string,
    address: string,
    amount: bigint,
    proof: string[]
  ): Promise<boolean> {
    return this.contracts.merkleDistributor.canClaim(
      epochId,
      tokenAddress,
      address,
      amount,
      proof
    );
  }

  /**
   * Claim rewards for a single epoch
   */
  async claimRewards(
    epochId: number,
    tokenAddress: string,
    amount: bigint,
    proof: string[]
  ): Promise<TxResult> {
    this.requireSigner();
    try {
      const tx = await this.contracts.merkleDistributor.claim(
        epochId,
        tokenAddress,
        amount,
        proof
      );
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  /**
   * Batch claim rewards for multiple epochs
   */
  async claimMultipleRewards(
    claims: ClaimData[],
    tokenAddress: string
  ): Promise<TxResult> {
    this.requireSigner();
    try {
      const epochIds = claims.map((c) => c.epochId);
      const amounts = claims.map((c) => c.amount);
      const proofs = claims.map((c) => c.proof);

      const tx = await this.contracts.merkleDistributor.claimMultiple(
        epochIds,
        tokenAddress,
        amounts,
        proofs
      );
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  // ============ Attestation Methods ============

  /**
   * Submit quality attestation
   */
  async submitAttestation(
    contentHash: string,
    bondAmount: bigint = BigInt(0)
  ): Promise<TxResult> {
    this.requireSigner();
    try {
      const tx = await this.contracts.attestationRegistry.submitAttestation(
        contentHash,
        bondAmount
      );
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  /**
   * Challenge an attestation
   */
  async challengeAttestation(
    attestationId: string,
    reason: string
  ): Promise<TxResult> {
    this.requireSigner();
    try {
      const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(reason));
      const tx = await this.contracts.attestationRegistry.challenge(
        attestationId,
        reasonHash
      );
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  /**
   * Get attestation details
   */
  async getAttestation(attestationId: string): Promise<Attestation> {
    const att = await this.contracts.attestationRegistry.getAttestation(
      attestationId
    );
    return {
      id: attestationId,
      attester: att.attester,
      contentHash: att.contentHash,
      bondAmount: att.bondAmount,
      timestamp: new Date(Number(att.timestamp) * 1000),
      challengeDeadline: new Date(Number(att.challengeDeadline) * 1000),
      status: att.status as AttestationStatus,
      challenger: att.challenger !== ethers.ZeroAddress ? att.challenger : undefined,
      challengeReason: att.challengeReason !== ethers.ZeroHash ? att.challengeReason : undefined,
    };
  }

  /**
   * Get attester statistics
   */
  async getAttesterStats(address: string): Promise<AttesterStats> {
    const stats = await this.contracts.attestationRegistry.getAttesterStats(address);
    const validCount = Number(stats.validCount);
    const slashCount = Number(stats.slashCount);
    const total = validCount + slashCount;
    return {
      validCount,
      slashCount,
      reputation: total > 0 ? (validCount / total) * 100 : 0,
    };
  }

  /**
   * Validate attestation after challenge period
   */
  async validateAttestation(attestationId: string): Promise<TxResult> {
    this.requireSigner();
    try {
      const tx = await this.contracts.attestationRegistry.validate(attestationId);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  /**
   * Withdraw bond after validation
   */
  async withdrawBond(attestationId: string): Promise<TxResult> {
    this.requireSigner();
    try {
      const tx = await this.contracts.attestationRegistry.withdrawBond(attestationId);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      return {
        success: false,
        txHash: '',
        error: error.message,
      };
    }
  }

  // ============ Utility Methods ============

  /**
   * Get provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get signer instance
   */
  getSigner(): Wallet | undefined {
    return this.signer;
  }

  /**
   * Get contract instance by name
   */
  getContract(name: keyof typeof this.contracts): Contract {
    return this.contracts[name];
  }

  /**
   * Require signer for write operations
   */
  private requireSigner(): void {
    if (!this.signer) {
      throw new Error('Signer required for this operation. Provide privateKey in config.');
    }
  }
}
