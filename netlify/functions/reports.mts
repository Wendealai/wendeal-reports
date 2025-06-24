import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { optimizeFileContent, formatBytes, formatCompressionRatio } from '../../src/lib/file-optimization';
import { validateFile } from '../../src/lib/file-validation';
import { cacheManager } from '../../src/lib/performance';

// 初始化 Prisma 客户端
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: Netlify.env.get('DATABASE_URL'),
    },
  },
});

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

// 预定义分类ID映射
const PREDEFINED_CATEGORY_ID_MAP = {
  'uncategorized': 'predefined-uncategorized',
  'tech-research': 'predefined-tech-research',
  'market-analysis': 'predefined-market-analysis',
  'product-review': 'predefined-product-review',
  'industry-insights': 'predefined-industry-insights',
};

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

// 创建新报告（支持文件上传）
async function createReport(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // 处理文件上传
      return await createReportFromFile(request);
    } else {
      // 处理JSON数据
      return await createReportFromJSON(request);
    }
  } catch (error) {
    console.error('Create report error:', error);
    return new Response(JSON.stringify({ error: '创建报告失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 从文件创建报告
async function createReportFromFile(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const categoryIdFromFrontend = formData.get('categoryId') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: '没有提供文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 综合文件验证
    const validationResult = validateFile(file, fileBuffer, {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['text/html', 'application/xhtml+xml'],
      allowedExtensions: ['.html', '.htm', '.xhtml'],
      checkContent: true,
      strictMode: false,
      allowExternalResources: true,
      allowScripts: true
    });

    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        error: '文件验证失败',
        details: validationResult.errors,
        warnings: validationResult.warnings,
        fileInfo: validationResult.fileInfo
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 提取元数据
    const htmlContent = fileBuffer.toString('utf-8');
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : file.name.replace(/\.html$/i, '');

    const pMatch = htmlContent.match(/<p>(.*?)<\/p>/);
    let description = pMatch ? pMatch[1].substring(0, 200) : '';
    if (!description) {
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      if (bodyMatch) {
        description = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
      }
    }

    // 优化和压缩文件内容
    const optimizationResult = optimizeFileContent(htmlContent, {
      enableCompression: true,
      compressionLevel: 6,
      minSizeForCompression: 1024,
      enableHtmlMinification: true,
      removeComments: true,
      removeWhitespace: true
    });

    // 映射分类ID
    const categoryId = categoryIdFromFrontend && PREDEFINED_CATEGORY_ID_MAP[categoryIdFromFrontend as keyof typeof PREDEFINED_CATEGORY_ID_MAP]
      ? PREDEFINED_CATEGORY_ID_MAP[categoryIdFromFrontend as keyof typeof PREDEFINED_CATEGORY_ID_MAP]
      : PREDEFINED_CATEGORY_ID_MAP['uncategorized'];

    // 验证数据
    const reportData = {
      title,
      description,
      content: optimizationResult.isCompressed ? htmlContent : optimizationResult.optimizedContent,
      status: 'draft' as const,
      priority: 'medium' as const,
      categoryId,
    };

    // 使用事务创建报告
    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          ...reportData,
          userId: DEFAULT_USER_ID,
        },
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
      });

      // 创建文件记录
      await tx.file.create({
        data: {
          filename: file.name,
          originalName: file.name,
          mimeType: 'text/html',
          size: optimizationResult.compressedSize,
          path: `/virtual/${report.id}`, // 虚拟路径，因为Netlify不支持文件存储
          reportId: report.id,
          originalSize: optimizationResult.originalSize,
          compressedSize: optimizationResult.compressedSize,
          isCompressed: optimizationResult.isCompressed,
          compressionRatio: optimizationResult.compressionRatio,
          optimizationInfo: {
            compressionEnabled: true,
            minificationEnabled: true,
            compressionLevel: 6,
            optimizedAt: new Date().toISOString(),
            savings: {
              bytes: optimizationResult.originalSize - optimizationResult.compressedSize,
              percentage: optimizationResult.compressionRatio
            }
          }
        },
      });

      return report;
    });

    // 清理缓存
    cacheManager.invalidateReportCache(result.id);

    return new Response(JSON.stringify({
      message: '报告创建成功',
      report: result,
      optimization: {
        originalSize: formatBytes(optimizationResult.originalSize),
        compressedSize: formatBytes(optimizationResult.compressedSize),
        compressionRatio: formatCompressionRatio(optimizationResult.compressionRatio),
        isCompressed: optimizationResult.isCompressed
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Create report from file error:', error);
    return new Response(JSON.stringify({ error: '从文件创建报告失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 从JSON创建报告
async function createReportFromJSON(request: Request) {
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