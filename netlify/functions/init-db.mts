import type { Context, Config } from "@netlify/functions";
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: '方法不允许' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 检查是否已经初始化
    const existingUser = await prisma.user.findFirst();
    if (existingUser) {
      return new Response(JSON.stringify({ 
        message: '数据库已经初始化',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建默认用户
    const hashedPassword = await bcryptjs.hash('admin123', 12);
    
    const user = await prisma.user.create({
      data: {
        id: 'cmbusc9x00000x2w0fqyu591k',
        email: 'admin@wendeal.com',
        username: 'admin',
        password: hashedPassword,
      }
    });

    // 创建默认分类
    const categories = [
      {
        name: '技术研究',
        description: '技术相关的深度研究报告',
        color: '#3B82F6',
        icon: '⚡',
        userId: user.id
      },
      {
        name: '市场分析',
        description: '市场趋势和商业分析报告',
        color: '#10B981',
        icon: '📊',
        userId: user.id
      },
      {
        name: '产品评测',
        description: '产品深度评测和对比分析',
        color: '#F59E0B',
        icon: '🔍',
        userId: user.id
      }
    ];

    await prisma.category.createMany({
      data: categories
    });

    return new Response(JSON.stringify({
      message: '数据库初始化成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('数据库初始化错误:', error);
    return new Response(JSON.stringify({ error: '数据库初始化失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const config: Config = {
  path: "/api/init"
}; 