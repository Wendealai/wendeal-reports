import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, dryRun = true } = body;

    console.log('🔧 分类清理请求:', { action, dryRun });

    if (action === 'cleanup-duplicates') {
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

      // 按名称分组，检查重复
      const categoriesByName: Record<string, any[]> = {};
      allCategories.forEach(category => {
        if (!categoriesByName[category.name]) {
          categoriesByName[category.name] = [];
        }
        categoriesByName[category.name].push(category);
      });

      // 检查重复的分类名称
      const duplicateNames = Object.keys(categoriesByName).filter(name => 
        categoriesByName[name].length > 1
      );

      const result = {
        totalCategories: allCategories.length,
        duplicateGroups: duplicateNames.length,
        duplicates: [] as any[],
        actions: [] as any[]
      };

      if (duplicateNames.length > 0) {
        console.log(`❌ 发现 ${duplicateNames.length} 组重复分类`);
        
        for (const name of duplicateNames) {
          const duplicateGroup = categoriesByName[name];
          result.duplicates.push({
            name,
            count: duplicateGroup.length,
            categories: duplicateGroup.map(cat => ({
              id: cat.id,
              reportsCount: cat._count.reports
            }))
          });

          if (!dryRun) {
            // 自动修复重复分类
            console.log(`🔧 修复 "${name}" 的重复项...`);
            
            // 确定要保留的分类（优先预定义ID或报告数最多的）
            const predefinedIds = ['uncategorized', 'tech-research', 'market-analysis', 'product-review', 'industry-insights'];
            let keepCategory = duplicateGroup.find(cat => 
              predefinedIds.some(predefined => cat.id.includes(predefined))
            );

            if (!keepCategory) {
              // 如果没有预定义ID，保留报告数最多的
              keepCategory = duplicateGroup.reduce((max, cat) => 
                cat._count.reports > max._count.reports ? cat : max
              );
            }

            console.log(`✅ 保留分类: ${keepCategory.id} (${keepCategory._count.reports} 个报告)`);

            // 将其他重复分类的报告转移到保留的分类
            const categoriesToRemove = duplicateGroup.filter(cat => cat.id !== keepCategory.id);
            
            for (const categoryToRemove of categoriesToRemove) {
              if (categoryToRemove._count.reports > 0) {
                console.log(`🔄 转移 ${categoryToRemove._count.reports} 个报告从 ${categoryToRemove.id} 到 ${keepCategory.id}`);
                
                await prisma.report.updateMany({
                  where: { categoryId: categoryToRemove.id },
                  data: { categoryId: keepCategory.id }
                });
              }

              console.log(`🗑️ 删除重复分类: ${categoryToRemove.id}`);
              await prisma.category.delete({
                where: { id: categoryToRemove.id }
              });

              result.actions.push({
                action: 'delete',
                categoryId: categoryToRemove.id,
                categoryName: categoryToRemove.name,
                reportsTransferred: categoryToRemove._count.reports,
                transferredTo: keepCategory.id
              });
            }
          }
        }
      } else {
        console.log('✅ 未发现重复分类');
      }

      // 3. 确保预定义分类存在
      console.log('🔧 检查预定义分类...');
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
        
        if (!existing && !dryRun) {
          console.log(`➕ 创建缺失的预定义分类: ${predefined.name}`);
          await prisma.category.create({
            data: {
              id: predefined.id,
              name: predefined.name,
              icon: predefined.icon,
              color: predefined.color,
              userId: 'default-user-id'
            }
          });
          
          result.actions.push({
            action: 'create',
            categoryId: predefined.id,
            categoryName: predefined.name
          });
        } else if (existing && existing.id !== predefined.id && !dryRun) {
          console.log(`🔄 更新分类ID: ${existing.id} -> ${predefined.id}`);
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

          result.actions.push({
            action: 'update_id',
            oldId: existing.id,
            newId: predefined.id,
            categoryName: predefined.name
          });
        }
      }

      // 4. 最终状态检查
      if (!dryRun) {
        const finalCategories = await prisma.category.findMany({
          include: {
            _count: {
              select: {
                reports: true
              }
            }
          }
        });

        result.finalState = {
          totalCategories: finalCategories.length,
          categories: finalCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            reportsCount: cat._count.reports
          }))
        };

        console.log(`✅ 分类数据清理完成! 最终分类数: ${finalCategories.length}`);
      }

      return NextResponse.json({
        success: true,
        message: dryRun ? '分类检查完成 (预览模式)' : '分类清理完成',
        dryRun,
        result
      });

    } else {
      return NextResponse.json(
        { error: '不支持的操作类型' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ 分类清理失败:', error);
    return NextResponse.json(
      { 
        error: '分类清理失败', 
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
