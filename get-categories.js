const { PrismaClient } = require('@prisma/client');

async function getCategories() {
  const prisma = new PrismaClient();
  try {
    const categories = await prisma.category.findMany();
    console.log('分类列表:', JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error('查询分类失败:', err);
  } finally {
    await prisma.$disconnect();
  }
}

getCategories();