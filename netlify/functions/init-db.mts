import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';

// Context7最佳实践：在函数外部实例化PrismaClient
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  // Context7关键修复：移除SQLite特定配置，使用环境变量
  errorFormat: 'minimal'
});

// Context7最佳实践：幂等的数据库初始化
async function initializeDatabase() {
  const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k';
  
  try {
    console.log('🚀 [Init-DB] Starting initialization...');
    console.log('🔧 [Init-DB] Environment:', {
      nodeEnv: process.env.NODE_ENV,
      isNetlify: process.env.NETLIFY === 'true',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL
    });

    // Context7推荐：显式连接和测试
    console.log('🔍 [Init-DB] Testing database connection...');
    await prisma.$connect();
    
    // 快速连接测试
    const testResult = await prisma.$queryRaw`SELECT 1 as test, version() as version`;
    console.log('✅ [Init-DB] Database connection verified:', testResult);

    // 检查是否已初始化（优化查询）
    const userExists = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      select: { id: true, email: true }
    });

    if (userExists) {
      console.log('✅ [Init-DB] Database already initialized for user:', userExists.email);
      
      // 获取统计信息
      const [userCount, categoryCount, reportCount] = await Promise.all([
        prisma.user.count(),
        prisma.category.count(),
        prisma.report.count()
      ]);
      
      return { 
        success: true, 
        message: '数据库已初始化', 
        alreadyInitialized: true,
        stats: { users: userCount, categories: categoryCount, reports: reportCount }
      };
    }

    console.log('⚡ [Init-DB] Initializing database with default data...');

    // Context7推荐：使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 创建默认用户
      await tx.user.create({
        data: {
          id: DEFAULT_USER_ID,
          email: 'demo@wendeal.com',
          username: 'demo',
          name: 'Demo User',
          role: 'admin',
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
          icon: '📁',
          type: 'predefined',
          isSystem: true
        },
        {
          id: 'predefined-tech-research', 
          name: '技术研究',
          description: '技术研究相关文档',
          color: '#3B82F6',
          icon: '💻',
          type: 'predefined',
          isSystem: true
        },
        {
          id: 'predefined-market-analysis',
          name: '市场分析', 
          description: '市场分析报告',
          color: '#10B981',
          icon: '📈',
          type: 'predefined',
          isSystem: true
        },
        {
          id: 'predefined-business-plan',
          name: '商业计划',
          description: '商业计划文档',
          color: '#F59E0B',
          icon: '📊',
          type: 'predefined',
          isSystem: true
        }
      ];

      // Context7推荐：批量创建分类
      await tx.category.createMany({
        data: categories.map(cat => ({
          ...cat,
          userId: DEFAULT_USER_ID
        }))
      });
      
      // 创建示例报告
      await tx.report.create({
        data: {
          id: 'demo-report-001',
          title: '欢迎使用Wendeal报告系统',
          content: `<h1>欢迎使用Wendeal报告系统</h1>
<p>这是一个演示报告，展示了系统的基本功能。</p>
<h2>主要特性</h2>
<ul>
<li>📝 创建和编辑报告</li>
<li>📁 分类管理</li>
<li>🏷️ 标签系统</li>
<li>🔍 高级搜索</li>
<li>📱 响应式设计</li>
</ul>
<p>您可以开始创建自己的报告了！</p>`,
          description: '系统演示报告，展示基本功能',
          status: 'published',
          priority: 'medium',
          categoryId: 'predefined-uncategorized',
          userId: DEFAULT_USER_ID,
          publishedAt: new Date()
        }
      });
    }, {
      timeout: 10000 // Context7推荐：设置事务超时
    });

    // 验证结果
    const [userCount, categoryCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.report.count()
    ]);

    console.log('🎉 [Init-DB] Success!', { users: userCount, categories: categoryCount, reports: reportCount });

    return {
      success: true,
      message: '数据库初始化成功',
      stats: { users: userCount, categories: categoryCount, reports: reportCount }
    };

  } catch (error) {
    console.error('❌ [Init-DB] Failed:', error);
    
    // Context7推荐：详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    let troubleshooting = [];
    
    if (errorMessage.includes('timeout')) {
      troubleshooting.push('数据库连接超时，请检查Neon数据库状态');
    }
    if (errorMessage.includes('authentication')) {
      troubleshooting.push('数据库认证失败，请检查DATABASE_URL');
    }
    if (errorMessage.includes('network')) {
      troubleshooting.push('网络连接问题，请稍后重试');
    }
    
    throw new Error(`${errorMessage}${troubleshooting.length > 0 ? ' 建议: ' + troubleshooting.join(', ') : ''}`);
  } finally {
    // Context7最佳实践：确保连接清理
    await prisma.$disconnect();
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
    console.log('📡 [Init-DB] Netlify context:', {
      requestId: context.requestId,
      region: context.geo?.region
    });
    
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
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers
    });
  }
};

export const config: Config = {
  path: "/api/init/database"
}; 