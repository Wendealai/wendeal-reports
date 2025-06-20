import { NextRequest, NextResponse } from 'next/server'
import { debugCreateReport, testDatabaseConnection, validateDatabaseSchema, initializeDatabase } from '@/lib/prisma'
import { reportsApi } from '@/lib/api-client'

// 默认用户ID（用于简化的单用户系统）
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'

// Context7最佳实践: 分类详细的数据库错误类型
function classifyDatabaseError(error: any) {
  const message = error.message || error.toString()
  
  if (message.includes('UNIQUE constraint failed')) {
    return {
      type: 'UNIQUE_CONSTRAINT',
      userMessage: '创建失败：该报告标题已存在',
      details: message
    }
  }
  
  if (message.includes('FOREIGN KEY constraint failed')) {
    return {
      type: 'FOREIGN_KEY_CONSTRAINT',
      userMessage: '创建失败：关联的分类或用户不存在',
      details: message
    }
  }
  
  if (message.includes('NOT NULL constraint failed')) {
    return {
      type: 'NOT_NULL_CONSTRAINT',
      userMessage: '创建失败：缺少必需的字段',
      details: message
    }
  }
  
  if (message.includes('SQLITE_BUSY') || message.includes('database is locked')) {
    return {
      type: 'DATABASE_BUSY',
      userMessage: '数据库繁忙，请稍后重试',
      details: message
    }
  }
  
  if (message.includes('no such table') || message.includes('table')) {
    return {
      type: 'SCHEMA_ERROR',
      userMessage: '数据库模式错误，请联系管理员',
      details: message
    }
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    userMessage: '创建报告时发生未知错误',
    details: message
  }
}

// Context7最佳实践：确保数据库已初始化的辅助函数
async function ensureDatabaseInitialized() {
  try {
    console.log('🔍 [API] Checking if database is initialized...')
    
    // 检查默认用户是否存在
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    })
    
    if (!user) {
      console.log('📦 [API] Database not initialized, initializing...')
      const initResult = await initializeDatabase()
      if (!initResult.success) {
        throw new Error(`数据库初始化失败: ${initResult.message}`)
      }
      console.log('✅ [API] Database initialized successfully')
    } else {
      console.log('✅ [API] Database already initialized')
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ [API] Database initialization check failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }
  }
}

// 获取报告列表
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [API] GET /api/reports - Starting request')
    
    // Context7最佳实践: 每次请求前进行连接检查
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.success) {
      console.error('❌ [API] Database connection failed:', connectionTest.message)
      return NextResponse.json({
        error: '数据库连接失败',
        message: connectionTest.message,
        code: 'DATABASE_CONNECTION_ERROR'
      }, { status: 500 })
    }
    
    console.log('✅ [API] Database connection verified')
    
    // 确保数据库已初始化
    const initCheck = await ensureDatabaseInitialized()
    if (!initCheck.success) {
      return NextResponse.json({
        error: '数据库初始化失败',
        message: initCheck.error,
        code: 'DATABASE_INIT_ERROR'
      }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    console.log('📋 [API] Query parameters:', { page, limit, category, search, tags })

    const params = {
      page,
      limit,
      ...(category && { category }),
      ...(search && { search }),
      ...(tags && tags.length > 0 && { tags })
    }

    const response = await reportsApi.getAll(params)
    console.log(`✅ [API] Successfully fetched ${response.reports?.length || 0} reports`)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [API] GET reports failed:', error)
    const classifiedError = classifyDatabaseError(error)
    
    return NextResponse.json({
      error: '获取报告失败',
      message: classifiedError.userMessage,
      code: classifiedError.type,
      details: process.env.NODE_ENV === 'development' ? classifiedError.details : undefined
    }, { status: 500 })
  }
}

// 创建新报告
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] POST /api/reports - Starting report creation')
    
    // Context7最佳实践: 详细的前置检查
    console.log('🔍 [API] Step 1: Testing database connection...')
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.success) {
      console.error('❌ [API] Database connection failed:', connectionTest.message)
      return NextResponse.json({
        error: '数据库连接失败',
        message: connectionTest.message,
        code: 'DATABASE_CONNECTION_ERROR',
        step: 'connection_test'
      }, { status: 500 })
    }
    console.log('✅ [API] Database connection verified')
    
    console.log('🔍 [API] Step 2: Ensuring database is initialized...')
    const initCheck = await ensureDatabaseInitialized()
    if (!initCheck.success) {
      console.error('❌ [API] Database initialization failed:', initCheck.error)
      return NextResponse.json({
        error: '数据库初始化失败',
        message: initCheck.error,
        code: 'DATABASE_INIT_ERROR',
        step: 'database_init'
      }, { status: 500 })
    }
    console.log('✅ [API] Database initialization verified')
    
    console.log('🔍 [API] Step 3: Validating database schema...')
    const schemaValidation = await validateDatabaseSchema()
    if (!schemaValidation.valid) {
      console.error('❌ [API] Database schema invalid:', schemaValidation.message)
      return NextResponse.json({
        error: '数据库模式错误',
        message: schemaValidation.message,
        code: 'SCHEMA_ERROR',
        step: 'schema_validation',
        details: schemaValidation
      }, { status: 500 })
    }
    console.log('✅ [API] Database schema validated')

    console.log('📥 [API] Step 4: Parsing request body...')
    const body = await request.json()
    console.log('📋 [API] Request body received:', {
      title: body.title,
      contentLength: body.content?.length || 0,
      categoryId: body.categoryId,
      tags: body.tags,
      status: body.status
    })

    // 验证必需字段
    if (!body.title || !body.content) {
      console.error('❌ [API] Missing required fields:', { 
        hasTitle: !!body.title, 
        hasContent: !!body.content 
      })
      return NextResponse.json({
        error: '缺少必需字段',
        message: '标题和内容是必需的',
        code: 'VALIDATION_ERROR',
        step: 'field_validation'
      }, { status: 400 })
    }

    console.log('💾 [API] Step 5: Creating report using debug function...')
    
    // 使用专门的调试创建函数
    const report = await debugCreateReport({
      title: body.title,
      content: body.content,
      description: body.description || '',
      status: body.status || 'published',
      categoryId: body.categoryId || null,
      tags: body.tags || []
    })

    console.log('✅ [API] Report created successfully:', {
      id: report.id,
      title: report.title,
      category: report.category?.name
    })

    return NextResponse.json({
      success: true,
      message: '报告创建成功',
      report: {
        id: report.id,
        title: report.title,
        content: report.content,
        description: report.description,
        status: report.status,
        categoryId: report.categoryId,
        tags: body.tags || [],
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }
    })

  } catch (error) {
    console.error('❌ [API] POST reports failed:', error)
    const classifiedError = classifyDatabaseError(error)
    
    // 详细的错误响应
    const errorResponse = {
      error: '创建报告失败',
      message: classifiedError.userMessage,
      code: classifiedError.type,
      step: 'report_creation',
      timestamp: new Date().toISOString()
    }
    
    // 开发环境添加详细信息
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).details = {
        originalError: classifiedError.details,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }
    }
    
    console.error('📤 [API] Sending error response:', errorResponse)
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
} 