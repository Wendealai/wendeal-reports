#!/usr/bin/env node

/**
 * 快速数据库设置脚本
 * 帮助设置免费的 Neon PostgreSQL 数据库
 */

const crypto = require('crypto');

console.log('🚀 Wendeal Reports - 数据库设置向导');
console.log('=================================\n');

console.log('第一步：创建免费 PostgreSQL 数据库');
console.log('推荐使用 Neon (免费 PostgreSQL):\n');

console.log('1. 🔗 访问 https://neon.tech');
console.log('2. 🔑 使用 GitHub 账号登录');
console.log('3. ➕ 点击 "Create project"');
console.log('4. 📝 项目设置:');
console.log('   - Project name: wendeal-reports');
console.log('   - Database name: wendeal_reports');
console.log('   - Region: 选择离你最近的区域');
console.log('5. 📋 复制连接字符串 (Connection string)\n');

console.log('第二步：在 Vercel 中配置环境变量');
console.log('🔗 https://vercel.com/wen-zhongs-projects/wendeal-reports/settings/environment-variables\n');

// 生成安全密钥
const nextAuthSecret = crypto.randomBytes(32).toString('base64');

console.log('📝 需要添加的环境变量:\n');
console.log('┌─────────────────┬─────────────────────────────────────────────────────────────┐');
console.log('│ 变量名           │ 值                                                           │');
console.log('├─────────────────┼─────────────────────────────────────────────────────────────┤');
console.log('│ DATABASE_URL    │ [你的 Neon 连接字符串]                                       │');
console.log('│ DIRECT_URL      │ [同 DATABASE_URL]                                           │');
console.log('│ NODE_ENV        │ production                                                  │');
console.log(`│ NEXTAUTH_SECRET │ ${nextAuthSecret} │`);
console.log('│ NEXTAUTH_URL    │ https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app │');
console.log('└─────────────────┴─────────────────────────────────────────────────────────────┘\n');

console.log('⚠️  注意事项:');
console.log('- 所有环境变量都选择 "Production" 环境');
console.log('- DATABASE_URL 必须是完整的 PostgreSQL 连接字符串');
console.log('- 连接字符串格式: postgresql://user:password@host/database?sslmode=require\n');

console.log('第三步：重新部署项目');
console.log('在 Vercel 控制台中点击 "Redeploy" 或者:');
console.log('git commit -am "配置数据库" && git push\n');

console.log('第四步：验证部署');
console.log('1. 📊 访问健康检查: https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app/api/health');
console.log('2. ✅ 确认响应中 database.status 为 "connected"');
console.log('3. 🧪 测试上传功能\n');

console.log('🔧 故障排除:');
console.log('- 如果数据库连接失败，检查 Neon 数据库是否处于活跃状态');
console.log('- Neon 免费版会在不活跃时休眠，首次连接可能较慢');
console.log('- 检查连接字符串是否包含 ?sslmode=require');
console.log('- 在 Vercel Function Logs 中查看详细错误信息\n');

console.log('🎯 快速测试命令:');
console.log(`curl -s "https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app/api/health" | jq`);
console.log('');

console.log('🔗 有用的链接:');
console.log('- Neon 控制台: https://console.neon.tech');
console.log('- Vercel 项目: https://vercel.com/wen-zhongs-projects/wendeal-reports');
console.log('- 环境变量设置: https://vercel.com/wen-zhongs-projects/wendeal-reports/settings/environment-variables');
console.log('');

console.log('✨ 设置完成后，你的应用就可以正常使用数据库功能了！');
