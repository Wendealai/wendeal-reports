const { PrismaClient } = require('@prisma/client');

async function createCategory() {
  const prisma = new PrismaClient();
  try {
    // 创建默认用户
    const defaultUserId = 'cmbusc9x00000x2w0fqyu591k';
    let user = await prisma.user.findUnique({
      where: { id: defaultUserId }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: defaultUserId,
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        }
      });
      console.log('创建测试用户成功:', user.id);
    } else {
      console.log('找到现有用户:', user.id);
    }
    
    // 创建测试分类
    const category = await prisma.category.create({
      data: {
        name: '测试分类',
        description: '用于测试的分类',
        userId: user.id
      }
    });
    
    console.log('分类创建成功:', category);
    
    // 查询所有分类
    const categories = await prisma.category.findMany();
    console.log('所有分类:', categories);
  } catch (err) {
    console.error('操作失败:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createCategory();