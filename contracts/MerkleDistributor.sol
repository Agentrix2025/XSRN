// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title MerkleDistributor
 * @author XSRN Team
 * @notice Merkle tree distributor for efficient epoch reward distribution
 * @dev 
 *   - Uses Merkle proofs for claim verification
 *   - Supports multi-epoch cumulative claims
 *   - Supports multiple token distributions
 */
contract MerkleDistributor is AccessControl {
    using SafeERC20 for IERC20;

    /// @notice Operator role for merkle root management
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Treasury address (reward source)
    address public treasury;

    /// @notice Epoch Merkle roots (epochId => token => merkleRoot)
    mapping(uint256 => mapping(address => bytes32)) public epochMerkleRoots;

    /// @notice Claim records (epochId => token => account => claimed)
    mapping(uint256 => mapping(address => mapping(address => bool))) public claimed;

    /// @notice Cumulative claims (account => token => totalClaimed)
    mapping(address => mapping(address => uint256)) public totalClaimed;

    // Events
    event MerkleRootSet(uint256 indexed epochId, address indexed token, bytes32 merkleRoot);
    event Claimed(uint256 indexed epochId, address indexed account, address indexed token, uint256 amount);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    /// @notice Contract constructor
    /// @param _admin Admin address
    /// @param _treasury Treasury address
    constructor(address _admin, address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        treasury = _treasury;
    }

    /**
     * @notice Set Merkle root for an epoch
     * @param epochId Epoch ID
     * @param token Token address
     * @param merkleRoot Merkle root hash
     */
    function setMerkleRoot(
        uint256 epochId,
        address token,
        bytes32 merkleRoot
    ) external onlyRole(OPERATOR_ROLE) {
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        epochMerkleRoots[epochId][token] = merkleRoot;
        emit MerkleRootSet(epochId, token, merkleRoot);
    }

    /**
     * @notice Claim rewards for a single epoch
     * @param epochId Epoch ID
     * @param token Token address
     * @param amount Claim amount
     * @param merkleProof Merkle proof
     */
    function claim(
        uint256 epochId,
        address token,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(!claimed[epochId][token][msg.sender], "Already claimed");
        
        bytes32 merkleRoot = epochMerkleRoots[epochId][token];
        require(merkleRoot != bytes32(0), "Merkle root not set");

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");

        // Mark as claimed
        claimed[epochId][token][msg.sender] = true;
        totalClaimed[msg.sender][token] += amount;

        // Transfer from Treasury
        IERC20(token).safeTransferFrom(treasury, msg.sender, amount);

        emit Claimed(epochId, msg.sender, token, amount);
    }

    /**
     * @notice Batch claim rewards for multiple epochs
     * @param epochIds Array of epoch IDs
     * @param token Token address
     * @param amounts Array of amounts
     * @param merkleProofs Array of Merkle proofs
     */
    function claimMultiple(
        uint256[] calldata epochIds,
        address token,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external {
        require(epochIds.length == amounts.length, "Length mismatch");
        require(epochIds.length == merkleProofs.length, "Length mismatch");

        uint256 totalAmount = 0;

        for (uint256 i = 0; i < epochIds.length; i++) {
            uint256 epochId = epochIds[i];
            uint256 amount = amounts[i];
            
            if (claimed[epochId][token][msg.sender]) continue;

            bytes32 merkleRoot = epochMerkleRoots[epochId][token];
            if (merkleRoot == bytes32(0)) continue;

            bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
            if (!MerkleProof.verify(merkleProofs[i], merkleRoot, leaf)) continue;

            claimed[epochId][token][msg.sender] = true;
            totalAmount += amount;

            emit Claimed(epochId, msg.sender, token, amount);
        }

        if (totalAmount > 0) {
            totalClaimed[msg.sender][token] += totalAmount;
            IERC20(token).safeTransferFrom(treasury, msg.sender, totalAmount);
        }
    }

    /// @notice Check if already claimed
    function isClaimed(uint256 epochId, address token, address account) external view returns (bool) {
        return claimed[epochId][token][account];
    }

    /// @notice Verify claim eligibility without claiming
    function canClaim(
        uint256 epochId,
        address token,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        if (claimed[epochId][token][account]) return false;

        bytes32 merkleRoot = epochMerkleRoots[epochId][token];
        if (merkleRoot == bytes32(0)) return false;

        bytes32 leaf = keccak256(abi.encodePacked(account, amount));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }

    /// @notice Update treasury address
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
}
