const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🚀 开始数据库连接测试...');
  try {
    console.log('🔄 正在连接到数据库...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');

    console.log('🔍 正在尝试查询一个用户...');
    const user = await prisma.user.findFirst();

    if (user) {
      console.log('👤 查询成功，找到用户:', user.username);
    } else {
      console.warn('⚠️ 未找到任何用户，但这仍然表示查询执行成功。');
    }

    console.log('🎉 数据库连接和查询测试通过！');
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    process.exit(1);
  } finally {
    console.log('🛑 正在断开数据库连接...');
    await prisma.$disconnect();
    console.log('👋 连接已断开。');
  }
}

main(); 