// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
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
    
    struct MultiSigPayment {
        address[] signers;
        address recipient;
        uint256 amount;
        address token;
        uint256 requiredSignatures;
        uint256 currentSignatures;
        mapping(address => bool) hasSigned;
        bool executed;
        string description;
        uint256 createdAt;
        uint256 deadline;
    }
    
    enum ConditionType {
        TimeBasedDelay,     // 基于时间延迟
        TimeBasedSchedule,  // 基于时间计划
        PriceThreshold,     // 基于价格阈值
        BlockNumber,        // 基于区块号
        Custom              // 自定义条件
    }
    
    struct ConditionalPayment {
        address payer;
        address recipient;
        uint256 amount;
        address token;
        ConditionType conditionType;
        uint256 conditionValue;     // 条件值 (时间戳、价格、区块号等)
        address priceOracle;        // 价格预言机地址 (仅用于价格条件)
        bool executed;
        bool cancelled;
        string description;
        uint256 createdAt;
    }
    
    struct SplitRecipient {
        address recipient;
        uint256 percentage;  // 百分比 (基点，10000 = 100%)
    }
    
    struct SplitPayment {
        address payer;
        SplitRecipient[] recipients;
        uint256 totalAmount;
        address token;
        bool executed;
        string description;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Payment) public payments;
    mapping(bytes32 => bool) public processedLinks;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(uint256 => EscrowPayment) public escrowPayments;
    mapping(uint256 => DisputeStatus) public disputes;
    mapping(uint256 => MultiSigPayment) public multiSigPayments;
    mapping(uint256 => ConditionalPayment) public conditionalPayments;
    mapping(uint256 => SplitPayment) public splitPayments;
    
    uint256 public nextSubscriptionId = 1;
    uint256 public nextEscrowId = 1;
    uint256 public nextMultiSigId = 1;
    uint256 public nextConditionalId = 1;
    uint256 public nextSplitId = 1;
    
    // NFT支付相关
    struct NFTPayment {
        address payer;
        address recipient;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken; // address(0) for ETH
        bool executed;
        bool cancelled;
        string description;
        uint256 createdAt;
        uint256 deadline;
    }
    
    mapping(uint256 => NFTPayment) public nftPayments;
    uint256 public nextNFTId = 1;
    
    // 第三方合约支付相关
    struct CustomContractPayment {
        address payer;
        address recipient;
        uint256 amount;
        address token; // address(0) for ETH
        address targetContract; // 第三方合约地址
        bytes callData; // 调用数据
        bytes expectedReturn; // 期望返回值（用于条件验证）
        bool requiresReturn; // 是否需要验证返回值
        uint256 gasLimit; // Gas 限制
        bool executed;
        bool cancelled;
        string description;
        uint256 createdAt;
        uint256 deadline;
    }
    
    mapping(uint256 => CustomContractPayment) public customContractPayments;
    uint256 public nextCustomContractId = 1;
    
    // 合约白名单
    mapping(address => bool) public whitelistedContracts;
    uint256 public maxGasLimit = 500000; // 最大 Gas 限制
    
    // 退款相关
    struct RefundRequest {
        uint256 paymentId;
        PaymentType paymentType;
        address requester;
        string reason;
        bool approved;
        bool processed;
        uint256 createdAt;
        uint256 processedAt;
        address approver;
    }
    
    enum PaymentType {
        REGULAR,
        ESCROW,
        MULTISIG,
        CONDITIONAL,
        SPLIT,
        NFT,
        CUSTOM_CONTRACT
    }
    
    mapping(uint256 => RefundRequest) public refundRequests;
    uint256 public nextRefundId = 1;
    
    // 自动退款设置
    mapping(uint256 => bool) public autoRefundEnabled; // paymentId => enabled
    mapping(uint256 => uint256) public refundDeadlines; // paymentId => deadline
    
    // 支付分析相关
    struct PaymentAnalytics {
        uint256 totalPayments;
        uint256 totalVolume;
        uint256 totalFees;
        uint256 successfulPayments;
        uint256 failedPayments;
        uint256 refundedPayments;
        mapping(address => uint256) tokenVolumes;
        mapping(address => uint256) userPayments;
        mapping(PaymentType => uint256) typeVolumes;
    }
    
    PaymentAnalytics public analytics;
    
    // 每日统计
    mapping(uint256 => PaymentAnalytics) public dailyAnalytics; // timestamp => analytics
    
    // 用户统计
    mapping(address => PaymentAnalytics) public userAnalytics;
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
    
    event MultiSigPaymentCreated(
        uint256 indexed multiSigId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint256 requiredSignatures
    );
    
    event MultiSigPaymentSigned(
        uint256 indexed multiSigId,
        address indexed signer,
        uint256 currentSignatures,
        uint256 requiredSignatures
    );
    
    event MultiSigPaymentExecuted(
        uint256 indexed multiSigId,
        address indexed recipient,
        uint256 amount
    );
    
    event MultiSigPaymentCancelled(
        uint256 indexed multiSigId,
        address indexed canceller
    );
    
    event ConditionalPaymentCreated(
        uint256 indexed conditionalId,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        ConditionType conditionType,
        uint256 conditionValue
    );
    
    event ConditionalPaymentExecuted(
        uint256 indexed conditionalId,
        address indexed recipient,
        uint256 amount
    );
    
    event ConditionalPaymentCancelled(
        uint256 indexed conditionalId,
        address indexed canceller
    );
    
    event SplitPaymentCreated(
        uint256 indexed splitId,
        address indexed payer,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event SplitPaymentExecuted(
        uint256 indexed splitId,
        address indexed payer,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event NFTPaymentCreated(
        uint256 indexed nftPaymentId,
        address indexed payer,
        address indexed recipient,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event NFTPaymentExecuted(
        uint256 indexed nftPaymentId,
        address indexed payer,
        address indexed recipient,
        address nftContract,
        uint256 tokenId
    );
    
    event NFTPaymentCancelled(
        uint256 indexed nftPaymentId,
        address indexed canceller
    );
    
    event CustomContractPaymentCreated(
        uint256 indexed customContractId,
        address indexed payer,
        address indexed recipient,
        address targetContract,
        uint256 amount,
        address token
    );
    
    event CustomContractPaymentExecuted(
        uint256 indexed customContractId,
        address indexed payer,
        address indexed recipient,
        address targetContract,
        uint256 amount,
        bool success
    );
    
    event CustomContractPaymentCancelled(
        uint256 indexed customContractId,
        address indexed canceller
    );
    
    event ContractWhitelisted(
        address indexed contractAddress,
        bool whitelisted
    );
    
    event RefundRequested(
        uint256 indexed refundId,
        uint256 indexed paymentId,
        PaymentType paymentType,
        address indexed requester,
        string reason
    );
    
    event RefundApproved(
        uint256 indexed refundId,
        address indexed approver
    );
    
    event RefundProcessed(
        uint256 indexed refundId,
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );
    
    event AutoRefundExecuted(
        uint256 indexed paymentId,
        PaymentType paymentType,
        address indexed recipient,
        uint256 amount
    );
    
    event PaymentAnalyticsUpdated(
        uint256 totalPayments,
        uint256 totalVolume,
        uint256 totalFees
    );
    
    event DailyAnalyticsUpdated(
        uint256 indexed date,
        uint256 dailyPayments,
        uint256 dailyVolume
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
    
    /**
     * @dev 创建托管支付
     */
    function createEscrow(
        address recipient,
        address arbiter,
        uint256 amount,
        address token,
        uint256 deadline,
        string memory description
    ) external payable nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(arbiter != address(0), "Invalid arbiter");
        require(amount > 0, "Invalid amount");
        require(deadline > block.timestamp, "Invalid deadline");
        require(arbiter != msg.sender && arbiter != recipient, "Invalid arbiter");
        
        uint256 escrowId = nextEscrowId++;
        uint256 fee = (amount * escrowFee) / 10000;
        uint256 totalAmount = amount + fee;
        
        if (token == address(0)) {
            require(msg.value >= totalAmount, "Insufficient payment");
            
            // 退还多余的ETH
            if (msg.value > totalAmount) {
                payable(msg.sender).transfer(msg.value - totalAmount);
            }
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }
        
        escrowPayments[escrowId] = EscrowPayment({
            payer: msg.sender,
            recipient: recipient,
            arbiter: arbiter,
            amount: amount,
            token: token,
            deadline: deadline,
            completed: false,
            disputed: false,
            released: false,
            description: description,
            createdAt: block.timestamp
        });
        
        emit EscrowCreated(escrowId, msg.sender, recipient, amount, deadline);
        return escrowId;
    }
    
    /**
     * @dev 释放托管资金
     */
    function releaseEscrow(uint256 escrowId) external nonReentrant {
        EscrowPayment storage escrow = escrowPayments[escrowId];
        require(!escrow.completed, "Escrow already completed");
        require(!escrow.disputed, "Escrow is disputed");
        require(
            msg.sender == escrow.payer || msg.sender == escrow.arbiter,
            "Not authorized"
        );
        
        escrow.completed = true;
        escrow.released = true;
        
        uint256 fee = (escrow.amount * escrowFee) / 10000;
        
        if (escrow.token == address(0)) {
            payable(escrow.recipient).transfer(escrow.amount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
        } else {
            IERC20(escrow.token).transfer(escrow.recipient, escrow.amount);
            if (fee > 0) {
                IERC20(escrow.token).transfer(feeRecipient, fee);
            }
        }
        
        emit EscrowReleased(escrowId, escrow.recipient, escrow.amount);
    }
    
    /**
     * @dev 退还托管资金
     */
    function refundEscrow(uint256 escrowId) external nonReentrant {
        EscrowPayment storage escrow = escrowPayments[escrowId];
        require(!escrow.completed, "Escrow already completed");
        require(
            block.timestamp > escrow.deadline || escrow.disputed,
            "Cannot refund yet"
        );
        require(
            msg.sender == escrow.payer || msg.sender == escrow.arbiter,
            "Not authorized"
        );
        
        escrow.completed = true;
        
        uint256 fee = (escrow.amount * escrowFee) / 10000;
        uint256 totalAmount = escrow.amount + fee;
        
        if (escrow.token == address(0)) {
            payable(escrow.payer).transfer(totalAmount);
        } else {
            IERC20(escrow.token).transfer(escrow.payer, totalAmount);
        }
        
        emit EscrowRefunded(escrowId, escrow.payer, escrow.amount);
    }
    
    /**
     * @dev 提起争议
     */
    function raiseDispute(uint256 escrowId, string memory reason) external {
        EscrowPayment storage escrow = escrowPayments[escrowId];
        require(!escrow.completed, "Escrow already completed");
        require(
            msg.sender == escrow.payer || msg.sender == escrow.recipient,
            "Not authorized"
        );
        require(disputes[escrowId] == DisputeStatus.None, "Dispute already raised");
        
        escrow.disputed = true;
        disputes[escrowId] = DisputeStatus.Raised;
        
        emit DisputeRaised(escrowId, msg.sender, reason);
    }
    
    /**
     * @dev 解决争议 (仅仲裁者)
     */
    function resolveDispute(
        uint256 escrowId,
        bool favorPayer,
        string memory resolution
    ) external nonReentrant {
        EscrowPayment storage escrow = escrowPayments[escrowId];
        require(msg.sender == escrow.arbiter, "Not arbiter");
        require(escrow.disputed, "No dispute to resolve");
        require(!escrow.completed, "Escrow already completed");
        
        escrow.completed = true;
        
        uint256 fee = (escrow.amount * escrowFee) / 10000;
        
        if (favorPayer) {
            disputes[escrowId] = DisputeStatus.ResolvedForPayer;
            uint256 totalAmount = escrow.amount + fee;
            
            if (escrow.token == address(0)) {
                payable(escrow.payer).transfer(totalAmount);
            } else {
                IERC20(escrow.token).transfer(escrow.payer, totalAmount);
            }
        } else {
            disputes[escrowId] = DisputeStatus.ResolvedForRecipient;
            escrow.released = true;
            
            if (escrow.token == address(0)) {
                payable(escrow.recipient).transfer(escrow.amount);
                if (fee > 0) {
                    payable(feeRecipient).transfer(fee);
                }
            } else {
                IERC20(escrow.token).transfer(escrow.recipient, escrow.amount);
                if (fee > 0) {
                    IERC20(escrow.token).transfer(feeRecipient, fee);
                }
            }
        }
        
        emit DisputeResolved(escrowId, favorPayer, resolution);
    }
    
    /**
     * @dev 获取托管支付信息
     */
    function getEscrow(uint256 escrowId) external view returns (EscrowPayment memory) {
        return escrowPayments[escrowId];
    }
    
    /**
     * @dev 获取争议状态
     */
    function getDisputeStatus(uint256 escrowId) external view returns (DisputeStatus) {
        return disputes[escrowId];
    }
    
    /**
     * @dev 更新托管费率 (仅所有者)
     */
    function updateEscrowFee(uint256 _escrowFee) external onlyOwner {
        require(_escrowFee <= 1000, "Fee too high"); // Max 10%
        escrowFee = _escrowFee;
    }
    
    /**
     * @dev 创建多签支付
     */
    function createMultiSigPayment(
        address[] memory signers,
        address recipient,
        uint256 amount,
        address token,
        uint256 requiredSignatures,
        uint256 deadline,
        string memory description
    ) external payable nonReentrant returns (uint256) {
        require(signers.length >= 2, "Need at least 2 signers");
        require(requiredSignatures > 0 && requiredSignatures <= signers.length, "Invalid required signatures");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(deadline > block.timestamp, "Invalid deadline");
        
        // 验证签名者列表中没有重复地址
        for (uint256 i = 0; i < signers.length; i++) {
            require(signers[i] != address(0), "Invalid signer");
            for (uint256 j = i + 1; j < signers.length; j++) {
                require(signers[i] != signers[j], "Duplicate signer");
            }
        }
        
        uint256 multiSigId = nextMultiSigId++;
        uint256 fee = (amount * platformFee) / 10000;
        uint256 totalAmount = amount + fee;
        
        // 锁定资金
        if (token == address(0)) {
            require(msg.value >= totalAmount, "Insufficient payment");
            
            // 退还多余的ETH
            if (msg.value > totalAmount) {
                payable(msg.sender).transfer(msg.value - totalAmount);
            }
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }
        
        MultiSigPayment storage payment = multiSigPayments[multiSigId];
        payment.signers = signers;
        payment.recipient = recipient;
        payment.amount = amount;
        payment.token = token;
        payment.requiredSignatures = requiredSignatures;
        payment.currentSignatures = 0;
        payment.executed = false;
        payment.description = description;
        payment.createdAt = block.timestamp;
        payment.deadline = deadline;
        
        emit MultiSigPaymentCreated(multiSigId, msg.sender, recipient, amount, requiredSignatures);
        return multiSigId;
    }
    
    /**
     * @dev 签名多签支付
     */
    function signMultiSigPayment(uint256 multiSigId) external {
        MultiSigPayment storage payment = multiSigPayments[multiSigId];
        require(!payment.executed, "Payment already executed");
        require(block.timestamp <= payment.deadline, "Payment expired");
        require(!payment.hasSigned[msg.sender], "Already signed");
        
        // 验证签名者身份
        bool isValidSigner = false;
        for (uint256 i = 0; i < payment.signers.length; i++) {
            if (payment.signers[i] == msg.sender) {
                isValidSigner = true;
                break;
            }
        }
        require(isValidSigner, "Not a valid signer");
        
        payment.hasSigned[msg.sender] = true;
        payment.currentSignatures++;
        
        emit MultiSigPaymentSigned(
            multiSigId,
            msg.sender,
            payment.currentSignatures,
            payment.requiredSignatures
        );
        
        // 如果达到所需签名数，自动执行支付
        if (payment.currentSignatures >= payment.requiredSignatures) {
            _executeMultiSigPayment(multiSigId);
        }
    }
    
    /**
     * @dev 执行多签支付 (内部函数)
     */
    function _executeMultiSigPayment(uint256 multiSigId) internal {
        MultiSigPayment storage payment = multiSigPayments[multiSigId];
        require(!payment.executed, "Payment already executed");
        require(payment.currentSignatures >= payment.requiredSignatures, "Insufficient signatures");
        
        payment.executed = true;
        
        uint256 fee = (payment.amount * platformFee) / 10000;
        
        if (payment.token == address(0)) {
            payable(payment.recipient).transfer(payment.amount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
        } else {
            IERC20(payment.token).transfer(payment.recipient, payment.amount);
            if (fee > 0) {
                IERC20(payment.token).transfer(feeRecipient, fee);
            }
        }
        
        emit MultiSigPaymentExecuted(multiSigId, payment.recipient, payment.amount);
    }
    
    /**
     * @dev 取消多签支付 (仅在过期后)
     */
    function cancelMultiSigPayment(uint256 multiSigId) external nonReentrant {
        MultiSigPayment storage payment = multiSigPayments[multiSigId];
        require(!payment.executed, "Payment already executed");
        require(block.timestamp > payment.deadline, "Payment not expired yet");
        
        // 验证调用者是签名者之一
        bool isValidSigner = false;
        for (uint256 i = 0; i < payment.signers.length; i++) {
            if (payment.signers[i] == msg.sender) {
                isValidSigner = true;
                break;
            }
        }
        require(isValidSigner, "Not a valid signer");
        
        payment.executed = true; // 标记为已执行以防止重复操作
        
        uint256 fee = (payment.amount * platformFee) / 10000;
        uint256 totalAmount = payment.amount + fee;
        
        // 退还资金给创建者 (第一个签名者)
        address creator = payment.signers[0];
        if (payment.token == address(0)) {
            payable(creator).transfer(totalAmount);
        } else {
            IERC20(payment.token).transfer(creator, totalAmount);
        }
        
        emit MultiSigPaymentCancelled(multiSigId, msg.sender);
    }
    
    /**
     * @dev 获取多签支付信息
     */
    function getMultiSigPayment(uint256 multiSigId) external view returns (
        address[] memory signers,
        address recipient,
        uint256 amount,
        address token,
        uint256 requiredSignatures,
        uint256 currentSignatures,
        bool executed,
        string memory description,
        uint256 createdAt,
        uint256 deadline
    ) {
        MultiSigPayment storage payment = multiSigPayments[multiSigId];
        return (
            payment.signers,
            payment.recipient,
            payment.amount,
            payment.token,
            payment.requiredSignatures,
            payment.currentSignatures,
            payment.executed,
            payment.description,
            payment.createdAt,
            payment.deadline
        );
    }
    
    /**
     * @dev 检查地址是否已签名
     */
    function hasSignedMultiSig(uint256 multiSigId, address signer) external view returns (bool) {
        return multiSigPayments[multiSigId].hasSigned[signer];
    }
    
    /**
     * @dev 创建条件支付
     */
    function createConditionalPayment(
        address recipient,
        uint256 amount,
        address token,
        ConditionType conditionType,
        uint256 conditionValue,
        address priceOracle,
        string memory description
    ) external payable nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(conditionValue > 0, "Invalid condition value");
        
        // 验证条件类型特定的要求
        if (conditionType == ConditionType.TimeBasedDelay) {
            require(conditionValue >= block.timestamp, "Delay must be in future");
        } else if (conditionType == ConditionType.TimeBasedSchedule) {
            require(conditionValue > block.timestamp, "Schedule must be in future");
        } else if (conditionType == ConditionType.PriceThreshold) {
            require(priceOracle != address(0), "Price oracle required");
        } else if (conditionType == ConditionType.BlockNumber) {
            require(conditionValue > block.number, "Block number must be in future");
        }
        
        uint256 conditionalId = nextConditionalId++;
        uint256 fee = (amount * platformFee) / 10000;
        uint256 totalAmount = amount + fee;
        
        // 锁定资金
        if (token == address(0)) {
            require(msg.value >= totalAmount, "Insufficient payment");
            
            // 退还多余的ETH
            if (msg.value > totalAmount) {
                payable(msg.sender).transfer(msg.value - totalAmount);
            }
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), totalAmount);
        }
        
        conditionalPayments[conditionalId] = ConditionalPayment({
            payer: msg.sender,
            recipient: recipient,
            amount: amount,
            token: token,
            conditionType: conditionType,
            conditionValue: conditionValue,
            priceOracle: priceOracle,
            executed: false,
            cancelled: false,
            description: description,
            createdAt: block.timestamp
        });
        
        emit ConditionalPaymentCreated(
            conditionalId,
            msg.sender,
            recipient,
            amount,
            conditionType,
            conditionValue
        );
        
        return conditionalId;
    }
    
    /**
     * @dev 执行条件支付
     */
    function executeConditionalPayment(uint256 conditionalId) external nonReentrant {
        ConditionalPayment storage payment = conditionalPayments[conditionalId];
        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment cancelled");
        require(_checkCondition(conditionalId), "Condition not met");
        
        payment.executed = true;
        
        uint256 fee = (payment.amount * platformFee) / 10000;
        
        if (payment.token == address(0)) {
            payable(payment.recipient).transfer(payment.amount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
        } else {
            IERC20(payment.token).transfer(payment.recipient, payment.amount);
            if (fee > 0) {
                IERC20(payment.token).transfer(feeRecipient, fee);
            }
        }
        
        emit ConditionalPaymentExecuted(conditionalId, payment.recipient, payment.amount);
    }
    
    /**
     * @dev 取消条件支付 (仅支付者)
     */
    function cancelConditionalPayment(uint256 conditionalId) external nonReentrant {
        ConditionalPayment storage payment = conditionalPayments[conditionalId];
        require(msg.sender == payment.payer, "Only payer can cancel");
        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment already cancelled");
        
        payment.cancelled = true;
        
        uint256 fee = (payment.amount * platformFee) / 10000;
        uint256 totalAmount = payment.amount + fee;
        
        // 退还资金给支付者
        if (payment.token == address(0)) {
            payable(payment.payer).transfer(totalAmount);
        } else {
            IERC20(payment.token).transfer(payment.payer, totalAmount);
        }
        
        emit ConditionalPaymentCancelled(conditionalId, msg.sender);
    }
    
    /**
     * @dev 检查条件是否满足
     */
    function _checkCondition(uint256 conditionalId) internal view returns (bool) {
        ConditionalPayment storage payment = conditionalPayments[conditionalId];
        
        if (payment.conditionType == ConditionType.TimeBasedDelay) {
            return block.timestamp >= payment.conditionValue;
        } else if (payment.conditionType == ConditionType.TimeBasedSchedule) {
            return block.timestamp >= payment.conditionValue;
        } else if (payment.conditionType == ConditionType.BlockNumber) {
            return block.number >= payment.conditionValue;
        } else if (payment.conditionType == ConditionType.PriceThreshold) {
            // 简化的价格检查 - 实际实现需要调用价格预言机
            // 这里假设价格预言机有一个 getPrice() 函数
            // return IPriceOracle(payment.priceOracle).getPrice() >= payment.conditionValue;
            return true; // 占位符实现
        } else if (payment.conditionType == ConditionType.Custom) {
            // 自定义条件的实现可以通过继承或其他方式扩展
            return true; // 占位符实现
        }
        
        return false;
    }
    
    /**
     * @dev 检查条件是否满足 (公开函数)
     */
    function checkCondition(uint256 conditionalId) external view returns (bool) {
        return _checkCondition(conditionalId);
    }
    
    /**
     * @dev 获取条件支付信息
     */
    function getConditionalPayment(uint256 conditionalId) external view returns (
        address payer,
        address recipient,
        uint256 amount,
        address token,
        ConditionType conditionType,
        uint256 conditionValue,
        address priceOracle,
        bool executed,
        bool cancelled,
        string memory description,
        uint256 createdAt
    ) {
        ConditionalPayment storage payment = conditionalPayments[conditionalId];
        return (
            payment.payer,
            payment.recipient,
            payment.amount,
            payment.token,
            payment.conditionType,
            payment.conditionValue,
            payment.priceOracle,
            payment.executed,
            payment.cancelled,
            payment.description,
            payment.createdAt
        );
     }
     
     /**
      * @dev 创建分割支付
      */
     function createSplitPayment(
         SplitRecipient[] memory recipients,
         uint256 totalAmount,
         address token,
         string memory description
     ) external payable nonReentrant returns (uint256) {
         require(recipients.length > 1, "Need at least 2 recipients");
         require(recipients.length <= 20, "Too many recipients");
         require(totalAmount > 0, "Invalid amount");
         
         // 验证百分比总和为100%
         uint256 totalPercentage = 0;
         for (uint256 i = 0; i < recipients.length; i++) {
             require(recipients[i].recipient != address(0), "Invalid recipient");
             require(recipients[i].percentage > 0, "Invalid percentage");
             totalPercentage += recipients[i].percentage;
         }
         require(totalPercentage == 10000, "Percentages must sum to 100%");
         
         uint256 splitId = nextSplitId++;
         uint256 fee = (totalAmount * platformFee) / 10000;
         uint256 totalWithFee = totalAmount + fee;
         
         // 锁定资金
         if (token == address(0)) {
             require(msg.value >= totalWithFee, "Insufficient payment");
             
             // 退还多余的ETH
             if (msg.value > totalWithFee) {
                 payable(msg.sender).transfer(msg.value - totalWithFee);
             }
         } else {
             IERC20(token).transferFrom(msg.sender, address(this), totalWithFee);
         }
         
         SplitPayment storage payment = splitPayments[splitId];
         payment.payer = msg.sender;
         payment.totalAmount = totalAmount;
         payment.token = token;
         payment.executed = false;
         payment.description = description;
         payment.createdAt = block.timestamp;
         
         // 复制接收者数组
         for (uint256 i = 0; i < recipients.length; i++) {
             payment.recipients.push(recipients[i]);
         }
         
         emit SplitPaymentCreated(splitId, msg.sender, totalAmount, recipients.length);
         return splitId;
     }
     
     /**
      * @dev 执行分割支付
      */
     function executeSplitPayment(uint256 splitId) external nonReentrant {
         SplitPayment storage payment = splitPayments[splitId];
         require(!payment.executed, "Payment already executed");
         
         payment.executed = true;
         
         uint256 fee = (payment.totalAmount * platformFee) / 10000;
         uint256 remainingAmount = payment.totalAmount;
         
         // 分配给每个接收者
         for (uint256 i = 0; i < payment.recipients.length; i++) {
             uint256 recipientAmount;
             
             if (i == payment.recipients.length - 1) {
                 // 最后一个接收者获得剩余金额，避免舍入误差
                 recipientAmount = remainingAmount;
             } else {
                 recipientAmount = (payment.totalAmount * payment.recipients[i].percentage) / 10000;
                 remainingAmount -= recipientAmount;
             }
             
             if (payment.token == address(0)) {
                 payable(payment.recipients[i].recipient).transfer(recipientAmount);
             } else {
                 IERC20(payment.token).transfer(payment.recipients[i].recipient, recipientAmount);
             }
         }
         
         // 支付平台费用
         if (fee > 0) {
             if (payment.token == address(0)) {
                 payable(feeRecipient).transfer(fee);
             } else {
                 IERC20(payment.token).transfer(feeRecipient, fee);
             }
         }
         
         emit SplitPaymentExecuted(splitId, payment.payer, payment.totalAmount, payment.recipients.length);
     }
     
     /**
      * @dev 获取分割支付信息
      */
     function getSplitPayment(uint256 splitId) external view returns (
         address payer,
         uint256 totalAmount,
         address token,
         bool executed,
         string memory description,
         uint256 createdAt,
         uint256 recipientCount
     ) {
         SplitPayment storage payment = splitPayments[splitId];
         return (
             payment.payer,
             payment.totalAmount,
             payment.token,
             payment.executed,
             payment.description,
             payment.createdAt,
             payment.recipients.length
         );
     }
     
     /**
      * @dev 获取分割支付的接收者信息
      */
     function getSplitRecipients(uint256 splitId) external view returns (SplitRecipient[] memory) {
         return splitPayments[splitId].recipients;
     }
     
     /**
      * @dev 计算接收者应得金额
      */
     function calculateSplitAmount(uint256 splitId, uint256 recipientIndex) external view returns (uint256) {
         SplitPayment storage payment = splitPayments[splitId];
         require(recipientIndex < payment.recipients.length, "Invalid recipient index");
         
         return (payment.totalAmount * payment.recipients[recipientIndex].percentage) / 10000;
      }
      
      /**
       * @dev 创建NFT支付订单
       */
      function createNFTPayment(
          address recipient,
          address nftContract,
          uint256 tokenId,
          uint256 price,
          address paymentToken,
          string memory description,
          uint256 deadline
      ) external payable nonReentrant returns (uint256) {
          require(recipient != address(0), "Invalid recipient");
          require(nftContract != address(0), "Invalid NFT contract");
          require(price > 0, "Invalid price");
          require(deadline > block.timestamp, "Invalid deadline");
          
          // 验证NFT存在且属于接收者
          try IERC721(nftContract).ownerOf(tokenId) returns (address owner) {
              require(owner == recipient, "NFT not owned by recipient");
          } catch {
              revert("Invalid NFT");
          }
          
          uint256 nftPaymentId = nextNFTId++;
          uint256 fee = (price * platformFee) / 10000;
          uint256 totalWithFee = price + fee;
          
          // 锁定支付资金
          if (paymentToken == address(0)) {
              require(msg.value >= totalWithFee, "Insufficient payment");
              
              // 退还多余的ETH
              if (msg.value > totalWithFee) {
                  payable(msg.sender).transfer(msg.value - totalWithFee);
              }
          } else {
              IERC20(paymentToken).transferFrom(msg.sender, address(this), totalWithFee);
          }
          
          NFTPayment storage payment = nftPayments[nftPaymentId];
          payment.payer = msg.sender;
          payment.recipient = recipient;
          payment.nftContract = nftContract;
          payment.tokenId = tokenId;
          payment.price = price;
          payment.paymentToken = paymentToken;
          payment.executed = false;
          payment.cancelled = false;
          payment.description = description;
          payment.createdAt = block.timestamp;
          payment.deadline = deadline;
          
          emit NFTPaymentCreated(nftPaymentId, msg.sender, recipient, nftContract, tokenId, price);
          return nftPaymentId;
      }
      
      /**
       * @dev 执行NFT支付（转移NFT并支付）
       */
      function executeNFTPayment(uint256 nftPaymentId) external nonReentrant {
          NFTPayment storage payment = nftPayments[nftPaymentId];
          require(!payment.executed, "Payment already executed");
          require(!payment.cancelled, "Payment cancelled");
          require(block.timestamp <= payment.deadline, "Payment expired");
          
          // 验证NFT仍然属于接收者
          require(IERC721(payment.nftContract).ownerOf(payment.tokenId) == payment.recipient, "NFT no longer owned by recipient");
          
          // 验证合约已被授权转移NFT
          require(
              IERC721(payment.nftContract).isApprovedForAll(payment.recipient, address(this)) ||
              IERC721(payment.nftContract).getApproved(payment.tokenId) == address(this),
              "Contract not approved to transfer NFT"
          );
          
          payment.executed = true;
          
          // 转移NFT给付款人
          IERC721(payment.nftContract).transferFrom(payment.recipient, payment.payer, payment.tokenId);
          
          uint256 fee = (payment.price * platformFee) / 10000;
          uint256 recipientAmount = payment.price;
          
          // 支付给NFT卖家
          if (payment.paymentToken == address(0)) {
              payable(payment.recipient).transfer(recipientAmount);
              if (fee > 0) {
                  payable(feeRecipient).transfer(fee);
              }
          } else {
              IERC20(payment.paymentToken).transfer(payment.recipient, recipientAmount);
              if (fee > 0) {
                  IERC20(payment.paymentToken).transfer(feeRecipient, fee);
              }
          }
          
          emit NFTPaymentExecuted(nftPaymentId, payment.payer, payment.recipient, payment.nftContract, payment.tokenId);
      }
      
      /**
       * @dev 取消NFT支付并退款
       */
      function cancelNFTPayment(uint256 nftPaymentId) external nonReentrant {
          NFTPayment storage payment = nftPayments[nftPaymentId];
          require(!payment.executed, "Payment already executed");
          require(!payment.cancelled, "Payment already cancelled");
          require(
              msg.sender == payment.payer || 
              msg.sender == payment.recipient || 
              block.timestamp > payment.deadline,
              "Not authorized to cancel"
          );
          
          payment.cancelled = true;
          
          uint256 fee = (payment.price * platformFee) / 10000;
          uint256 refundAmount = payment.price + fee;
          
          // 退款给付款人
          if (payment.paymentToken == address(0)) {
              payable(payment.payer).transfer(refundAmount);
          } else {
              IERC20(payment.paymentToken).transfer(payment.payer, refundAmount);
          }
          
          emit NFTPaymentCancelled(nftPaymentId, msg.sender);
      }
      
      /**
       * @dev 获取NFT支付信息
       */
      function getNFTPayment(uint256 nftPaymentId) external view returns (
          address payer,
          address recipient,
          address nftContract,
          uint256 tokenId,
          uint256 price,
          address paymentToken,
          bool executed,
          bool cancelled,
          string memory description,
          uint256 createdAt,
          uint256 deadline
      ) {
          NFTPayment storage payment = nftPayments[nftPaymentId];
          return (
              payment.payer,
              payment.recipient,
              payment.nftContract,
              payment.tokenId,
              payment.price,
              payment.paymentToken,
              payment.executed,
              payment.cancelled,
              payment.description,
              payment.createdAt,
              payment.deadline
          );
      }
      
      /**
       * @dev 检查NFT支付是否可以执行
       */
      function canExecuteNFTPayment(uint256 nftPaymentId) external view returns (bool) {
          NFTPayment storage payment = nftPayments[nftPaymentId];
          
          if (payment.executed || payment.cancelled || block.timestamp > payment.deadline) {
              return false;
          }
          
          // 检查NFT所有权
          try IERC721(payment.nftContract).ownerOf(payment.tokenId) returns (address owner) {
              if (owner != payment.recipient) {
                  return false;
              }
          } catch {
              return false;
          }
          
          // 检查授权
          try IERC721(payment.nftContract).isApprovedForAll(payment.recipient, address(this)) returns (bool approvedForAll) {
              if (approvedForAll) {
                  return true;
              }
          } catch {
              // 继续检查单个代币授权
          }
          
          try IERC721(payment.nftContract).getApproved(payment.tokenId) returns (address approved) {
              return approved == address(this);
          } catch {
              return false;
           }
       }
       
       /**
        * @dev 请求退款
        */
       function requestRefund(
           uint256 paymentId,
           PaymentType paymentType,
           string memory reason
       ) external returns (uint256) {
           require(bytes(reason).length > 0, "Reason required");
           
           // 验证请求者有权限申请退款
           require(_canRequestRefund(paymentId, paymentType, msg.sender), "Not authorized to request refund");
           
           uint256 refundId = nextRefundId++;
           
           RefundRequest storage request = refundRequests[refundId];
           request.paymentId = paymentId;
           request.paymentType = paymentType;
           request.requester = msg.sender;
           request.reason = reason;
           request.approved = false;
           request.processed = false;
           request.createdAt = block.timestamp;
           
           emit RefundRequested(refundId, paymentId, paymentType, msg.sender, reason);
           return refundId;
       }
       
       /**
        * @dev 批准退款请求
        */
       function approveRefund(uint256 refundId) external {
           RefundRequest storage request = refundRequests[refundId];
           require(!request.processed, "Refund already processed");
           require(_canApproveRefund(request.paymentId, request.paymentType, msg.sender), "Not authorized to approve");
           
           request.approved = true;
           request.approver = msg.sender;
           
           emit RefundApproved(refundId, msg.sender);
       }
       
       /**
        * @dev 处理退款
        */
       function processRefund(uint256 refundId) external nonReentrant {
           RefundRequest storage request = refundRequests[refundId];
           require(request.approved, "Refund not approved");
           require(!request.processed, "Refund already processed");
           
           request.processed = true;
           request.processedAt = block.timestamp;
           
           (address recipient, uint256 amount, address token) = _getRefundDetails(request.paymentId, request.paymentType);
           require(recipient != address(0), "Invalid refund recipient");
           require(amount > 0, "Invalid refund amount");
           
           // 执行退款
           if (token == address(0)) {
               payable(recipient).transfer(amount);
           } else {
               IERC20(token).transfer(recipient, amount);
           }
           
           emit RefundProcessed(refundId, request.paymentId, recipient, amount);
       }
       
       /**
        * @dev 启用自动退款
        */
       function enableAutoRefund(uint256 paymentId, PaymentType paymentType, uint256 deadline) external {
           require(_canManageAutoRefund(paymentId, paymentType, msg.sender), "Not authorized");
           require(deadline > block.timestamp, "Invalid deadline");
           
           uint256 key = _getPaymentKey(paymentId, paymentType);
           autoRefundEnabled[key] = true;
           refundDeadlines[key] = deadline;
       }
       
       /**
        * @dev 执行自动退款
        */
       function executeAutoRefund(uint256 paymentId, PaymentType paymentType) external nonReentrant {
           uint256 key = _getPaymentKey(paymentId, paymentType);
           require(autoRefundEnabled[key], "Auto refund not enabled");
           require(block.timestamp >= refundDeadlines[key], "Deadline not reached");
           
           autoRefundEnabled[key] = false; // 防止重复执行
           
           (address recipient, uint256 amount, address token) = _getRefundDetails(paymentId, paymentType);
           require(recipient != address(0), "Invalid refund recipient");
           require(amount > 0, "Invalid refund amount");
           
           // 执行自动退款
           if (token == address(0)) {
               payable(recipient).transfer(amount);
           } else {
               IERC20(token).transfer(recipient, amount);
           }
           
           emit AutoRefundExecuted(paymentId, paymentType, recipient, amount);
       }
       
       /**
        * @dev 检查是否可以申请退款
        */
       function _canRequestRefund(uint256 paymentId, PaymentType paymentType, address requester) internal view returns (bool) {
           if (paymentType == PaymentType.REGULAR) {
               Payment storage payment = payments[paymentId];
               return requester == payment.payer || requester == payment.recipient;
           } else if (paymentType == PaymentType.ESCROW) {
               EscrowPayment storage escrow = escrowPayments[paymentId];
               return requester == escrow.payer || requester == escrow.recipient;
           } else if (paymentType == PaymentType.MULTISIG) {
               MultiSigPayment storage multiSig = multiSigPayments[paymentId];
               return requester == multiSig.recipient || _isMultiSigSigner(paymentId, requester);
           } else if (paymentType == PaymentType.CONDITIONAL) {
               ConditionalPayment storage conditional = conditionalPayments[paymentId];
               return requester == conditional.payer || requester == conditional.recipient;
           } else if (paymentType == PaymentType.SPLIT) {
               SplitPayment storage split = splitPayments[paymentId];
               return requester == split.payer;
           } else if (paymentType == PaymentType.NFT) {
               NFTPayment storage nft = nftPayments[paymentId];
               return requester == nft.payer || requester == nft.recipient;
           }
           return false;
       }
       
       /**
        * @dev 检查是否可以批准退款
        */
       function _canApproveRefund(uint256 paymentId, PaymentType paymentType, address approver) internal view returns (bool) {
           if (paymentType == PaymentType.ESCROW) {
               EscrowPayment storage escrow = escrowPayments[paymentId];
               return approver == escrow.arbiter;
           }
           // 对于其他类型，合约所有者可以批准
           return approver == owner();
       }
       
       /**
        * @dev 获取退款详情
        */
       function _getRefundDetails(uint256 paymentId, PaymentType paymentType) internal view returns (address recipient, uint256 amount, address token) {
           if (paymentType == PaymentType.REGULAR) {
               Payment storage payment = payments[paymentId];
               return (payment.payer, payment.amount, payment.token);
           } else if (paymentType == PaymentType.ESCROW) {
               EscrowPayment storage escrow = escrowPayments[paymentId];
               return (escrow.payer, escrow.amount, escrow.token);
           } else if (paymentType == PaymentType.CONDITIONAL) {
               ConditionalPayment storage conditional = conditionalPayments[paymentId];
               return (conditional.payer, conditional.amount, conditional.token);
           } else if (paymentType == PaymentType.NFT) {
               NFTPayment storage nft = nftPayments[paymentId];
               uint256 fee = (nft.price * platformFee) / 10000;
               return (nft.payer, nft.price + fee, nft.paymentToken);
           }
           return (address(0), 0, address(0));
       }
       
       /**
        * @dev 检查是否可以管理自动退款
        */
       function _canManageAutoRefund(uint256 paymentId, PaymentType paymentType, address manager) internal view returns (bool) {
           if (paymentType == PaymentType.REGULAR) {
               Payment storage payment = payments[paymentId];
               return manager == payment.payer;
           } else if (paymentType == PaymentType.CONDITIONAL) {
               ConditionalPayment storage conditional = conditionalPayments[paymentId];
               return manager == conditional.payer;
           } else if (paymentType == PaymentType.NFT) {
               NFTPayment storage nft = nftPayments[paymentId];
               return manager == nft.payer;
           }
           return false;
       }
       
       /**
        * @dev 生成支付键值
        */
       function _getPaymentKey(uint256 paymentId, PaymentType paymentType) internal pure returns (uint256) {
           return uint256(keccak256(abi.encodePacked(paymentId, paymentType)));
       }
       
       /**
        * @dev 检查是否为多签签名者
        */
       function _isMultiSigSigner(uint256 multiSigId, address signer) internal view returns (bool) {
           MultiSigPayment storage payment = multiSigPayments[multiSigId];
           for (uint256 i = 0; i < payment.signers.length; i++) {
               if (payment.signers[i] == signer) {
                   return true;
               }
           }
           return false;
       }
       
       /**
        * @dev 获取退款请求信息
        */
       function getRefundRequest(uint256 refundId) external view returns (
           uint256 paymentId,
           PaymentType paymentType,
           address requester,
           string memory reason,
           bool approved,
           bool processed,
           uint256 createdAt,
           uint256 processedAt,
           address approver
       ) {
           RefundRequest storage request = refundRequests[refundId];
           return (
               request.paymentId,
               request.paymentType,
               request.requester,
               request.reason,
               request.approved,
               request.processed,
               request.createdAt,
               request.processedAt,
               request.approver
           );
        }
        
        /**
         * @dev 更新支付分析数据
         */
        function _updateAnalytics(
            address payer,
            uint256 amount,
            address token,
            PaymentType paymentType,
            bool success
        ) internal {
            uint256 fee = (amount * platformFee) / 10000;
            uint256 today = block.timestamp / 86400; // 获取今天的日期
            
            // 更新全局统计
            analytics.totalPayments++;
            if (success) {
                analytics.successfulPayments++;
                analytics.totalVolume += amount;
                analytics.totalFees += fee;
                analytics.tokenVolumes[token] += amount;
                analytics.typeVolumes[paymentType] += amount;
            } else {
                analytics.failedPayments++;
            }
            analytics.userPayments[payer]++;
            
            // 更新每日统计
            dailyAnalytics[today].totalPayments++;
            if (success) {
                dailyAnalytics[today].successfulPayments++;
                dailyAnalytics[today].totalVolume += amount;
                dailyAnalytics[today].totalFees += fee;
                dailyAnalytics[today].tokenVolumes[token] += amount;
                dailyAnalytics[today].typeVolumes[paymentType] += amount;
            } else {
                dailyAnalytics[today].failedPayments++;
            }
            dailyAnalytics[today].userPayments[payer]++;
            
            // 更新用户统计
            userAnalytics[payer].totalPayments++;
            if (success) {
                userAnalytics[payer].successfulPayments++;
                userAnalytics[payer].totalVolume += amount;
                userAnalytics[payer].totalFees += fee;
                userAnalytics[payer].tokenVolumes[token] += amount;
                userAnalytics[payer].typeVolumes[paymentType] += amount;
            } else {
                userAnalytics[payer].failedPayments++;
            }
            
            emit PaymentAnalyticsUpdated(analytics.totalPayments, analytics.totalVolume, analytics.totalFees);
            emit DailyAnalyticsUpdated(today, dailyAnalytics[today].totalPayments, dailyAnalytics[today].totalVolume);
        }
        
        /**
         * @dev 更新退款统计
         */
        function _updateRefundAnalytics(address user, uint256 amount, address token) internal {
            uint256 today = block.timestamp / 86400;
            
            analytics.refundedPayments++;
            dailyAnalytics[today].refundedPayments++;
            userAnalytics[user].refundedPayments++;
        }
        
        /**
         * @dev 获取全局分析数据
         */
        function getGlobalAnalytics() external view returns (
            uint256 totalPayments,
            uint256 totalVolume,
            uint256 totalFees,
            uint256 successfulPayments,
            uint256 failedPayments,
            uint256 refundedPayments
        ) {
            return (
                analytics.totalPayments,
                analytics.totalVolume,
                analytics.totalFees,
                analytics.successfulPayments,
                analytics.failedPayments,
                analytics.refundedPayments
            );
        }
        
        /**
         * @dev 获取每日分析数据
         */
        function getDailyAnalytics(uint256 date) external view returns (
            uint256 totalPayments,
            uint256 totalVolume,
            uint256 totalFees,
            uint256 successfulPayments,
            uint256 failedPayments,
            uint256 refundedPayments
        ) {
            PaymentAnalytics storage daily = dailyAnalytics[date];
            return (
                daily.totalPayments,
                daily.totalVolume,
                daily.totalFees,
                daily.successfulPayments,
                daily.failedPayments,
                daily.refundedPayments
            );
        }
        
        /**
         * @dev 获取用户分析数据
         */
        function getUserAnalytics(address user) external view returns (
            uint256 totalPayments,
            uint256 totalVolume,
            uint256 totalFees,
            uint256 successfulPayments,
            uint256 failedPayments,
            uint256 refundedPayments
        ) {
            PaymentAnalytics storage userStats = userAnalytics[user];
            return (
                userStats.totalPayments,
                userStats.totalVolume,
                userStats.totalFees,
                userStats.successfulPayments,
                userStats.failedPayments,
                userStats.refundedPayments
            );
        }
        
        /**
         * @dev 获取代币交易量
         */
        function getTokenVolume(address token) external view returns (uint256) {
            return analytics.tokenVolumes[token];
        }
        
        /**
         * @dev 获取每日代币交易量
         */
        function getDailyTokenVolume(uint256 date, address token) external view returns (uint256) {
            return dailyAnalytics[date].tokenVolumes[token];
        }
        
        /**
         * @dev 获取用户代币交易量
         */
        function getUserTokenVolume(address user, address token) external view returns (uint256) {
            return userAnalytics[user].tokenVolumes[token];
        }
        
        /**
         * @dev 获取支付类型交易量
         */
        function getPaymentTypeVolume(PaymentType paymentType) external view returns (uint256) {
            return analytics.typeVolumes[paymentType];
        }
        
        /**
         * @dev 获取每日支付类型交易量
         */
        function getDailyPaymentTypeVolume(uint256 date, PaymentType paymentType) external view returns (uint256) {
            return dailyAnalytics[date].typeVolumes[paymentType];
        }
        
        /**
         * @dev 获取用户支付类型交易量
         */
        function getUserPaymentTypeVolume(address user, PaymentType paymentType) external view returns (uint256) {
            return userAnalytics[user].typeVolumes[paymentType];
        }
        
        /**
         * @dev 获取成功率
         */
        function getSuccessRate() external view returns (uint256) {
            if (analytics.totalPayments == 0) return 0;
            return (analytics.successfulPayments * 10000) / analytics.totalPayments; // 返回基点
        }
        
        /**
         * @dev 获取每日成功率
         */
        function getDailySuccessRate(uint256 date) external view returns (uint256) {
            PaymentAnalytics storage daily = dailyAnalytics[date];
            if (daily.totalPayments == 0) return 0;
            return (daily.successfulPayments * 10000) / daily.totalPayments;
        }
        
        /**
         * @dev 获取用户成功率
         */
        function getUserSuccessRate(address user) external view returns (uint256) {
            PaymentAnalytics storage userStats = userAnalytics[user];
            if (userStats.totalPayments == 0) return 0;
            return (userStats.successfulPayments * 10000) / userStats.totalPayments;
        }
        
        /**
         * @dev 获取平均交易金额
         */
        function getAveragePaymentAmount() external view returns (uint256) {
            if (analytics.successfulPayments == 0) return 0;
            return analytics.totalVolume / analytics.successfulPayments;
        }
        
        /**
         * @dev 获取每日平均交易金额
         */
        function getDailyAveragePaymentAmount(uint256 date) external view returns (uint256) {
            PaymentAnalytics storage daily = dailyAnalytics[date];
            if (daily.successfulPayments == 0) return 0;
            return daily.totalVolume / daily.successfulPayments;
        }
        
        /**
         * @dev 获取用户平均交易金额
         */
        function getUserAveragePaymentAmount(address user) external view returns (uint256) {
            PaymentAnalytics storage userStats = userAnalytics[user];
            if (userStats.successfulPayments == 0) return 0;
            return userStats.totalVolume / userStats.successfulPayments;
        }

    // ==================== 第三方合约支付功能 ====================
    
    /**
     * @dev 创建第三方合约支付
     */
    function createCustomContractPayment(
        address recipient,
        uint256 amount,
        address token,
        address targetContract,
        bytes calldata callData,
        bytes calldata expectedReturn,
        bool requiresReturn,
        uint256 gasLimit,
        uint256 deadline,
        string memory description
    ) external payable nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(targetContract != address(0), "Invalid target contract");
        require(whitelistedContracts[targetContract], "Contract not whitelisted");
        require(gasLimit <= maxGasLimit, "Gas limit too high");
        require(deadline > block.timestamp, "Invalid deadline");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 fee = (amount * platformFee) / 10000;
        uint256 totalWithFee = amount + fee;
        
        if (token == address(0)) {
            require(msg.value >= totalWithFee, "Insufficient ETH sent");
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), totalWithFee);
        }
        
        uint256 customContractId = nextCustomContractId++;
        
        CustomContractPayment storage payment = customContractPayments[customContractId];
        payment.payer = msg.sender;
        payment.recipient = recipient;
        payment.amount = amount;
        payment.token = token;
        payment.targetContract = targetContract;
        payment.callData = callData;
        payment.expectedReturn = expectedReturn;
        payment.requiresReturn = requiresReturn;
        payment.gasLimit = gasLimit;
        payment.executed = false;
        payment.cancelled = false;
        payment.description = description;
        payment.createdAt = block.timestamp;
        payment.deadline = deadline;
        
        emit CustomContractPaymentCreated(
            customContractId,
            msg.sender,
            recipient,
            targetContract,
            amount,
            token
        );
        
        return customContractId;
    }
    
    /**
     * @dev 执行第三方合约支付
     */
    function executeCustomContractPayment(uint256 customContractId) external nonReentrant {
        CustomContractPayment storage payment = customContractPayments[customContractId];
        
        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment cancelled");
        require(block.timestamp <= payment.deadline, "Payment expired");
        
        // 执行第三方合约调用
        bool success;
        bytes memory returnData;
        
        (success, returnData) = payment.targetContract.call{gas: payment.gasLimit}(payment.callData);
        
        // 验证返回值（如果需要）
        if (payment.requiresReturn && success) {
            require(keccak256(returnData) == keccak256(payment.expectedReturn), "Return value mismatch");
        }
        
        if (success) {
            // 执行支付
            uint256 fee = (payment.amount * platformFee) / 10000;
            
            if (payment.token == address(0)) {
                payable(payment.recipient).transfer(payment.amount);
                if (fee > 0) {
                    payable(feeRecipient).transfer(fee);
                }
            } else {
                IERC20(payment.token).transfer(payment.recipient, payment.amount);
                if (fee > 0) {
                    IERC20(payment.token).transfer(feeRecipient, fee);
                }
            }
            
            payment.executed = true;
            
            // 更新分析数据
            _updateAnalytics(payment.amount, fee, PaymentType.CUSTOM_CONTRACT, payment.payer, true);
        }
        
        emit CustomContractPaymentExecuted(
            customContractId,
            payment.payer,
            payment.recipient,
            payment.targetContract,
            payment.amount,
            success
        );
        
        if (!success) {
            // 如果调用失败，退款给付款人
            _refundCustomContractPayment(customContractId);
        }
    }
    
    /**
     * @dev 取消第三方合约支付
     */
    function cancelCustomContractPayment(uint256 customContractId) external nonReentrant {
        CustomContractPayment storage payment = customContractPayments[customContractId];
        
        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment already cancelled");
        require(
            msg.sender == payment.payer || 
            msg.sender == owner() || 
            block.timestamp > payment.deadline,
            "Not authorized to cancel"
        );
        
        payment.cancelled = true;
        
        // 退款
        _refundCustomContractPayment(customContractId);
        
        emit CustomContractPaymentCancelled(customContractId, msg.sender);
    }
    
    /**
     * @dev 内部退款函数
     */
    function _refundCustomContractPayment(uint256 customContractId) internal {
        CustomContractPayment storage payment = customContractPayments[customContractId];
        
        uint256 fee = (payment.amount * platformFee) / 10000;
        uint256 totalAmount = payment.amount + fee;
        
        if (payment.token == address(0)) {
            payable(payment.payer).transfer(totalAmount);
        } else {
            IERC20(payment.token).transfer(payment.payer, totalAmount);
        }
    }
    
    /**
     * @dev 添加合约到白名单
     */
    function whitelistContract(address contractAddress, bool whitelisted) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        whitelistedContracts[contractAddress] = whitelisted;
        emit ContractWhitelisted(contractAddress, whitelisted);
    }
    
    /**
     * @dev 设置最大 Gas 限制
     */
    function setMaxGasLimit(uint256 _maxGasLimit) external onlyOwner {
        require(_maxGasLimit > 0, "Invalid gas limit");
        maxGasLimit = _maxGasLimit;
    }
    
    /**
     * @dev 检查合约是否在白名单中
     */
    function isContractWhitelisted(address contractAddress) external view returns (bool) {
        return whitelistedContracts[contractAddress];
    }
    
    /**
     * @dev 获取第三方合约支付信息
     */
    function getCustomContractPayment(uint256 customContractId) external view returns (
        address payer,
        address recipient,
        uint256 amount,
        address token,
        address targetContract,
        bytes memory callData,
        bytes memory expectedReturn,
        bool requiresReturn,
        uint256 gasLimit,
        bool executed,
        bool cancelled,
        string memory description,
        uint256 createdAt,
        uint256 deadline
    ) {
        CustomContractPayment storage payment = customContractPayments[customContractId];
        return (
            payment.payer,
            payment.recipient,
            payment.amount,
            payment.token,
            payment.targetContract,
            payment.callData,
            payment.expectedReturn,
            payment.requiresReturn,
            payment.gasLimit,
            payment.executed,
            payment.cancelled,
            payment.description,
            payment.createdAt,
            payment.deadline
        );
    }
    
    /**
     * @dev 检查第三方合约支付是否可以执行
     */
    function canExecuteCustomContractPayment(uint256 customContractId) external view returns (bool) {
        CustomContractPayment storage payment = customContractPayments[customContractId];
        
        if (payment.executed || payment.cancelled) {
            return false;
        }
        
        if (block.timestamp > payment.deadline) {
            return false;
        }
        
        return true;
    }

    // 接收原生代币
    receive() external payable {}
}