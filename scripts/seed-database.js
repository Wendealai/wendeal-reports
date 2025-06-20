// Context7最佳实践：兼容不同环境的Prisma导入
let prisma;

try {
  // 尝试从生成的客户端导入
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.error('❌ [Seed] Failed to import PrismaClient:', error);
  process.exit(1);
}

// Context7最佳实践：为Netlify无服务器环境的数据库种子脚本
async function seedDatabase() {
  try {
    console.log('🌱 [Seed] Starting database seeding...');

    // 默认用户ID
    const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k';

    // 1. 创建默认用户
    console.log('👤 [Seed] Creating default user...');
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: 'demo@wendeal.com',
        username: 'demo',
        password: 'not-used' // 简化版本不使用密码
      }
    });
    console.log('✅ [Seed] Default user created');

    // 2. 创建预定义分类
    console.log('📁 [Seed] Creating predefined categories...');
    const predefinedCategories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        description: '默认分类',
        color: '#6B7280',
        icon: '📁'
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        description: '技术研究相关文档',
        color: '#3B82F6',
        icon: '💻'
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        description: '市场分析报告',
        color: '#10B981',
        icon: '📈'
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        description: '产品评测文档',
        color: '#F59E0B',
        icon: '🔍'
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        description: '行业洞察分析',
        color: '#8B5CF6',
        icon: '🔬'
      }
    ];

    for (const categoryData of predefinedCategories) {
      await prisma.category.upsert({
        where: { id: categoryData.id },
        update: {},
        create: {
          ...categoryData,
          userId: DEFAULT_USER_ID
        }
      });
    }
    console.log('✅ [Seed] Predefined categories created');

    // 3. 验证数据库状态
    const [userCount, categoryCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.report.count()
    ]);

    console.log('📊 [Seed] Database status after seeding:', {
      users: userCount,
      categories: categoryCount,
      reports: reportCount
    });

    console.log('🎉 [Seed] Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ [Seed] Database seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 