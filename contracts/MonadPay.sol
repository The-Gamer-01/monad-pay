// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonadPay
 * @dev 支持批量支付、定期订阅和可编程支付的智能合约
 */
contract MonadPay is ReentrancyGuard, Ownable {
    
    struct Payment {
        address from;
        address to;
        uint256 amount;
        address token; // address(0) for native token
        string label;
        string message;
        uint256 timestamp;
        bytes32 linkHash;
    }
    
    struct Subscription {
        address subscriber;
        address recipient;
        uint256 amount;
        address token;
        uint256 interval; // seconds
        uint256 lastPayment;
        bool active;
    }
    
    struct EscrowPayment {
        address payer;
        address recipient;
        address arbiter;
        uint256 amount;
        address token;
        uint256 deadline;
        bool completed;
        bool disputed;
        bool released;
        string description;
        uint256 createdAt;
    }
    
    enum DisputeStatus {
        None,
        Raised,
        ResolvedForPayer,
        ResolvedForRecipient
    }
    
    mapping(bytes32 => Payment) public payments;
    mapping(bytes32 => bool) public processedLinks;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(uint256 => EscrowPayment) public escrowPayments;
    mapping(uint256 => DisputeStatus) public disputes;
    
    uint256 public nextSubscriptionId = 1;
    uint256 public nextEscrowId = 1;
    uint256 public platformFee = 25; // 0.25% in basis points
    uint256 public escrowFee = 50; // 0.5% for escrow services
    address public feeRecipient;
    
    event PaymentProcessed(
        bytes32 indexed linkHash,
        address indexed from,
        address indexed to,
        uint256 amount,
        address token,
        string label
    );
    
    event BatchPaymentProcessed(
        address indexed from,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed recipient,
        uint256 amount,
        uint256 interval
    );
    
    event SubscriptionPayment(
        uint256 indexed subscriptionId,
        uint256 amount,
        uint256 timestamp
    );
    
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed payer,
        address indexed recipient,
        address arbiter,
        uint256 amount,
        address token,
        uint256 deadline
    );
    
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount
    );
    
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed payer,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raiser
    );
    
    event DisputeResolved(
        uint256 indexed escrowId,
        DisputeStatus resolution,
        address indexed resolver
    );
    
    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev 处理单个支付链接
     */
    function processPaymentLink(
        address to,
        uint256 amount,
        address token,
        string memory label,
        string memory message,
        bytes32 linkHash
    ) external payable nonReentrant {
        require(!processedLinks[linkHash], "Link already processed");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        
        processedLinks[linkHash] = true;
        
        uint256 fee = (amount * platformFee) / 10000;
        uint256 netAmount = amount - fee;
        
        if (token == address(0)) {
            // Native token payment
            require(msg.value >= amount, "Insufficient payment");
            
            payable(to).transfer(netAmount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            
            // Refund excess
            if (msg.value > amount) {
                payable(msg.sender).transfer(msg.value - amount);
            }
        } else {
            // ERC20 token payment
            IERC20(token).transferFrom(msg.sender, to, netAmount);
            if (fee > 0) {
                IERC20(token).transferFrom(msg.sender, feeRecipient, fee);
            }
        }
        
        payments[linkHash] = Payment({
            from: msg.sender,
            to: to,
            amount: amount,
            token: token,
            label: label,
            message: message,
            timestamp: block.timestamp,
            linkHash: linkHash
        });
        
        emit PaymentProcessed(linkHash, msg.sender, to, amount, token, label);
    }
    
    /**
     * @dev 批量支付功能
     */
    function batchPayment(
        address[] memory recipients,
        uint256[] memory amounts,
        address token
    ) external payable nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty recipients array");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        uint256 fee = (totalAmount * platformFee) / 10000;
        uint256 totalWithFee = totalAmount + fee;
        
        if (token == address(0)) {
            require(msg.value >= totalWithFee, "Insufficient payment");
            
            for (uint256 i = 0; i < recipients.length; i++) {
                payable(recipients[i]).transfer(amounts[i]);
            }
            
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            
            if (msg.value > totalWithFee) {
                payable(msg.sender).transfer(msg.value - totalWithFee);
            }
        } else {
            for (uint256 i = 0; i < recipients.length; i++) {
                IERC20(token).transferFrom(msg.sender, recipients[i], amounts[i]);
            }
            
            if (fee > 0) {
                IERC20(token).transferFrom(msg.sender, feeRecipient, fee);
            }
        }
        
        emit BatchPaymentProcessed(msg.sender, totalAmount, recipients.length);
    }
    
    /**
     * @dev 创建订阅
     */
    function createSubscription(
        address recipient,
        uint256 amount,
        address token,
        uint256 interval
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(interval > 0, "Invalid interval");
        
        uint256 subscriptionId = nextSubscriptionId++;
        
        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            recipient: recipient,
            amount: amount,
            token: token,
            interval: interval,
            lastPayment: 0,
            active: true
        });
        
        emit SubscriptionCreated(subscriptionId, msg.sender, recipient, amount, interval);
        return subscriptionId;
    }
    
    /**
     * @dev 执行订阅支付
     */
    function executeSubscriptionPayment(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.active, "Subscription not active");
        require(
            block.timestamp >= sub.lastPayment + sub.interval,
            "Payment not due yet"
        );
        
        uint256 fee = (sub.amount * platformFee) / 10000;
        uint256 netAmount = sub.amount - fee;
        
        if (sub.token == address(0)) {
            require(address(this).balance >= sub.amount, "Insufficient contract balance");
            payable(sub.recipient).transfer(netAmount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
        } else {
            IERC20(sub.token).transferFrom(sub.subscriber, sub.recipient, netAmount);
            if (fee > 0) {
                IERC20(sub.token).transferFrom(sub.subscriber, feeRecipient, fee);
            }
        }
        
        sub.lastPayment = block.timestamp;
        
        emit SubscriptionPayment(subscriptionId, sub.amount, block.timestamp);
    }
    
    /**
     * @dev 取消订阅
     */
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber == msg.sender, "Not subscription owner");
        sub.active = false;
    }
    
    /**
     * @dev 更新平台费率 (仅所有者)
     */
    function updatePlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _platformFee;
    }
    
    /**
     * @dev 更新费用接收地址 (仅所有者)
     */
    function updateFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev 获取支付信息
     */
    function getPayment(bytes32 linkHash) external view returns (Payment memory) {
        return payments[linkHash];
    }
    
    /**
     * @dev 检查链接是否已处理
     */
    function isLinkProcessed(bytes32 linkHash) external view returns (bool) {
        return processedLinks[linkHash];
    }
    
    /**
     * @dev 生成链接哈希
     */
    function generateLinkHash(
        address to,
        uint256 amount,
        address token,
        string memory label,
        uint256 nonce
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(to, amount, token, label, nonce));
    }
    
    // 接收原生代币
    receive() external payable {}
}