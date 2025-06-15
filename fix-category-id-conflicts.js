// 修复分类ID冲突问题的脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 定义标准分类映射
const STANDARD_CATEGORY_MAPPING = {
  // 新ID -> 标准ID 的映射
  'cmbueae5r000nx2lwnofshhrc': 'tech-research',    // 技术研究
  'cmbuec4ki000tx2lw6qkkne87': 'market-analysis',  // 市场分析
  'cmbueis250005x2n8he7zekox': 'product-review',   // 产品评测
  'cmbueoesv000fx2n8mh07nhno': 'industry-insights', // 行业洞察
};

async function fixCategoryIdConflicts() {
  try {
    console.log('🔧 开始修复分类ID冲突问题...\n');

    // 1. 获取所有分类
    const categories = await prisma.category.findMany();
    console.log('📊 找到的分类:');
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.id})`);
    });

    // 2. 统一报告的分类ID
    console.log('\n🔄 统一报告的分类ID...');
    
    for (const [oldId, newId] of Object.entries(STANDARD_CATEGORY_MAPPING)) {
      // 查找使用旧ID的报告
      const reportsWithOldId = await prisma.report.findMany({
        where: { categoryId: oldId },
        select: { id: true, title: true }
      });

      if (reportsWithOldId.length > 0) {
        console.log(`📝 将 ${reportsWithOldId.length} 个报告从 ${oldId} 迁移到 ${newId}`);
        
        // 更新报告的分类ID
        const updateResult = await prisma.report.updateMany({
          where: { categoryId: oldId },
          data: { categoryId: newId }
        });

        console.log(`✅ 成功更新 ${updateResult.count} 个报告`);
      } else {
        console.log(`ℹ️  没有使用 ${oldId} 的报告`);
      }
    }

    // 3. 删除重复的分类（保留标准ID的分类）
    console.log('\n🗑️ 清理重复的分类...');
    
    for (const [oldId, newId] of Object.entries(STANDARD_CATEGORY_MAPPING)) {
      try {
        // 检查是否存在旧分类
        const oldCategory = await prisma.category.findUnique({
          where: { id: oldId }
        });

        if (oldCategory) {
          console.log(`删除重复分类: ${oldCategory.name} (${oldId})`);
          await prisma.category.delete({
            where: { id: oldId }
          });
          console.log(`✅ 已删除重复分类 ${oldId}`);
        }
      } catch (error) {
        console.log(`⚠️ 删除分类 ${oldId} 时出错:`, error.message);
      }
    }

    // 4. 确保标准分类存在
    console.log('\n🔧 确保标准分类存在...');
    
    const standardCategories = [
      {
        id: 'tech-research',
        name: '技术研究',
        description: '技术相关的研究报告',
        color: '#3B82F6',
        icon: '💻',
      },
      {
        id: 'market-analysis',
        name: '市场分析',
        description: '市场趋势和分析报告',
        color: '#10B981',
        icon: '📈',
      },
      {
        id: 'product-review',
        name: '产品评测',
        description: '产品评测和比较报告',
        color: '#F59E0B',
        icon: '🔍',
      },
      {
        id: 'industry-insights',
        name: '行业洞察',
        description: '行业趋势和洞察报告',
        color: '#8B5CF6',
        icon: '🔬',
      },
      {
        id: 'uncategorized',
        name: '未分类',
        description: '暂未分类的报告',
        color: '#6B7280',
        icon: '📁',
      }
    ];

    for (const categoryData of standardCategories) {
      try {
        await prisma.category.upsert({
          where: { id: categoryData.id },
          update: {
            name: categoryData.name,
            description: categoryData.description,
            color: categoryData.color,
            icon: categoryData.icon,
          },
          create: {
            ...categoryData,
            userId: 'cmbusc9x00000x2w0fqyu591k'
          }
        });
        console.log(`✅ 标准分类 ${categoryData.name} (${categoryData.id}) 已确保存在`);
      } catch (error) {
        console.log(`⚠️ 处理分类 ${categoryData.id} 时出错:`, error.message);
      }
    }

    // 5. 验证修复结果
    console.log('\n📊 修复后的分类统计:');
    
    const finalCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            reports: true
          }
        }
      }
    });

    finalCategories.forEach(category => {
      console.log(`  - ${category.name} (${category.id}): ${category._count.reports} 个报告`);
    });

    console.log('\n🎉 分类ID冲突修复完成！');
    
    // 6. 清理孤立的报告（分类不存在的报告）
    console.log('\n🧹 检查和修复孤立的报告...');
    
    const allReports = await prisma.report.findMany({
      select: {
        id: true,
        title: true,
        categoryId: true,
        category: true
      }
    });

    const validCategoryIds = finalCategories.map(c => c.id);
    const orphanedReports = allReports.filter(report => 
      report.categoryId && !validCategoryIds.includes(report.categoryId)
    );

    if (orphanedReports.length > 0) {
      console.log(`发现 ${orphanedReports.length} 个孤立的报告，将其移至未分类:`);
      orphanedReports.forEach(report => {
        console.log(`  - ${report.title} (分类ID: ${report.categoryId})`);
      });

      const orphanUpdateResult = await prisma.report.updateMany({
        where: {
          id: {
            in: orphanedReports.map(r => r.id)
          }
        },
        data: {
          categoryId: 'uncategorized'
        }
      });

      console.log(`✅ 已将 ${orphanUpdateResult.count} 个孤立报告移至未分类`);
    } else {
      console.log('✅ 没有发现孤立的报告');
    }

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行修复
fixCategoryIdConflicts(); 