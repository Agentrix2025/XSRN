/**
 * Merkle Tree Generator Service
 * 
 * Generates Merkle trees for reward distribution
 */

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ethers } from 'ethers';
import { RewardEntry, MerkleTreeResult } from '../types';

/**
 * Service for generating and managing Merkle trees
 */
export class MerkleGenerator {
  /**
   * Generate a Merkle tree from reward entries
   * 
   * @param rewards Array of reward entries
   * @returns Merkle tree result with root and proofs
   */
  static generate(rewards: RewardEntry[]): MerkleTreeResult {
    if (rewards.length === 0) {
      return {
        root: ethers.ZeroHash,
        proofs: new Map(),
        entries: [],
      };
    }

    // Prepare values for Merkle tree
    // Format: [address, amount]
    const values = rewards.map((r) => [r.address, r.amount.toString()]);

    // Generate tree
    const tree = StandardMerkleTree.of(values, ['address', 'uint256']);

    // Generate proofs for each entry
    const proofs = new Map<string, string[]>();
    for (let i = 0; i < rewards.length; i++) {
      const proof = tree.getProof(i);
      proofs.set(rewards[i].address.toLowerCase(), proof);
    }

    return {
      root: tree.root,
      proofs,
      entries: rewards,
    };
  }

  /**
   * Get proof for a specific address
   */
  static getProof(result: MerkleTreeResult, address: string): string[] | undefined {
    return result.proofs.get(address.toLowerCase());
  }

  /**
   * Verify a proof
   */
  static verify(
    root: string,
    address: string,
    amount: bigint,
    proof: string[]
  ): boolean {
    // Recreate the leaf
    const leaf = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [address, amount]
      )
    );

    // Verify using the proof
    let computedHash = leaf;
    for (const proofElement of proof) {
      if (computedHash < proofElement) {
        computedHash = ethers.keccak256(
          ethers.concat([computedHash, proofElement])
        );
      } else {
        computedHash = ethers.keccak256(
          ethers.concat([proofElement, computedHash])
        );
      }
    }

    return computedHash === root;
  }

  /**
   * Generate tree from aggregated data
   * 
   * @param aggregatedData Map of address to total amount
   * @param epochId Epoch ID for entries
   */
  static fromAggregatedData(
    aggregatedData: Map<string, bigint>,
    epochId: number
  ): MerkleTreeResult {
    const rewards: RewardEntry[] = [];
    for (const [address, amount] of aggregatedData) {
      rewards.push({ address, amount, epochId });
    }
    return this.generate(rewards);
  }

  /**
   * Serialize tree result for storage
   */
  static serialize(result: MerkleTreeResult): string {
    const obj = {
      root: result.root,
      proofs: Object.fromEntries(result.proofs),
      entries: result.entries.map((e) => ({
        address: e.address,
        amount: e.amount.toString(),
        epochId: e.epochId,
      })),
    };
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Deserialize tree result from storage
   */
  static deserialize(json: string): MerkleTreeResult {
    const obj = JSON.parse(json);
    return {
      root: obj.root,
      proofs: new Map(Object.entries(obj.proofs) as [string, string[]][]),
      entries: obj.entries.map((e: any) => ({
        address: e.address,
        amount: BigInt(e.amount),
        epochId: e.epochId,
      })),
    };
  }
}
