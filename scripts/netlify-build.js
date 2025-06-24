#!/usr/bin/env node

/**
 * Netlify 构建脚本
 * 处理环境变量和数据库设置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始 Netlify 构建过程...');

// 检查必要的环境变量
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.log('⚠️  缺少环境变量，使用占位符进行构建:', missingEnvVars.join(', '));
  
  // 为构建设置占位符环境变量
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder?sslmode=require';
  process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
} else {
  console.log('✅ 环境变量检查通过');
}

try {
  // 步骤 1: 生成 Prisma 客户端
  console.log('📦 生成 Prisma 客户端...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 步骤 2: 构建 Next.js 应用
  console.log('🏗️  构建 Next.js 应用...');
  execSync('npx next build', { stdio: 'inherit' });
  
  // 步骤 3: 如果有真实的数据库连接，运行数据库设置
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
    console.log('🗄️  设置数据库...');
    
    try {
      // 推送数据库架构
      execSync('npx prisma db push', { stdio: 'inherit' });
      
      // 初始化数据库数据
      execSync('node scripts/deploy-setup.js', { stdio: 'inherit' });
      
      console.log('✅ 数据库设置完成');
    } catch (dbError) {
      console.warn('⚠️  数据库设置失败，但构建继续:', dbError.message);
    }
  } else {
    console.log('ℹ️  跳过数据库设置（使用占位符连接）');
  }
  
  // 步骤 4: 验证构建结果
  const buildDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(buildDir)) {
    console.log('✅ 构建成功完成！');
    
    // 显示构建统计
    const stats = fs.statSync(buildDir);
    console.log(`📊 构建目录大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    throw new Error('构建目录不存在');
  }
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

console.log('🎉 Netlify 构建完成！');
