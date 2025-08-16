// 测试传统二维码优化 - 验证只使用 URL

// 模拟用户提供的 JSON 数据
const linkData = {
  "web": "http://localhost:3000/pay?type=regular&to=0x836047a99e11F376522B447bffb6e3495Dd0637c&amount=1&token=MON",
  "monadpay": "monadpay://send?type=regular&to=0x836047a99e11F376522B447bffb6e3495Dd0637c&amount=1&token=MON",
  "metamask": "https://metamask.app.link/send/0x836047a99e11F376522B447bffb6e3495Dd0637c@10143?value=1000000000000000000",
  "universal": "https://metamask.app.link/dapp/http://localhost:3000/pay?type=regular&to=0x836047a99e11F376522B447bffb6e3495Dd0637c&amount=1&token=MON",
  "params": {
    "type": "regular",
    "to": "0x836047a99e11F376522B447bffb6e3495Dd0637c",
    "amount": "1",
    "token": "MON"
  }
};

// 模拟 QRCodeDisplay 的处理逻辑
function processQRCodeLink(link, useWalletConnect = false) {
  let qrCodeLink = link;
  let copyLink = link;
  let parsedData = null;
  
  if (link) {
    try {
      const linkDataObj = JSON.parse(link);
      
      if (useWalletConnect && linkDataObj.monadpay) {
        // WalletConnect 模式使用 monadpay:// 深度链接
        qrCodeLink = linkDataObj.monadpay;
        copyLink = linkDataObj.monadpay;
      } else if (linkDataObj.web) {
        // 传统二维码模式直接使用 web URL
        qrCodeLink = linkDataObj.web;
        copyLink = linkDataObj.web;
      }
      
      // 从参数中提取数据用于显示
      if (linkDataObj.params) {
        parsedData = linkDataObj.params;
      }
    } catch (error) {
      console.error('解析链接失败:', error);
    }
  }
  
  return { qrCodeLink, copyLink, parsedData };
}

// 测试传统二维码模式
console.log('=== 传统二维码模式测试 ===');
const traditionalResult = processQRCodeLink(JSON.stringify(linkData), false);
console.log('二维码链接:', traditionalResult.qrCodeLink);
console.log('复制链接:', traditionalResult.copyLink);
console.log('解析数据:', traditionalResult.parsedData);
console.log('是否为 URL 格式:', traditionalResult.qrCodeLink.startsWith('http'));
console.log('是否包含正确参数:', traditionalResult.qrCodeLink.includes('to=0x836047a99e11F376522B447bffb6e3495Dd0637c'));

// 测试 WalletConnect 模式
console.log('\n=== WalletConnect 模式测试 ===');
const walletConnectResult = processQRCodeLink(JSON.stringify(linkData), true);
console.log('二维码链接:', walletConnectResult.qrCodeLink);
console.log('复制链接:', walletConnectResult.copyLink);
console.log('解析数据:', walletConnectResult.parsedData);
console.log('是否为深度链接格式:', walletConnectResult.qrCodeLink.startsWith('monadpay://'));
console.log('是否包含正确参数:', walletConnectResult.qrCodeLink.includes('to=0x836047a99e11F376522B447bffb6e3495Dd0637c'));

// 验证结果
console.log('\n=== 验证结果 ===');
const traditionalIsUrl = traditionalResult.qrCodeLink.startsWith('http');
const walletConnectIsDeepLink = walletConnectResult.qrCodeLink.startsWith('monadpay://');

if (traditionalIsUrl && walletConnectIsDeepLink) {
  console.log('✅ 测试通过: 传统二维码使用 URL，WalletConnect 使用深度链接');
} else {
  console.log('❌ 测试失败:');
  if (!traditionalIsUrl) {
    console.log('  - 传统二维码应该使用 URL 格式');
  }
  if (!walletConnectIsDeepLink) {
    console.log('  - WalletConnect 应该使用深度链接格式');
  }
}