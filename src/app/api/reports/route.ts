import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReportWithFileSchema } from '@/lib/validations'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { ZodError } from 'zod'
import { optimizeFileContent, formatBytes, formatCompressionRatio } from '@/lib/file-optimization'
import { validateFile } from '@/lib/file-validation'
import { optimizedQueries, cacheManager, measureQuery } from '@/lib/performance'

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
  let uploadedFilePath: string | null = null;

  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const categoryIdFromFrontend = formData.get('categoryId') as string | null

    console.log('📝 接收到的上传数据:', {
      fileName: file?.name,
      fileSize: file?.size,
      categoryIdFromFrontend,
      availableCategories: Object.keys(PREDEFINED_CATEGORY_ID_MAP)
    });

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

    console.log('🔍 开始文件验证...');

    // 综合文件验证
    const validationResult = validateFile(file, fileBuffer, {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['text/html', 'application/xhtml+xml'],
      allowedExtensions: ['.html', '.htm', '.xhtml'],
      checkContent: true,
      strictMode: false, // 允许警告但不阻止上传
      allowExternalResources: true, // 允许外部资源但会记录
      allowScripts: true // 允许脚本（因为很多HTML报告包含CSS/JS框架）
    });

    console.log('✅ 文件验证完成:', {
      isValid: validationResult.isValid,
      errorsCount: validationResult.errors.length,
      warningsCount: validationResult.warnings.length,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    });

    // 如果验证失败，返回详细错误信息
    if (!validationResult.isValid) {
      return NextResponse.json({
        error: '文件验证失败',
        details: validationResult.errors,
        warnings: validationResult.warnings,
        fileInfo: validationResult.fileInfo
      }, { status: 400 });
    }

    // 记录警告信息
    if (validationResult.warnings.length > 0) {
      console.warn('File validation warnings:', validationResult.warnings);
    }

    // 记录安全检查结果
    console.log('Security checks:', validationResult.securityChecks);

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

    // 优化和压缩文件内容
    const optimizationResult = optimizeFileContent(htmlContent, {
      enableCompression: true,
      compressionLevel: 6,
      minSizeForCompression: 1024, // 1KB
      enableHtmlMinification: true,
      removeComments: true,
      removeWhitespace: true
    });

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const fileExtension = path.extname(file.name);
    const fileName = `${new Date().getTime()}-${Math.random().toString(36).substring(2, 10)}${fileExtension}`;
    const fullPath = path.join(uploadDir, fileName);

    // 确保目录存在
    await mkdir(uploadDir, { recursive: true });

    // 写入优化后的文件内容
    const contentToWrite = optimizationResult.isCompressed
      ? Buffer.from(optimizationResult.optimizedContent, 'base64')
      : Buffer.from(optimizationResult.optimizedContent, 'utf-8');

    await writeFile(fullPath, contentToWrite);
    uploadedFilePath = fullPath; // 记录上传的文件路径用于错误清理

    const filePath = `/uploads/${fileName}`;
    const fileSize = file.size;

    console.log('File optimization result:', {
      originalSize: formatBytes(optimizationResult.originalSize),
      compressedSize: formatBytes(optimizationResult.compressedSize),
      compressionRatio: formatCompressionRatio(optimizationResult.compressionRatio),
      isCompressed: optimizationResult.isCompressed
    });

    // 验证输入数据
    const validatedData = createReportWithFileSchema.parse({
      title,
      description,
      content: optimizationResult.isCompressed ? htmlContent : optimizationResult.optimizedContent, // 对于压缩文件，在数据库中存储原始内容用于搜索
      categoryId: finalCategoryId,
      filePath,
      fileSize,
      fileName,
      originalName: file.name,
      mimeType: file.type || 'text/html',
      tags: [], // 简化：暂时不支持在上传时添加标签
    });

    // 从验证数据中分离报告数据和文件数据
    const { tags: validatedTags, filePath: validatedFilePath, fileSize: validatedFileSize,
            fileName: validatedFileName, originalName: validatedOriginalName,
            mimeType: validatedMimeType, ...reportData } = validatedData;

    const fileData = {
      filePath: validatedFilePath,
      fileSize: validatedFileSize,
      fileName: validatedFileName,
      originalName: validatedOriginalName,
      mimeType: validatedMimeType,
    };

    // 验证关键数据存在性
    if (reportData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: reportData.categoryId }
      });
      if (!categoryExists) {
        console.warn(`分类不存在: ${reportData.categoryId}, 使用默认分类`);
        reportData.categoryId = PREDEFINED_CATEGORY_ID_MAP['uncategorized'];
      }
    }

    // 使用事务创建报告和文件记录
    const result = await prisma.$transaction(async (tx) => {
      // 创建报告
      const report = await tx.report.create({
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

      // 创建文件记录
      await tx.file.create({
        data: {
          filename: fileData.fileName || fileName,
          originalName: fileData.originalName || file.name,
          mimeType: fileData.mimeType || 'text/html',
          size: optimizationResult.compressedSize, // 使用压缩后的大小
          path: fileData.filePath || filePath,
          reportId: report.id,
          // 优化信息
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

    // Invalidate cache after successful creation
    cacheManager.invalidateReportCache(result.id);

    return NextResponse.json({
      message: '报告创建成功',
      report: {
        ...result,
        tags: result.reportTags.map(rt => rt.tag),
        reportTags: undefined,
      },
      optimization: {
        originalSize: formatBytes(optimizationResult.originalSize),
        compressedSize: formatBytes(optimizationResult.compressedSize),
        compressionRatio: formatCompressionRatio(optimizationResult.compressionRatio),
        isCompressed: optimizationResult.isCompressed
      }
    })
  } catch (error: any) {
    console.error('Create report error:', error)

    // 清理已上传的文件（如果存在）
    if (uploadedFilePath) {
      try {
        await unlink(uploadedFilePath);
        console.log('Cleaned up uploaded file:', uploadedFilePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: '数据验证失败',
        details: error.errors,
        message: '请检查上传的文件和数据格式'
      }, { status: 400 });
    }

    // Handle Prisma database errors
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: '数据库约束冲突',
        message: '报告标题或文件已存在'
      }, { status: 409 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({
        error: '关联数据不存在',
        message: '指定的分类或用户不存在'
      }, { status: 404 });
    }

    // Handle foreign key constraint violations
    if (error.message && error.message.includes('Foreign key constraint violated')) {
      return NextResponse.json({
        error: '关联数据错误',
        message: '指定的分类ID不存在，请选择有效的分类'
      }, { status: 400 });
    }

    // Handle file system errors
    if (error.code === 'ENOSPC') {
      return NextResponse.json({
        error: '磁盘空间不足',
        message: '服务器存储空间不足，请稍后重试'
      }, { status: 507 });
    }

    if (error.code === 'EACCES') {
      return NextResponse.json({
        error: '文件权限错误',
        message: '服务器文件权限配置错误'
      }, { status: 500 });
    }

    // Generic server error
    return NextResponse.json({
      error: '创建报告失败',
      message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误，请稍后重试'
    }, { status: 500 })
  }
}

export { getReports as GET, createReport as POST } 