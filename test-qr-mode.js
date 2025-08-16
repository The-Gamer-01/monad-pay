// 测试二维码模式修复
const fs = require('fs');

// 模拟链接数据
const mockLinkData = {
  web: "http://localhost:3000/pay?type=regular&to=0xF401F99D78BDDF2b8C22c078dBeFB2Fb758f6b46&amount=0.02&token=MON",
  metamask: "https://metamask.app.link/send/0xF401F99D78BDDF2b8C22c078dBeFB2Fb758f6b46@10143?value=20000000000000000",
  universal: "https://metamask.app.link/dapp/http://localhost:3000/pay?type=regular&to=0xF401F99D78BDDF2b8C22c078dBeFB2Fb758f6b46&amount=0.02&token=MON",
  monadpay: "monadpay://send?to=0xF401F99D78BDDF2b8C22c078dBeFB2Fb758f6b46&amount=0.02&token=MON&label=coffee",
  params: {
    type: "regular",
    to: "0xF401F99D78BDDF2b8C22c078dBeFB2Fb758f6b46",
    amount: "0.02",
    token: "MON"
  }
};

// 模拟 QRCodeDisplay 的解析逻辑
function parseQRLink(link, useWalletConnect) {
  let qrCodeLink = link;
  
  try {
    const linkDataObj = JSON.parse(link);
    // 传统二维码使用 HTTP 链接，WalletConnect 使用深度链接
    if (useWalletConnect && linkDataObj.monadpay) {
      qrCodeLink = linkDataObj.monadpay; // WalletConnect 模式使用 monadpay:// 深度链接
    } else if (linkDataObj.web) {
      qrCodeLink = linkDataObj.web; // 传统二维码使用 HTTP 链接
    }
  } catch (error) {
    console.log('解析失败，使用原链接');
  }
  
  return qrCodeLink;
}

// 模拟复制功能
function getCopyLink(link, useWalletConnect) {
  let copyLink = link;
  
  try {
    const linkDataObj = JSON.parse(link);
    // 传统模式复制 HTTP 链接，WalletConnect 模式复制深度链接
    if (useWalletConnect && linkDataObj.monadpay) {
      copyLink = linkDataObj.monadpay;
    } else if (linkDataObj.web) {
      copyLink = linkDataObj.web;
    }
  } catch (error) {
    // 如果不是 JSON，直接使用原链接
  }
  
  return copyLink;
}

const jsonString = JSON.stringify(mockLinkData);

console.log('=== 二维码模式测试 ===');
console.log('\n原始链接数据:');
console.log(JSON.stringify(mockLinkData, null, 2));

console.log('\n1. 传统二维码模式 (useWalletConnect = false):');
const traditionalQR = parseQRLink(jsonString, false);
const traditionalCopy = getCopyLink(jsonString, false);
console.log('二维码链接:', traditionalQR);
console.log('复制链接:', traditionalCopy);
console.log('✓ 使用 HTTP 协议:', traditionalQR.startsWith('http://'));

console.log('\n2. WalletConnect 模式 (useWalletConnect = true):');
const walletConnectQR = parseQRLink(jsonString, true);
const walletConnectCopy = getCopyLink(jsonString, true);
console.log('二维码链接:', walletConnectQR);
console.log('复制链接:', walletConnectCopy);
console.log('✓ 使用 monadpay 协议:', walletConnectQR.startsWith('monadpay://'));

console.log('\n=== 验证结果 ===');
console.log('✓ 传统模式使用 HTTP:', traditionalQR.startsWith('http://') && traditionalCopy.startsWith('http://'));
console.log('✓ WalletConnect 模式使用深度链接:', walletConnectQR.startsWith('monadpay://') && walletConnectCopy.startsWith('monadpay://'));
console.log('\n=== 测试完成 ===');