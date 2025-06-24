import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

// 报告创建验证Schema
const createReportSchema = z.object({
  title: z.string().min(1, '报告标题不能为空').max(200, '报告标题不能超过200个字符'),
  content: z.string().min(1, '报告内容不能为空'),
  description: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// 获取报告列表
async function getReports(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const categoryId = url.searchParams.get('categoryId');
    const search = url.searchParams.get('search');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      userId: DEFAULT_USER_ID
    };

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { summary: { contains: search } }
      ];
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
    ]);

    // 格式化返回数据
    const formattedReports = reports.map(report => ({
      ...report,
      tags: report.reportTags.map(rt => rt.tag),
      reportTags: undefined,
      fileCount: report._count.files
    }));

    return new Response(JSON.stringify({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    return new Response(JSON.stringify({ error: '获取报告列表失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 创建新报告
async function createReport(request: Request) {
  try {
    const body = await request.json();
    
    // 验证输入数据
    const validatedData = createReportSchema.parse(body);
    const { tags, ...reportData } = validatedData;

    // 创建报告
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
    });

    // 如果有标签，处理标签关联
    if (tags && tags.length > 0) {
      // 创建或获取标签
      const tagRecords = await Promise.all(
        tags.map(async (tagName) => {
          return prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });
        })
      );

      // 创建报告标签关联
      await prisma.reportTag.createMany({
        data: tagRecords.map(tag => ({
          reportId: report.id,
          tagId: tag.id
        }))
      });

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
      });

      return new Response(JSON.stringify({
        message: '报告创建成功',
        report: {
          ...reportWithTags,
          tags: reportWithTags?.reportTags.map(rt => rt.tag) || [],
          reportTags: undefined
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: '报告创建成功',
      report: {
        ...report,
        tags: []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create report error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: '输入数据格式错误',
        details: error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: '创建报告失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default async (req: Request, context: Context) => {
  try {
    switch (req.method) {
      case 'GET':
        return await getReports(req);
      case 'POST':
        return await createReport(req);
      default:
        return new Response(JSON.stringify({ error: '方法不允许' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } finally {
    await prisma.$disconnect();
  }
};

export const config: Config = {
  path: "/api/reports"
}; 