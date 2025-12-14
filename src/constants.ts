/**
 * XSRN Constants
 */

/**
 * Default contract addresses for BSC Testnet
 */
export const BSC_TESTNET_CONTRACTS = {
  treasury: '0x3FDfB8408cdd91B5692E68F07B8937fD5F62fC01',
  feeSplitter: '0x371E206CA565f5713b8Cd1f8922A2eb8FB0F98F7',
  sessionManager: '0x85F03Ca00307f4F7C218CF88aC15Ae7FdD6b0F95',
  receiptRegistry: '0x1BBEeb73AC8bbDC9D5063B6E53470D3234B7240c',
  epochManager: '0xAe969539b6c840798658dd2e141e6a5F898C9f00',
  merkleDistributor: '0xC72d761b6dE93F33Dcba2fA150316F6E1F63f6E2',
  attestationRegistry: '0x6BfDDeBbF72E32f4d9fd87452da3fFDe58341267',
  usdt: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
};

/**
 * Chain IDs
 */
export const CHAIN_IDS = {
  BSC_TESTNET: 97,
  BSC_MAINNET: 56,
  LOCALHOST: 31337,
} as const;

/**
 * Default RPC URLs
 */
export const RPC_URLS = {
  BSC_TESTNET: 'https://bsc-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
  BSC_MAINNET: 'https://bsc-dataseed.binance.org',
} as const;

/**
 * Protocol fee in basis points (0.3% = 30 bps)
 */
export const PROTOCOL_FEE_BPS = 30;

/**
 * Treasury distribution ratios
 */
export const DISTRIBUTION_RATIOS = {
  WATCHER: 4000,        // 40%
  OPERATOR: 3000,       // 30%
  PUBLIC_GOODS: 2000,   // 20%
  SECURITY_RESERVE: 1000, // 10%
} as const;

/**
 * Default epoch duration (7 days in seconds)
 */
export const DEFAULT_EPOCH_DURATION = 7 * 24 * 60 * 60;

/**
 * Default challenge period (7 days in seconds)
 */
export const DEFAULT_CHALLENGE_PERIOD = 7 * 24 * 60 * 60;

/**
 * Default slash percentage (50%)
 */
export const DEFAULT_SLASH_PERCENTAGE = 5000;

/**
 * Contract ABIs (simplified for SDK)
 */
export const ABIS = {
  EpochManager: [
    'function getCurrentEpochId() view returns (uint256)',
    'function getCurrentEpoch() view returns (tuple(uint256 id, uint256 startTime, uint256 endTime, bytes32 merkleRoot, bool finalized, uint256 totalRewards))',
    'function canAdvanceEpoch() view returns (bool)',
    'function advanceEpoch()',
    'function finalizeEpoch(uint256 epochId, bytes32 merkleRoot, uint256 totalRewards)',
    'event EpochStarted(uint256 indexed epochId, uint256 startTime, uint256 endTime)',
    'event EpochFinalized(uint256 indexed epochId, bytes32 merkleRoot, uint256 totalRewards)',
  ],
  MerkleDistributor: [
    'function claim(uint256 epochId, address token, uint256 amount, bytes32[] proof)',
    'function claimMultiple(uint256[] epochIds, address token, uint256[] amounts, bytes32[][] proofs)',
    'function isClaimed(uint256 epochId, address token, address account) view returns (bool)',
    'function canClaim(uint256 epochId, address token, address account, uint256 amount, bytes32[] proof) view returns (bool)',
    'function totalClaimed(address account, address token) view returns (uint256)',
    'event Claimed(uint256 indexed epochId, address indexed account, address indexed token, uint256 amount)',
  ],
  ReceiptRegistry: [
    'function getReceipt(bytes32 paymentId) view returns (tuple(bytes32 paymentId, address payer, address merchant, address agent, address token, uint256 amount, uint256 protocolFee, uint256 timestamp, uint256 epochId, bytes32 routeRefHash))',
    'function getEpochStats(uint256 epochId) view returns (uint256 totalReceipts, uint256 totalVolume, uint256 totalFees)',
    'function getTotalReceipts() view returns (uint256)',
    'event ReceiptCreated(bytes32 indexed paymentId, address indexed payer, address indexed merchant, address agent, address token, uint256 amount, uint256 protocolFee, uint256 epochId, bytes32 routeRefHash)',
  ],
  AttestationRegistry: [
    'function submitAttestation(bytes32 contentHash, uint256 bondAmount) returns (bytes32)',
    'function challenge(bytes32 attestationId, bytes32 reason)',
    'function validate(bytes32 attestationId)',
    'function withdrawBond(bytes32 attestationId)',
    'function getAttestation(bytes32 attestationId) view returns (tuple(address attester, bytes32 contentHash, uint256 bondAmount, uint256 timestamp, uint256 challengeDeadline, uint8 status, address challenger, bytes32 challengeReason))',
    'function getAttesterStats(address attester) view returns (uint256 validCount, uint256 slashCount)',
    'event AttestationSubmitted(bytes32 indexed attestationId, address indexed attester, bytes32 contentHash, uint256 bondAmount, uint256 challengeDeadline)',
    'event AttestationChallenged(bytes32 indexed attestationId, address indexed challenger, bytes32 challengeReason)',
    'event AttestationValidated(bytes32 indexed attestationId)',
    'event AttestationSlashed(bytes32 indexed attestationId, address indexed challenger, uint256 slashAmount)',
  ],
  XsrnFeeSplitter: [
    'function protocolFeeBps() view returns (uint256)',
    'function treasury() view returns (address)',
    'function splitPaymentNative(address merchant, bytes routeRef) payable',
    'function splitPaymentERC20(address token, address merchant, uint256 amount, bytes routeRef)',
    'event PaymentSplit(address indexed token, address indexed merchant, uint256 totalAmount, uint256 commissionAmount, uint256 protocolFeeAmount, bytes32 indexed routeRefHash)',
  ],
  XsrnTreasury: [
    'function WATCHER_BPS() view returns (uint256)',
    'function OPERATOR_BPS() view returns (uint256)',
    'function PUBLIC_GOODS_BPS() view returns (uint256)',
    'function SECURITY_RESERVE_BPS() view returns (uint256)',
    'function watcher() view returns (address)',
    'function operator() view returns (address)',
    'function publicGoods() view returns (address)',
    'function securityReserve() view returns (address)',
    'event RewardsDistributed(address indexed token, uint256 totalAmount)',
    'event FundsReceived(address indexed sender, uint256 amount)',
  ],
};
