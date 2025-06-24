import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';

export default async (req: Request, context: Context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    // 检查环境变量
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.NEON_DATABASE_URL || 
                       process.env.POSTGRES_URL ||
                       process.env.DB_URL;

    console.log('🔍 Environment check:');
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
    console.log('All env vars:', Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || key.includes('DB') || key.includes('POSTGRES') || key.includes('NEON')
    ));

    if (!databaseUrl) {
      return new Response(JSON.stringify({
        error: 'No database URL found',
        availableEnvVars: Object.keys(process.env).filter(key => 
          key.includes('DATABASE') || key.includes('DB') || key.includes('POSTGRES') || key.includes('NEON')
        ),
        allEnvVars: Object.keys(process.env).length
      }), {
        status: 500,
        headers
      });
    }

    // 测试数据库连接
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await prisma.$connect();
    console.log('✅ Database connection successful');

    // 检查数据库状态
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const reportCount = await prisma.report.count();

    // 获取分类列表
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        icon: true
      }
    });

    await prisma.$disconnect();

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Database connection successful',
      databaseUrl: databaseUrl.replace(/:[^:@]*@/, ':***@'), // 隐藏密码
      counts: {
        users: userCount,
        categories: categoryCount,
        reports: reportCount
      },
      categories,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return new Response(JSON.stringify({
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/test-db"
};
