import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReportSchema } from '@/lib/validations'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// 预定义分类的前端ID到数据库ID的映射
const PREDEFINED_CATEGORY_ID_MAP: Record<string, string> = {
  'uncategorized': 'predefined-uncategorized',
  'tech-research': 'predefined-tech-research',
  'market-analysis': 'predefined-market-analysis',
  'product-review': 'predefined-product-review',
  'industry-insights': 'predefined-industry-insights',
};

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'

// 获取报告列表
async function getReports(request: Request) {
  try {
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

    // 格式化返回数据
    const formattedReports = reports.map(report => ({
      ...report,
      tags: report.reportTags.map(rt => rt.tag),
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
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: '获取报告列表失败' },
      { status: 500 }
    )
  }
}

// 创建新报告
async function createReport(request: Request) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const categoryIdFromFrontend = formData.get('categoryId') as string | null

    if (!file) {
      return NextResponse.json({ error: '没有提供文件' }, { status: 400 });
    }

    let finalCategoryId: string | null = null;
    if (categoryIdFromFrontend) {
      // 1. 检查是否为已知的预定义分类
      if (PREDEFINED_CATEGORY_ID_MAP[categoryIdFromFrontend]) {
        finalCategoryId = PREDEFINED_CATEGORY_ID_MAP[categoryIdFromFrontend];
      } else {
        // 2. 如果不是预定义分类，检查该ID是否存在于数据库中
        try {
          const category = await prisma.category.findUnique({
            where: { id: categoryIdFromFrontend },
          });
          if (category) {
            finalCategoryId = category.id;
          }
        } catch (e) {
          // 忽略无效ID格式可能导致的Prisma错误
          console.warn(`查找ID为 ${categoryIdFromFrontend} 的分类时出错:`, e)
        }
      }
    }

    // 3. 如果未找到有效分类，则回退到"未分类"
    if (!finalCategoryId) {
        console.warn(`分类ID "${categoryIdFromFrontend}" 未找到或无效。回退到 '未分类'.`);
        finalCategoryId = PREDEFINED_CATEGORY_ID_MAP['uncategorized'];
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const fileExtension = path.extname(file.name);
    const fileName = `${new Date().getTime()}-${Math.random().toString(36).substring(2, 10)}${fileExtension}`;
    const fullPath = path.join(uploadDir, fileName);

    // 确保目录存在
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    await writeFile(fullPath, fileBuffer);
    
    const filePath = `/uploads/${fileName}`;
    const fileSize = file.size;

    // --- 后端提取元数据 ---
    const htmlContent = fileBuffer.toString('utf-8');
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : file.name.replace(/\.html$/i, '');
    
    // 使用一个简单的<p>标签或者<body>的开头作为描述
    const pMatch = htmlContent.match(/<p>(.*?)<\/p>/);
    let description = pMatch ? pMatch[1].substring(0, 200) : '';
    if (!description) {
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        if (bodyMatch) {
            description = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
        }
    }
    // --- 元数据提取结束 ---

    // 验证输入数据
    const validatedData = createReportSchema.parse({
      title,
      description,
      content: htmlContent, // 将完整HTML内容用于索引
      categoryId: finalCategoryId,
      filePath,
      fileSize,
      tags: [], // 简化：暂时不支持在上传时添加标签
    });
    
    // 从验证数据中移除标签
    const { tags: validatedTags, ...reportData } = validatedData;

    // 创建报告
    const report = await prisma.report.create({
      data: {
        ...reportData,
        userId: DEFAULT_USER_ID,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
        reportTags: {
            include: {
              tag: { select: { id: true, name: true, color: true } },
            },
          },
      },
    });

    return NextResponse.json({
      message: '报告创建成功',
      report: {
        ...report,
        tags: report.reportTags.map(rt => rt.tag),
        reportTags: undefined,
      },
    })
  } catch (error: any) {
    console.error('Create report error:', error)
    if (error instanceof require('zod').ZodError) {
      return NextResponse.json({ error: '数据验证失败', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: '创建报告失败' }, { status: 500 })
  }
}

export { getReports as GET, createReport as POST } 