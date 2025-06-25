const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("🔄 正在创建管理员用户...");

    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@wendeal.com" },
    });

    if (existingAdmin) {
      console.log("✅ 管理员用户已存在");
      return;
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash("zwyy0323", 12);

    // 创建管理员用户
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@wendeal.com",
        username: "admin",
        password: hashedPassword,
      },
    });

    console.log("✅ 管理员用户创建成功:", {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
    });
  } catch (error) {
    console.error("❌ 创建管理员用户失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
