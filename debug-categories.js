const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCategories() {
  try {
    console.log('=== 数据库分类诊断 ===');
    
    // 1. 检查数据库连接
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ 数据库连接正常');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return;
    }

    // 2. 列出所有现有分类
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\n📋 现有分类列表:');
    if (categories.length === 0) {
      console.log('  ❌ 没有找到任何分类');
    } else {
      categories.forEach(cat => {
        console.log(`  - ID: ${cat.id}, 名称: ${cat.name}, 用户ID: ${cat.userId}`);
      });
    }

    // 3. 检查预定义分类是否存在
    const predefinedIds = [
      'predefined-uncategorized',
      'predefined-tech-research', 
      'predefined-market-analysis',
      'predefined-product-review',
      'predefined-industry-insights'
    ];

    console.log('\n🔍 检查预定义分类:');
    for (const id of predefinedIds) {
      const category = await prisma.category.findUnique({
        where: { id }
      });
      
      if (category) {
        console.log(`  ✅ ${id} - 存在 (${category.name})`);
      } else {
        console.log(`  ❌ ${id} - 不存在`);
      }
    }

    // 4. 检查用户
    const defaultUserId = 'cmbusc9x00000x2w0fqyu591k';
    const userCategories = await prisma.category.findMany({
      where: { userId: defaultUserId }
    });
    
    console.log(`\n👤 用户 ${defaultUserId} 的分类:`);
    if (userCategories.length === 0) {
      console.log('  ❌ 该用户没有任何分类');
    } else {
      userCategories.forEach(cat => {
        console.log(`  - ${cat.id}: ${cat.name}`);
      });
    }

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategories();
