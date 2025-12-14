// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title XsrnTreasury
 * @author XSRN Team
 * @notice XSRN ecosystem treasury for protocol fee management
 * @dev Funds are locked unless withdrawn through authorized distributors or timelock
 * 
 * Distribution Ratios:
 * - 40% Watcher: On-chain monitoring and alerts
 * - 30% Operator: Node operation and maintenance
 * - 20% Public Goods: Ecosystem public goods funding
 * - 10% Security Reserve: Security reserve fund
 */
contract XsrnTreasury is AccessControl {
    using SafeERC20 for IERC20;

    /// @notice Role for authorized distributors (e.g., MerkleDistributor)
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    
    /// @notice Role for timelock-protected operations
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK_ROLE");

    /// @notice Emitted when funds are withdrawn
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount, string reason);
    
    /// @notice Emitted when funds are received
    event FundsReceived(address indexed sender, uint256 amount);

    // Distribution addresses
    address public watcher;
    address public operator;
    address public publicGoods;
    address public securityReserve;

    // Distribution ratios (Basis Points, 10000 = 100%)
    uint256 public constant WATCHER_BPS = 4000;         // 40%
    uint256 public constant OPERATOR_BPS = 3000;        // 30%
    uint256 public constant PUBLIC_GOODS_BPS = 2000;    // 20%
    uint256 public constant SECURITY_RESERVE_BPS = 1000; // 10%

    /// @notice Emitted when distribution addresses are updated
    event DistributionUpdated(address watcher, address operator, address publicGoods, address securityReserve);
    
    /// @notice Emitted when rewards are distributed
    event RewardsDistributed(address indexed token, uint256 totalAmount);

    /// @notice Contract constructor
    /// @param _admin Admin address with full control
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIMELOCK_ROLE, _admin);
        
        // Initialize with admin as placeholder (should be updated)
        watcher = _admin;
        operator = _admin;
        publicGoods = _admin;
        securityReserve = _admin;
    }

    /// @notice Update distribution addresses
    function setDistributionAddresses(
        address _watcher,
        address _operator,
        address _publicGoods,
        address _securityReserve
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_watcher != address(0), "Invalid watcher");
        require(_operator != address(0), "Invalid operator");
        require(_publicGoods != address(0), "Invalid public goods");
        require(_securityReserve != address(0), "Invalid security reserve");
        
        watcher = _watcher;
        operator = _operator;
        publicGoods = _publicGoods;
        securityReserve = _securityReserve;
        
        emit DistributionUpdated(_watcher, _operator, _publicGoods, _securityReserve);
    }

    /**
     * @notice Distribute accumulated rewards according to the 40/30/20/10 rule
     * @param token Token address to distribute (address(0) for native)
     */
    function distributeRewards(address token) external onlyRole(DISTRIBUTOR_ROLE) {
        uint256 totalBalance;
        if (token == address(0)) {
            totalBalance = address(this).balance;
        } else {
            totalBalance = IERC20(token).balanceOf(address(this));
        }
        
        require(totalBalance > 0, "No funds to distribute");

        uint256 watcherAmount = (totalBalance * WATCHER_BPS) / 10000;
        uint256 operatorAmount = (totalBalance * OPERATOR_BPS) / 10000;
        uint256 publicGoodsAmount = (totalBalance * PUBLIC_GOODS_BPS) / 10000;
        uint256 securityReserveAmount = totalBalance - watcherAmount - operatorAmount - publicGoodsAmount;

        _transfer(token, watcher, watcherAmount);
        _transfer(token, operator, operatorAmount);
        _transfer(token, publicGoods, publicGoodsAmount);
        _transfer(token, securityReserve, securityReserveAmount);

        emit RewardsDistributed(token, totalBalance);
    }

    /// @dev Internal transfer function
    function _transfer(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @notice Distribute reward to a specific address (for MerkleDistributor)
     * @param token Token address
     * @param to Recipient address
     * @param amount Amount to distribute
     */
    function distributeReward(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /// @notice Receive native tokens
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
}
