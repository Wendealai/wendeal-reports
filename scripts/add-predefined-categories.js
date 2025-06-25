const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 默认用户 ID - 需要先创建用户
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

async function addPredefinedCategories() {
  console.log('🔄 开始添加预定义分类和用户...');
  
  try {
    // 1. 先确保默认用户存在
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: 'admin@wendeal.com',
        username: 'admin',
        password: 'hashed_password_placeholder',
        avatar: null,
      },
    });
    console.log('✅ 默认用户已确保存在');

    // 2. 添加预定义分类
    const categories = [
      { id: "predefined-uncategorized", name: "未分类", description: "暂无分类", icon: "📁", color: "#6b7280", userId: DEFAULT_USER_ID },
      { id: "predefined-tech-research", name: "技术研究", description: "技术研究报告类", icon: "💻", color: "#3b82f6", userId: DEFAULT_USER_ID },
      { id: "predefined-market-analysis", name: "市场分析", description: "市场分析报告类", icon: "📊", color: "#8b5cf6", userId: DEFAULT_USER_ID },
      { id: "predefined-product-review", name: "产品评测", description: "产品评测报告类", icon: "🔍", color: "#f59e0b", userId: DEFAULT_USER_ID },
      { id: "predefined-industry-insights", name: "行业洞察", description: "行业洞察报告类", icon: "🔬", color: "#10b981", userId: DEFAULT_USER_ID },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
        },
        create: category,
      });
      console.log(`✅ 分类 "${category.name}" (${category.id}) 已添加/更新`);
    }

    console.log('🎉 预定义分类和用户设置完成！');
    
    // 3. 验证数据
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    console.log(`📊 数据统计: 用户 ${userCount} 个，分类 ${categoryCount} 个`);
    
  } catch (error) {
    console.error('❌ 设置过程中出错:', error);
    throw error;
  }
}

addPredefinedCategories()
  .then(() => {
    console.log('✅ 脚本执行完成');
  })
  .catch(e => {
    console.error('❌ 脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

