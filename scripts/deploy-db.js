#!/usr/bin/env node
/**
 * 数据库部署脚本
 */

const { execSync } = require('child_process');

console.log('🗄️ 正在部署数据库表结构...');

try {
  // 推送数据库 schema
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ 数据库表结构部署成功!');
  console.log('🎉 现在可以正常使用文档上传功能了!');
} catch (error) {
  console.error('❌ 数据库部署失败:', error.message);
  console.log('\n请检查:');
  console.log('1. DATABASE_URL 是否正确配置');
  console.log('2. 数据库连接是否正常');
  console.log('3. 网络连接是否稳定');
}
