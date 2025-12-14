/**
 * XSRN Protocol SDK
 * 
 * X402 Service Routing Network - Incentive Layer for Web3 Payments
 * 
 * @packageDocumentation
 */

// Main client
export { XsrnClient } from './client';

// Types
export * from './types';

// Constants
export { 
  BSC_TESTNET_CONTRACTS, 
  CHAIN_CONFIG, 
  ABIS,
  PROTOCOL_FEE_BPS,
  EPOCH_DURATION,
  CHALLENGE_PERIOD,
} from './constants';

// Services
export * from './services';

// Version
export const VERSION = '0.1.0';
