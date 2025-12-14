// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AttestationRegistry
 * @author XSRN Team
 * @notice Quality attestation registry with Bond/Challenge mechanism
 * @dev 
 *   Implements quality assurance through:
 *   - Agent attestation submission with optional bond
 *   - Challenge mechanism for quality disputes
 *   - Arbiter resolution with slash penalties
 */
contract AttestationRegistry is AccessControl {
    using SafeERC20 for IERC20;

    /// @notice Arbiter role for dispute resolution
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    // Configuration
    address public bondToken;           // Bond token (typically USDT)
    uint256 public minBondAmount;       // Minimum bond amount
    uint256 public challengePeriod;     // Challenge period (seconds)
    uint256 public slashPercentage;     // Slash percentage (basis points, 10000 = 100%)

    /// @notice Attestation data structure
    struct Attestation {
        address attester;           // Attestation submitter (Agent)
        bytes32 contentHash;        // Service quality proof hash
        uint256 bondAmount;         // Staked amount
        uint256 timestamp;          // Submission time
        uint256 challengeDeadline;  // Challenge deadline
        AttestationStatus status;   // Current status
        address challenger;         // Challenger address
        bytes32 challengeReason;    // Challenge reason hash
    }

    /// @notice Attestation status enum
    enum AttestationStatus {
        Pending,        // Awaiting challenge period end
        Validated,      // Validated (no challenge or challenge failed)
        Challenged,     // Being challenged
        Slashed,        // Slashed (challenge succeeded)
        Withdrawn       // Bond withdrawn
    }

    // Storage
    mapping(bytes32 => Attestation) public attestations;
    bytes32[] public attestationIds;
    
    // Statistics
    mapping(address => uint256) public attesterValidCount;
    mapping(address => uint256) public attesterSlashCount;
    mapping(address => uint256) public challengerWinCount;

    // Events
    event AttestationSubmitted(
        bytes32 indexed attestationId,
        address indexed attester,
        bytes32 contentHash,
        uint256 bondAmount,
        uint256 challengeDeadline
    );
    event AttestationChallenged(bytes32 indexed attestationId, address indexed challenger, bytes32 challengeReason);
    event AttestationValidated(bytes32 indexed attestationId);
    event AttestationSlashed(bytes32 indexed attestationId, address indexed challenger, uint256 slashAmount);
    event BondWithdrawn(bytes32 indexed attestationId, address indexed attester, uint256 amount);

    /// @notice Contract constructor
    constructor(
        address _admin,
        address _bondToken,
        uint256 _minBondAmount,
        uint256 _challengePeriod,
        uint256 _slashPercentage
    ) {
        require(_bondToken != address(0), "Invalid bond token");
        require(_slashPercentage <= 10000, "Invalid slash percentage");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ARBITER_ROLE, _admin);

        bondToken = _bondToken;
        minBondAmount = _minBondAmount;
        challengePeriod = _challengePeriod;
        slashPercentage = _slashPercentage;
    }

    /**
     * @notice Submit service quality attestation
     * @param contentHash Proof content hash (off-chain storage)
     * @param bondAmount Bond amount (can be 0 but affects credibility)
     * @return attestationId Generated attestation ID
     */
    function submitAttestation(
        bytes32 contentHash,
        uint256 bondAmount
    ) external returns (bytes32) {
        require(contentHash != bytes32(0), "Invalid content hash");
        
        bytes32 attestationId = keccak256(
            abi.encodePacked(msg.sender, contentHash, block.timestamp, block.number)
        );
        
        require(attestations[attestationId].timestamp == 0, "Attestation exists");

        if (bondAmount > 0) {
            require(bondAmount >= minBondAmount, "Bond too low");
            IERC20(bondToken).safeTransferFrom(msg.sender, address(this), bondAmount);
        }

        uint256 deadline = block.timestamp + challengePeriod;

        attestations[attestationId] = Attestation({
            attester: msg.sender,
            contentHash: contentHash,
            bondAmount: bondAmount,
            timestamp: block.timestamp,
            challengeDeadline: deadline,
            status: AttestationStatus.Pending,
            challenger: address(0),
            challengeReason: bytes32(0)
        });

        attestationIds.push(attestationId);

        emit AttestationSubmitted(attestationId, msg.sender, contentHash, bondAmount, deadline);
        return attestationId;
    }

    /**
     * @notice Challenge an attestation
     * @param attestationId Attestation ID
     * @param reason Challenge reason hash
     */
    function challenge(bytes32 attestationId, bytes32 reason) external {
        Attestation storage att = attestations[attestationId];
        
        require(att.timestamp != 0, "Attestation not found");
        require(att.status == AttestationStatus.Pending, "Not challengeable");
        require(block.timestamp <= att.challengeDeadline, "Challenge period ended");
        require(msg.sender != att.attester, "Cannot self-challenge");

        att.status = AttestationStatus.Challenged;
        att.challenger = msg.sender;
        att.challengeReason = reason;

        emit AttestationChallenged(attestationId, msg.sender, reason);
    }

    /**
     * @notice Arbitrate challenge result
     * @param attestationId Attestation ID
     * @param challengeSucceeded Whether challenge succeeded
     */
    function arbitrate(bytes32 attestationId, bool challengeSucceeded) external onlyRole(ARBITER_ROLE) {
        Attestation storage att = attestations[attestationId];
        
        require(att.status == AttestationStatus.Challenged, "Not in challenge");

        if (challengeSucceeded) {
            att.status = AttestationStatus.Slashed;
            attesterSlashCount[att.attester]++;
            challengerWinCount[att.challenger]++;

            uint256 slashAmount = (att.bondAmount * slashPercentage) / 10000;
            uint256 refundAmount = att.bondAmount - slashAmount;

            if (slashAmount > 0) {
                IERC20(bondToken).safeTransfer(att.challenger, slashAmount);
            }

            if (refundAmount > 0) {
                IERC20(bondToken).safeTransfer(att.attester, refundAmount);
            }

            emit AttestationSlashed(attestationId, att.challenger, slashAmount);
        } else {
            att.status = AttestationStatus.Validated;
            attesterValidCount[att.attester]++;
            emit AttestationValidated(attestationId);
        }
    }

    /**
     * @notice Validate attestation after challenge period
     * @param attestationId Attestation ID
     */
    function validate(bytes32 attestationId) external {
        Attestation storage att = attestations[attestationId];
        
        require(att.status == AttestationStatus.Pending, "Not pending");
        require(block.timestamp > att.challengeDeadline, "Challenge period not ended");

        att.status = AttestationStatus.Validated;
        attesterValidCount[att.attester]++;

        emit AttestationValidated(attestationId);
    }

    /**
     * @notice Withdraw bond after validation
     * @param attestationId Attestation ID
     */
    function withdrawBond(bytes32 attestationId) external {
        Attestation storage att = attestations[attestationId];
        
        require(msg.sender == att.attester, "Not attester");
        require(att.status == AttestationStatus.Validated, "Not validated");
        require(att.bondAmount > 0, "No bond");

        uint256 amount = att.bondAmount;
        att.bondAmount = 0;
        att.status = AttestationStatus.Withdrawn;

        IERC20(bondToken).safeTransfer(msg.sender, amount);

        emit BondWithdrawn(attestationId, msg.sender, amount);
    }

    /// @notice Get attestation details
    function getAttestation(bytes32 attestationId) external view returns (Attestation memory) {
        return attestations[attestationId];
    }

    /// @notice Get attester statistics
    function getAttesterStats(address attester) external view returns (uint256 validCount, uint256 slashCount) {
        return (attesterValidCount[attester], attesterSlashCount[attester]);
    }

    /// @notice Get total attestation count
    function getTotalAttestations() external view returns (uint256) {
        return attestationIds.length;
    }

    // Admin functions
    function setMinBondAmount(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minBondAmount = _amount;
    }

    function setChallengePeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        challengePeriod = _period;
    }

    function setSlashPercentage(uint256 _percentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_percentage <= 10000, "Invalid percentage");
        slashPercentage = _percentage;
    }
}
