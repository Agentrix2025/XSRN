/**
 * API Server Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApiServer } from '../src/api/server';
import type { Application } from 'express';

describe('API Server', () => {
  let app: Application;

  beforeAll(() => {
    app = createApiServer({
      port: 3099,
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    });
  });

  describe('Health endpoint', () => {
    it('GET /health should return ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Info endpoint', () => {
    it('GET /api/info should return protocol info', async () => {
      const response = await request(app).get('/api/info');
      
      expect(response.status).toBe(200);
      expect(response.body.protocol).toBe('XSRN');
      expect(response.body.version).toBe('0.1.0');
      expect(response.body.contracts).toBeDefined();
    });
  });

  describe('Epoch endpoints', () => {
    it('GET /api/epochs/current should return current epoch', async () => {
      const response = await request(app).get('/api/epochs/current');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
    });

    it('GET /api/epochs/:epochId should return epoch stats', async () => {
      const response = await request(app).get('/api/epochs/1');
      
      expect(response.status).toBe(200);
      expect(response.body.epochId).toBe(1);
    });
  });

  describe('Rewards endpoints', () => {
    it('GET /api/rewards/:address should return rewards info', async () => {
      const address = '0x1111111111111111111111111111111111111111';
      const response = await request(app).get(`/api/rewards/${address}`);
      
      expect(response.status).toBe(200);
      expect(response.body.address).toBe(address);
    });

    it('GET /api/rewards/:address should reject invalid address', async () => {
      const response = await request(app).get('/api/rewards/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid address');
    });
  });

  describe('Attestation endpoints', () => {
    it('POST /api/attestations should require all fields', async () => {
      const response = await request(app)
        .post('/api/attestations')
        .send({ targetHash: '0x123' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });
});
