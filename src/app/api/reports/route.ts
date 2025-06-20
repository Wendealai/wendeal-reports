import { NextRequest, NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/prisma'
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
    const { ensureDatabaseInitialized } = await import('@/lib/prisma')
    await ensureDatabaseInitialized()
    
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
    const { ensureDatabaseInitialized } = await import('@/lib/prisma')
    await ensureDatabaseInitialized()
    console.log('✅ [API] Database initialization verified')

    console.log('📥 [API] Step 3: Parsing request body...')
    const body = await request.json()
    console.log('📋 [API] Request body received:', {
      title: body.title,
      categoryId: body.categoryId,
      hasContent: !!body.content,
      contentLength: body.content?.length || 0
    })

    // Context7最佳实践: 输入验证
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({
        error: '验证失败',
        message: '报告标题是必需的',
        code: 'VALIDATION_ERROR',
        step: 'input_validation'
      }, { status: 400 })
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({
        error: '验证失败',
        message: '报告内容是必需的',
        code: 'VALIDATION_ERROR',
        step: 'input_validation'
      }, { status: 400 })
    }

    console.log('✅ [API] Input validation passed')

    // Context7最佳实践: 使用API客户端创建报告
    console.log('💾 [API] Step 4: Creating report via API client...')
    const response = await reportsApi.create({
      title: body.title.trim(),
      content: body.content,
      description: body.description?.trim() || '',
      categoryId: body.categoryId || 'predefined-uncategorized',
      tags: body.tags || [],
      status: body.status || 'draft',
      userId: DEFAULT_USER_ID
    })

    console.log('🎉 [API] Report created successfully:', {
      id: response.report?.id,
      title: response.report?.title
    })

    return NextResponse.json({
      success: true,
      message: response.message || '报告创建成功',
      report: response.report
    }, { status: 201 })

  } catch (error) {
    console.error('❌ [API] POST reports failed:', error)
    const classifiedError = classifyDatabaseError(error)
    
    return NextResponse.json({
      error: '创建报告失败',
      message: classifiedError.userMessage,
      code: classifiedError.type,
      details: process.env.NODE_ENV === 'development' ? classifiedError.details : undefined
    }, { status: 500 })
  }
} 