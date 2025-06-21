import { NextRequest, NextResponse } from 'next/server'
import { testDatabaseConnection, getDatabaseStatus, ensureDatabaseInitialized } from '@/lib/prisma'

// Context7推荐：标准CORS头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// GET: 获取数据库状态
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] GET /api/init - Checking database status')
    
    const status = await getDatabaseStatus()
    
    return NextResponse.json({
      success: true,
      message: '数据库状态检查完成',
      status,
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: corsHeaders
    })
    
  } catch (error) {
    console.error('❌ [API] Database status check failed:', error)
    
    return NextResponse.json({
      success: false,
      message: '数据库状态检查失败',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: corsHeaders
    })
  }
}

// POST: 初始化数据库
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] POST /api/init - Starting database initialization')
    
    // Context7最佳实践：分步骤初始化
    console.log('🔍 [API] Step 1: Testing database connection...')
    const connectionTest = await testDatabaseConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: '数据库连接失败',
        error: connectionTest.error,
        troubleshooting: connectionTest.troubleshooting,
        step: 'connection_test',
        timestamp: new Date().toISOString()
      }, { 
        status: 500,
        headers: corsHeaders
      })
    }
    
    console.log('✅ [API] Database connection successful')
    
    console.log('🏗️ [API] Step 2: Initializing database...')
    await ensureDatabaseInitialized()
    
    console.log('📊 [API] Step 3: Getting final status...')
    const finalStatus = await getDatabaseStatus()
    
    console.log('🎉 [API] Database initialization completed successfully')
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      status: finalStatus,
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: corsHeaders
    })
    
  } catch (error) {
    console.error('❌ [API] Database initialization failed:', error)
    
    // Context7推荐：详细的错误分类
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    let errorType = 'INITIALIZATION_ERROR'
    let troubleshooting: string[] = []
    
    if (errorMessage.includes('timeout')) {
      errorType = 'CONNECTION_TIMEOUT'
      troubleshooting = [
        '数据库连接超时，请检查Neon数据库状态',
        '尝试刷新页面重新初始化',
        '检查网络连接'
      ]
    } else if (errorMessage.includes('authentication')) {
      errorType = 'AUTHENTICATION_ERROR'
      troubleshooting = [
        '数据库认证失败，请检查DATABASE_URL环境变量',
        '确认Neon数据库凭据正确',
        '联系管理员检查权限设置'
      ]
    } else if (errorMessage.includes('schema') || errorMessage.includes('table')) {
      errorType = 'SCHEMA_ERROR'
      troubleshooting = [
        '数据库模式错误，可能需要运行迁移',
        '检查Prisma schema是否最新',
        '尝试运行 npx prisma db push'
      ]
    }
    
    return NextResponse.json({
      success: false,
      message: '数据库初始化失败',
      error: errorMessage,
      errorType,
      troubleshooting,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: corsHeaders
    })
  }
} 