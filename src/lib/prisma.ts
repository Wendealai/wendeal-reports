import { PrismaClient } from '@prisma/client'

// Context7最佳实践：在Netlify函数外部实例化PrismaClient
let globalPrisma: PrismaClient | undefined

function createPrismaClient() {
  const isNetlify = process.env.NETLIFY === 'true'
  
  console.log(`🔧 [Prisma] Creating client for ${isNetlify ? 'Netlify' : 'local'} environment`)
  
  // Context7关键配置：Netlify专用数据库URL
  const databaseUrl = isNetlify 
    ? process.env.DATABASE_URL || "file:/tmp/dev.db?connection_limit=1&pool_timeout=10&socket_timeout=10"
    : process.env.DATABASE_URL || "file:./prisma/dev.db?connection_limit=1&pool_timeout=10"
  
  const client = new PrismaClient({
    // Context7推荐：简化日志配置
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    errorFormat: 'minimal',
    
    // Context7关键修复：显式数据源配置  
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

  // Context7最佳实践：连接事件监听（生产环境优化）
  if (process.env.NODE_ENV === 'production') {
    process.on('SIGINT', async () => {
      console.log('🔌 [Prisma] Disconnecting...')
      await client.$disconnect()
    })
  }

  return client
}

// Context7最佳实践：全局实例管理（防止连接池耗尽）
export const prisma = globalThis.__prisma ?? (() => {
  if (!globalPrisma) {
    globalPrisma = createPrismaClient()
  }
  return globalPrisma
})()

// 开发环境缓存
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Context7推荐：简化连接测试
export async function testDatabaseConnection() {
  try {
    console.log('🔌 [Prisma] Testing connection...')
    const startTime = Date.now()
    
    await prisma.$queryRaw`SELECT 1 as test`
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Connected in ${duration}ms`)
    
    return { 
      success: true, 
      message: '数据库连接正常',
      duration 
    }
  } catch (error) {
    console.error('❌ [Prisma] Connection failed:', error)
    return { 
      success: false, 
      message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

// Context7最佳实践：数据库状态快速检查
export async function getDatabaseStatus() {
  try {
    const startTime = Date.now()
    
    const [userCount, reportCount, categoryCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.report.count().catch(() => 0), 
      prisma.category.count().catch(() => 0)
    ])
    
    const duration = Date.now() - startTime
    
    return {
      connected: true,
      userCount,
      reportCount,
      categoryCount,
      hasData: userCount > 0,
      duration
    }
  } catch (error) {
    console.error('❌ [Prisma] Status check failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : '状态检查失败'
    }
  }
}

// Context7最佳实践：自动初始化（幂等操作）
export async function ensureDatabaseInitialized() {
  const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
  
  try {
    // 快速检查：用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      select: { id: true }
    })
    
    if (userExists) {
      console.log('✅ [Prisma] Database already initialized')
      return
    }
    
    console.log('⚡ [Prisma] Auto-initializing database...')
    
    // Context7推荐：使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 创建默认用户
      await tx.user.upsert({
        where: { id: DEFAULT_USER_ID },
        update: {},
        create: {
          id: DEFAULT_USER_ID,
          email: 'demo@wendeal.com',
          username: 'demo',
          password: 'demo-password'
        }
      })

      // 创建默认分类
      await tx.category.upsert({
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
    })
    
    console.log('✅ [Prisma] Auto-initialization completed')
  } catch (error) {
    console.error('❌ [Prisma] Initialization failed:', error)
    // 不抛出错误，允许应用继续运行
  }
}

// Context7推荐：调试信息
export async function debugDatabaseInfo() {
  try {
    const [status, connection] = await Promise.all([
      getDatabaseStatus(),
      testDatabaseConnection()
    ])
    
    return {
      status,
      connection,
      environment: {
        isNetlify: process.env.NETLIFY === 'true',
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL?.split('?')[0] || 'not-set'
      }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '调试信息获取失败'
    }
  }
}

// Context7推荐：声明全局类型
declare global {
  var __prisma: PrismaClient | undefined
} 