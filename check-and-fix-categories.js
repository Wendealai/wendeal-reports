const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixCategories() {
  try {
    console.log('🔍 检查数据库中的分类数据...\n');

    // 1. 获取所有分类
    const allCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            reports: true
          }
        }
      }
    });

    console.log(`📊 数据库中总分类数: ${allCategories.length}`);
    console.log('\n📋 分类详情:');
    
    // 按名称分组，检查重复
    const categoriesByName = {};
    allCategories.forEach(category => {
      if (!categoriesByName[category.name]) {
        categoriesByName[category.name] = [];
      }
      categoriesByName[category.name].push(category);
    });

    // 打印分类信息
    allCategories.forEach(category => {
      console.log(`   ${category.name} (${category.id}): ${category._count.reports} 个报告`);
    });

    // 2. 检查重复的分类名称
    console.log('\n🔍 检查重复分类:');
    const duplicateNames = Object.keys(categoriesByName).filter(name => 
      categoriesByName[name].length > 1
    );

    if (duplicateNames.length > 0) {
      console.log('❌ 发现重复分类:');
      for (const name of duplicateNames) {
        console.log(`\n   📁 "${name}" 有 ${categoriesByName[name].length} 个重复项:`);
        categoriesByName[name].forEach(category => {
          console.log(`      - ID: ${category.id}, 报告数: ${category._count.reports}`);
        });

        // 自动修复重复分类
        console.log(`\n🔧 修复 "${name}" 的重复项...`);
        
        // 确定要保留的分类（优先预定义ID或报告数最多的）
        const predefinedIds = ['uncategorized', 'tech-research', 'market-analysis', 'product-review', 'industry-insights'];
        let keepCategory = categoriesByName[name].find(cat => 
          predefinedIds.some(predefined => cat.id.includes(predefined))
        );

        if (!keepCategory) {
          // 如果没有预定义ID，保留报告数最多的
          keepCategory = categoriesByName[name].reduce((max, cat) => 
            cat._count.reports > max._count.reports ? cat : max
          );
        }

        console.log(`   ✅ 保留分类: ${keepCategory.id} (${keepCategory._count.reports} 个报告)`);

        // 将其他重复分类的报告转移到保留的分类
        const categoriesToRemove = categoriesByName[name].filter(cat => cat.id !== keepCategory.id);
        
        for (const categoryToRemove of categoriesToRemove) {
          if (categoryToRemove._count.reports > 0) {
            console.log(`   🔄 转移 ${categoryToRemove._count.reports} 个报告从 ${categoryToRemove.id} 到 ${keepCategory.id}`);
            
            await prisma.report.updateMany({
              where: { categoryId: categoryToRemove.id },
              data: { categoryId: keepCategory.id }
            });
          }

          console.log(`   🗑️ 删除重复分类: ${categoryToRemove.id}`);
          await prisma.category.delete({
            where: { id: categoryToRemove.id }
          });
        }
      }

      console.log('\n✅ 重复分类清理完成!');
    } else {
      console.log('✅ 未发现重复分类');
    }

    // 3. 确保预定义分类存在
    console.log('\n🔧 检查预定义分类...');
    const predefinedCategories = [
      { id: 'uncategorized', name: '未分类', icon: '📁', color: '#6B7280' },
      { id: 'tech-research', name: '技术研究', icon: '💻', color: '#3B82F6' },
      { id: 'market-analysis', name: '市场分析', icon: '📈', color: '#10B981' },
      { id: 'product-review', name: '产品评测', icon: '🔍', color: '#F59E0B' },
      { id: 'industry-insights', name: '行业洞察', icon: '🔬', color: '#8B5CF6' }
    ];

    for (const predefined of predefinedCategories) {
      // 检查是否存在具有此名称的分类
      const existing = allCategories.find(cat => cat.name === predefined.name);
      
      if (!existing) {
        console.log(`   ➕ 创建缺失的预定义分类: ${predefined.name}`);
        await prisma.category.create({
          data: {
            id: predefined.id,
            name: predefined.name,
            icon: predefined.icon,
            color: predefined.color,
            userId: 'default-user-id'
          }
        });
      } else if (existing.id !== predefined.id) {
        console.log(`   🔄 更新分类ID: ${existing.id} -> ${predefined.id}`);
        // 如果存在但ID不正确，需要更新
        await prisma.report.updateMany({
          where: { categoryId: existing.id },
          data: { categoryId: predefined.id }
        });
        
        await prisma.category.delete({
          where: { id: existing.id }
        });
        
        await prisma.category.create({
          data: {
            id: predefined.id,
            name: predefined.name,
            icon: predefined.icon,
            color: predefined.color,
            userId: 'default-user-id'
          }
        });
      } else {
        console.log(`   ✅ ${predefined.name} 已存在且正确`);
      }
    }

    // 4. 最终状态检查
    console.log('\n📊 修复后的分类状态:');
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
      console.log(`   ${category.name} (${category.id}): ${category._count.reports} 个报告`);
    });

    console.log(`\n✅ 分类数据检查和修复完成! 最终分类数: ${finalCategories.length}`);

  } catch (error) {
    console.error('❌ 检查分类时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixCategories();
