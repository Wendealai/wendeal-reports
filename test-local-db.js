const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...');
    
    // 1. 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 2. 检查预定义分类
    console.log('\n📋 检查预定义分类...');
    const categories = await prisma.category.findMany();
    console.log(`找到 ${categories.length} 个分类:`, categories.map(c => ({ id: c.id, name: c.name })));
    
    // 3. 检查用户
    console.log('\n👤 检查用户...');
    const users = await prisma.user.findMany();
    console.log(`找到 ${users.length} 个用户:`, users.map(u => ({ id: u.id, username: u.username, email: u.email })));
    
    // 4. 检查报告
    console.log('\n📄 检查报告...');
    const reports = await prisma.report.findMany({
      include: {
        category: true,
        files: true
      }
    });
    console.log(`找到 ${reports.length} 个报告:`, reports.map(r => ({ 
      id: r.id, 
      title: r.title, 
      category: r.category?.name,
      fileCount: r.files.length 
    })));
    
    // 5. 检查文件
    console.log('\n📎 检查文件...');
    const files = await prisma.file.findMany();
    console.log(`找到 ${files.length} 个文件:`, files.map(f => ({ 
      id: f.id, 
      filename: f.filename, 
      originalName: f.originalName,
      size: f.size 
    })));
    
    console.log('\n✅ 数据库测试完成');
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果需要，也可以创建一些测试数据
async function createTestUser() {
  try {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123' // 在实际应用中需要加密
      }
    });
    console.log('✅ 创建测试用户:', testUser);
    return testUser;
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️ 测试用户已存在');
      return await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    }
    throw error;
  }
}

// 运行测试
testDatabase().catch(console.error);
