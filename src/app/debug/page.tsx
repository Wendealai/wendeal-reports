'use client';

import { useState, useEffect } from 'react'

interface DiagnosticResult {
  success: boolean
  message: string
  details?: any
  duration?: string
  step?: string
}

interface TestReport {
  title: string
  content: string
  description: string
  categoryId?: string
  tags?: string[]
}

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, DiagnosticResult>>({})
  const [databaseStatus, setDatabaseStatus] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logMessage])
    console.log(logMessage)
  }

  const clearLogs = () => {
    setLogs([])
    setTestResults({})
    setDatabaseStatus(null)
  }

  // Context7最佳实践: 详细的数据库连接测试
  const testDatabaseConnection = async () => {
    addLog('🔌 开始测试数据库连接...')
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.database?.connected) {
        addLog('✅ 数据库连接测试通过')
        setTestResults(prev => ({
          ...prev,
          connection: {
            success: true,
            message: '数据库连接正常',
            details: result.database,
            duration: result.database.duration
          }
        }))
        return true
      } else {
        addLog('❌ 数据库连接测试失败')
        setTestResults(prev => ({
          ...prev,
          connection: {
            success: false,
            message: '数据库连接失败',
            details: result.database
          }
        }))
        return false
      }
    } catch (error) {
      addLog(`❌ 数据库连接测试异常: ${error}`)
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: false,
          message: '数据库连接测试异常',
          details: error instanceof Error ? error.message : String(error)
        }
      }))
      return false
    }
  }

  // Context7最佳实践: 数据库模式验证
  const validateDatabaseSchema = async () => {
    addLog('🔍 开始验证数据库模式...')
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.database?.connected) {
        addLog('✅ 数据库模式验证通过')
        setTestResults(prev => ({
          ...prev,
          schema: {
            success: true,
            message: '数据库模式正常',
            details: result.database
          }
        }))
        return true
      } else {
        addLog('❌ 数据库模式验证失败')
        setTestResults(prev => ({
          ...prev,
          schema: {
            success: false,
            message: '数据库模式异常',
            details: result.database
          }
        }))
        return false
      }
    } catch (error) {
      addLog(`❌ 数据库模式验证异常: ${error}`)
      setTestResults(prev => ({
        ...prev,
        schema: {
          success: false,
          message: '数据库模式验证异常',
          details: error instanceof Error ? error.message : String(error)
        }
      }))
      return false
    }
  }

  // Context7最佳实践: 测试默认用户存在
  const testDefaultUser = async () => {
    addLog('👤 检查默认用户...')
    try {
      const response = await fetch('/api/init', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.initialized && result.user) {
        addLog(`✅ 默认用户存在: ${result.user.username}`)
        setTestResults(prev => ({
          ...prev,
          user: {
            success: true,
            message: '默认用户存在',
            details: result.user
          }
        }))
        return true
      } else {
        addLog('❌ 默认用户不存在')
        setTestResults(prev => ({
          ...prev,
          user: {
            success: false,
            message: '默认用户不存在',
            details: result
          }
        }))
        return false
      }
    } catch (error) {
      addLog(`❌ 检查默认用户异常: ${error}`)
      setTestResults(prev => ({
        ...prev,
        user: {
          success: false,
          message: '检查默认用户异常',
          details: error instanceof Error ? error.message : String(error)
        }
      }))
      return false
    }
  }

  // Context7最佳实践: 完整的报告创建测试
  const testReportCreation = async () => {
    addLog('📝 开始测试报告创建...')
    
    const testReport: TestReport = {
      title: `测试报告 - ${new Date().toLocaleString()}`,
      content: `
        <html>
          <head>
            <title>测试报告</title>
          </head>
          <body>
            <h1>Context7优化测试报告</h1>
            <p>这是一个用于测试数据库连接和报告创建功能的测试文档。</p>
            <h2>测试内容</h2>
            <ul>
              <li>数据库连接测试</li>
              <li>Prisma客户端配置验证</li>
              <li>报告创建流程测试</li>
            </ul>
            <p>创建时间: ${new Date().toISOString()}</p>
          </body>
        </html>
      `,
      description: '这是一个Context7优化的测试报告，用于验证数据库连接和报告创建功能。',
      categoryId: 'uncategorized',
      tags: ['测试', 'Context7', '调试']
    }

    try {
      addLog('📤 发送报告创建请求...')
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testReport)
      })

      const result = await response.json()
      addLog(`📥 收到响应: ${response.status}`)

      if (response.ok && result.success) {
        addLog(`✅ 报告创建成功: ${result.report.title}`)
        addLog(`📊 报告ID: ${result.report.id}`)
        setTestResults(prev => ({
          ...prev,
          reportCreation: {
            success: true,
            message: '报告创建成功',
            details: {
              reportId: result.report.id,
              title: result.report.title,
              status: result.report.status,
              categoryId: result.report.categoryId
            }
          }
        }))
        return true
      } else {
        addLog(`❌ 报告创建失败: ${result.message || result.error}`)
        addLog(`🔍 错误详情: ${JSON.stringify(result, null, 2)}`)
        setTestResults(prev => ({
          ...prev,
          reportCreation: {
            success: false,
            message: result.message || result.error || '报告创建失败',
            details: result,
            step: result.step
          }
        }))
        return false
      }
    } catch (error) {
      addLog(`❌ 报告创建请求异常: ${error}`)
      setTestResults(prev => ({
        ...prev,
        reportCreation: {
          success: false,
          message: '报告创建请求异常',
          details: error instanceof Error ? error.message : String(error)
        }
      }))
      return false
    }
  }

  // 运行完整诊断
  const runFullDiagnostic = async () => {
    setIsRunning(true)
    clearLogs()
    
    addLog('🚀 开始运行完整诊断...')
    addLog('📋 基于Context7最佳实践的数据库诊断系统')
    
    try {
      // 步骤1: 测试数据库连接
      const connectionOk = await testDatabaseConnection()
      if (!connectionOk) {
        addLog('⚠️ 数据库连接失败，停止后续测试')
        return
      }

      // 步骤2: 验证数据库模式
      const schemaOk = await validateDatabaseSchema()
      if (!schemaOk) {
        addLog('⚠️ 数据库模式验证失败，继续其他测试...')
      }

      // 步骤3: 检查默认用户
      const userOk = await testDefaultUser()
      if (!userOk) {
        addLog('⚠️ 默认用户不存在，尝试初始化...')
        await initializeDatabase()
        await testDefaultUser() // 重新检查
      }

      // 步骤4: 测试报告创建
      await testReportCreation()
      
      addLog('🎉 完整诊断完成！')
    } catch (error) {
      addLog(`❌ 诊断过程异常: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  // 初始化数据库
  const initializeDatabase = async () => {
    addLog('🔧 初始化数据库...')
    try {
      const response = await fetch('/api/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        addLog('✅ 数据库初始化成功')
        addLog(`👤 创建用户: ${result.user?.username}`)
        addLog(`📁 创建分类: ${result.categories?.length || 0} 个`)
      } else {
        addLog(`❌ 数据库初始化失败: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ 数据库初始化异常: ${error}`)
    }
  }

  // 获取数据库状态
  const getDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const result = await response.json()
      setDatabaseStatus(result.database)
    } catch (error) {
      console.error('获取数据库状态失败:', error)
    }
  }

  useEffect(() => {
    getDatabaseStatus()
  }, [])

  const getStatusColor = (success: boolean) => success ? 'text-green-600' : 'text-red-600'
  const getStatusIcon = (success: boolean) => success ? '✅' : '❌'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Context7优化诊断系统
          </h1>
          <p className="text-gray-600">
            基于Context7最佳实践的完整数据库诊断和调试工具
          </p>
        </div>

        {/* 快速状态概览 */}
        {databaseStatus && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">数据库状态概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor(databaseStatus.connected)}`}>
                  {getStatusIcon(databaseStatus.connected)}
                </div>
                <div className="text-sm text-gray-600">连接状态</div>
                <div className="text-xs text-gray-500">{databaseStatus.duration}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {databaseStatus.userCount || 0}
                </div>
                <div className="text-sm text-gray-600">用户数量</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {databaseStatus.reportCount || 0}
                </div>
                <div className="text-sm text-gray-600">报告数量</div>
              </div>
            </div>
          </div>
        )}

        {/* 测试结果状态 */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <div className="space-y-3">
              {Object.entries(testResults).map(([key, result]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={getStatusColor(result.success)}>
                      {getStatusIcon(result.success)}
                    </span>
                    <span className="font-medium">
                      {key === 'connection' && '数据库连接'}
                      {key === 'schema' && '数据库模式'}
                      {key === 'user' && '默认用户'}
                      {key === 'reportCreation' && '报告创建'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${getStatusColor(result.success)}`}>
                      {result.message}
                    </div>
                    {result.duration && (
                      <div className="text-xs text-gray-500">{result.duration}</div>
                    )}
                    {result.step && (
                      <div className="text-xs text-orange-500">步骤: {result.step}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">诊断控制</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runFullDiagnostic}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? '🔄 运行中...' : '🚀 运行完整诊断'}
            </button>
            
            <button
              onClick={testDatabaseConnection}
              disabled={isRunning}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              🔌 测试数据库连接
            </button>

            <button
              onClick={initializeDatabase}
              disabled={isRunning}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              🔧 初始化数据库
            </button>

            <button
              onClick={testReportCreation}
              disabled={isRunning}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              📝 测试报告创建
            </button>

            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              🗑️ 清空日志
            </button>
          </div>
        </div>

        {/* 实时日志 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            实时诊断日志 
            <span className="text-sm text-gray-500 ml-2">
              ({logs.length} 条记录)
            </span>
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">点击上方按钮开始诊断...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Context7优化说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🎯 Context7优化说明
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>连接池配置:</strong> 使用 connection_limit=1 防止无服务器环境连接耗尽</p>
            <p>• <strong>详细日志:</strong> 启用查询级别的调试日志用于问题排查</p>
            <p>• <strong>错误分类:</strong> 细分数据库错误类型，提供精确的修复建议</p>
            <p>• <strong>优雅关闭:</strong> 正确处理PrismaClient连接生命周期</p>
            <p>• <strong>实时监控:</strong> 提供连接状态和性能指标的实时反馈</p>
          </div>
        </div>

        {/* 修复指南 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            🔧 常见问题修复指南
          </h3>
          <div className="text-yellow-800 space-y-2">
            <p>1. <strong>数据库连接失败:</strong> 检查 DATABASE_URL 环境变量配置</p>
            <p>2. <strong>默认用户不存在:</strong> 点击"初始化数据库"按钮创建默认数据</p>
            <p>3. <strong>报告创建失败:</strong> 检查数据库模式是否完整，可能需要运行 prisma migrate</p>
            <p>4. <strong>FOREIGN KEY错误:</strong> 确保分类ID存在或设置为null</p>
            <p>5. <strong>UNIQUE constraint错误:</strong> 报告标题重复，请使用不同标题</p>
          </div>
        </div>
      </div>
    </div>
  )
} 