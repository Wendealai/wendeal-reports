import { NextResponse } from 'next/server'
import { prisma, testDatabaseConnection } from '@/lib/prisma'
import { createReportSchema } from '@/lib/validations'

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'

// 获取报告列表
async function getReports(request: Request) {
  try {
    console.log('🔍 开始获取报告列表...')
    
    // 首先测试数据库连接
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.success) {
      console.error('❌ 数据库连接失败:', connectionTest.message)
      return NextResponse.json(
        { error: `数据库连接失败: ${connectionTest.message}` },
        { status: 503 }
      )
    }
    console.log('✅ 数据库连接正常')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      userId: DEFAULT_USER_ID
    }

    if (status) {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { summary: { contains: search } }
      ]
    }

    console.log('📊 查询条件:', { where, page, limit, skip })

    // 获取报告列表
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          },
          reportTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          },
          _count: {
            select: {
              files: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ])

    console.log(`📄 查询结果: 找到 ${reports.length} 条报告，总计 ${total} 条`)

    // 格式化返回数据
    const formattedReports = reports.map((report: any) => ({
      ...report,
      tags: report.reportTags.map((rt: any) => rt.tag),
      reportTags: undefined,
      fileCount: report._count.files
    }))

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('❌ 获取报告列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取报告列表失败', 
        details: error instanceof Error ? error.message : '未知错误',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}

// 创建新报告
async function createReport(request: Request) {
  try {
    console.log('📝 开始创建新报告...')
    
    // 首先测试数据库连接
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.success) {
      console.error('❌ 数据库连接失败:', connectionTest.message)
      return NextResponse.json(
        { error: `数据库连接失败: ${connectionTest.message}` },
        { status: 503 }
      )
    }
    console.log('✅ 数据库连接正常')

    const body = await request.json()
    console.log('📥 接收到的数据:', {
      title: body.title,
      categoryId: body.categoryId,
      tagsCount: body.tags?.length || 0,
      contentLength: body.content?.length || 0
    })
    
    // 验证输入数据
    const validatedData = createReportSchema.parse(body)
    const { tags, ...reportData } = validatedData

    console.log('✅ 数据验证通过')

    // 验证默认用户是否存在
    const defaultUser = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    })

    if (!defaultUser) {
      console.error(`❌ 默认用户不存在: ${DEFAULT_USER_ID}`)
      return NextResponse.json(
        { 
          error: '默认用户不存在，请先初始化数据库',
          hint: '请访问 /debug 页面并点击"初始化数据库"按钮'
        },
        { status: 400 }
      )
    }
    console.log('✅ 默认用户存在:', defaultUser.username)

    // 验证分类是否存在（如果指定了分类）
    if (reportData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: reportData.categoryId }
      })
      
             if (!category) {
         console.warn(`⚠️ 分类不存在: ${reportData.categoryId}，将使用未分类`)
         reportData.categoryId = undefined
       } else {
        console.log('✅ 分类存在:', category.name)
      }
    }

    // 创建报告
    console.log('💾 开始创建报告...')
    const report = await prisma.report.create({
      data: {
        ...reportData,
        userId: DEFAULT_USER_ID,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    console.log('✅ 报告创建成功:', { id: report.id, title: report.title })

    // 如果有标签，处理标签关联
    if (tags && tags.length > 0) {
      console.log('🏷️ 开始处理标签:', tags)
      
      // 创建或获取标签
      const tagRecords = await Promise.all(
        tags.map(async (tagName) => {
          return prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          })
        })
      )

      console.log('✅ 标签处理完成:', tagRecords.map((t: any) => t.name))

      // 创建报告标签关联
      await prisma.reportTag.createMany({
        data: tagRecords.map((tag: any) => ({
          reportId: report.id,
          tagId: tag.id
        }))
      })

      console.log('✅ 标签关联创建完成')

      // 重新获取包含标签的报告
      const reportWithTags = await prisma.report.findUnique({
        where: { id: report.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          },
          reportTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          }
        }
      })

      console.log('🎉 报告创建完成（包含标签）')

      return NextResponse.json({
        message: '报告创建成功',
        report: {
          ...reportWithTags,
          tags: reportWithTags?.reportTags.map((rt: any) => rt.tag) || [],
          reportTags: undefined
        }
      })
    }

    console.log('🎉 报告创建完成（无标签）')

    return NextResponse.json({
      message: '报告创建成功',
      report: {
        ...report,
        tags: []
      }
    })

  } catch (error) {
    console.error('❌ 创建报告失败:', error)
    
    // 详细的错误信息
    let errorMessage = '创建报告失败'
    let errorDetails = error instanceof Error ? error.message : '未知错误'
    
    // 特殊错误处理
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        errorMessage = '报告标题重复'
        errorDetails = '该标题的报告已存在，请使用不同的标题'
      } else if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = '关联数据不存在'
        errorDetails = '指定的分类或用户不存在'
      } else if (error.message.includes('NOT NULL constraint failed')) {
        errorMessage = '必填字段缺失'
        errorDetails = '请确保所有必填字段都已填写'
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 400 }
    )
  }
}

export const GET = getReports
export const POST = createReport 