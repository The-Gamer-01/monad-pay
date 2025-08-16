// 测试深度链接格式是否符合规范
const fs = require('fs');
const path = require('path');

// 读取 WalletConnectDeepLink.tsx 文件
const walletConnectFile = fs.readFileSync(
  path.join(__dirname, 'src/components/WalletConnectDeepLink.tsx'),
  'utf8'
);

// 读取 walletDetection.ts 文件
const walletDetectionFile = fs.readFileSync(
  path.join(__dirname, 'src/utils/walletDetection.ts'),
  'utf8'
);

console.log('🔍 检查深度链接格式...');

// 检查 WalletConnectDeepLink.tsx
if (walletConnectFile.includes('monadpay://send?')) {
  console.log('✅ WalletConnectDeepLink.tsx: 使用正确的 monadpay://send? 格式');
} else if (walletConnectFile.includes('monadpay://pay?')) {
  console.log('❌ WalletConnectDeepLink.tsx: 仍在使用错误的 monadpay://pay? 格式');
} else {
  console.log('⚠️  WalletConnectDeepLink.tsx: 未找到 monadpay:// 协议');
}

// 检查 walletDetection.ts
if (walletDetectionFile.includes('monadpay://send')) {
  console.log('✅ walletDetection.ts: 使用正确的 monadpay://send 格式');
} else if (walletDetectionFile.includes('monadpay://pay')) {
  console.log('❌ walletDetection.ts: 仍在使用错误的 monadpay://pay 格式');
} else {
  console.log('⚠️  walletDetection.ts: 未找到 monadpay:// 协议');
}

// 模拟生成深度链接
const testParams = {
  to: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
  amount: '5',
  token: '0x5843...',
  label: 'coffee'
};

const expectedFormat = `monadpay://send?to=${testParams.to}&amount=${testParams.amount}&token=${testParams.token}&label=${testParams.label}`;

console.log('\n📋 期望的深度链接格式:');
console.log(expectedFormat);

console.log('\n🎯 格式验证完成!');