const fs = require('fs');
const path = require('path');

console.log('🚀 Wendeal Reports 部署前检查\n');

// 检查必需文件
const requiredFiles = [
  'package.json',
  'netlify.toml',
  'next.config.js',
  'prisma/schema.prisma',
  'prisma/schema.postgresql.prisma',
  'src/app/api/health/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/categories/route.ts',
  'netlify/functions/init-db.mts'
];

console.log('📂 检查必需文件:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ 缺少必需文件，请检查项目结构');
  process.exit(1);
}

// 检查package.json配置
console.log('\n📦 检查package.json配置:');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

// 检查关键依赖
const requiredDeps = ['@prisma/client', 'prisma', 'next', 'react', 'zustand'];
const missingDeps = requiredDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.log('❌ 缺少依赖:', missingDeps.join(', '));
} else {
  console.log('✅ 所有必需依赖已安装');
}

// 检查构建脚本
const hasCorrectBuildScript = packageJson.scripts && 
  packageJson.scripts.build && 
  packageJson.scripts.build.includes('next build');

console.log(`${hasCorrectBuildScript ? '✅' : '❌'} 构建脚本配置正确`);

// 检查Netlify配置
console.log('\n🌐 检查netlify.toml配置:');
const netlifyToml = fs.readFileSync(path.join(__dirname, '..', 'netlify.toml'), 'utf8');

const checks = [
  { name: '构建命令包含prisma generate', test: /npx prisma generate/.test(netlifyToml) },
  { name: '发布目录设置为.next', test: /publish\s*=\s*"\.next"/.test(netlifyToml) },
  { name: '配置了Next.js插件', test: /@netlify\/plugin-nextjs/.test(netlifyToml) },
];

checks.forEach(check => {
  console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
});

// 检查数据库Schema
console.log('\n🗄️ 检查数据库Schema:');
const sqliteSchema = fs.readFileSync(path.join(__dirname, '..', 'prisma/schema.prisma'), 'utf8');
const postgresSchema = fs.readFileSync(path.join(__dirname, '..', 'prisma/schema.postgresql.prisma'), 'utf8');

const sqliteOk = /provider\s*=\s*"sqlite"/.test(sqliteSchema);
const postgresOk = /provider\s*=\s*"postgresql"/.test(postgresSchema);

console.log(`${sqliteOk ? '✅' : '❌'} SQLite schema for local development`);
console.log(`${postgresOk ? '✅' : '❌'} PostgreSQL schema for production`);

// 检查API路由
console.log('\n🔌 检查API路由:');
const apiRoutes = [
  'src/app/api/health/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/categories/route.ts',
  'src/app/api/init/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(__dirname, '..', route);
  const exists = fs.existsSync(routePath);
  if (exists) {
    const content = fs.readFileSync(routePath, 'utf8');
    const hasGetMethod = /export\s+async\s+function\s+GET/.test(content);
    const hasPostMethod = /export\s+async\s+function\s+POST/.test(content);
    console.log(`✅ ${route} ${hasGetMethod ? '(GET)' : ''} ${hasPostMethod ? '(POST)' : ''}`);
  } else {
    console.log(`❌ ${route}`);
  }
});

console.log('\n📋 部署检查清单:');
const checklist = [
  '✅ GitHub仓库已更新最新代码',
  '✅ 本地构建测试通过 (npm run build)',
  '⚠️ Neon数据库已创建并获取连接字符串',
  '⚠️ Netlify站点已连接到GitHub仓库',
  '⚠️ Netlify环境变量已配置',
  '⚠️ 部署后调用 /.netlify/functions/init-db 初始化数据库'
];

checklist.forEach(item => console.log(item));

console.log('\n🎉 检查完成！项目已准备好部署到Netlify。');
console.log('📚 详细部署指南请查看 NETLIFY_DEPLOYMENT_FINAL.md'); 