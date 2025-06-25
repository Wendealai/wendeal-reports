#!/usr/bin/env node

/**
 * 调用Vercel部署的数据库初始化API端点
 */

const https = require('https');

const VERCEL_URL = 'https://wendeal-reports.vercel.app';
const API_ENDPOINT = '/api/admin/init-database';

console.log('🚀 正在初始化Vercel生产环境数据库...\n');

function callInitAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: 'initialize'
    });

    const options = {
      hostname: 'wendeal-reports.vercel.app',
      port: 443,
      path: API_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ API调用成功！');
            console.log('\n📊 初始化结果:');
            
            if (response.data) {
              console.log(`   默认用户: ${response.data.user === 'created' ? '已创建' : '已存在'}`);
              
              if (response.data.categories && response.data.categories.length > 0) {
                console.log('   分类状态:');
                response.data.categories.forEach(cat => {
                  console.log(`     - ${cat.name}: ${cat.status === 'created' ? '已创建' : '已存在'}`);
                });
              }
              
              if (response.data.statistics) {
                console.log('\n📈 数据库统计:');
                console.log(`   用户数量: ${response.data.statistics.users}`);
                console.log(`   分类数量: ${response.data.statistics.categories}`);
                console.log(`   报告数量: ${response.data.statistics.reports}`);
              }
            }
            
            console.log(`\n🎉 ${response.message}`);
            console.log('🌐 现在可以在网站上正常使用文件上传功能了！');
            console.log(`📱 访问: ${VERCEL_URL}`);
            
            resolve(response);
          } else {
            console.error('❌ API调用失败:');
            console.error(`   状态码: ${res.statusCode}`);
            console.error(`   错误信息: ${response.error || response.message}`);
            
            if (response.troubleshooting) {
              console.log('\n🔧 故障排除建议:');
              response.troubleshooting.forEach((tip, index) => {
                console.log(`   ${index + 1}. ${tip}`);
              });
            }
            
            reject(new Error(`HTTP ${res.statusCode}: ${response.error || response.message}`));
          }
        } catch (parseError) {
          console.error('❌ 响应解析失败:', parseError.message);
          console.error('原始响应:', data);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message);
      console.log('\n🔧 可能的原因:');
      console.log('1. 网络连接问题');
      console.log('2. Vercel服务不可用');
      console.log('3. API端点路径错误');
      console.log(`4. 确认网站是否可访问: ${VERCEL_URL}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 执行初始化
async function main() {
  try {
    console.log(`📍 目标URL: ${VERCEL_URL}${API_ENDPOINT}`);
    console.log('📡 发送POST请求...\n');
    
    await callInitAPI();
    
    console.log('\n✨ 数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 初始化失败:', error.message);
    console.log('\n📋 替代方案:');
    console.log(`1. 手动访问: ${VERCEL_URL}${API_ENDPOINT}`);
    console.log('2. 使用浏览器开发者工具发送POST请求');
    console.log('3. 检查Vercel项目的Function日志');
    console.log('4. 确认环境变量配置正确');
    process.exit(1);
  }
}

main();
