// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReceiptRegistry
 * @author XSRN Team
 * @notice On-chain receipt registry for all x402 payments
 * @dev Used for:
 *   1. Off-chain indexer aggregation
 *   2. Epoch settlement calculations
 *   3. Dispute arbitration evidence
 */
contract ReceiptRegistry is AccessControl {
    /// @notice Role for authorized receipt emitters
    bytes32 public constant EMITTER_ROLE = keccak256("EMITTER_ROLE");

    /// @notice Receipt data structure
    struct Receipt {
        bytes32 paymentId;       // Payment ID
        address payer;           // Payer address
        address merchant;        // Merchant address
        address agent;           // Referring agent
        address token;           // Payment token
        uint256 amount;          // Payment amount
        uint256 protocolFee;     // Protocol fee (0.3%)
        uint256 timestamp;       // Timestamp
        uint256 epochId;         // Epoch ID
        bytes32 routeRefHash;    // Route attribution hash
    }

    // Storage
    mapping(bytes32 => Receipt) public receipts;
    bytes32[] public receiptIds;
    
    // Epoch tracking
    mapping(uint256 => bytes32[]) public epochReceipts;
    mapping(uint256 => uint256) public epochTotalVolume;
    mapping(uint256 => uint256) public epochTotalFees;

    // Events
    event ReceiptCreated(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        address agent,
        address token,
        uint256 amount,
        uint256 protocolFee,
        uint256 epochId,
        bytes32 routeRefHash
    );

    event EpochFinalized(
        uint256 indexed epochId,
        uint256 totalReceipts,
        uint256 totalVolume,
        uint256 totalFees
    );

    /// @notice Contract constructor
    /// @param _admin Admin address
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(EMITTER_ROLE, _admin);
    }

    /**
     * @notice Record a payment receipt
     * @dev Called by XsrnFeeSplitter after payment completion
     */
    function recordReceipt(
        bytes32 paymentId,
        address payer,
        address merchant,
        address agent,
        address token,
        uint256 amount,
        uint256 protocolFee,
        uint256 epochId,
        bytes32 routeRefHash
    ) external onlyRole(EMITTER_ROLE) {
        require(receipts[paymentId].timestamp == 0, "Receipt already exists");

        receipts[paymentId] = Receipt({
            paymentId: paymentId,
            payer: payer,
            merchant: merchant,
            agent: agent,
            token: token,
            amount: amount,
            protocolFee: protocolFee,
            timestamp: block.timestamp,
            epochId: epochId,
            routeRefHash: routeRefHash
        });

        receiptIds.push(paymentId);
        epochReceipts[epochId].push(paymentId);
        epochTotalVolume[epochId] += amount;
        epochTotalFees[epochId] += protocolFee;

        emit ReceiptCreated(
            paymentId, payer, merchant, agent, token,
            amount, protocolFee, epochId, routeRefHash
        );
    }

    /// @notice Get receipt details
    function getReceipt(bytes32 paymentId) external view returns (Receipt memory) {
        return receipts[paymentId];
    }

    /// @notice Get epoch receipt IDs
    function getEpochReceiptIds(uint256 epochId) external view returns (bytes32[] memory) {
        return epochReceipts[epochId];
    }

    /// @notice Get epoch statistics
    function getEpochStats(uint256 epochId) external view returns (
        uint256 totalReceipts,
        uint256 totalVolume,
        uint256 totalFees
    ) {
        return (
            epochReceipts[epochId].length,
            epochTotalVolume[epochId],
            epochTotalFees[epochId]
        );
    }

    /// @notice Get total receipt count
    function getTotalReceipts() external view returns (uint256) {
        return receiptIds.length;
    }
}
