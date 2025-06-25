#!/usr/bin/env node

/**
 * 通过Vercel CLI运行生产环境数据库初始化
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始初始化Vercel生产环境数据库...\n');

try {
  // 创建临时的生产环境初始化脚本
  const initScript = `
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

async function initializeProductionData() {
  try {
    console.log('🚀 开始初始化生产环境数据库...');
    
    // 创建默认用户（如果不存在）
    const existingUser = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'admin@wendeal.com',
          username: 'admin',
          password: 'hashed_password_placeholder'
        }
      });
      console.log('✅ 默认用户创建成功');
    } else {
      console.log('✅ 默认用户已存在');
    }

    // 创建预定义分类
    const predefinedCategories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        icon: '📁',
        color: '#6B7280',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        icon: '💻',
        color: '#3B82F6',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        icon: '📈',
        color: '#10B981',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        icon: '🔍',
        color: '#F59E0B',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        icon: '🔬',
        color: '#8B5CF6',
        userId: DEFAULT_USER_ID
      }
    ];

    for (const category of predefinedCategories) {
      const existing = await prisma.category.findUnique({
        where: { id: category.id }
      });

      if (!existing) {
        await prisma.category.create({ data: category });
        console.log(\`✅ 分类创建成功: \${category.name}\`);
      } else {
        console.log(\`✅ 分类已存在: \${category.name}\`);
      }
    }

    // 验证数据
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    
    console.log('📊 数据库状态:');
    console.log(\`   用户数量: \${userCount}\`);
    console.log(\`   分类数量: \${categoryCount}\`);

    console.log('🎉 生产环境数据库初始化完成！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeProductionData().catch(console.error);
`;

  // 将脚本写入临时文件
  const tempFile = path.join(__dirname, 'temp-production-init.js');
  fs.writeFileSync(tempFile, initScript);

  console.log('📝 正在通过Vercel CLI执行生产环境数据库初始化...');
  
  // 通过Vercel CLI执行脚本
  const result = execSync(`vercel dev --local-config=false --no-clipboard --listen=0 node temp-production-init.js`, {
    stdio: 'inherit',
    cwd: __dirname
  });

  // 清理临时文件
  fs.unlinkSync(tempFile);

  console.log('\n✅ 生产环境数据库初始化完成！');
  console.log('🌐 现在可以在Vercel部署的网站上正常使用文件上传功能了');

} catch (error) {
  console.error('\n❌ 初始化失败:', error.message);
  console.log('\n🔧 替代方案:');
  console.log('1. 访问你的Vercel项目控制台');
  console.log('2. 在Functions页面找到并手动执行数据库初始化');
  console.log('3. 或者通过Vercel的Serverless Function API端点来初始化');
  
  // 清理临时文件（如果存在）
  const tempFile = path.join(__dirname, 'temp-production-init.js');
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
