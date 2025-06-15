import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCategorySchema } from '@/lib/validations'

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k'

// 获取单个分类
async function getCategory(request: Request, { params }: { params: { id: string } }) {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
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
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      category: {
        ...category,
        reportCount: category._count.reports
      }
    })

  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: '获取分类失败' },
      { status: 500 }
    )
  }
}

// 更新分类
async function updateCategory(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    // 验证输入数据
    const validatedData = updateCategorySchema.parse(body)

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: DEFAULT_USER_ID
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      )
    }

    // 如果要更新父分类，检查父分类是否存在且不会造成循环引用
    if (validatedData.parentId) {
      if (validatedData.parentId === params.id) {
        return NextResponse.json(
          { error: '不能将分类设置为自己的子分类' },
          { status: 400 }
        )
      }

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

    // 如果要更新名称，检查同名分类是否已存在
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          userId: DEFAULT_USER_ID,
          parentId: validatedData.parentId || existingCategory.parentId,
          id: { not: params.id }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: '同名分类已存在' },
          { status: 400 }
        )
      }
    }

    // 更新分类
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: validatedData,
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
      message: '分类更新成功',
      category: {
        ...updatedCategory,
        reportCount: updatedCategory._count.reports
      }
    })

  } catch (error) {
    console.error('Update category error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '输入数据格式错误', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    )
  }
}

// 删除分类
async function deleteCategory(request: Request, { params }: { params: { id: string } }) {
  try {
    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: DEFAULT_USER_ID
      },
      include: {
        children: true,
        _count: {
          select: {
            reports: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      )
    }

    // 检查是否有子分类
    if (existingCategory.children.length > 0) {
      return NextResponse.json(
        { error: '请先删除子分类' },
        { status: 400 }
      )
    }

    // 检查是否有关联的报告
    if (existingCategory._count.reports > 0) {
      return NextResponse.json(
        { error: '该分类下还有报告，无法删除' },
        { status: 400 }
      )
    }

    // 删除分类
    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: '分类删除成功'
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    )
  }
}

export const GET = getCategory
export const PUT = updateCategory
export const DELETE = deleteCategory 