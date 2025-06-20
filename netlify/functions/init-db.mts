import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';

// Context7最佳实践：全局Prisma实例管理
let prisma: PrismaClient | null = null;

function getPrismaClient() {
  if (!prisma) {
    console.log('🔧 [Init-DB] Creating new Prisma client for serverless environment');
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "file:/tmp/dev.db?connection_limit=1&pool_timeout=10"
        }
      }
    });
  }
  return prisma;
}

// Context7最佳实践：运行时数据库初始化
async function initializeDatabase() {
  const client = getPrismaClient();
  const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k';
  
  try {
    console.log('🌱 [Init-DB] Starting database initialization...');

    // 1. 测试数据库连接
    await client.$queryRaw`SELECT 1 as test`;
    console.log('✅ [Init-DB] Database connection established');

    // 2. 检查是否已初始化
    const userCount = await client.user.count();
    if (userCount > 0) {
      console.log('✅ [Init-DB] Database already initialized');
      return { success: true, message: '数据库已初始化', alreadyInitialized: true };
    }

    // 3. 创建默认用户
    console.log('👤 [Init-DB] Creating default user...');
    await client.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: 'demo@wendeal.com',
        username: 'demo',
        password: 'not-used'
      }
    });

    // 4. 创建预定义分类
    console.log('📁 [Init-DB] Creating predefined categories...');
    const predefinedCategories = [
      {
        id: 'predefined-uncategorized',
        name: '未分类',
        description: '默认分类',
        color: '#6B7280',
        icon: '📁'
      },
      {
        id: 'predefined-tech-research',
        name: '技术研究',
        description: '技术研究相关文档',
        color: '#3B82F6',
        icon: '💻'
      },
      {
        id: 'predefined-market-analysis',
        name: '市场分析',
        description: '市场分析报告',
        color: '#10B981',
        icon: '📈'
      },
      {
        id: 'predefined-product-review',
        name: '产品评测',
        description: '产品评测文档',
        color: '#F59E0B',
        icon: '🔍'
      },
      {
        id: 'predefined-industry-insights',
        name: '行业洞察',
        description: '行业洞察分析',
        color: '#8B5CF6',
        icon: '🔬'
      }
    ];

    for (const categoryData of predefinedCategories) {
      await client.category.upsert({
        where: { id: categoryData.id },
        update: {},
        create: {
          ...categoryData,
          userId: DEFAULT_USER_ID
        }
      });
    }

    // 5. 验证初始化结果
    const [finalUserCount, categoryCount] = await Promise.all([
      client.user.count(),
      client.category.count()
    ]);

    console.log('🎉 [Init-DB] Database initialization completed successfully!', {
      users: finalUserCount,
      categories: categoryCount
    });

    return {
      success: true,
      message: '数据库初始化成功',
      stats: {
        users: finalUserCount,
        categories: categoryCount
      }
    };

  } catch (error) {
    console.error('❌ [Init-DB] Database initialization failed:', error);
    throw error;
  }
}

export default async (req: Request, context: Context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    console.log(`📡 [Init-DB] ${req.method} request received`);
    
    // 执行数据库初始化
    const result = await initializeDatabase();
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('❌ [Init-DB] Function error:', error);
    
    const errorResponse = {
      success: false,
      message: '数据库初始化失败',
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message
      } : undefined
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/init/database"
}; 