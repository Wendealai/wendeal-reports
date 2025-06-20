import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Context7最佳实践：针对Netlify无服务器环境的Prisma配置
const createPrismaClient = () => {
  // 检测运行环境
  const isNetlify = process.env.NETLIFY === 'true'
  const isProduction = process.env.NODE_ENV === 'production'
  
  console.log(`🔧 [Prisma] Initializing for environment:`, {
    isNetlify,
    isProduction,
    databaseUrl: process.env.DATABASE_URL?.substring(0, 20) + '...'
  })

  const client = new PrismaClient({
    // Context7推荐：详细日志配置
    log: isProduction ? ['error', 'warn'] : [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event', 
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
    ],
    errorFormat: 'pretty',
    
    // Context7最佳实践：无服务器环境数据源配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL || (
          isNetlify 
            ? "file:/tmp/dev.db?connection_limit=1&pool_timeout=10"
            : "file:./dev.db?connection_limit=1&pool_timeout=10"
        )
      }
    }
  })

  // Context7推荐：生产环境错误处理
  if (isProduction) {
    client.$on('error', (e) => {
      console.error('❌ [Prisma Production Error]:', {
        message: e.message,
        target: e.target,
        timestamp: new Date().toISOString()
      })
    })
  }

  return client
}

// Context7最佳实践：无服务器环境中的实例管理
export const prisma = globalThis.__prisma ?? createPrismaClient()

// 仅在开发环境中缓存实例
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
  
  // 开发环境详细日志
  if (typeof window === 'undefined') {
    // 使用any类型避免TypeScript错误
    (prisma as any).$on('query', (e: any) => {
      console.log('🔍 [Prisma Query]:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        timestamp: new Date().toISOString()
      })
    })

    (prisma as any).$on('error', (e: any) => {
      console.error('❌ [Prisma Error]:', {
        message: e.message,
        target: e.target,
        timestamp: new Date().toISOString()
      })
    })

    (prisma as any).$on('warn', (e: any) => {
      console.warn('⚠️ [Prisma Warning]:', {
        message: e.message,
        target: e.target,
        timestamp: new Date().toISOString()
      })
    })
  }
}

// Context7最佳实践：连接测试函数（支持无服务器环境）
export async function testDatabaseConnection() {
  try {
    console.log('🔌 [Prisma] Testing database connection...')
    const startTime = Date.now()
    
    // 检查数据库是否可访问
    await prisma.$queryRaw`SELECT 1 as test`
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Connection test successful (${duration}ms)`)
    
    return { 
      success: true, 
      message: '数据库连接正常',
      duration: `${duration}ms`,
      environment: {
        isNetlify: process.env.NETLIFY === 'true',
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    }
  } catch (error) {
    console.error('❌ [Prisma] Connection test failed:', error)
    return { 
      success: false, 
      message: `数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      error,
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }
  }
}

// Context7最佳实践：数据库状态检查（针对无服务器环境优化）
export async function getDatabaseStatus() {
  try {
    console.log('📊 [Prisma] Getting database status...')
    const startTime = Date.now()
    
    // 使用事务确保一致性
    const result = await prisma.$transaction(async (tx) => {
      const [userCount, reportCount, categoryCount] = await Promise.all([
        tx.user.count(),
        tx.report.count(), 
        tx.category.count()
      ])
      
      return { userCount, reportCount, categoryCount }
    })
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Status check successful (${duration}ms)`, result)
    
    return {
      connected: true,
      ...result,
      hasData: result.userCount > 0 || result.reportCount > 0 || result.categoryCount > 0,
      duration: `${duration}ms`,
      environment: {
        isNetlify: process.env.NETLIFY === 'true',
        nodeEnv: process.env.NODE_ENV
      }
    }
  } catch (error) {
    console.error('❌ [Prisma] Status check failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message
      } : undefined
    }
  }
}

// Context7最佳实践：数据库模式验证（支持SQLite）
export async function validateDatabaseSchema() {
  try {
    console.log('🔍 [Prisma] Validating database schema...')
    
    // 检查SQLite表是否存在
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ` as Array<{ name: string }>
    
    const requiredTables = ['User', 'Report', 'Category', 'Tag', 'ReportTag']
    const existingTables = tables.map(t => t.name)
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    console.log('📋 [Prisma] Schema validation result:', {
      existingTables,
      missingTables,
      isValid: missingTables.length === 0
    })
    
    return {
      valid: missingTables.length === 0,
      existingTables,
      missingTables,
      message: missingTables.length === 0 
        ? '数据库模式验证通过' 
        : `缺少必要的表: ${missingTables.join(', ')}`
    }
  } catch (error) {
    console.error('❌ [Prisma] Schema validation failed:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: '数据库模式验证失败'
    }
  }
}

// Context7最佳实践：创建报告的专用调试函数（无服务器优化）
export async function debugCreateReport(reportData: any) {
  try {
    console.log('🐛 [Debug] Creating report with data:', reportData)
    
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 步骤1: 验证默认用户存在
      const defaultUserId = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
      console.log('🔍 [Debug] Checking default user:', defaultUserId)
      
      let user = await tx.user.findUnique({
        where: { id: defaultUserId }
      })
      
      // 如果用户不存在，创建默认用户
      if (!user) {
        console.log('👤 [Debug] Creating default user...')
        user = await tx.user.create({
          data: {
            id: defaultUserId,
            email: 'demo@wendeal.com',
            username: 'demo',
            password: 'not-used'
          }
        })
      }
      console.log('✅ [Debug] User verified:', user.username)
      
      // 步骤2: 验证分类存在（如果指定）
      if (reportData.categoryId && reportData.categoryId !== 'uncategorized') {
        console.log('🔍 [Debug] Checking category:', reportData.categoryId)
        
        const category = await tx.category.findUnique({
          where: { id: reportData.categoryId }
        })
        
        if (!category) {
          console.warn('⚠️ [Debug] Category not found, setting to null')
          reportData.categoryId = null
        } else {
          console.log('✅ [Debug] Category found:', category.name)
        }
      }
      
      // 步骤3: 创建报告
      console.log('💾 [Debug] Creating report in database...')
      const report = await tx.report.create({
        data: {
          title: reportData.title,
          content: reportData.content,
          description: reportData.description,
          status: reportData.status || 'published',
          categoryId: reportData.categoryId,
          userId: defaultUserId
        },
        include: {
          category: true,
          user: true
        }
      })
      
      return report
    })
    
    console.log('✅ [Debug] Report created successfully:', {
      id: result.id,
      title: result.title,
      category: result.category?.name,
      user: result.user?.username
    })
    
    return result
  } catch (error) {
    console.error('❌ [Debug] Report creation failed:', error)
    throw error
  }
}

// Context7最佳实践：初始化数据库（无服务器环境）
export async function initializeDatabase() {
  try {
    console.log('🚀 [Prisma] Initializing database...')
    
    // 直接在这里实现种子逻辑，避免require路径问题
    const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
    
    // 使用事务执行初始化
    await prisma.$transaction(async (tx) => {
      // 1. 创建默认用户
      await tx.user.upsert({
        where: { id: DEFAULT_USER_ID },
        update: {},
        create: {
          id: DEFAULT_USER_ID,
          email: 'demo@wendeal.com',
          username: 'demo',
          password: 'not-used'
        }
      })
      
      // 2. 创建预定义分类
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
      ]

      for (const categoryData of predefinedCategories) {
        await tx.category.upsert({
          where: { id: categoryData.id },
          update: {},
          create: {
            ...categoryData,
            userId: DEFAULT_USER_ID
          }
        })
      }
    })
    
    console.log('✅ [Prisma] Database initialized successfully')
    return { success: true, message: '数据库初始化成功' }
  } catch (error) {
    console.error('❌ [Prisma] Database initialization failed:', error)
    return { 
      success: false, 
      message: '数据库初始化失败',
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
} 