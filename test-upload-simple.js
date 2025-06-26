const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('=== 测试文件上传 ===');
    
    // 检查测试文件是否存在
    const testFilePath = path.join(process.cwd(), 'test-upload.html');
    
    if (!fs.existsSync(testFilePath)) {
      console.log('创建测试HTML文件...');
      const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
</head>
<body>
    <h1>测试报告</h1>
    <p>这是一个测试HTML文件，用于验证文件上传功能。</p>
</body>
</html>`;
      fs.writeFileSync(testFilePath, testHtml);
      console.log('✅ 测试文件已创建');
    }

    // 准备FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-report.html',
      contentType: 'text/html'
    });
    
    // 使用预定义分类
    formData.append('categoryId', 'uncategorized');
    
    console.log('📤 发送上传请求...');
    
    // 使用fetch发送请求
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log(`📨 响应状态: ${response.status} ${response.statusText}`);
    
    const result = await response.text();
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('📋 响应内容:', JSON.stringify(jsonResult, null, 2));
      
      if (response.ok) {
        console.log('✅ 上传成功!');
      } else {
        console.log('❌ 上传失败:', jsonResult.error || jsonResult.message);
      }
    } catch (e) {
      console.log('❌ 响应不是有效的JSON:', result);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请确保开发服务器正在运行 (npm run dev 或 docker compose up)');
    }
  }
}

testUpload();
