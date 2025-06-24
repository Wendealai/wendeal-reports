// 简单测试服务器状态
async function testServer() {
  try {
    console.log('🔍 检查服务器状态...')
    
    const response = await fetch('http://localhost:3000')
    console.log('状态码:', response.status)
    console.log('状态文本:', response.statusText)
    
    if (response.ok) {
      console.log('✅ 服务器正常运行')
    } else {
      console.log('❌ 服务器响应异常')
      const text = await response.text()
      console.log('响应内容:', text.substring(0, 200))
    }
    
  } catch (error) {
    console.error('❌ 连接服务器失败:', error.message)
  }
}

testServer() 