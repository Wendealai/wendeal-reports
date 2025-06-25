import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = "cmbusc9x00000x2w0fqyu591k";

// 分类创建验证Schema
const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "分类名称不能为空")
    .max(50, "分类名称不能超过50个字符"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

// 获取分类列表
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: DEFAULT_USER_ID,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            description: true,
          },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 格式化返回数据
    const formattedCategories = categories.map((category) => ({
      ...category,
      reportCount: category._count.reports,
    }));

    return new Response(
      JSON.stringify({
        categories: formattedCategories,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return new Response(JSON.stringify({ error: "获取分类列表失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 创建新分类
async function createCategory(request: Request) {
  try {
    const body = await request.json();

    // 验证输入数据
    const validatedData = createCategorySchema.parse(body);

    // 如果指定了父分类，检查父分类是否存在且属于当前用户
    if (validatedData.parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: validatedData.parentId,
          userId: DEFAULT_USER_ID,
        },
      });

      if (!parentCategory) {
        return new Response(JSON.stringify({ error: "父分类不存在" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 检查同名分类是否已存在
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        userId: DEFAULT_USER_ID,
        parentId: validatedData.parentId || null,
      },
    });

    if (existingCategory) {
      return new Response(JSON.stringify({ error: "同名分类已存在" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
            icon: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            description: true,
          },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        message: "分类创建成功",
        category: {
          ...category,
          reportCount: category._count.reports,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Create category error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "输入数据格式错误",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "创建分类失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default async (req: Request, context: Context) => {
  try {
    switch (req.method) {
      case "GET":
        return await getCategories();
      case "POST":
        return await createCategory(req);
      default:
        return new Response(JSON.stringify({ error: "方法不允许" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
    }
  } finally {
    await prisma.$disconnect();
  }
};

export const config: Config = {
  path: "/api/categories",
};
