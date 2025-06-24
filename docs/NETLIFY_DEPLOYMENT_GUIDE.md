# Wendeal Reports - Netlify 部署指南

本指南将帮助您将Wendeal Reports项目部署到Netlify平台。

## 🚀 快速部署

### 1. 准备工作

确保您的项目已经推送到GitHub仓库。

### 2. 连接到Netlify

1. 登录 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 选择您的GitHub仓库
4. 选择要部署的分支（通常是 `main` 或 `master`）

### 3. 构建配置

Netlify会自动检测到`netlify.toml`配置文件，但您也可以手动设置：

- **Build command**: `npm run build:netlify && npm run export`
- **Publish directory**: `out`
- **Functions directory**: `netlify/functions`

### 4. 环境变量配置

在Netlify控制台的 "Site settings" > "Environment variables" 中添加以下变量：

```bash
# 必需的环境变量
DATABASE_URL="file:./wendeal.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="production"
NETLIFY="true"
NEXT_TELEMETRY_DISABLED="1"

# 可选的环境变量
APP_NAME="Wendeal Reports"
APP_URL="https://your-site-name.netlify.app"
MAX_FILE_SIZE="10485760"
LOG_LEVEL="info"
DEFAULT_USER_ID="cmbusc9x00000x2w0fqyu591k"
```

### 5. 部署

点击 "Deploy site" 开始部署。首次部署可能需要几分钟时间。

## 📋 部署后设置

### 1. 初始化数据库

部署完成后，访问以下URL来初始化数据库：

```
POST https://your-site-name.netlify.app/api/init
```

或者使用curl命令：

```bash
curl -X POST https://your-site-name.netlify.app/api/init
```

### 2. 默认登录信息

初始化完成后，您可以使用以下信息登录：

- **邮箱**: admin@wendeal.com
- **密码**: admin123

**重要**: 首次登录后请立即修改密码！

## 🔧 功能说明

### Netlify Functions

项目使用Netlify Functions来处理API请求：

- `auth-login.mts` - 用户登录认证
- `categories.mts` - 分类管理
- `reports.mts` - 报告管理
- `init-db.mts` - 数据库初始化

### 数据库

由于Netlify是无服务器平台，我们使用SQLite数据库文件。在生产环境中，建议使用：

- [PlanetScale](https://planetscale.com/) (MySQL)
- [Supabase](https://supabase.com/) (PostgreSQL)
- [Neon](https://neon.tech/) (PostgreSQL)

要切换到外部数据库，只需修改`DATABASE_URL`环境变量。

## 🛠️ 故障排除

### 构建失败

1. 检查Node.js版本是否为18或更高
2. 确保所有依赖都已正确安装
3. 检查环境变量是否正确设置

### 函数错误

1. 查看Netlify Functions日志
2. 确保数据库连接正常
3. 检查环境变量配置

### 数据库问题

1. 确保DATABASE_URL正确设置
2. 检查Prisma schema是否正确
3. 尝试重新初始化数据库

## 📈 性能优化

### 1. 启用缓存

在`netlify.toml`中添加缓存头：

```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 2. 图片优化

使用Netlify的图片优化服务：

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 3. 函数优化

- 使用连接池来优化数据库连接
- 实现适当的错误处理和重试机制
- 监控函数执行时间

## 🔒 安全建议

1. **更改默认密码**: 首次登录后立即修改管理员密码
2. **使用强JWT密钥**: 生成一个强随机字符串作为JWT_SECRET
3. **启用HTTPS**: Netlify默认提供免费SSL证书
4. **定期备份**: 定期备份数据库文件

## 📞 支持

如果遇到问题，可以：

1. 查看Netlify部署日志
2. 检查浏览器控制台错误
3. 查看项目的GitHub Issues
4. 联系技术支持

## 🔄 更新部署

要更新部署：

1. 推送代码到GitHub仓库
2. Netlify会自动触发新的部署
3. 等待部署完成
4. 测试新功能

---

**祝您部署愉快！** 🎉 