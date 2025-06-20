import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 默认用户ID（与其他API保持一致）
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'

export async function GET() {
  try {
    // 检查数据库状态
    const userExists = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    })

    const [reportCount, categoryCount] = await Promise.all([
      prisma.report.count(),
      prisma.category.count()
    ])

    return NextResponse.json({
      initialized: !!userExists,
      userExists: !!userExists,
      reportCount,
      categoryCount,
      defaultUserId: DEFAULT_USER_ID
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json(
      { error: '数据库检查失败', details: error },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // 检查用户是否已存在
    let user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    })

    if (!user) {
      // 创建默认用户
      user = await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'demo@wendeal.com',
          username: 'demo',
          password: 'not-used' // 简化版本不使用密码
        }
      })
    }

    // 创建预定义分类（如果不存在）
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
    ]

    let categoriesCreated = 0
    for (const categoryData of predefinedCategories) {
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryData.id }
      })

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            ...categoryData,
            userId: DEFAULT_USER_ID
          }
        })
        categoriesCreated++
      }
    }

    const [finalReportCount, finalCategoryCount] = await Promise.all([
      prisma.report.count(),
      prisma.category.count()
    ])

    return NextResponse.json({
      message: '数据库初始化完成',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      categoriesCreated,
      totalReports: finalReportCount,
      totalCategories: finalCategoryCount
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: '数据库初始化失败', details: error },
      { status: 500 }
    )
  }
} 