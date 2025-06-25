const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

// 检查环境和文件系统
function checkEnvironment() {
  console.log("=== 环境检查 ===");

  // 检查上传目录
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log(`上传目录 ${uploadDir} 可写: 是`);
  } catch (err) {
    console.log(`上传目录 ${uploadDir} 可写: 否`, err.message);
  }

  // 检查数据库文件
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  try {
    fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
    console.log(`数据库文件 ${dbPath} 可读写: 是`);
    const stats = fs.statSync(dbPath);
    console.log(`数据库文件大小: ${stats.size} 字节`);
  } catch (err) {
    console.log(`数据库文件 ${dbPath} 可读写: 否`, err.message);
  }
}

// 测试数据库连接和操作
async function testDatabase() {
  console.log("\n=== 数据库测试 ===");

  let prisma;
  try {
    prisma = new PrismaClient();
    console.log("PrismaClient 实例化成功");

    // 测试连接
    await prisma.$connect();
    console.log("数据库连接成功");

    // 测试查询
    const categoriesCount = await prisma.category.count();
    console.log(`数据库中的分类数量: ${categoriesCount}`);

    // 创建测试用户
    const defaultUserId =
      process.env.DEFAULT_USER_ID || "cmbusc9x00000x2w0fqyu591k";
    console.log(`使用默认用户ID: ${defaultUserId}`);

    // 检查用户是否存在
    let testUser;
    try {
      testUser = await prisma.user.findUnique({
        where: { id: defaultUserId },
      });
    } catch (err) {
      console.log("查询用户失败，尝试创建测试用户");
    }

    if (!testUser) {
      try {
        testUser = await prisma.user.create({
          data: {
            id: defaultUserId,
            email: "test@example.com",
            username: "testuser",
            password: "password123",
          },
        });
        console.log("创建测试用户成功:", testUser.id);
      } catch (err) {
        console.error("创建测试用户失败:", err);
      }
    } else {
      console.log("找到现有用户:", testUser.id);
    }

    // 测试创建记录
    try {
      const testReport = await prisma.report.create({
        data: {
          title: "测试报告",
          content: "测试内容",
          summary: "测试摘要",
          status: "DRAFT",
          priority: "MEDIUM",
          userId: defaultUserId,
          categoryId: null, // 先不关联分类
          files: {
            create: {
              filename: "test-file.html",
              originalName: "test-file.html",
              mimeType: "text/html",
              size: 100,
              path: "/uploads/test-file.html",
            },
          },
        },
      });
      console.log("测试报告创建成功:", testReport.id);

      // 清理测试数据
      await prisma.report.delete({ where: { id: testReport.id } });
      console.log("测试数据清理完成");
    } catch (err) {
      console.error("创建测试报告失败:", err);
    }
  } catch (err) {
    console.error("数据库操作失败:", err);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log("数据库连接已关闭");
    }
  }
}

// 测试文件上传模拟
function testFileUpload() {
  console.log("\n=== 文件上传测试 ===");

  const testFilePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "test-upload.html",
  );
  const testContent =
    "<html><body><h1>测试文档</h1><p>这是一个测试文档</p></body></html>";

  try {
    fs.writeFileSync(testFilePath, testContent);
    console.log(`测试文件写入成功: ${testFilePath}`);

    // 检查文件是否成功写入
    const fileContent = fs.readFileSync(testFilePath, "utf8");
    console.log("文件内容验证:", fileContent === testContent ? "成功" : "失败");

    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log("测试文件清理完成");
  } catch (err) {
    console.error("文件操作失败:", err);
  }
}

// 运行所有测试
async function runTests() {
  try {
    checkEnvironment();
    await testDatabase();
    testFileUpload();
    console.log("\n所有测试完成");
  } catch (err) {
    console.error("测试过程中发生错误:", err);
  }
}

runTests();
