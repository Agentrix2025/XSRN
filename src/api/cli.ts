#!/usr/bin/env node
/**
 * XSRN API Server CLI
 * 
 * Usage: npx xsrn-server [options]
 */

import { config } from 'dotenv';
import { startApiServer } from './server';

config();

const port = parseInt(process.env.PORT || '3003');
const rpcUrl = process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const privateKey = process.env.PRIVATE_KEY;

console.log('Starting XSRN API Server...');
console.log(`Port: ${port}`);
console.log(`RPC: ${rpcUrl}`);
console.log(`Signer: ${privateKey ? 'Configured' : 'Not configured (read-only)'}`);

startApiServer({
  port,
  rpcUrl,
  privateKey,
  corsOrigins: process.env.CORS_ORIGINS?.split(','),
});
