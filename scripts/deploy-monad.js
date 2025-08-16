const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 开始部署 MonadPay 到 Monad 网络...");
  
  // 获取部署者账户
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ 没有找到可用的签名者账户。请检查 PRIVATE_KEY 环境变量是否正确配置。");
  }
  
  const [deployer] = signers;
  console.log("📝 部署账户:", deployer.address);
  
  // 检查账户余额
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "MON");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  警告: 账户余额较低，可能无法完成部署");
  }
  
  // 部署 MonadPay 合约
  console.log("📦 部署 MonadPay 合约...");
  const MonadPay = await ethers.getContractFactory("MonadPay");
  
  // 部署合约 (使用费用接收者地址)
  console.log("🔨 开始部署合约...");
  
  // 设置 Gas 参数 (使用 EIP-1559 格式)
  const maxFeePerGas = ethers.parseUnits("100", "gwei"); // 100 Gwei
  const maxPriorityFeePerGas = ethers.parseUnits("50", "gwei"); // 50 Gwei
  const gasLimit = 8000000; // 8M gas limit
  
  const monadPay = await MonadPay.deploy(deployer.address, {
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    gasLimit: gasLimit
  });
  
  console.log("⏳ 等待合约部署确认...");
  await monadPay.waitForDeployment();
  
  console.log("✅ MonadPay 合约部署成功!");
  const contractAddress = await monadPay.getAddress();
  console.log("📍 合约地址:", contractAddress);
  console.log("🔗 交易哈希:", monadPay.deploymentTransaction().hash);
  
  // 等待更多确认
  console.log("⏳ 等待区块确认...");
  const receipt = await monadPay.deploymentTransaction().wait(3);
  console.log("📊 Gas 使用量:", receipt.gasUsed.toString());
  console.log("🧱 区块号:", receipt.blockNumber);
  
  // 验证合约 (如果支持)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("🔍 尝试验证合约...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ 合约验证成功!");
    } catch (error) {
      console.log("❌ 合约验证失败:", error.message);
      console.log("💡 你可以稍后手动验证合约");
    }
  }
  
  // 测试基本功能
  console.log("🧪 测试基本合约功能...");
  try {
    // 测试合约所有者
    const owner = await monadPay.owner();
    console.log("👤 合约所有者:", owner);
    
    // 测试一些基本状态
    const nextSubscriptionId = await monadPay.nextSubscriptionId();
    console.log("🔢 下一个订阅 ID:", nextSubscriptionId.toString());
    
    console.log("✅ 基本功能测试通过!");
  } catch (error) {
    console.error("❌ 基本功能测试失败:", error.message);
  }
  
  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractName: "MonadPay",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: monadPay.deploymentTransaction().hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: receipt.gasPrice?.toString() || 'N/A',
    deploymentCost: ethers.formatEther(
      (receipt.gasUsed * (receipt.gasPrice || 0n)).toString()
    ),
    timestamp: new Date().toISOString(),
    compiler: {
      version: "0.8.19",
      optimizer: true,
      runs: 200
    }
  };
  
  const deploymentFile = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📄 部署信息已保存到:", deploymentFile);
  
  // 显示后续步骤
  console.log("\n🎉 部署完成!");
  console.log("\n📋 后续步骤:");
  console.log("1. 更新前端配置文件中的合约地址");
  console.log("2. 在区块浏览器中验证合约 (如果自动验证失败)");
  console.log("3. 测试合约功能");
  console.log("4. 配置前端连接到 Monad 网络");
  
  console.log("\n🔗 有用的链接:");
  console.log(`📍 合约地址: ${contractAddress}`);
  if (network.name === 'monadTestnet') {
    console.log(`🔍 区块浏览器: https://testnet-explorer.monad.xyz/address/${contractAddress}`);
  }
  console.log(`💰 部署成本: ${deploymentInfo.deploymentCost} MON`);
}

// 错误处理
main()
  .then(() => {
    console.log("\n🎊 部署脚本执行完成!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 部署失败:");
    console.error(error);
    
    // 提供故障排除建议
    console.log("\n🔧 故障排除建议:");
    console.log("1. 检查账户余额是否足够");
    console.log("2. 验证私钥配置是否正确");
    console.log("3. 确认网络连接正常");
    console.log("4. 检查 RPC 端点是否可用");
    
    process.exit(1);
  });