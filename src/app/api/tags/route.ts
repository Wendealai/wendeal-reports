import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTagSchema } from "@/lib/validations";

// 获取标签列表
async function getTags(request: Request) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            reportTags: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // 格式化返回数据
    const formattedTags = tags.map((tag) => ({
      ...tag,
      reportCount: tag._count.reportTags,
    }));

    return NextResponse.json({
      tags: formattedTags,
    });
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json({ error: "获取标签列表失败" }, { status: 500 });
  }
}

// 创建新标签
async function createTag(request: Request) {
  try {
    const body = await request.json();

    // 验证输入数据
    const validatedData = createTagSchema.parse(body);

    // 检查同名标签是否已存在
    const existingTag = await prisma.tag.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTag) {
      return NextResponse.json({ error: "同名标签已存在" }, { status: 400 });
    }

    // 创建标签
    const tag = await prisma.tag.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            reportTags: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "标签创建成功",
      tag: {
        ...tag,
        reportCount: tag._count.reportTags,
      },
    });
  } catch (error) {
    console.error("Create tag error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "输入数据格式错误", details: error },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}

export const GET = getTags;
export const POST = createTag;
