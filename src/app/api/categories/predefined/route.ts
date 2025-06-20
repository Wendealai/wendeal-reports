import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k'

// 更新预定义分类
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { categoryId, name, icon, color } = body

    if (!categoryId || !name) {
      return NextResponse.json(
        { error: '分类ID和名称不能为空' },
        { status: 400 }
      )
    }

    // 预定义分类的固定ID映射
    const predefinedIds: Record<string, string> = {
      'uncategorized': 'predefined-uncategorized',
      'tech-research': 'predefined-tech-research',
      'market-analysis': 'predefined-market-analysis',
      'product-review': 'predefined-product-review',
      'industry-insights': 'predefined-industry-insights'
    }

    const dbCategoryId = predefinedIds[categoryId as keyof typeof predefinedIds]
    if (!dbCategoryId) {
      return NextResponse.json(
        { error: '无效的预定义分类ID' },
        { status: 400 }
      )
    }

    // 尝试更新现有分类
    let category = await prisma.category.findFirst({
      where: {
        id: dbCategoryId,
        userId: DEFAULT_USER_ID
      }
    })

    if (category) {
      // 更新现有分类
      category = await prisma.category.update({
        where: { id: dbCategoryId },
        data: {
          name,
          icon,
          color
        }
      })
      console.log('✅ 更新预定义分类:', dbCategoryId, name)
    } else {
      // 创建新的预定义分类
      category = await prisma.category.create({
        data: {
          id: dbCategoryId,
          name,
          icon,
          color,
          userId: DEFAULT_USER_ID
        }
      })
      console.log('✅ 创建预定义分类:', dbCategoryId, name)
    }

    return NextResponse.json({
      message: '预定义分类更新成功',
      category
    })

  } catch (error) {
    console.error('Update predefined category error:', error)
    return NextResponse.json(
      { error: '更新预定义分类失败' },
      { status: 500 }
    )
  }
}

// 初始化预定义分类
export async function POST(request: Request) {
  try {
    const predefinedCategories = [
      { id: 'predefined-uncategorized', categoryId: 'uncategorized', name: '未分类', icon: '📁', color: '#6B7280' },
      { id: 'predefined-tech-research', categoryId: 'tech-research', name: '技术研究', icon: '💻', color: '#3B82F6' },
      { id: 'predefined-market-analysis', categoryId: 'market-analysis', name: '市场分析', icon: '📈', color: '#10B981' },
      { id: 'predefined-product-review', categoryId: 'product-review', name: '产品评测', icon: '🔍', color: '#F59E0B' },
      { id: 'predefined-industry-insights', categoryId: 'industry-insights', name: '行业洞察', icon: '🔬', color: '#8B5CF6' }
    ]

    const results = []
    for (const categoryDef of predefinedCategories) {
      try {
        // 检查是否已存在
        const existing = await prisma.category.findFirst({
          where: {
            id: categoryDef.id,
            userId: DEFAULT_USER_ID
          }
        })

        if (!existing) {
          // 创建新分类
          const category = await prisma.category.create({
            data: {
              id: categoryDef.id,
              name: categoryDef.name,
              icon: categoryDef.icon,
              color: categoryDef.color,
              userId: DEFAULT_USER_ID
            }
          })
          results.push({ action: 'created', category })
          console.log('✅ 创建预定义分类:', categoryDef.id, categoryDef.name)
        } else {
          results.push({ action: 'exists', category: existing })
          console.log('ℹ️ 预定义分类已存在:', categoryDef.id, existing.name)
        }
      } catch (error) {
        console.error('创建预定义分类失败:', categoryDef.id, error)
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        results.push({ action: 'error', categoryId: categoryDef.id, error: errorMessage })
      }
    }

    return NextResponse.json({
      message: '预定义分类初始化完成',
      results
    })

  } catch (error) {
    console.error('Initialize predefined categories error:', error)
    return NextResponse.json(
      { error: '初始化预定义分类失败' },
      { status: 500 }
    )
  }
}
