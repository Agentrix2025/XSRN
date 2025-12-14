// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EpochManager
 * @author XSRN Team
 * @notice Epoch cycle manager for reward distribution
 * @dev 
 *   - Default epoch duration: 7 days
 *   - Triggers MerkleDistributor allocation after epoch ends
 *   - Supports manual and automatic epoch advancement
 */
contract EpochManager is AccessControl {
    /// @notice Operator role for epoch management
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Epoch data structure
    struct Epoch {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        bytes32 merkleRoot;      // Merkle root for this epoch
        bool finalized;          // Whether distribution is complete
        uint256 totalRewards;    // Total rewards for this epoch
    }

    // Configuration
    uint256 public epochDuration = 7 days;
    uint256 public constant MIN_EPOCH_DURATION = 1 days;
    uint256 public constant MAX_EPOCH_DURATION = 30 days;

    // State
    uint256 public currentEpochId;
    mapping(uint256 => Epoch) public epochs;
    
    // Events
    event EpochStarted(uint256 indexed epochId, uint256 startTime, uint256 endTime);
    event EpochFinalized(uint256 indexed epochId, bytes32 merkleRoot, uint256 totalRewards);
    event EpochDurationUpdated(uint256 oldDuration, uint256 newDuration);

    /// @notice Contract constructor
    /// @param _admin Admin address
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        // Initialize first epoch
        currentEpochId = 1;
        epochs[currentEpochId] = Epoch({
            id: currentEpochId,
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration,
            merkleRoot: bytes32(0),
            finalized: false,
            totalRewards: 0
        });

        emit EpochStarted(currentEpochId, block.timestamp, block.timestamp + epochDuration);
    }

    /// @notice Get current epoch ID
    function getCurrentEpochId() external view returns (uint256) {
        return currentEpochId;
    }

    /// @notice Get current epoch info
    function getCurrentEpoch() external view returns (Epoch memory) {
        return epochs[currentEpochId];
    }

    /// @notice Check if epoch can be advanced
    function canAdvanceEpoch() public view returns (bool) {
        return block.timestamp >= epochs[currentEpochId].endTime;
    }

    /// @notice Advance to next epoch
    /// @dev Anyone can call if conditions are met
    function advanceEpoch() external {
        require(canAdvanceEpoch(), "Current epoch not ended");
        require(epochs[currentEpochId].finalized, "Current epoch not finalized yet");

        currentEpochId++;
        
        epochs[currentEpochId] = Epoch({
            id: currentEpochId,
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration,
            merkleRoot: bytes32(0),
            finalized: false,
            totalRewards: 0
        });

        emit EpochStarted(currentEpochId, block.timestamp, block.timestamp + epochDuration);
    }

    /**
     * @notice Finalize epoch with Merkle root
     * @param epochId Epoch ID to finalize
     * @param merkleRoot Merkle root for reward distribution
     * @param totalRewards Total rewards for this epoch
     */
    function finalizeEpoch(
        uint256 epochId,
        bytes32 merkleRoot,
        uint256 totalRewards
    ) external onlyRole(OPERATOR_ROLE) {
        require(epochId <= currentEpochId, "Invalid epoch");
        require(!epochs[epochId].finalized, "Already finalized");
        require(merkleRoot != bytes32(0), "Invalid merkle root");

        epochs[epochId].merkleRoot = merkleRoot;
        epochs[epochId].totalRewards = totalRewards;
        epochs[epochId].finalized = true;

        emit EpochFinalized(epochId, merkleRoot, totalRewards);
    }

    /// @notice Update epoch duration
    function setEpochDuration(uint256 _duration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_duration >= MIN_EPOCH_DURATION, "Duration too short");
        require(_duration <= MAX_EPOCH_DURATION, "Duration too long");
        
        uint256 oldDuration = epochDuration;
        epochDuration = _duration;
        
        emit EpochDurationUpdated(oldDuration, _duration);
    }

    /// @notice Get epoch Merkle root
    function getMerkleRoot(uint256 epochId) external view returns (bytes32) {
        return epochs[epochId].merkleRoot;
    }

    /// @notice Check if epoch is finalized
    function isEpochFinalized(uint256 epochId) external view returns (bool) {
        return epochs[epochId].finalized;
    }
}
