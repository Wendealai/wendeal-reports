import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// 基于Context7最佳实践的Prisma配置
// 针对Netlify等无服务器环境优化
const createPrismaClient = () => {
  return new PrismaClient({
    // 详细日志配置 - Context7推荐的调试设置
    log: [
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

// 添加事件监听器进行详细调试
if (typeof window === 'undefined') {
  // 查询日志
  prisma.$on('query', (e) => {
    console.log('🔍 [Prisma Query]:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: new Date().toISOString()
    })
  })

  // 错误日志
  prisma.$on('error', (e) => {
    console.error('❌ [Prisma Error]:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    })
  })

  // 警告日志
  prisma.$on('warn', (e) => {
    console.warn('⚠️ [Prisma Warning]:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    })
  })
}

// 仅在开发环境中缓存实例，生产环境中避免缓存
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// 添加优雅关闭处理
if (typeof window === 'undefined') {
  // 只在服务端添加关闭处理器
  process.on('beforeExit', async () => {
    console.log('🔌 [Prisma] Disconnecting before exit...')
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    console.log('🔌 [Prisma] Disconnecting on SIGINT...')
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    console.log('🔌 [Prisma] Disconnecting on SIGTERM...')
    await prisma.$disconnect()
    process.exit(0)
  })
}

// 导出增强的连接测试函数
export async function testDatabaseConnection() {
  try {
    console.log('🔌 [Prisma] Testing database connection...')
    const startTime = Date.now()
    
    // 执行简单查询测试连接
    await prisma.$queryRaw`SELECT 1 as test`
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Connection test successful (${duration}ms)`)
    
    return { 
      success: true, 
      message: '数据库连接正常',
      duration: `${duration}ms`
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

// 导出数据库状态检查函数
export async function getDatabaseStatus() {
  try {
    console.log('📊 [Prisma] Getting database status...')
    const startTime = Date.now()
    
    const [userCount, reportCount, categoryCount] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.category.count()
    ])
    
    const duration = Date.now() - startTime
    console.log(`✅ [Prisma] Status check successful (${duration}ms)`, {
      userCount,
      reportCount,
      categoryCount
    })
    
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
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }
  }
}

// 导出数据库模式验证函数
export async function validateDatabaseSchema() {
  try {
    console.log('🔍 [Prisma] Validating database schema...')
    
    // 检查必要的表是否存在
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

// 导出创建报告的专用调试函数
export async function debugCreateReport(reportData: any) {
  try {
    console.log('🐛 [Debug] Creating report with data:', reportData)
    
    // 步骤1: 验证默认用户存在
    const defaultUserId = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
    console.log('🔍 [Debug] Checking default user:', defaultUserId)
    
    const user = await prisma.user.findUnique({
      where: { id: defaultUserId }
    })
    
    if (!user) {
      throw new Error(`默认用户不存在: ${defaultUserId}`)
    }
    console.log('✅ [Debug] Default user found:', user.username)
    
    // 步骤2: 验证分类存在（如果指定）
    if (reportData.categoryId && reportData.categoryId !== 'uncategorized') {
      console.log('🔍 [Debug] Checking category:', reportData.categoryId)
      
      const category = await prisma.category.findUnique({
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
    const report = await prisma.report.create({
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
    
    console.log('✅ [Debug] Report created successfully:', {
      id: report.id,
      title: report.title,
      category: report.category?.name,
      user: report.user?.username
    })
    
    return report
  } catch (error) {
    console.error('❌ [Debug] Report creation failed:', error)
    throw error
  }
} 