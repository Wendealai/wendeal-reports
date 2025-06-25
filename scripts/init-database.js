#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于在 Netlify 部署后手动初始化数据库
 */

const { PrismaClient } = require("@prisma/client");

// 使用你的 Neon 数据库连接
const DATABASE_URL =
  "postgresql://neondb_owner:npg_MbfgQ2a5Oitu@ep-yellow-sunset-a5oyo4gk-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function initializeDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

  try {
    console.log("🚀 开始初始化数据库...");

    // 测试数据库连接
    await prisma.$connect();
    console.log("✅ 数据库连接成功");

    // 推送数据库架构
    console.log("📋 推送数据库架构...");
    const { execSync } = require("child_process");
    execSync("npx prisma db push", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL },
    });

    // 创建默认用户
    const defaultUser = await prisma.user.upsert({
      where: { id: "cmbusc9x00000x2w0fqyu591k" },
      update: {},
      create: {
        id: "cmbusc9x00000x2w0fqyu591k",
        name: "系统管理员",
        email: "admin@wendeal.com",
        role: "admin",
      },
    });
    console.log("✅ 默认用户创建/更新成功:", defaultUser.name);

    // 创建预定义分类
    const categories = [
      {
        id: "predefined-uncategorized",
        name: "未分类",
        description: "未分类的报告",
        color: "#6b7280",
        icon: "folder",
        userId: defaultUser.id,
      },
      {
        id: "predefined-tech-research",
        name: "技术研究",
        description: "技术相关的研究报告",
        color: "#3b82f6",
        icon: "cpu",
        userId: defaultUser.id,
      },
      {
        id: "predefined-market-analysis",
        name: "市场分析",
        description: "市场分析和调研报告",
        color: "#10b981",
        icon: "trending-up",
        userId: defaultUser.id,
      },
      {
        id: "predefined-product-review",
        name: "产品评测",
        description: "产品评测和比较报告",
        color: "#f59e0b",
        icon: "star",
        userId: defaultUser.id,
      },
      {
        id: "predefined-industry-insights",
        name: "行业洞察",
        description: "行业趋势和洞察报告",
        color: "#8b5cf6",
        icon: "lightbulb",
        userId: defaultUser.id,
      },
    ];

    for (const category of categories) {
      const result = await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
        },
        create: category,
      });
      console.log("✅ 分类创建/更新成功:", result.name);
    }

    // 检查数据完整性
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const reportCount = await prisma.report.count();

    console.log("\n📊 数据库状态:");
    console.log(`   用户数量: ${userCount}`);
    console.log(`   分类数量: ${categoryCount}`);
    console.log(`   报告数量: ${reportCount}`);

    console.log("\n🎉 数据库初始化完成！");
    console.log("现在可以尝试上传文件了。");
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
    console.error("详细错误:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
initializeDatabase();
