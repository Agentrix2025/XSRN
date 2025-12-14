/**
 * Event Indexer Service
 * 
 * Indexes blockchain events for reward calculation
 */

import { ethers, Contract, JsonRpcProvider, EventLog } from 'ethers';
import { Receipt, PaymentSplitEvent } from '../types';
import { ABIS } from '../constants';

export interface EventIndexerConfig {
  provider: JsonRpcProvider;
  contracts: {
    feeSplitter: string;
    receiptRegistry: string;
  };
  /** Starting block for indexing (default: contract deployment block) */
  startBlock?: number;
}

export interface IndexedData {
  receipts: Receipt[];
  paymentEvents: PaymentSplitEvent[];
  agentVolumes: Map<string, bigint>;
  merchantVolumes: Map<string, bigint>;
  totalVolume: bigint;
  totalFees: bigint;
}

/**
 * Service for indexing blockchain events
 */
export class EventIndexer {
  private provider: JsonRpcProvider;
  private feeSplitter: Contract;
  private receiptRegistry: Contract;
  private startBlock: number;

  constructor(config: EventIndexerConfig) {
    this.provider = config.provider;
    this.startBlock = config.startBlock || 0;

    this.feeSplitter = new Contract(
      config.contracts.feeSplitter,
      ABIS.XsrnFeeSplitter,
      this.provider
    );

    this.receiptRegistry = new Contract(
      config.contracts.receiptRegistry,
      ABIS.ReceiptRegistry,
      this.provider
    );
  }

  /**
   * Index all events for an epoch
   */
  async indexEpoch(
    epochId: number,
    fromBlock: number,
    toBlock: number | 'latest' = 'latest'
  ): Promise<IndexedData> {
    const receipts: Receipt[] = [];
    const paymentEvents: PaymentSplitEvent[] = [];
    const agentVolumes = new Map<string, bigint>();
    const merchantVolumes = new Map<string, bigint>();
    let totalVolume = BigInt(0);
    let totalFees = BigInt(0);

    // Query PaymentSplit events
    const filter = this.feeSplitter.filters.PaymentSplit();
    const events = await this.feeSplitter.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      if (!(event instanceof EventLog)) continue;

      const args = event.args;
      const paymentEvent: PaymentSplitEvent = {
        token: args.token,
        merchant: args.merchant,
        totalAmount: args.totalAmount,
        commissionAmount: args.commissionAmount,
        protocolFeeAmount: args.protocolFeeAmount,
        routeRefHash: args.routeRefHash,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      };

      paymentEvents.push(paymentEvent);
      totalVolume += paymentEvent.totalAmount;
      totalFees += paymentEvent.protocolFeeAmount;

      // Aggregate merchant volumes
      const currentMerchantVolume = merchantVolumes.get(args.merchant) || BigInt(0);
      merchantVolumes.set(args.merchant, currentMerchantVolume + args.totalAmount);
    }

    // Query ReceiptCreated events
    const receiptFilter = this.receiptRegistry.filters.ReceiptCreated();
    const receiptEvents = await this.receiptRegistry.queryFilter(
      receiptFilter,
      fromBlock,
      toBlock
    );

    for (const event of receiptEvents) {
      if (!(event instanceof EventLog)) continue;

      const args = event.args;
      
      // Only include receipts for this epoch
      if (Number(args.epochId) !== epochId) continue;

      const receipt: Receipt = {
        paymentId: args.paymentId,
        payer: args.payer,
        merchant: args.merchant,
        agent: args.agent,
        token: args.token,
        amount: args.amount,
        protocolFee: args.protocolFee,
        timestamp: new Date(Number(args.timestamp) * 1000),
        epochId: Number(args.epochId),
        routeRefHash: args.routeRefHash,
      };

      receipts.push(receipt);

      // Aggregate agent volumes
      if (args.agent !== ethers.ZeroAddress) {
        const currentAgentVolume = agentVolumes.get(args.agent) || BigInt(0);
        agentVolumes.set(args.agent, currentAgentVolume + args.amount);
      }
    }

    return {
      receipts,
      paymentEvents,
      agentVolumes,
      merchantVolumes,
      totalVolume,
      totalFees,
    };
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Watch for new payment events
   */
  onPaymentSplit(
    callback: (event: PaymentSplitEvent) => void
  ): () => void {
    const listener = (
      token: string,
      merchant: string,
      totalAmount: bigint,
      commissionAmount: bigint,
      protocolFeeAmount: bigint,
      routeRefHash: string,
      event: EventLog
    ) => {
      callback({
        token,
        merchant,
        totalAmount,
        commissionAmount,
        protocolFeeAmount,
        routeRefHash,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      });
    };

    this.feeSplitter.on('PaymentSplit', listener);

    // Return unsubscribe function
    return () => {
      this.feeSplitter.off('PaymentSplit', listener);
    };
  }

  /**
   * Calculate reward distribution from indexed data
   */
  calculateRewardDistribution(data: IndexedData): Map<string, bigint> {
    const distribution = new Map<string, bigint>();
    
    // Simple distribution: proportional to agent volume
    // In production, this would use more complex logic
    
    for (const [agent, volume] of data.agentVolumes) {
      // Example: 10% of agent's volume as reward
      const reward = (volume * BigInt(10)) / BigInt(100);
      distribution.set(agent, reward);
    }

    return distribution;
  }
}
