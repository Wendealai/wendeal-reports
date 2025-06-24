#!/usr/bin/env node

/**
 * Netlify 部署设置脚本
 * 用于初始化数据库和创建必要的数据
 */

// Prisma 客户端将在需要时动态加载

async function setupDatabase() {
  // 检查是否有有效的数据库连接
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('ℹ️  跳过数据库设置（无有效数据库连接）');
    return;
  }

  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch (error) {
    console.log('ℹ️  Prisma 客户端不可用，跳过数据库设置');
    return;
  }

  try {
    console.log('🚀 开始设置数据库...');

    // 检查数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 创建默认用户
    const defaultUser = await prisma.user.upsert({
      where: { id: 'cmbusc9x00000x2w0fqyu591k' },
      update: {},
      create: {
        id: 'cmbusc9x00000x2w0fqyu591k',
        name: '系统管理员',
        email: 'admin@wendeal.com',
        role: 'admin'
      }
    });
    console.log('✅ 默认用户创建/更新成功:', defaultUser.name);
    
    // 创建预定义分类
    const categories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        description: '未分类的报告',
        color: '#6b7280',
        icon: 'folder',
        userId: defaultUser.id
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        description: '技术相关的研究报告',
        color: '#3b82f6',
        icon: 'cpu',
        userId: defaultUser.id
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        description: '市场分析和调研报告',
        color: '#10b981',
        icon: 'trending-up',
        userId: defaultUser.id
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        description: '产品评测和比较报告',
        color: '#f59e0b',
        icon: 'star',
        userId: defaultUser.id
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        description: '行业趋势和洞察报告',
        color: '#8b5cf6',
        icon: 'lightbulb',
        userId: defaultUser.id
      }
    ];
    
    for (const category of categories) {
      const result = await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon
        },
        create: category
      });
      console.log('✅ 分类创建/更新成功:', result.name);
    }
    
    // 检查数据完整性
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const reportCount = await prisma.report.count();
    
    console.log('\n📊 数据库状态:');
    console.log(`   用户数量: ${userCount}`);
    console.log(`   分类数量: ${categoryCount}`);
    console.log(`   报告数量: ${reportCount}`);
    
    console.log('\n🎉 数据库设置完成！');
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
