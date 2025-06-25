#!/usr/bin/env node

/**
 * Vercel 环境变量诊断和修复脚本
 */

const crypto = require('crypto');

console.log('🔧 Vercel 环境变量诊断和修复');
console.log('==============================\n');

console.log('📋 问题诊断:');
console.log('❌ DATABASE_URL 环境变量在 Vercel 中解析为空字符串');
console.log('📍 这意味着环境变量没有正确设置或没有应用到生产环境\n');

console.log('🔍 可能的原因:');
console.log('1. 环境变量设置在错误的环境 (Preview 而不是 Production)');
console.log('2. 环境变量值为空或包含特殊字符');
console.log('3. 部署后没有重新生成构建');
console.log('4. Vercel 项目配置问题\n');

console.log('🎯 立即修复步骤:\n');

console.log('步骤 1: 检查 Vercel 环境变量设置');
console.log('🔗 https://vercel.com/wen-zhongs-projects/wendeal-reports/settings/environment-variables\n');

console.log('步骤 2: 确保以下环境变量正确设置且选择 "Production" 环境:\n');

// 生成新的密钥
const nextAuthSecret = crypto.randomBytes(32).toString('base64');

const envVars = [
  {
    name: 'DATABASE_URL',
    description: '你的 Neon PostgreSQL 连接字符串',
    example: 'postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/wendeal_reports?sslmode=require',
    required: true
  },
  {
    name: 'DIRECT_URL', 
    description: '同 DATABASE_URL (Prisma 需要)',
    example: '(同上)',
    required: true
  },
  {
    name: 'NODE_ENV',
    description: '环境标识',
    example: 'production',
    required: true
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: '认证密钥',
    example: nextAuthSecret,
    required: true
  },
  {
    name: 'NEXTAUTH_URL',
    description: '应用 URL',
    example: 'https://wendeal-reports.vercel.app',
    required: true
  }
];

console.log('┌─────────────────┬─────────────────────────────────────────────────────────────┐');
console.log('│ 变量名           │ 值/描述                                                      │');
console.log('├─────────────────┼─────────────────────────────────────────────────────────────┤');

envVars.forEach(envVar => {
  const nameCol = envVar.name.padEnd(15);
  let valueCol = envVar.example;
  if (valueCol.length > 60) {
    valueCol = valueCol.substring(0, 57) + '...';
  }
  valueCol = valueCol.padEnd(60);
  
  console.log(`│ ${nameCol} │ ${valueCol} │`);
  if (envVar.description && envVar.name === 'DATABASE_URL') {
    console.log('│                 │ ⚠️ 必须是完整的 PostgreSQL 连接字符串                    │');
  }
});

console.log('└─────────────────┴─────────────────────────────────────────────────────────────┘\n');

console.log('⚠️ 重要提醒:');
console.log('- 所有变量必须设置为 "Production" 环境');
console.log('- DATABASE_URL 不能包含空格或换行符');
console.log('- 必须包含 ?sslmode=require');
console.log('- 确保用户名和密码正确编码\n');

console.log('步骤 3: 获取正确的数据库连接字符串');
console.log('如果你还没有数据库，或者连接字符串有问题:');
console.log('1. 🔗 访问 https://neon.tech');
console.log('2. 登录并进入你的项目控制台');
console.log('3. 点击 "Connection string" 或 "Connection details"');
console.log('4. 复制 "Pooled connection" 字符串');
console.log('5. 确保字符串格式类似: postgresql://user:pass@host/db?sslmode=require\n');

console.log('步骤 4: 重新部署');
console.log('设置环境变量后:');
console.log('1. 🔄 在 Vercel 控制台点击 "Redeploy"');
console.log('2. ✅ 选择 "Use existing Build Cache: No"');
console.log('3. 🚀 点击 "Deploy" 按钮\n');

console.log('步骤 5: 验证修复');
console.log('等待部署完成后运行:');
console.log('node deploy-and-test.js\n');

console.log('🔧 快速测试命令:');
console.log('# 检查健康状态');
console.log('curl -s "https://wendeal-reports.vercel.app/api/health"\n');

console.log('# 测试分类 API');
console.log('curl -s "https://wendeal-reports.vercel.app/api/categories"\n');

console.log('🆘 如果仍然失败:');
console.log('1. 检查 Vercel Function Logs:');
console.log('   https://vercel.com/wen-zhongs-projects/wendeal-reports/functions');
console.log('2. 确认数据库服务器在线:');
console.log('   登录 Neon 控制台检查数据库状态');
console.log('3. 验证连接字符串:');
console.log('   使用 psql 或其他客户端工具测试连接\n');

console.log('💡 专业提示:');
console.log('- Neon 免费数据库可能在不活跃时暂停，首次连接需要 10-30 秒');
console.log('- 如果持续失败，可以删除所有环境变量重新添加');
console.log('- 确保没有使用开发环境的 .env.local 文件中的占位符URL\n');

console.log('✨ 修复完成后，你的应用应该能够:');
console.log('- ✅ 正常创建和管理分类');
console.log('- ✅ 成功上传文件');
console.log('- ✅ 数据持久化保存');
