import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateReportSchema } from "@/lib/validations";
import { DEFAULT_USER_ID, PREDEFINED_CATEGORY_ID_MAP } from "@/lib/database-init";
import { ZodError } from "zod";

// 获取单个报告
async function getReport(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        reportTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "报告不存在" }, { status: 404 });
    }

    // 格式化返回数据
    const formattedReport = {
      ...report,
      tags: report.reportTags.map((rt) => rt.tag),
      reportTags: undefined,
    };

    return NextResponse.json({ report: formattedReport });
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json({ error: "获取报告失败" }, { status: 500 });
  }
}

// 更新报告
async function updateReport(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    // 验证输入数据
    const validatedData = updateReportSchema.parse(body);
    const { tags, categoryId, ...reportData } = validatedData;

    console.log("📝 Report update request:", {
      reportId: params.id,
      categoryId,
      validatedData
    });

    // 检查报告是否存在且属于当前用户
    const existingReport = await prisma.report.findFirst({
      where: {
        id: params.id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "报告不存在" }, { status: 404 });
    }

    // 处理分类ID映射
    let finalCategoryId = categoryId;
    if (categoryId) {
      // 检查是否为预定义分类的前端ID
      if (PREDEFINED_CATEGORY_ID_MAP[categoryId]) {
        finalCategoryId = PREDEFINED_CATEGORY_ID_MAP[categoryId];
        console.log("🔄 Category ID mapped:", categoryId, "→", finalCategoryId);
      } else {
        // 验证分类是否存在
        try {
          const category = await prisma.category.findUnique({
            where: { id: categoryId },
          });
          if (!category) {
            console.warn(`分类不存在: ${categoryId}, 保持原分类`);
            finalCategoryId = undefined; // 不更新分类
          }
        } catch (e) {
          console.warn(`检查分类时出错: ${categoryId}`, e);
          finalCategoryId = undefined; // 不更新分类
        }
      }
    }

    // 构建更新数据
    const updateData: any = { ...reportData };
    if (finalCategoryId !== undefined) {
      updateData.categoryId = finalCategoryId;
    }

    console.log("💾 Final update data:", updateData);

    // 更新报告基本信息
    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // 如果提供了标签，更新标签关联
    if (tags !== undefined) {
      // 删除现有的标签关联
      await prisma.reportTag.deleteMany({
        where: { reportId: params.id },
      });

      if (tags.length > 0) {
        // 创建或获取标签
        const tagRecords = await Promise.all(
          tags.map(async (tagName) => {
            return prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });
          }),
        );

        // 创建新的标签关联
        await prisma.reportTag.createMany({
          data: tagRecords.map((tag) => ({
            reportId: params.id,
            tagId: tag.id,
          })),
        });
      }
    }

    // 重新获取包含标签的报告
    const reportWithTags = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        reportTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "报告更新成功",
      report: {
        ...reportWithTags,
        tags: reportWithTags?.reportTags.map((rt) => rt.tag) || [],
        reportTags: undefined,
      },
    });
  } catch (error) {
    console.error("Update report error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "输入数据格式错误", details: error },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "更新报告失败" }, { status: 500 });
  }
}

// 删除报告
async function deleteReport(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // 检查报告是否存在且属于当前用户
    const existingReport = await prisma.report.findFirst({
      where: {
        id: params.id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "报告不存在" }, { status: 404 });
    }

    // 删除相关的标签关联
    await prisma.reportTag.deleteMany({
      where: { reportId: params.id },
    });

    // 删除相关的文件
    await prisma.file.deleteMany({
      where: { reportId: params.id },
    });

    // 删除报告
    await prisma.report.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "报告删除成功",
    });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "删除报告失败" }, { status: 500 });
  }
}

export const GET = getReport;
export const PUT = updateReport;
export const DELETE = deleteReport;
