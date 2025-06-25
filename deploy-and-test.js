#!/usr/bin/env node

/**
 * 快速部署和测试脚本
 */

const { execSync } = require('child_process');
const https = require('https');

const APP_URL = 'https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app';
const HEALTH_ENDPOINT = `${APP_URL}/api/health`;

console.log('🚀 Wendeal Reports - 部署和测试脚本');
console.log('===================================\n');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            status: res.statusCode, 
            data: JSON.parse(data),
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data.substring(0, 200) + '...',
            headers: res.headers 
          });
        }
      });
    }).on('error', reject);
  });
}

async function testEndpoint() {
  console.log('🧪 Testing health endpoint...');
  
  try {
    const result = await makeRequest(HEALTH_ENDPOINT);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200 && result.data.status) {
      console.log('✅ Health check passed!');
      console.log(`Database status: ${result.data.database?.status || 'unknown'}`);
      
      if (result.data.database?.statistics) {
        console.log('Database statistics:');
        console.log(`- Users: ${result.data.database.statistics.users}`);
        console.log(`- Categories: ${result.data.database.statistics.categories}`);
        console.log(`- Reports: ${result.data.database.statistics.reports}`);
      }
      
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testCategories() {
  console.log('\n🏷️ Testing categories endpoint...');
  
  try {
    const result = await makeRequest(`${APP_URL}/api/categories`);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200 && result.data.categories) {
      console.log(`✅ Categories endpoint working! Found ${result.data.categories.length} categories`);
      
      result.data.categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.icon || '📁'} ${cat.name} (${cat.reportCount || 0} reports)`);
      });
      
      return true;
    } else {
      console.log('❌ Categories endpoint failed');
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Categories request failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('📋 Current deployment status check...\n');
  
  // Test health endpoint
  const healthOk = await testEndpoint();
  
  if (!healthOk) {
    console.log('\n❌ 部署有问题，可能的原因:');
    console.log('1. 数据库未正确配置');
    console.log('2. 环境变量缺失');
    console.log('3. Vercel 函数启动失败');
    console.log('\n🔧 解决步骤:');
    console.log('1. 运行: node setup-database.js');
    console.log('2. 在 Vercel 中配置环境变量');
    console.log('3. 重新部署项目');
    console.log(`4. 检查 Vercel 函数日志: https://vercel.com/wen-zhongs-projects/wendeal-reports/functions`);
    return;
  }
  
  // Test categories endpoint
  const categoriesOk = await testCategories();
  
  console.log('\n📊 测试结果总结:');
  console.log(`✅ 健康检查: ${healthOk ? '通过' : '失败'}`);
  console.log(`✅ 分类功能: ${categoriesOk ? '通过' : '失败'}`);
  
  if (healthOk && categoriesOk) {
    console.log('\n🎉 恭喜！你的应用已正常部署并可以使用！');
    console.log(`\n🔗 应用地址: ${APP_URL}`);
    console.log('现在你可以:');
    console.log('- 📁 创建和管理分类');
    console.log('- 📄 上传和管理报告');
    console.log('- 🔍 搜索和浏览内容');
  } else {
    console.log('\n⚠️ 部分功能可能有问题，请检查 Vercel 函数日志');
  }
  
  console.log('\n🔗 有用的链接:');
  console.log(`- 应用首页: ${APP_URL}`);
  console.log(`- 健康检查: ${HEALTH_ENDPOINT}`);
  console.log('- Vercel 控制台: https://vercel.com/wen-zhongs-projects/wendeal-reports');
  console.log('- 函数日志: https://vercel.com/wen-zhongs-projects/wendeal-reports/functions');
}

main().catch(console.error);
