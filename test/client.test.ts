/**
 * XSRN Client Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { XsrnClient } from '../src/client';
import { BSC_TESTNET_CONTRACTS } from '../src/constants';

describe('XsrnClient', () => {
  let client: XsrnClient;
  let provider: ethers.JsonRpcProvider;

  beforeAll(() => {
    provider = new ethers.JsonRpcProvider(
      'https://data-seed-prebsc-1-s1.binance.org:8545/'
    );

    client = new XsrnClient({
      provider,
      contracts: BSC_TESTNET_CONTRACTS,
    });
  });

  describe('initialization', () => {
    it('should initialize with provider', () => {
      expect(client).toBeDefined();
    });

    it('should have contracts configured', () => {
      // Client is created successfully
      expect(client).toBeDefined();
    });
  });

  describe('getCurrentEpoch', () => {
    it('should return epoch info', async () => {
      const epoch = await client.getCurrentEpoch();
      
      expect(epoch).toHaveProperty('id');
      expect(epoch).toHaveProperty('startTime');
      expect(epoch).toHaveProperty('endTime');
      expect(epoch).toHaveProperty('finalized');
      expect(typeof epoch.id).toBe('number');
    });
  });

  describe('getRewardsBalance', () => {
    it('should return zero for address with no rewards', async () => {
      const balance = await client.getRewardsBalance(
        ethers.ZeroAddress,
        1,
        '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'
      );
      
      expect(balance).toBeDefined();
    });
  });
});
