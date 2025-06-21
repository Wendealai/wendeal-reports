#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Context7推荐：通用数据库连接测试脚本（支持SQLite和PostgreSQL）
async function testDatabaseConnection() {
  console.log('🚀 开始数据库连接测试...\n');
  
  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('NODE_ENV:', process.env.NODE_ENV || '未设置');
  console.log('DATABASE_URL 存在:', !!process.env.DATABASE_URL);
  console.log('DIRECT_URL 存在:', !!process.env.DIRECT_URL);
  
  if (process.env.DATABASE_URL) {
    // 安全显示URL（隐藏密码）
    const safeUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
    console.log('DATABASE_URL 格式:', safeUrl);
    
    // 检测数据库类型
    const isSQLite = process.env.DATABASE_URL.startsWith('file:');
    const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://');
    const isNeon = process.env.DATABASE_URL.includes('.neon.tech');
    
    console.log('数据库类型:', isSQLite ? 'SQLite' : isPostgreSQL ? 'PostgreSQL' : '未知');
    if (isNeon) console.log('Neon云数据库: ✅');
    
    if (isPostgreSQL) {
      const hasPooler = process.env.DATABASE_URL.includes('-pooler');
      const hasSSL = process.env.DATABASE_URL.includes('sslmode=require');
      console.log('连接池:', hasPooler ? '✅' : '❌');
      console.log('SSL模式:', hasSSL ? '✅' : '❌');
    }
  }
  console.log('');

  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    errorFormat: 'pretty'
  });

  try {
    console.log('🔌 步骤1: 显式连接...');
    await prisma.$connect();
    console.log('✅ 连接成功\n');

    console.log('🔍 步骤2: 测试查询...');
    
    // Context7修复：根据数据库类型使用不同的查询
    const isSQLite = process.env.DATABASE_URL?.startsWith('file:');
    
    let result;
    if (isSQLite) {
      // SQLite查询
      result = await prisma.$queryRaw`SELECT 
        sqlite_version() as version,
        'SQLite' as database_type,
        datetime('now') as timestamp`;
    } else {
      // PostgreSQL查询
      result = await prisma.$queryRaw`SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        now() as timestamp`;
    }
    
    console.log('✅ 查询成功:');
    console.log('数据库版本:', result[0].version);
    
    if (!isSQLite) {
      console.log('当前数据库:', result[0].database);
      console.log('当前用户:', result[0].user);
    }
    console.log('服务器时间:', result[0].timestamp);
    console.log('');

    console.log('📊 步骤3: 检查表结构...');
    try {
      let tables;
      if (isSQLite) {
        // SQLite查询表结构
        tables = await prisma.$queryRaw`
          SELECT name as table_name 
          FROM sqlite_master 
          WHERE type='table' 
          AND name NOT LIKE 'sqlite_%'
          ORDER BY name`;
      } else {
        // PostgreSQL查询表结构
        tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name`;
      }
      
      console.log('✅ 发现表:', tables.map(t => t.table_name).join(', '));
      
      // 检查表的记录数
      const tableNames = tables.map(t => t.table_name);
      
      if (tableNames.includes('User')) {
        const userCount = await prisma.user.count();
        console.log('User表记录数:', userCount);
      }
      
      if (tableNames.includes('Category')) {
        const categoryCount = await prisma.category.count();
        console.log('Category表记录数:', categoryCount);
      }
      
      if (tableNames.includes('Report')) {
        const reportCount = await prisma.report.count();
        console.log('Report表记录数:', reportCount);
      }
      
    } catch (tableError) {
      console.log('⚠️ 表检查失败（可能需要运行迁移）:', tableError.message);
    }
    console.log('');

    console.log('⚡ 步骤4: 性能测试...');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const queryTime = Date.now() - startTime;
    console.log(`✅ 查询延迟: ${queryTime}ms`);
    console.log('');

    console.log('🎉 所有测试通过！数据库连接正常\n');
    
    // Context7推荐：输出部署建议
    console.log('💡 部署建议:');
    if (isSQLite) {
      console.log('1. 当前使用SQLite进行本地开发');
      console.log('2. 生产环境建议使用PostgreSQL（Neon）');
      console.log('3. 在Netlify中配置Neon数据库连接字符串');
    } else {
      console.log('1. 确保在Netlify环境变量中设置了DATABASE_URL');
      console.log('2. 如果使用迁移，也需要设置DIRECT_URL');
      console.log('3. 建议在连接URL中添加连接超时参数：');
      console.log('   ?sslmode=require&connect_timeout=15&pool_timeout=15');
      console.log('4. Neon数据库在闲置时会自动睡眠，首次连接可能较慢');
    }
    
  } catch (error) {
    console.error('❌ 连接测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    // Context7推荐：详细的错误诊断
    console.log('\n🔧 故障排除建议:');
    
    if (error.message.includes('timeout')) {
      console.log('- 连接超时：数据库可能处于睡眠状态，请稍后重试');
      console.log('- 在DATABASE_URL中添加超时参数：connect_timeout=15&pool_timeout=15');
    }
    
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('- 认证失败：检查DATABASE_URL中的用户名和密码');
      console.log('- 确认在数据库控制台中的凭据正确');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('- 无法连接到主机：检查DATABASE_URL中的主机地址');
      console.log('- 确认网络连接正常');
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('- 数据库不存在：确认数据库名称正确');
    }
    
    if (error.message.includes('no such table') || error.message.includes('table')) {
      console.log('- 表不存在：需要运行数据库迁移');
      console.log('- 运行: npx prisma db push 或 npx prisma migrate deploy');
    }
    
    console.log('- 检查数据库状态和配置');
    console.log('- 确认所有环境变量正确设置');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行测试
testDatabaseConnection().catch(console.error); 