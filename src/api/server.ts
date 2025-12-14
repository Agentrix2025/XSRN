/**
 * XSRN REST API Server
 * 
 * Provides HTTP endpoints for the XSRN protocol
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ethers } from 'ethers';
import { XsrnClient } from '../client';
import { EpochService } from '../services/epoch-service';
import { EventIndexer } from '../services/event-indexer';
import { MerkleGenerator } from '../services/merkle-generator';
import { AttestationService } from '../services/attestation-service';
import { BSC_TESTNET_CONTRACTS, CHAIN_CONFIG } from '../constants';

export interface ApiServerConfig {
  port: number;
  rpcUrl: string;
  privateKey?: string;
  corsOrigins?: string[];
}

/**
 * Create and configure the Express app
 */
export function createApiServer(config: ApiServerConfig): express.Application {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigins || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Initialize services
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = config.privateKey 
    ? new ethers.Wallet(config.privateKey, provider) 
    : undefined;

  const client = new XsrnClient({
    provider,
    signer,
    contracts: BSC_TESTNET_CONTRACTS,
  });

  const epochService = new EpochService({
    provider,
    signer,
    contracts: {
      epochManager: BSC_TESTNET_CONTRACTS.epochManager,
      receiptRegistry: BSC_TESTNET_CONTRACTS.receiptRegistry,
      merkleDistributor: BSC_TESTNET_CONTRACTS.merkleDistributor,
      treasury: BSC_TESTNET_CONTRACTS.treasury,
    },
  });

  const eventIndexer = new EventIndexer({
    provider,
    contracts: {
      feeSplitter: BSC_TESTNET_CONTRACTS.feeSplitter,
      receiptRegistry: BSC_TESTNET_CONTRACTS.receiptRegistry,
    },
  });

  const attestationService = new AttestationService({
    provider,
    signer,
    contracts: {
      attestationRegistry: BSC_TESTNET_CONTRACTS.attestationRegistry,
    },
  });

  // ============ HEALTH ROUTES ============
  
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/info', async (_req: Request, res: Response) => {
    try {
      const network = await provider.getNetwork();
      res.json({
        protocol: 'XSRN',
        version: '0.1.0',
        chainId: Number(network.chainId),
        contracts: BSC_TESTNET_CONTRACTS,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get info' });
    }
  });

  // ============ EPOCH ROUTES ============

  app.get('/api/epochs/current', async (_req: Request, res: Response) => {
    try {
      const epoch = await client.getCurrentEpoch();
      res.json({
        id: epoch.id,
        startTime: epoch.startTime.toISOString(),
        endTime: epoch.endTime.toISOString(),
        merkleRoot: epoch.merkleRoot,
        finalized: epoch.finalized,
        totalRewards: epoch.totalRewards.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get current epoch' });
    }
  });

  app.get('/api/epochs/:epochId', async (req: Request, res: Response) => {
    try {
      const epochId = parseInt(req.params.epochId);
      const stats = await epochService.getEpochStats(epochId);
      res.json({
        epochId: stats.epochId,
        totalReceipts: stats.totalReceipts,
        totalVolume: stats.totalVolume.toString(),
        totalFees: stats.totalFees.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get epoch stats' });
    }
  });

  // ============ REWARDS ROUTES ============

  app.get('/api/rewards/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const epochId = req.query.epochId ? parseInt(req.query.epochId as string) : undefined;
      
      if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: 'Invalid address' });
      }

      // For now, return mock data
      // In production, this would query the Merkle tree storage
      res.json({
        address,
        epochId: epochId || 'latest',
        balance: '0',
        claimed: false,
        proof: [],
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get rewards' });
    }
  });

  app.post('/api/rewards/claim', async (req: Request, res: Response) => {
    try {
      const { epochId, address, amount, proof, tokenAddress } = req.body;

      if (!epochId || !address || !amount || !proof || !tokenAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const txHash = await client.claimRewards({
        epochId,
        address,
        amount: BigInt(amount),
        proof,
        tokenAddress,
      });

      res.json({ txHash, status: 'submitted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ATTESTATION ROUTES ============

  app.get('/api/attestations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const attestation = await attestationService.getAttestation(id);
      res.json({
        ...attestation,
        timestamp: attestation.timestamp.toISOString(),
        challengeEndTime: attestation.challengeEndTime?.toISOString(),
        bondAmount: attestation.bondAmount.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get attestation' });
    }
  });

  app.post('/api/attestations', async (req: Request, res: Response) => {
    try {
      const { targetHash, metadataUri, bondAmount } = req.body;

      if (!targetHash || !metadataUri || !bondAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const attestationId = await attestationService.submitAttestation(
        targetHash,
        metadataUri,
        BigInt(bondAmount)
      );

      res.json({ attestationId, status: 'submitted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/attestations/:id/challenge', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, bondAmount } = req.body;

      if (!reason || !bondAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const txHash = await attestationService.challengeAttestation(
        id,
        reason,
        BigInt(bondAmount)
      );

      res.json({ txHash, status: 'challenged' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ INDEXER ROUTES ============

  app.get('/api/index/:epochId', async (req: Request, res: Response) => {
    try {
      const epochId = parseInt(req.params.epochId);
      const fromBlock = parseInt(req.query.fromBlock as string) || 0;
      const toBlock = req.query.toBlock as string || 'latest';

      const data = await eventIndexer.indexEpoch(
        epochId,
        fromBlock,
        toBlock === 'latest' ? 'latest' : parseInt(toBlock)
      );

      res.json({
        epochId,
        receipts: data.receipts.length,
        paymentEvents: data.paymentEvents.length,
        totalVolume: data.totalVolume.toString(),
        totalFees: data.totalFees.toString(),
        agentCount: data.agentVolumes.size,
        merchantCount: data.merchantVolumes.size,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to index epoch' });
    }
  });

  // ============ ERROR HANDLER ============

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

/**
 * Start the API server
 */
export function startApiServer(config: ApiServerConfig): void {
  const app = createApiServer(config);
  
  app.listen(config.port, () => {
    console.log(`XSRN API server running on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/health`);
  });
}
