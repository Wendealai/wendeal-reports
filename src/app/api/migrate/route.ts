import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

interface LocalStorageReport {
  id: string;
  title: string;
  content: string;
  summary?: string;
  status: "draft" | "published" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface MigrationData {
  reports: LocalStorageReport[];
  categories?: Array<{
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }>;
}

// 数据迁移API
async function migrateData(request: AuthenticatedRequest) {
  try {
    const body = (await request.json()) as MigrationData;
    const { reports, categories = [] } = body;

    if (!reports || !Array.isArray(reports)) {
      return NextResponse.json(
        { error: "无效的迁移数据格式" },
        { status: 400 },
      );
    }

    const userId = request.user!.userId;
    const results = {
      categoriesCreated: 0,
      reportsCreated: 0,
      tagsCreated: 0,
      errors: [] as string[],
    };

    // 1. 创建分类映射
    const categoryMap = new Map<string, string>();

    for (const categoryData of categories) {
      try {
        // 检查分类是否已存在
        let category = await prisma.category.findFirst({
          where: {
            name: categoryData.name,
            userId,
          },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              ...categoryData,
              userId,
            },
          });
          results.categoriesCreated++;
        }

        categoryMap.set(categoryData.name, category.id);
      } catch (error) {
        results.errors.push(`创建分类 "${categoryData.name}" 失败: ${error}`);
      }
    }

    // 2. 收集所有标签
    const allTags = new Set<string>();
    reports.forEach((report) => {
      if (report.tags) {
        report.tags.forEach((tag) => allTags.add(tag));
      }
    });

    // 3. 创建标签映射
    const tagMap = new Map<string, string>();

    for (const tagName of allTags) {
      try {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName },
          });
          results.tagsCreated++;
        }

        tagMap.set(tagName, tag.id);
      } catch (error) {
        results.errors.push(`创建标签 "${tagName}" 失败: ${error}`);
      }
    }

    // 4. 迁移报告
    for (const reportData of reports) {
      try {
        // 检查报告是否已存在（基于标题和用户）
        const existingReport = await prisma.report.findFirst({
          where: {
            title: reportData.title,
            userId,
          },
        });

        if (existingReport) {
          results.errors.push(`报告 "${reportData.title}" 已存在，跳过`);
          continue;
        }

        // 创建报告
        const report = await prisma.report.create({
          data: {
            title: reportData.title,
            content: reportData.content,
            summary: reportData.summary,
            status: reportData.status,
            priority: reportData.priority,
            categoryId: reportData.category
              ? categoryMap.get(reportData.category)
              : null,
            userId,
            createdAt: new Date(reportData.createdAt),
            updatedAt: new Date(reportData.updatedAt),
            publishedAt:
              reportData.status === "published"
                ? new Date(reportData.updatedAt)
                : null,
          },
        });

        // 创建标签关联
        if (reportData.tags && reportData.tags.length > 0) {
          const reportTagData = reportData.tags
            .map((tagName) => {
              const tagId = tagMap.get(tagName);
              return tagId ? { reportId: report.id, tagId } : null;
            })
            .filter(Boolean) as Array<{ reportId: string; tagId: string }>;

          if (reportTagData.length > 0) {
            await prisma.reportTag.createMany({
              data: reportTagData,
            });
          }
        }

        results.reportsCreated++;
      } catch (error) {
        results.errors.push(`创建报告 "${reportData.title}" 失败: ${error}`);
      }
    }

    return NextResponse.json({
      message: "数据迁移完成",
      results,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "数据迁移失败", details: error },
      { status: 500 },
    );
  }
}

// 获取迁移状态
async function getMigrationStatus(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    const [reportCount, categoryCount] = await Promise.all([
      prisma.report.count({ where: { userId } }),
      prisma.category.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      hasData: reportCount > 0 || categoryCount > 0,
      reportCount,
      categoryCount,
    });
  } catch (error) {
    console.error("Get migration status error:", error);
    return NextResponse.json({ error: "获取迁移状态失败" }, { status: 500 });
  }
}

export const POST = withAuth(migrateData);
export const GET = withAuth(getMigrationStatus);
