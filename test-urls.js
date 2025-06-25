#!/usr/bin/env node

/**
 * 测试多个可能的 Vercel URL
 */

const https = require('https');

const urls = [
  'https://wendeal-reports.vercel.app',
  'https://wendeal-reports-jqi4j1b7f-wen-zhongs-projects.vercel.app',
  'https://wendeal-reports-git-main-wen-zhongs-projects.vercel.app'
];

async function makeRequest(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ 
            url,
            status: res.statusCode, 
            data: res.statusCode === 200 ? JSON.parse(data) : data.substring(0, 100) + '...',
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            url,
            status: res.statusCode, 
            data: data.substring(0, 100) + '...',
            headers: res.headers 
          });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        data: err.message,
        headers: {}
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        data: 'Request timeout',
        headers: {}
      });
    });
  });
}

async function testUrl(baseUrl) {
  console.log(`\n🔍 Testing: ${baseUrl}`);
  console.log('=' + '='.repeat(baseUrl.length + 10));
  
  const endpoints = [
    '/api/health',
    '/api/categories',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    const fullUrl = baseUrl + endpoint;
    console.log(`\n📡 ${endpoint}:`);
    
    const result = await makeRequest(fullUrl);
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('   ✅ Success!');
      if (endpoint === '/api/health' && result.data.status) {
        console.log(`   Database: ${result.data.database?.status || 'unknown'}`);
        if (result.data.database?.statistics) {
          console.log(`   Stats: ${JSON.stringify(result.data.database.statistics)}`);
        }
      }
      if (endpoint === '/api/categories' && result.data.categories) {
        console.log(`   Categories: ${result.data.categories.length} found`);
      }
    } else if (result.status === 401) {
      console.log('   🔐 Authentication required');
    } else if (result.status === 404) {
      console.log('   ❌ Not found');
    } else if (result.status === 500) {
      console.log('   💥 Server error');
    } else {
      console.log(`   ❓ Unexpected status: ${result.status}`);
    }
    
    if (result.data && typeof result.data === 'string' && result.data.includes('error')) {
      console.log(`   Error: ${result.data.substring(0, 80)}...`);
    }
  }
}

async function main() {
  console.log('🌐 Testing Vercel Deployment URLs');
  console.log('==================================');
  
  for (const url of urls) {
    await testUrl(url);
  }
  
  console.log('\n📋 Summary:');
  console.log('----------');
  console.log('Check which URL works and update your environment variables accordingly.');
  console.log('The working URL should be set as NEXTAUTH_URL in Vercel environment variables.');
  
  console.log('\n🔗 Next steps:');
  console.log('1. If any URL shows ✅ Success, use that as your main URL');
  console.log('2. Update NEXTAUTH_URL in Vercel environment variables');
  console.log('3. Redeploy if needed');
  console.log('4. Test the application functionality');
}

main().catch(console.error);
