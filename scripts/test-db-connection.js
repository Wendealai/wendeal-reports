#!/usr/bin/env node

// Context7数据库连接测试脚本
console.log('🔍 [Test] Starting database connection test...');

// 模拟Netlify环境
process.env.NETLIFY = 'true';
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'file:/tmp/dev.db?connection_limit=1&pool_timeout=10&socket_timeout=10';

async function testDatabaseConnection() {
  try {
    // 动态导入修复后的prisma模块
    const { testDatabaseConnection, ensureDatabaseInitialized, debugDatabaseInfo } = await import('../src/lib/prisma.ts');
    
    console.log('📊 [Test] Running database tests...');
    
    // 测试1: 基本连接
    console.log('\n1️⃣ Testing basic connection...');
    const connectionResult = await testDatabaseConnection();
    console.log('Connection result:', connectionResult);
    
    // 测试2: 自动初始化
    console.log('\n2️⃣ Testing auto-initialization...');
    await ensureDatabaseInitialized();
    console.log('✅ Initialization completed');
    
    // 测试3: 调试信息
    console.log('\n3️⃣ Getting debug info...');
    const debugInfo = await debugDatabaseInfo();
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    console.log('\n🎉 [Test] All tests passed! Database connection is working.');
    
  } catch (error) {
    console.error('❌ [Test] Database test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    process.exit(1);
  }
}

testDatabaseConnection(); 