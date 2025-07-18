const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');

    // Create default user if not exists
    const existingUser = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'admin@wendeal.com',
          username: 'admin',
          password: 'hashed_password_placeholder'
        }
      });
      console.log('✅ Default user created');
    } else {
      console.log('✅ Default user already exists');
    }

    // Create predefined categories
    const predefinedCategories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        icon: '📁',
        color: '#6B7280',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        icon: '💻',
        color: '#3B82F6',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        icon: '📈',
        color: '#10B981',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        icon: '🔍',
        color: '#F59E0B',
        userId: DEFAULT_USER_ID
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        icon: '🔬',
        color: '#8B5CF6',
        userId: DEFAULT_USER_ID
      }
    ];

    for (const category of predefinedCategories) {
      const existing = await prisma.category.findUnique({
        where: { id: category.id }
      });

      if (!existing) {
        await prisma.category.create({ data: category });
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`✅ Category already exists: ${category.name}`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
