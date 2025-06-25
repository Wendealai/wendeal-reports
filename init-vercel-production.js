#!/usr/bin/env node

/**
 * Vercel生产环境数据库初始化脚本
 * 这个脚本将连接到Vercel的生产数据库并初始化必要的数据
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// 使用生产环境数据库URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

async function initializeProductionData() {
  try {
    console.log('🚀 开始初始化Vercel生产环境数据库...');
    console.log('📍 数据库URL:', process.env.DATABASE_URL ? '已配置' : '未配置');
    
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

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
        console.log(`✅ 分类创建成功: ${category.name}`);
      } else {
        console.log(`✅ 分类已存在: ${category.name}`);
      }
    }

    // 验证数据
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    
    console.log('\n📊 数据库状态:');
    console.log(`   用户数量: ${userCount}`);
    console.log(`   分类数量: ${categoryCount}`);

    console.log('\n🎉 Vercel生产环境数据库初始化完成！');
    console.log('📱 现在可以在 https://wendeal-reports.vercel.app 上正常使用文件上传功能了');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.log('\n🔧 请检查:');
    console.log('1. Vercel环境变量中的DATABASE_URL是否正确配置');
    console.log('2. 数据库连接字符串是否有效');
    console.log('3. 网络连接是否正常');
    console.log('4. 数据库权限是否充足');
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
if (require.main === module) {
  initializeProductionData()
    .then(() => {
      console.log('\n✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 脚本执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = { initializeProductionData };
