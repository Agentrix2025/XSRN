/**
 * Merkle Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';
import { MerkleGenerator } from '../src/services/merkle-generator';
import { RewardEntry } from '../src/types';

describe('MerkleGenerator', () => {
  const mockRewards: RewardEntry[] = [
    {
      address: '0x1111111111111111111111111111111111111111',
      amount: ethers.parseEther('100'),
      epochId: 1,
    },
    {
      address: '0x2222222222222222222222222222222222222222',
      amount: ethers.parseEther('200'),
      epochId: 1,
    },
    {
      address: '0x3333333333333333333333333333333333333333',
      amount: ethers.parseEther('50'),
      epochId: 1,
    },
  ];

  describe('generate', () => {
    it('should generate merkle tree from rewards', () => {
      const result = MerkleGenerator.generate(mockRewards);
      
      expect(result.root).toBeDefined();
      expect(result.root).not.toBe(ethers.ZeroHash);
      expect(result.proofs.size).toBe(3);
      expect(result.entries.length).toBe(3);
    });

    it('should handle empty rewards array', () => {
      const result = MerkleGenerator.generate([]);
      
      expect(result.root).toBe(ethers.ZeroHash);
      expect(result.proofs.size).toBe(0);
      expect(result.entries.length).toBe(0);
    });

    it('should generate proofs for each address', () => {
      const result = MerkleGenerator.generate(mockRewards);
      
      for (const reward of mockRewards) {
        const proof = MerkleGenerator.getProof(result, reward.address);
        expect(proof).toBeDefined();
        expect(Array.isArray(proof)).toBe(true);
      }
    });
  });

  describe('verify', () => {
    it('should verify valid proof', () => {
      const result = MerkleGenerator.generate(mockRewards);
      const reward = mockRewards[0];
      const proof = MerkleGenerator.getProof(result, reward.address)!;
      
      const isValid = MerkleGenerator.verify(
        result.root,
        reward.address,
        reward.amount,
        proof
      );
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid amount', () => {
      const result = MerkleGenerator.generate(mockRewards);
      const reward = mockRewards[0];
      const proof = MerkleGenerator.getProof(result, reward.address)!;
      
      const isValid = MerkleGenerator.verify(
        result.root,
        reward.address,
        reward.amount + BigInt(1), // Wrong amount
        proof
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const result = MerkleGenerator.generate(mockRewards);
      
      const serialized = MerkleGenerator.serialize(result);
      const deserialized = MerkleGenerator.deserialize(serialized);
      
      expect(deserialized.root).toBe(result.root);
      expect(deserialized.entries.length).toBe(result.entries.length);
      expect(deserialized.proofs.size).toBe(result.proofs.size);
    });
  });

  describe('fromAggregatedData', () => {
    it('should create tree from aggregated data', () => {
      const aggregated = new Map<string, bigint>();
      aggregated.set('0x1111111111111111111111111111111111111111', ethers.parseEther('100'));
      aggregated.set('0x2222222222222222222222222222222222222222', ethers.parseEther('200'));
      
      const result = MerkleGenerator.fromAggregatedData(aggregated, 1);
      
      expect(result.root).not.toBe(ethers.ZeroHash);
      expect(result.entries.length).toBe(2);
    });
  });
});
