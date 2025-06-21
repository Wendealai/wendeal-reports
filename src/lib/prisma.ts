import { PrismaClient } from '@prisma/client'

// Context7最佳实践：在Netlify函数外部实例化PrismaClient
let globalPrisma: PrismaClient | undefined

function createPrismaClient() {
  const isNetlify = process.env.NETLIFY === 'true'
  const databaseUrl = process.env.DATABASE_URL
  
  console.log(`🔧 [Prisma] Creating client for ${isNetlify ? 'Netlify' : 'local'} environment`)
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Context7关键修复：检测数据库类型并应用正确配置
  const isPostgreSQL = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
  const isNeon = databaseUrl.includes('.neon.tech')
  
  console.log(`🔧 [Prisma] Database type: ${isPostgreSQL ? 'PostgreSQL' : 'Other'} ${isNeon ? '(Neon)' : ''}`)

  // Context7推荐：Neon专用连接配置
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    errorFormat: 'minimal',
    // Context7关键修复：Neon需要的特殊配置
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

// Context7最佳实践：全局单例模式
export const prisma = globalPrisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalPrisma = prisma
}

// Context7推荐：增强的连接测试函数
export async function testDatabaseConnection() {
  try {
    console.log('🔍 [Test] Testing database connection...')
    
    // Context7最佳实践：使用$connect()进行显式连接
    await prisma.$connect()
    console.log('✅ [Test] Database connection established')
    
    // Context7推荐：测试查询验证连接
    const result = await prisma.$queryRaw`SELECT 1 as test, version() as version`
    console.log('✅ [Test] Database query successful:', result)
    
    return { 
      success: true, 
      message: 'Database connection successful',
      version: Array.isArray(result) && result[0] ? result[0].version : 'Unknown'
    }
  } catch (error) {
    console.error('❌ [Test] Database connection failed:', error)
    
    // Context7最佳实践：详细的错误分类
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let errorType = 'UNKNOWN_ERROR'
    
    if (errorMessage.includes('timeout')) {
      errorType = 'CONNECTION_TIMEOUT'
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      errorType = 'CONNECTION_REFUSED'
    } else if (errorMessage.includes('authentication')) {
      errorType = 'AUTHENTICATION_FAILED'
    } else if (errorMessage.includes('database')) {
      errorType = 'DATABASE_ERROR'
    }
    
    return { 
      success: false, 
      error: errorMessage,
      errorType,
      troubleshooting: getTroubleshootingTips(errorType)
    }
  }
}

// Context7推荐：故障排除提示
function getTroubleshootingTips(errorType: string): string[] {
  switch (errorType) {
    case 'CONNECTION_TIMEOUT':
      return [
        '检查Neon数据库是否处于活跃状态（非睡眠状态）',
        '增加connect_timeout参数到15-30秒',
        '检查Netlify函数超时设置'
      ]
    case 'CONNECTION_REFUSED':
      return [
        '检查DATABASE_URL是否正确配置',
        '确认Neon数据库主机地址和端口',
        '检查网络连接'
      ]
    case 'AUTHENTICATION_FAILED':
      return [
        '检查数据库用户名和密码',
        '确认DATABASE_URL中的凭据正确',
        '检查Neon数据库访问权限'
      ]
    default:
      return [
        '检查所有环境变量是否正确设置',
        '确认Prisma schema与数据库匹配',
        '查看完整错误日志获取更多信息'
      ]
  }
}

export async function getDatabaseStatus() {
  try {
    // Context7最佳实践：获取数据库详细信息
    const [connectionTest, userCount, categoryCount] = await Promise.all([
      testDatabaseConnection(),
      prisma.user.count().catch(() => 0),
      prisma.category.count().catch(() => 0)
    ])
    
    return { 
      success: connectionTest.success,
      connected: connectionTest.success, 
      version: connectionTest.version,
      url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'), // 隐藏密码
      stats: { users: userCount, categories: categoryCount },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isNetlify: process.env.NETLIFY === 'true',
        hasDirectUrl: !!process.env.DIRECT_URL
      }
    }
  } catch (error) {
    return { 
      success: false, 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isNetlify: process.env.NETLIFY === 'true',
        hasDirectUrl: !!process.env.DIRECT_URL
      }
    }
  }
}

export async function ensureDatabaseInitialized() {
  const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
  
  try {
    console.log('🚀 [Init] Checking database initialization...')
    
    // Context7最佳实践：先测试连接
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`)
    }
    
    // Context7最佳实践：检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      select: { id: true, email: true }
    })
    
    if (!user) {
      console.log('📦 [Init] Initializing database with default data...')
      
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
            password: 'demo-password' // Context7注意：生产环境需要哈希密码
          }
        })
        
        // 创建预定义分类
        const categories = [
          { 
            id: 'predefined-uncategorized', 
            name: '未分类', 
            type: 'predefined', 
            isSystem: true,
            description: '默认分类',
            color: '#6B7280',
            icon: '📁'
          },
          { 
            id: 'predefined-general', 
            name: '通用', 
            type: 'predefined', 
            isSystem: true,
            description: '通用文档',
            color: '#8B5CF6',
            icon: '📋'
          },
          { 
            id: 'predefined-technical', 
            name: '技术', 
            type: 'predefined', 
            isSystem: true,
            description: '技术相关文档',
            color: '#3B82F6',
            icon: '💻'
          },
          { 
            id: 'predefined-business', 
            name: '商务', 
            type: 'predefined', 
            isSystem: true,
            description: '商务相关文档',
            color: '#10B981',
            icon: '📈'
          }
        ]
        
        for (const category of categories) {
          await tx.category.upsert({
            where: { id: category.id },
            update: {},
            create: {
              ...category,
              userId: DEFAULT_USER_ID
            }
          })
        }
      })
      
      console.log('✅ [Init] Database initialized successfully')
    } else {
      console.log('✅ [Init] Database already initialized')
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ [Init] Database initialization failed:', error)
    throw error
  }
}

// Context7推荐：导出默认实例
export default prisma 