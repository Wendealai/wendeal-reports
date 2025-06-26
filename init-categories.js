const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initCategories() {
  try {
    console.log('=== 初始化预定义分类 ===');
    
    const defaultUserId = 'cmbusc9x00000x2w0fqyu591k';
    
    const predefinedCategories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        icon: '📁',
        color: '#6B7280',
        userId: defaultUserId,
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        icon: '💻',
        color: '#3B82F6',
        userId: defaultUserId,
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        icon: '📈',
        color: '#10B981',
        userId: defaultUserId,
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        icon: '🔍',
        color: '#F59E0B',
        userId: defaultUserId,
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        icon: '🔬',
        color: '#8B5CF6',
        userId: defaultUserId,
      },
    ];

    console.log('🚀 开始创建分类...');
    
    for (const categoryData of predefinedCategories) {
      try {
        // 检查是否已存在
        const existing = await prisma.category.findUnique({
          where: { id: categoryData.id }
        });
        
        if (existing) {
          console.log(`ℹ️  分类已存在: ${categoryData.id} - ${existing.name}`);
        } else {
          // 创建新分类
          const category = await prisma.category.create({
            data: categoryData
          });
          console.log(`✅ 创建分类: ${category.id} - ${category.name}`);
        }
      } catch (error) {
        console.error(`❌ 创建分类失败 ${categoryData.id}:`, error.message);
      }
    }
    
    console.log('✅ 分类初始化完成');
    
  } catch (error) {
    console.error('初始化过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initCategories();
