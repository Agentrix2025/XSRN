// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title XsrnSessionManager
 * @author XSRN Team
 * @notice X402 V2 Session Manager implementing ERC-8004 Session Keys
 * @dev Supports "Approve and Call" pattern for seamless integration with Commission contracts
 */
contract XsrnSessionManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    /// @notice Session data structure
    struct Session {
        address signer;         // Session key address
        address owner;          // User wallet address
        uint256 singleLimit;    // Single transaction limit
        uint256 dailyLimit;     // Daily transaction limit
        uint256 usedToday;      // Amount used today
        uint256 expiry;         // Expiry timestamp
        uint256 lastResetDate;  // Last reset date (days since epoch)
        bool isActive;          // Is session active
    }

    // State variables
    mapping(bytes32 => Session) public sessions;
    mapping(address => bytes32[]) public userSessions;
    address public usdcToken;
    address public relayer;

    // Events
    event SessionCreated(
        bytes32 indexed sessionId,
        address indexed owner,
        address indexed signer,
        uint256 singleLimit,
        uint256 dailyLimit,
        uint256 expiry
    );
    event SessionRevoked(bytes32 indexed sessionId, address indexed owner);
    event PaymentExecuted(bytes32 indexed sessionId, address indexed to, uint256 amount, bytes32 paymentId);
    event DailyLimitReset(bytes32 indexed sessionId, uint256 date);
    event RelayerUpdated(address oldRelayer, address newRelayer);

    /// @notice Only authorized relayer can call
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }

    /// @notice Session must be valid
    modifier validSession(bytes32 sessionId) {
        require(sessions[sessionId].isActive, "Session not active");
        require(sessions[sessionId].expiry > block.timestamp, "Session expired");
        _;
    }

    /// @notice Contract constructor
    /// @param _usdcToken USDC/USDT token address
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = _usdcToken;
    }

    /// @notice Set authorized relayer
    /// @param _relayer New relayer address
    function setRelayer(address _relayer) external onlyOwner {
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }

    /**
     * @notice Create a new session
     * @param signer Session key address
     * @param singleLimit Maximum amount per transaction
     * @param dailyLimit Maximum amount per day
     * @param expiry Session expiry timestamp
     * @return sessionId The created session ID
     */
    function createSession(
        address signer,
        uint256 singleLimit,
        uint256 dailyLimit,
        uint256 expiry
    ) external returns (bytes32) {
        require(signer != address(0), "Invalid signer");
        require(expiry > block.timestamp, "Invalid expiry");
        require(dailyLimit >= singleLimit, "Daily limit must be >= single limit");

        bytes32 sessionId = keccak256(
            abi.encodePacked(msg.sender, signer, block.timestamp, block.number)
        );

        sessions[sessionId] = Session({
            signer: signer,
            owner: msg.sender,
            singleLimit: singleLimit,
            dailyLimit: dailyLimit,
            usedToday: 0,
            expiry: expiry,
            lastResetDate: block.timestamp / 1 days,
            isActive: true
        });

        userSessions[msg.sender].push(sessionId);
        
        emit SessionCreated(sessionId, msg.sender, signer, singleLimit, dailyLimit, expiry);
        return sessionId;
    }

    /**
     * @notice Revoke a session
     * @param sessionId Session ID to revoke
     */
    function revokeSession(bytes32 sessionId) external {
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        require(sessions[sessionId].isActive, "Session not active");
        
        sessions[sessionId].isActive = false;
        emit SessionRevoked(sessionId, msg.sender);
    }

    /**
     * @notice Execute payment with session
     * @param sessionId Session ID
     * @param to Recipient address
     * @param amount Payment amount
     * @param paymentId Unique payment identifier
     * @param signature Session key signature
     */
    function executeWithSession(
        bytes32 sessionId,
        address to,
        uint256 amount,
        bytes32 paymentId,
        bytes calldata signature
    ) external onlyRelayer validSession(sessionId) nonReentrant {
        Session storage session = sessions[sessionId];

        // 1. Check and reset daily limit
        uint256 currentDate = block.timestamp / 1 days;
        if (currentDate > session.lastResetDate) {
            session.usedToday = 0;
            session.lastResetDate = currentDate;
            emit DailyLimitReset(sessionId, currentDate);
        }

        // 2. Check limits
        require(amount <= session.singleLimit, "Exceeds single limit");
        require(session.usedToday + amount <= session.dailyLimit, "Exceeds daily limit");

        // 3. Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(sessionId, to, amount, paymentId, block.chainid))
            )
        );
        address recoveredSigner = messageHash.recover(signature);
        require(recoveredSigner == session.signer, "Invalid signature");

        // 4. Update usage
        session.usedToday += amount;

        // 5. Execute transfer
        IERC20(usdcToken).safeTransferFrom(session.owner, to, amount);

        emit PaymentExecuted(sessionId, to, amount, paymentId);
    }

    /**
     * @notice Get user's session IDs
     * @param user User address
     * @return Array of session IDs
     */
    function getUserSessions(address user) external view returns (bytes32[] memory) {
        return userSessions[user];
    }

    /**
     * @notice Get session details
     * @param sessionId Session ID
     * @return Session data
     */
    function getSession(bytes32 sessionId) external view returns (Session memory) {
        return sessions[sessionId];
    }
}
