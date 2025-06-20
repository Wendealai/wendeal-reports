import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCategorySchema } from '@/lib/validations'

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k'

// 获取分类列表
async function getCategories(request: Request) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: DEFAULT_USER_ID
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            description: true
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 格式化返回数据
    const formattedCategories = categories.map(category => ({
      ...category,
      reportCount: category._count.reports
    }))

    return NextResponse.json({
      categories: formattedCategories
    })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    )
  }
}

// 创建新分类
async function createCategory(request: Request) {
  try {
    const body = await request.json()
    
    // 验证输入数据
    const validatedData = createCategorySchema.parse(body)

    // 如果指定了父分类，检查父分类是否存在且属于当前用户
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: validatedData.parentId,
          userId: DEFAULT_USER_ID
        }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: '父分类不存在' },
          { status: 400 }
        )
      }
    }

    // 检查同名分类是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        userId: DEFAULT_USER_ID,
        parentId: validatedData.parentId || null
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: '同名分类已存在' },
        { status: 400 }
      )
    }

    // 创建分类
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId: DEFAULT_USER_ID,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            description: true
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      }
    })

    return NextResponse.json({
      message: '分类创建成功',
      category: {
        ...category,
        reportCount: category._count.reports
      }
    })

  } catch (error) {
    console.error('Create category error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '输入数据格式错误', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    )
  }
}

export const GET = getCategories
export const POST = createCategory 
