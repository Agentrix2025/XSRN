/**
 * Attestation Service
 * 
 * Handles quality attestations and bond management
 */

import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import { AttestationInfo, ChallengeInfo } from '../types';
import { ABIS } from '../constants';

export interface AttestationServiceConfig {
  provider: JsonRpcProvider;
  signer?: Wallet;
  contracts: {
    attestationRegistry: string;
  };
}

/**
 * Service for attestation management
 */
export class AttestationService {
  private provider: JsonRpcProvider;
  private signer?: Wallet;
  private registry: Contract;

  constructor(config: AttestationServiceConfig) {
    this.provider = config.provider;
    this.signer = config.signer;

    const signerOrProvider = this.signer || this.provider;

    this.registry = new Contract(
      config.contracts.attestationRegistry,
      ABIS.AttestationRegistry,
      signerOrProvider
    );
  }

  /**
   * Submit a quality attestation
   * 
   * @param targetHash Hash of the target being attested (agent, content, etc.)
   * @param metadataUri URI to attestation metadata (e.g., IPFS hash)
   * @param bondAmount Amount of bond to stake
   */
  async submitAttestation(
    targetHash: string,
    metadataUri: string,
    bondAmount: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for attestation');
    }

    const tx = await this.registry.submitAttestation(
      targetHash,
      metadataUri,
      { value: bondAmount }
    );
    const receipt = await tx.wait();
    
    // Return attestation ID from event
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === 'AttestationSubmitted'
    );
    
    return event?.args?.attestationId?.toString() || receipt.hash;
  }

  /**
   * Get attestation details
   */
  async getAttestation(attestationId: string): Promise<AttestationInfo> {
    const attestation = await this.registry.attestations(attestationId);
    return {
      id: attestationId,
      attester: attestation.attester,
      targetHash: attestation.targetHash,
      metadataUri: attestation.metadataUri,
      bondAmount: attestation.bondAmount,
      timestamp: new Date(Number(attestation.timestamp) * 1000),
      challengeEndTime: attestation.challengeEndTime > 0 
        ? new Date(Number(attestation.challengeEndTime) * 1000)
        : undefined,
      status: attestation.status,
    };
  }

  /**
   * Challenge an attestation
   * 
   * @param attestationId ID of the attestation to challenge
   * @param reason Reason for the challenge
   * @param bondAmount Bond to stake for challenge
   */
  async challengeAttestation(
    attestationId: string,
    reason: string,
    bondAmount: bigint
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for challenge');
    }

    const tx = await this.registry.challengeAttestation(
      attestationId,
      reason,
      { value: bondAmount }
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Resolve a challenged attestation
   * 
   * @param attestationId ID of the attestation
   * @param validAttestation True if attestation is valid, false if challenge wins
   */
  async resolveChallenge(
    attestationId: string,
    validAttestation: boolean
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for resolution');
    }

    const tx = await this.registry.resolveChallenge(
      attestationId,
      validAttestation
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Withdraw bond after challenge period
   */
  async withdrawBond(attestationId: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for withdrawal');
    }

    const tx = await this.registry.withdrawBond(attestationId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get challenge info for an attestation
   */
  async getChallengeInfo(attestationId: string): Promise<ChallengeInfo | null> {
    try {
      const challenge = await this.registry.challenges(attestationId);
      if (challenge.challenger === ethers.ZeroAddress) {
        return null;
      }
      return {
        attestationId,
        challenger: challenge.challenger,
        reason: challenge.reason,
        bondAmount: challenge.bondAmount,
        timestamp: new Date(Number(challenge.timestamp) * 1000),
        resolved: challenge.resolved,
        challengerWon: challenge.challengerWon,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if attestation is in challenge period
   */
  async isInChallengePeriod(attestationId: string): Promise<boolean> {
    const attestation = await this.getAttestation(attestationId);
    if (!attestation.challengeEndTime) {
      return false;
    }
    return new Date() < attestation.challengeEndTime;
  }

  /**
   * Get all attestations by attester
   */
  async getAttestationsByAttester(attester: string): Promise<string[]> {
    // Query events
    const filter = this.registry.filters.AttestationSubmitted(null, attester);
    const events = await this.registry.queryFilter(filter);
    return events.map((e: any) => e.args.attestationId.toString());
  }

  /**
   * Watch for new attestations
   */
  onAttestationSubmitted(
    callback: (attestationId: string, attester: string, targetHash: string) => void
  ): () => void {
    const listener = (attestationId: any, attester: string, targetHash: string) => {
      callback(attestationId.toString(), attester, targetHash);
    };

    this.registry.on('AttestationSubmitted', listener);

    return () => {
      this.registry.off('AttestationSubmitted', listener);
    };
  }
}
