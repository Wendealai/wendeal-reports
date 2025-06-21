import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';

// Context7最佳实践：在函数外部实例化PrismaClient
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  // Context7关键修复：Netlify环境专用配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:/tmp/dev.db?connection_limit=1&pool_timeout=10&socket_timeout=10"
    }
  }
});

// Context7最佳实践：幂等的数据库初始化
async function initializeDatabase() {
  const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k';
  
  try {
    console.log('🚀 [Init-DB] Starting initialization...');

    // 快速连接测试
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [Init-DB] Database connection verified');

    // 检查是否已初始化（优化查询）
    const userExists = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      select: { id: true }
    });

    if (userExists) {
      console.log('✅ [Init-DB] Database already initialized');
      return { 
        success: true, 
        message: '数据库已初始化', 
        alreadyInitialized: true 
      };
    }

    console.log('⚡ [Init-DB] Initializing database...');

    // Context7推荐：使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 创建默认用户
      await tx.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'demo@wendeal.com',
          username: 'demo',
          password: 'demo-password'
        }
      });

      // 创建预定义分类
      const categories = [
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
        }
      ];

      await tx.category.createMany({
        data: categories.map(cat => ({
          ...cat,
          userId: DEFAULT_USER_ID
        }))
      });
    });

    // 验证结果
    const [userCount, categoryCount] = await Promise.all([
      prisma.user.count(),
      prisma.category.count()
    ]);

    console.log('🎉 [Init-DB] Success!', { users: userCount, categories: categoryCount });

    return {
      success: true,
      message: '数据库初始化成功',
      stats: { users: userCount, categories: categoryCount }
    };

  } catch (error) {
    console.error('❌ [Init-DB] Failed:', error);
    throw error;
  }
}

export default async (req: Request, context: Context) => {
  // Context7推荐：标准CORS头
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    console.log(`📡 [Init-DB] ${req.method} request from ${req.url}`);
    
    const result = await initializeDatabase();
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('❌ [Init-DB] Function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '数据库初始化失败',
      error: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/init/database"
}; 