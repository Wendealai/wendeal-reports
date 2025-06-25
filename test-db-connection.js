#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests local and production database connectivity
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function testDatabaseConnection() {
  console.log('🔧 Testing Database Connection...\n');
  
  // Test local database first
  console.log('📋 Environment Configuration:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
  console.log(`DIRECT_URL configured: ${!!process.env.DIRECT_URL}`);
  
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    const isLocalSqlite = url.includes('file:');
    const isNeonPg = url.includes('neon.tech');
    const isPlaceholder = url.includes('username:password');
    
    console.log(`Database type: ${isLocalSqlite ? 'Local SQLite' : isNeonPg ? 'Neon PostgreSQL' : 'Unknown'}`);
    console.log(`Is placeholder: ${isPlaceholder}`);
  }
  console.log('');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // Test basic connection
    console.log('🔍 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful!');
    
    // Test database structure
    try {
      console.log('\n📊 Testing database structure...');
      
      const userCount = await prisma.user.count();
      console.log(`Users: ${userCount}`);
      
      const categoryCount = await prisma.category.count();
      console.log(`Categories: ${categoryCount}`);
      
      const reportCount = await prisma.report.count();
      console.log(`Reports: ${reportCount}`);
      
      console.log('✅ Database structure is healthy!');
      
      // Show some sample data
      if (reportCount > 0) {
        console.log('\n📝 Sample reports:');
        const sampleReports = await prisma.report.findMany({
          take: 3,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            category: {
              select: {
                name: true
              }
            }
          }
        });
        
        sampleReports.forEach((report, index) => {
          console.log(`${index + 1}. ${report.title} (${report.category?.name || 'Uncategorized'}) - ${report.status}`);
        });
      }
      
      if (categoryCount > 0) {
        console.log('\n📁 Available categories:');
        const categories = await prisma.category.findMany({
          select: {
            id: true,
            name: true,
            icon: true,
            _count: {
              select: {
                reports: true
              }
            }
          }
        });
        
        categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.icon || '📁'} ${cat.name} (${cat._count.reports} reports)`);
        });
      }
      
    } catch (structureError) {
      console.warn('⚠️ Database structure test failed (may need migration):', structureError.message);
      console.log('\n🔧 To fix this, run: npx prisma db push');
    }
    
  } catch (connectionError) {
    console.error('❌ Database connection failed:', connectionError.message);
    
    // Check if it's a SQLite file issue
    if (connectionError.message.includes('ENOENT') || connectionError.message.includes('no such file')) {
      console.log('\n💡 SQLite database file not found. Creating...');
      try {
        const { execSync } = require('child_process');
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ Database initialized successfully!');
        
        // Retry connection
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection now working!');
      } catch (createError) {
        console.error('❌ Failed to create database:', createError.message);
      }
    }
    
    // Check if it's a network/credentials issue
    else if (connectionError.message.includes('connect') || connectionError.message.includes('authentication')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if DATABASE_URL is correctly configured');
      console.log('2. Verify database credentials');
      console.log('3. Ensure database server is running');
      console.log('4. Check network connectivity');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('📄 Loading .env.local file...');
  require('dotenv').config({ path: envPath });
} else {
  console.log('📄 No .env.local file found, using system environment variables');
}

testDatabaseConnection()
  .then(() => {
    console.log('\n🎉 Database test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database test failed:', error);
    process.exit(1);
  });
