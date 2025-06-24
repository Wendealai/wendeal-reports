const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { default: fetch } = require('node-fetch');

async function testApiUpload() {
  try {
    console.log('=== 测试API上传 ===');
    
    // 读取测试HTML文件
    const testFilePath = path.join(process.cwd(), 'test-upload.html');
    console.log(`读取测试文件: ${testFilePath}`);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-upload.html',
      contentType: 'text/html',
    });
    formData.append('categoryId', 'cmcagngqh0001x2p08njwtgjx');
    
    console.log('准备发送请求...');
    
    // 发送POST请求
    const response = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      body: formData,
    });
    
    console.log(`响应状态: ${response.status}`);
    
    const result = await response.json();
    console.log('响应数据:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('文件上传成功!');
    } else {
      console.error('文件上传失败:', result.error);
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testApiUpload();