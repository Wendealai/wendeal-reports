import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Context7最佳实践：针对Netlify无服务器环境的简化Prisma配置
const createPrismaClient = () => {
  const isNetlify = process.env.NETLIFY === 'true'
  const isProduction = process.env.NODE_ENV === 'production'
  
  console.log(`🔧 [Prisma] Initializing for ${isNetlify ? 'Netlify' : 'local'} environment`)

  const client = new PrismaClient({
    // Context7推荐：简化日志配置
    log: isProduction ? ['error'] : ['error', 'warn'],
    errorFormat: 'minimal',
    
    // Context7最佳实践：环境适应的数据库配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL || (
          isNetlify 
            ? "file:/tmp/dev.db?connection_limit=1&pool_timeout=10"
            : "file:./prisma/dev.db?connection_limit=1&pool_timeout=10"
        )
      }
    }
  })

  return client
}

// Context7最佳实践：无服务器环境实例管理
export const prisma = globalThis.__prisma ?? createPrismaClient()

// 仅在开发环境中缓存实例
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Context7最佳实践：简化的连接测试
export async function testDatabaseConnection() {
  try {
    console.log('🔌 [Prisma] Testing connection...')
    const startTime = Date.now()
    
    await prisma.$queryRaw`SELECT 1 as test`
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Connected (${duration}ms)`)
    
    return { 
      success: true, 
      message: '数据库连接正常',
      duration: `${duration}ms`
    }
  } catch (error) {
    console.error('❌ [Prisma] Connection failed:', error)
    return { 
      success: false, 
      message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      error
    }
  }
}

// Context7最佳实践：数据库状态检查
export async function getDatabaseStatus() {
  try {
    const startTime = Date.now()
    
    const [userCount, reportCount, categoryCount] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(), 
      prisma.category.count()
    ])
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Status check (${duration}ms)`, { userCount, reportCount, categoryCount })
    
    return {
      connected: true,
      userCount,
      reportCount,
      categoryCount,
      hasData: userCount > 0 || reportCount > 0 || categoryCount > 0,
      duration: `${duration}ms`
    }
  } catch (error) {
    console.error('❌ [Prisma] Status check failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// Context7最佳实践：数据库初始化检查
export async function ensureDatabaseInitialized() {
  const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
  
  try {
    // 检查用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    })
    
    if (!userExists) {
      console.log('⚠️ [Prisma] Auto-initializing database...')
      
      // 创建默认用户
      await prisma.user.upsert({
        where: { id: DEFAULT_USER_ID },
        update: {},
        create: {
          id: DEFAULT_USER_ID,
          email: 'demo@wendeal.com',
          username: 'demo',
          password: 'not-used'
        }
      })

      // 创建默认分类
      await prisma.category.upsert({
        where: { id: 'predefined-uncategorized' },
        update: {},
        create: {
          id: 'predefined-uncategorized',
          name: '未分类',
          description: '默认分类',
          color: '#6B7280',
          icon: '📁',
          userId: DEFAULT_USER_ID
        }
      })
      
      console.log('✅ [Prisma] Auto-initialization completed')
    }
    
    return true
  } catch (error) {
    console.error('❌ [Prisma] Initialization failed:', error)
    throw error
  }
}

// Context7推荐：简化的调试函数
export async function debugDatabaseInfo() {
  try {
    const status = await getDatabaseStatus()
    const connection = await testDatabaseConnection()
    
    return {
      status,
      connection,
      environment: {
        isNetlify: process.env.NETLIFY === 'true',
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + '...'
      }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
} 