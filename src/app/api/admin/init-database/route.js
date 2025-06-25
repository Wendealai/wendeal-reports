import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();
const DEFAULT_USER_ID = 'cmbusc9x00000x2w0fqyu591k';

export async function POST(request) {
  try {
    console.log('🚀 开始初始化Vercel生产环境数据库...');
    
    // 验证环境变量
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'DATABASE_URL环境变量未配置',
        message: '请在Vercel项目设置中配置DATABASE_URL'
      }, { status: 500 });
    }

    const results = {
      user: null,
      categories: [],
      status: 'success'
    };

    // 创建默认用户（如果不存在）
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
      results.user = 'created';
      console.log('✅ 默认用户创建成功');
    } else {
      results.user = 'exists';
      console.log('✅ 默认用户已存在');
    }

    // 创建预定义分类
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
        results.categories.push({
          name: category.name,
          status: 'created'
        });
        console.log(`✅ 分类创建成功: ${category.name}`);
      } else {
        results.categories.push({
          name: category.name,
          status: 'exists'
        });
        console.log(`✅ 分类已存在: ${category.name}`);
      }
    }

    // 验证数据
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const reportCount = await prisma.report.count();
    
    console.log('📊 数据库状态:');
    console.log(`   用户数量: ${userCount}`);
    console.log(`   分类数量: ${categoryCount}`);
    console.log(`   报告数量: ${reportCount}`);

    console.log('🎉 生产环境数据库初始化完成！');

    return NextResponse.json({
      success: true,
      message: '生产环境数据库初始化完成！',
      data: {
        ...results,
        statistics: {
          users: userCount,
          categories: categoryCount,
          reports: reportCount
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '数据库初始化失败',
      message: error.message,
      details: {
        code: error.code,
        meta: error.meta
      },
      troubleshooting: [
        '检查Vercel环境变量中的DATABASE_URL是否正确配置',
        '确认数据库连接字符串是否有效',
        '验证数据库权限是否充足',
        '检查网络连接是否正常'
      ]
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// 支持GET请求用于健康检查
export async function GET() {
  return NextResponse.json({
    message: '数据库初始化API端点',
    usage: '发送POST请求来初始化数据库',
    endpoint: '/api/admin/init-database'
  });
}
