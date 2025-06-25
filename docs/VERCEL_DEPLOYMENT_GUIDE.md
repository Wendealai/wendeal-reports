# Wendeal Reports - Vercel 部署指南

## 🚀 快速部署到Vercel

### 方法一：使用Vercel CLI（推荐）

1. **登录Vercel**

   ```bash
   vercel login
   ```

2. **部署项目**

   ```bash
   vercel --prod
   ```

3. **按照提示配置**
   - 选择团队（如果有）
   - 确认项目名称
   - 确认项目设置

### 方法二：使用GitHub集成

1. **推送代码到GitHub**

   ```bash
   git add .
   git commit -m "准备部署到Vercel"
   git push origin main
   ```

2. **连接Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择GitHub仓库
   - 点击 "Deploy"

## 🗄️ 数据库设置

### 选项一：Vercel Postgres（推荐）

1. **在Vercel控制台中**

   - 进入项目设置
   - 点击 "Storage" 标签
   - 选择 "Create Database"
   - 选择 "Postgres"

2. **获取连接字符串**
   - 复制 `DATABASE_URL`
   - 添加到环境变量

### 选项二：其他云数据库

**Supabase (PostgreSQL)**

```bash
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"
```

**PlanetScale (MySQL)**

```bash
DATABASE_URL="mysql://[username]:[password]@[host]/[database]?sslaccept=strict"
```

**Neon (PostgreSQL)**

```bash
DATABASE_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"
```

## ⚙️ 环境变量配置

在Vercel控制台的 "Settings" > "Environment Variables" 中添加：

### 必需变量

```bash
DATABASE_URL="your-database-connection-string"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="production"
```

### 可选变量

```bash
APP_NAME="Wendeal Reports"
LOG_LEVEL="info"
MAX_FILE_SIZE="10485760"
DEFAULT_USER_ID="cmbusc9x00000x2w0fqyu591k"
NEXT_TELEMETRY_DISABLED="1"
```

## 🔄 数据库迁移

### 如果使用新数据库

1. **更新Prisma配置**

   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"  // 或 "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. **运行迁移**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### 如果需要迁移现有数据

1. **导出SQLite数据**

   ```bash
   npx prisma db pull
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql
   ```

2. **在新数据库中执行迁移**

## 🧪 本地测试

1. **设置本地环境**

   ```bash
   cp vercel-env.example .env.local
   # 编辑 .env.local 设置数据库连接
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **生成Prisma客户端**

   ```bash
   npx prisma generate
   ```

4. **运行数据库迁移**

   ```bash
   npx prisma migrate dev
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 🔧 Vercel配置文件

项目包含以下Vercel配置：

- `vercel.json` - Vercel项目配置
- `next.config.js` - Next.js优化配置
- `vercel-env.example` - 环境变量示例

## 📋 部署后设置

1. **初始化数据库**
   访问：`https://your-app.vercel.app/api/init`

2. **默认登录信息**

   - 邮箱: `admin@wendeal.com`
   - 密码: `admin123`

3. **修改密码**
   首次登录后请立即修改密码！

## 🚀 部署优化

### 性能优化

- 启用Vercel Analytics
- 配置Edge Functions
- 使用Vercel Image Optimization

### 监控设置

- 启用Vercel Monitoring
- 配置错误报告
- 设置性能警报

## 🛠️ 故障排除

### 构建失败

1. 检查环境变量设置
2. 验证数据库连接
3. 查看构建日志

### 数据库连接问题

1. 确认DATABASE_URL格式正确
2. 检查数据库服务状态
3. 验证网络连接

### API路由错误

1. 检查函数日志
2. 验证环境变量
3. 测试本地开发环境

## 📈 扩展功能

### 添加域名

1. 在Vercel控制台添加自定义域名
2. 配置DNS设置
3. 启用HTTPS

### 团队协作

1. 邀请团队成员
2. 设置权限
3. 配置分支部署

## 🔄 更新部署

### 自动部署

- 推送到main分支自动触发部署
- Pull Request预览部署

### 手动部署

```bash
vercel --prod
```

## 📞 技术支持

如果遇到问题：

1. **查看Vercel文档**: https://vercel.com/docs
2. **检查构建日志**: Vercel控制台 > Deployments
3. **测试本地环境**: 确保本地运行正常
4. **联系支持**: Vercel社区或GitHub Issues

---

**恭喜！** 您的Wendeal Reports应用现在可以在Vercel上运行了！ 🎉
