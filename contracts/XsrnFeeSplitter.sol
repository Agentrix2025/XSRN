// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title XsrnFeeSplitter
 * @author XSRN Team
 * @notice Core entry contract for x402 payment fee splitting
 * @dev Receives payment -> Deducts Protocol Fee -> Forwards remaining to merchant
 * 
 * Fee Structure:
 * - Protocol Fee: 0.3% (30 basis points) to Treasury
 * - Remaining: 99.7% to Commission contract for merchant distribution
 */
contract XsrnFeeSplitter is Ownable {
    using SafeERC20 for IERC20;

    /// @notice Protocol fee in basis points (10000 = 100%)
    /// @dev Default: 0.3% (30 bps)
    uint256 public protocolFeeBps = 30;
    
    /// @notice Commission contract address for merchant fund distribution
    address public commissionContract;

    /// @notice Treasury address for protocol fee collection
    address public treasury;

    /// @notice Emitted when a payment is split
    event PaymentSplit(
        address indexed token,
        address indexed merchant,
        uint256 totalAmount,
        uint256 commissionAmount,
        uint256 protocolFeeAmount,
        bytes32 indexed routeRefHash
    );

    /// @notice Emitted when protocol fee is updated
    event ProtocolFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    
    /// @notice Emitted when treasury address is updated
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    
    /// @notice Emitted when commission contract is updated
    event CommissionContractUpdated(address oldContract, address newContract);

    /// @notice Contract constructor
    /// @param _treasury Treasury address for protocol fees
    /// @param _commissionContract Commission contract for merchant distribution
    constructor(address _treasury, address _commissionContract) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        require(_commissionContract != address(0), "Invalid commission contract");
        treasury = _treasury;
        commissionContract = _commissionContract;
    }

    /// @notice Update commission contract address
    /// @param _commissionContract New commission contract address
    function setCommissionContract(address _commissionContract) external onlyOwner {
        require(_commissionContract != address(0), "Invalid address");
        address oldContract = commissionContract;
        commissionContract = _commissionContract;
        emit CommissionContractUpdated(oldContract, _commissionContract);
    }

    /**
     * @notice Process QuickPay payment (X402 V2)
     * @dev Called by XsrnSessionManager via Approve and Call pattern
     * @param token Payment token address
     * @param merchant Merchant receiving address
     * @param amount Payment amount
     * @param orderId Order ID for tracking
     */
    function quickPaySplit(
        address token,
        address merchant,
        uint256 amount,
        bytes32 orderId
    ) external {
        require(amount > 0, "Amount must be > 0");
        
        // 1. Pull tokens from sender (XsrnSessionManager)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // 2. Calculate protocol fee (0.3%)
        uint256 protocolFeeAmount = (amount * protocolFeeBps) / 10000;
        uint256 remainingAmount = amount - protocolFeeAmount;

        // 3. Transfer protocol fee to Treasury
        if (protocolFeeAmount > 0) {
            IERC20(token).safeTransfer(treasury, protocolFeeAmount);
        }

        // 4. Forward remaining to Commission contract
        if (remainingAmount > 0) {
            IERC20(token).forceApprove(commissionContract, remainingAmount);
            
            (bool success, bytes memory data) = commissionContract.call(
                abi.encodeWithSignature("quickPaySplit(bytes32,uint256)", orderId, remainingAmount)
            );
            require(success, string(abi.encodePacked("Commission call failed: ", data)));
            
            IERC20(token).forceApprove(commissionContract, 0);
        }

        emit PaymentSplit(token, merchant, amount, remainingAmount, protocolFeeAmount, orderId);
    }

    /**
     * @notice Process ERC20 payment split (Direct Push)
     * @param token Payment token address
     * @param merchant Merchant receiving address
     * @param amount Total payment amount
     * @param routeRef Attribution data for off-chain reward calculation
     */
    function splitPaymentERC20(
        address token,
        address merchant,
        uint256 amount,
        bytes calldata routeRef
    ) external {
        require(amount > 0, "Amount must be > 0");
        
        uint256 feeAmount = (amount * protocolFeeBps) / 10000;
        uint256 merchantAmount = amount - feeAmount;

        if (feeAmount > 0) {
            IERC20(token).safeTransferFrom(msg.sender, treasury, feeAmount);
        }

        if (merchantAmount > 0) {
            IERC20(token).safeTransferFrom(msg.sender, merchant, merchantAmount);
        }

        emit PaymentSplit(token, merchant, amount, merchantAmount, feeAmount, keccak256(routeRef));
    }

    /**
     * @notice Process native token (ETH/BNB) payment split
     * @param merchant Merchant receiving address
     * @param routeRef Attribution data for off-chain reward calculation
     */
    function splitPaymentNative(
        address merchant,
        bytes calldata routeRef
    ) external payable {
        uint256 amount = msg.value;
        require(amount > 0, "Amount must be > 0");

        uint256 feeAmount = (amount * protocolFeeBps) / 10000;
        uint256 merchantAmount = amount - feeAmount;

        if (feeAmount > 0) {
            (bool successFee, ) = treasury.call{value: feeAmount}("");
            require(successFee, "Fee transfer failed");
        }

        if (merchantAmount > 0) {
            (bool successMerch, ) = merchant.call{value: merchantAmount}("");
            require(successMerch, "Merchant transfer failed");
        }

        emit PaymentSplit(address(0), merchant, amount, merchantAmount, feeAmount, keccak256(routeRef));
    }

    // --- Admin Functions ---

    /// @notice Update protocol fee
    /// @param _bps New fee in basis points (max 1000 = 10%)
    function setProtocolFee(uint256 _bps) external onlyOwner {
        require(_bps <= 1000, "Fee too high (max 10%)");
        uint256 oldBps = protocolFeeBps;
        protocolFeeBps = _bps;
        emit ProtocolFeeUpdated(oldBps, _bps);
    }

    /// @notice Update treasury address
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
}
