'use client';

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [initStatus, setInitStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkHealth = async () => {
    try {
      addLog('🔍 检查系统健康状态...')
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
      
      if (data.status === 'healthy') {
        addLog('✅ 系统健康检查通过')
      } else {
        addLog(`❌ 系统健康检查失败: ${data.error || '未知错误'}`)
      }
    } catch (error) {
      addLog(`❌ 健康检查请求失败: ${error}`)
    }
  }

  const checkInitStatus = async () => {
    try {
      addLog('📋 检查数据库初始化状态...')
      const response = await fetch('/api/init')
      const data = await response.json()
      setInitStatus(data)
      
      if (response.ok) {
        addLog(`📊 初始化状态: ${data.initialized ? '已初始化' : '未初始化'}`)
        addLog(`📄 报告数量: ${data.reportCount}`)
        addLog(`📁 分类数量: ${data.categoryCount}`)
      } else {
        addLog(`❌ 初始化状态检查失败: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ 初始化状态检查请求失败: ${error}`)
    }
  }

  const initializeDatabase = async () => {
    try {
      setLoading(true)
      addLog('🚀 开始初始化数据库...')
      
      const response = await fetch('/api/init', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setInitStatus(data)
        addLog(`✅ 数据库初始化完成`)
        addLog(`👤 用户: ${data.user?.username} (${data.user?.email})`)
        addLog(`📁 创建分类: ${data.categoriesCreated} 个`)
        addLog(`📊 总报告数: ${data.totalReports}`)
        addLog(`📁 总分类数: ${data.totalCategories}`)
        
        // 重新检查状态
        setTimeout(() => {
          checkInitStatus()
          checkHealth()
        }, 1000)
      } else {
        addLog(`❌ 数据库初始化失败: ${data.error}`)
        if (data.details) {
          addLog(`🔍 详细信息: ${data.details}`)
        }
      }
    } catch (error) {
      addLog(`❌ 数据库初始化请求失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testReportUpload = async () => {
    try {
      setLoading(true)
      addLog('📝 测试报告创建...')
      
      const testReport = {
        title: '测试报告 - ' + new Date().toLocaleString(),
        content: '<h1>这是一个测试报告</h1><p>用于验证数据库上传功能是否正常工作。</p><p>时间戳: ' + Date.now() + '</p>',
        description: '这是一个测试报告用于验证功能',
        status: 'published',
        categoryId: 'predefined-uncategorized',
        tags: ['测试', '调试', 'Context7修复']
      }

      addLog(`📤 发送报告数据: ${testReport.title}`)
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testReport)
      })

      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ 报告创建成功!`)
        addLog(`📄 报告标题: ${data.report.title}`)
        addLog(`🆔 报告ID: ${data.report.id}`)
        addLog(`📁 分类: ${data.report.category?.name || '未分类'}`)
        addLog(`🏷️ 标签数量: ${data.report.tags?.length || 0}`)
        
        // 立即验证报告是否存在
        setTimeout(() => {
          testReportsAPI()
        }, 500)
      } else {
        addLog(`❌ 报告创建失败: ${data.error}`)
        if (data.details) {
          addLog(`🔍 详细错误: ${data.details}`)
        }
        if (data.hint) {
          addLog(`💡 提示: ${data.hint}`)
        }
      }
    } catch (error) {
      addLog(`❌ 报告创建请求失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testCategoriesAPI = async () => {
    try {
      addLog('📁 测试分类API...')
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ 分类API正常，共 ${data.categories.length} 个分类`)
        data.categories.forEach((cat: any, index: number) => {
          addLog(`  ${index + 1}. ${cat.name} (${cat.id}) ${cat.icon || ''}`)
        })
      } else {
        addLog(`❌ 分类API失败: ${data.error}`)
        if (data.details) {
          addLog(`🔍 详细信息: ${data.details}`)
        }
      }
    } catch (error) {
      addLog(`❌ 分类API请求失败: ${error}`)
    }
  }

  const testReportsAPI = async () => {
    try {
      addLog('📄 测试报告API...')
      const response = await fetch('/api/reports')
      const data = await response.json()
      
      if (response.ok) {
        addLog(`✅ 报告API正常，共 ${data.reports.length} 个报告`)
        if (data.reports.length > 0) {
          const latest = data.reports[0]
          addLog(`📄 最新报告: ${latest.title}`)
          addLog(`🕒 创建时间: ${new Date(latest.createdAt).toLocaleString()}`)
          addLog(`📁 分类: ${latest.category?.name || '未分类'}`)
        } else {
          addLog(`📝 暂无报告，可以测试创建功能`)
        }
      } else {
        addLog(`❌ 报告API失败: ${data.error}`)
        if (data.details) {
          addLog(`🔍 详细信息: ${data.details}`)
        }
      }
    } catch (error) {
      addLog(`❌ 报告API请求失败: ${error}`)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      addLog('🔌 测试数据库连接...')
      
      // 通过健康检查API测试连接
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (response.ok && data.status === 'healthy') {
        addLog('✅ 数据库连接正常')
        addLog(`🗄️ 数据库状态: ${data.database}`)
        addLog(`🌍 运行环境: ${data.environment}`)
        addLog(`⏱️ 运行时间: ${Math.round(data.uptime)}秒`)
      } else {
        addLog(`❌ 数据库连接失败: ${data.error || '未知错误'}`)
      }
    } catch (error) {
      addLog(`❌ 数据库连接测试失败: ${error}`)
    }
  }

  const runFullDiagnosis = async () => {
    addLog('🔍 开始完整诊断...')
    addLog('=====================================')
    
    await testDatabaseConnection()
    await checkHealth()
    await checkInitStatus()
    await testCategoriesAPI()
    await testReportsAPI()
    
    addLog('=====================================')
    addLog('🏁 完整诊断完成')
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    runFullDiagnosis()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🔧 Wendeal Reports 诊断工具</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        基于 Context7 Prisma 最佳实践的数据库诊断和修复工具
      </p>
      
      {/* 系统状态面板 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h2>📊 系统状态概览</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          
          {/* 健康状态 */}
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e1e1e1' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>🏥 系统健康</h4>
            {healthStatus ? (
              <div>
                <div style={{ color: healthStatus.status === 'healthy' ? 'green' : 'red', fontWeight: 'bold' }}>
                  {healthStatus.status === 'healthy' ? '✅ 正常' : '❌ 异常'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  数据库: {healthStatus.database}
                </div>
              </div>
            ) : (
              <div style={{ color: '#999' }}>检查中...</div>
            )}
          </div>

          {/* 初始化状态 */}
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e1e1e1' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>🚀 数据库初始化</h4>
            {initStatus ? (
              <div>
                <div style={{ color: initStatus.initialized ? 'green' : 'orange', fontWeight: 'bold' }}>
                  {initStatus.initialized ? '✅ 已初始化' : '⚠️ 未初始化'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  报告: {initStatus.reportCount} | 分类: {initStatus.categoryCount}
                </div>
              </div>
            ) : (
              <div style={{ color: '#999' }}>检查中...</div>
            )}
          </div>

          {/* 数据统计 */}
          <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e1e1e1' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>📈 数据统计</h4>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div>报告总数: {initStatus?.reportCount || 0}</div>
              <div>分类总数: {initStatus?.categoryCount || 0}</div>
            </div>
          </div>

        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={runFullDiagnosis}
          style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🔍 完整诊断
        </button>
        
        <button 
          onClick={testDatabaseConnection}
          style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🔌 测试连接
        </button>
        
        <button 
          onClick={initializeDatabase}
          disabled={loading}
          style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          🚀 初始化数据库
        </button>
        
        <button 
          onClick={testCategoriesAPI}
          style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📁 测试分类API
        </button>
        
        <button 
          onClick={testReportsAPI}
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📄 测试报告API
        </button>
        
        <button 
          onClick={testReportUpload}
          disabled={loading}
          style={{ padding: '8px 16px', backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          ⬆️ 测试报告创建
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ padding: '8px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🗑️ 清空日志
        </button>
      </div>

      {/* 实时日志 */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9' }}>
        <h3>🚦 实时诊断日志</h3>
        <div style={{ 
          maxHeight: '500px', 
          overflowY: 'auto', 
          fontFamily: 'monospace', 
          fontSize: '13px',
          backgroundColor: '#000',
          color: '#00ff00',
          padding: '15px',
          borderRadius: '4px',
          lineHeight: '1.4'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#888' }}>等待诊断操作...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
            ))
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f0f9ff' }}>
        <h3>📖 诊断指南</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <h4>🚀 首次部署</h4>
            <ol style={{ fontSize: '14px', color: '#555' }}>
              <li>点击"完整诊断"检查状态</li>
              <li>如果未初始化，点击"初始化数据库"</li>
              <li>测试"报告创建"功能</li>
            </ol>
          </div>
          <div>
            <h4>🔧 问题排查</h4>
            <ol style={{ fontSize: '14px', color: '#555' }}>
              <li>检查"系统健康"状态</li>
              <li>测试"数据库连接"</li>
              <li>查看日志中的详细错误信息</li>
            </ol>
          </div>
          <div>
            <h4>⚙️ Context7 优化</h4>
            <ul style={{ fontSize: '14px', color: '#555' }}>
              <li>连接池配置: connection_limit=1</li>
              <li>超时设置: pool_timeout=10</li>
              <li>无服务器环境优化</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 