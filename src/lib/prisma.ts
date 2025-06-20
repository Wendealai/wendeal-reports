import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// 基于Context7最佳实践的Prisma配置
// 针对Netlify等无服务器环境优化
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    // 添加连接池配置以防止连接耗尽
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

// 在无服务器环境中重用PrismaClient实例
export const prisma = globalThis.__prisma ?? createPrismaClient()

// 仅在开发环境中缓存实例，生产环境中避免缓存
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// 添加优雅关闭处理
if (typeof window === 'undefined') {
  // 只在服务端添加关闭处理器
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

// 导出连接测试函数
export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { success: true, message: '数据库连接正常' }
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return { 
      success: false, 
      message: `数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      error
    }
  }
}

// 导出数据库状态检查函数
export async function getDatabaseStatus() {
  try {
    const userCount = await prisma.user.count()
    const reportCount = await prisma.report.count()
    const categoryCount = await prisma.category.count()
    
    return {
      connected: true,
      userCount,
      reportCount,
      categoryCount,
      hasData: userCount > 0 || reportCount > 0 || categoryCount > 0
    }
  } catch (error) {
    console.error('获取数据库状态失败:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
} 