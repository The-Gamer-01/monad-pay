// 测试深度链接修复
const fs = require('fs');
const path = require('path');

// 模拟 AdvancedLinkGenerator 的输出
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

console.log('=== 深度链接修复测试 ===');
console.log('\n1. 生成的链接数据:');
console.log(JSON.stringify(mockLinkData, null, 2));

// 模拟 QRCodeDisplay 的解析逻辑
function parseLink(link) {
  let qrCodeLink = link;
  let parsedData = null;
  
  try {
    const linkDataObj = JSON.parse(link);
    if (linkDataObj.monadpay) {
      qrCodeLink = linkDataObj.monadpay; // 优先使用 monadpay:// 深度链接
    } else if (linkDataObj.web) {
      qrCodeLink = linkDataObj.web; // 回退到 web 链接
    }
    
    // 从参数中提取数据
    if (linkDataObj.params) {
      parsedData = linkDataObj.params;
    }
  } catch (error) {
    console.log('不是 JSON 格式，尝试作为 URL 解析');
  }
  
  return { qrCodeLink, parsedData };
}

const jsonString = JSON.stringify(mockLinkData);
const result = parseLink(jsonString);

console.log('\n2. QRCodeDisplay 解析结果:');
console.log('二维码链接:', result.qrCodeLink);
console.log('解析的参数:', result.parsedData);

console.log('\n3. 验证结果:');
console.log('✓ 是否使用 monadpay:// 协议:', result.qrCodeLink.startsWith('monadpay://send'));
console.log('✓ 是否包含正确参数:', result.parsedData && result.parsedData.to && result.parsedData.amount);
console.log('✓ 链接格式符合规范:', result.qrCodeLink.includes('monadpay://send?to=') && result.qrCodeLink.includes('&amount=') && result.qrCodeLink.includes('&token='));

console.log('\n=== 测试完成 ===');