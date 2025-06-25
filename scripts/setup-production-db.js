#!/usr/bin/env node

/**
 * 生产环境数据库设置脚本
 * 这个脚本会帮助你自动配置 Vercel 环境变量和数据库
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置生产环境数据库...\n');

// 生成 NEXTAUTH_SECRET
function generateSecret() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

const NEXTAUTH_SECRET = generateSecret();
const NEXTAUTH_URL = 'https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app';

console.log('📋 请完成以下步骤:\n');

console.log('1️⃣ 创建免费的 PostgreSQL 数据库:');
console.log('   选项 A: Neon (推荐)');
console.log('   - 访问: https://neon.tech');
console.log('   - 使用 GitHub 登录');
console.log('   - 创建新项目，数据库名: wendeal_reports');
console.log('   - 复制连接字符串\n');

console.log('   选项 B: Vercel Postgres');
console.log('   - 访问: https://vercel.com/wen-zhongs-projects/wendeal-reports/storage');
console.log('   - 点击 "Create Database"');
console.log('   - 选择 Postgres');
console.log('   - 复制连接字符串\n');

console.log('2️⃣ 配置 Vercel 环境变量:');
console.log('   访问: https://vercel.com/wen-zhongs-projects/wendeal-reports/settings/environment-variables\n');

console.log('   添加以下环境变量:');
console.log('   ┌─────────────────┬─────────────────────────────────────────────────────────┐');
console.log('   │ 变量名           │ 值                                                       │');
console.log('   ├─────────────────┼─────────────────────────────────────────────────────────┤');
console.log(`   │ DATABASE_URL    │ [从数据库提供商复制的连接字符串]                            │`);
console.log(`   │ DIRECT_URL      │ [同 DATABASE_URL]                                       │`);
console.log(`   │ NODE_ENV        │ production                                              │`);
console.log(`   │ NEXTAUTH_SECRET │ ${NEXTAUTH_SECRET} │`);
console.log(`   │ NEXTAUTH_URL    │ ${NEXTAUTH_URL}                 │`);
console.log('   └─────────────────┴─────────────────────────────────────────────────────────┘\n');

console.log('3️⃣ 设置完成后，运行以下命令部署数据库表结构:');
console.log('   npm run db:deploy\n');

console.log('4️⃣ 重新部署到 Vercel:');
console.log('   vercel --prod\n');

// 创建部署脚本
const deployScript = `#!/usr/bin/env node
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
  console.log('\\n请检查:');
  console.log('1. DATABASE_URL 是否正确配置');
  console.log('2. 数据库连接是否正常');
  console.log('3. 网络连接是否稳定');
}
`;

// 写入部署脚本
const deployScriptPath = path.join(__dirname, 'deploy-db.js');
fs.writeFileSync(deployScriptPath, deployScript);

console.log(`💾 数据库部署脚本已创建: ${deployScriptPath}`);
console.log('\\n🔗 有用的链接:');
console.log('   • Neon 控制台: https://console.neon.tech');
console.log('   • Vercel 项目: https://vercel.com/wen-zhongs-projects/wendeal-reports');
console.log('   • 项目网站: https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app');
