# 🚀 Netlify + Neon 部署指南

本指南将帮助你将 Wendeal Reports 项目部署到 Netlify，使用 Neon 作为 PostgreSQL 数据库。

## 📋 **前置要求**

- ✅ GitHub 账号
- ✅ Netlify 账号
- ✅ Neon 账号 (https://neon.tech)

## 🗄️ **第一步：设置 Neon 数据库**

### 1. 创建 Neon 项目
1. 登录 [Neon Console](https://console.neon.tech)
2. 点击 "Create Project"
3. 选择区域（推荐选择离用户最近的区域）
4. 项目名称：`wendeal-reports`
5. 数据库名称：`wendeal_reports_db`

### 2. 获取数据库连接字符串
创建项目后，在 Dashboard 中找到：
- **Connection String**: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`
- 复制这个连接字符串，稍后需要用到

### 3. 配置数据库设置
在 Neon Console 中：
- 确保 "Auto-suspend" 设置为合理的时间（如 5 分钟）
- 启用 "Connection pooling" 以提高性能

## 🌐 **第二步：部署到 Netlify**

### 1. 连接 GitHub 仓库
1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub 并授权
4. 选择 `wendeal-reports` 仓库

### 2. 配置构建设置
在 Netlify 部署设置中：
- **Build command**: `npm run netlify:build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`

### 3. 设置环境变量
在 Netlify 项目设置 > Environment variables 中添加：

```bash
# 数据库配置
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# Next.js 配置
NODE_ENV=production
NEXTAUTH_SECRET=your-super-secret-key-here-32-chars-min
NEXTAUTH_URL=https://your-site-name.netlify.app
```

**重要提示**：
- 将 `your-site-name` 替换为你的实际 Netlify 站点名称
- `NEXTAUTH_SECRET` 应该是一个至少 32 字符的随机字符串

### 4. 部署站点
1. 点击 "Deploy site"
2. 等待构建完成（首次部署可能需要 3-5 分钟）
3. 构建成功后，数据库会自动初始化

## ⚙️ **第三步：验证部署**

### 1. 检查站点功能
访问你的 Netlify 站点 URL：
- ✅ 首页加载正常
- ✅ 上传功能工作
- ✅ 报告列表显示
- ✅ 分类功能正常

### 2. 检查数据库
在 Neon Console 中查看：
- ✅ 表已创建
- ✅ 默认用户和分类已添加
- ✅ 连接正常

### 3. 测试上传功能
1. 访问站点首页
2. 尝试上传一个 HTML 文件
3. 验证文件压缩和优化功能
4. 检查报告是否正确显示

## 🔧 **高级配置**

### 自定义域名
1. 在 Netlify 项目设置中点击 "Domain management"
2. 添加自定义域名
3. 配置 DNS 记录
4. 更新 `NEXTAUTH_URL` 环境变量

### 性能优化
1. 启用 Netlify 的 "Asset optimization"
2. 配置 CDN 缓存策略
3. 启用 "Form detection" 如果需要

### 监控和分析
1. 启用 Netlify Analytics
2. 配置 Sentry 错误监控（可选）
3. 设置 Uptime 监控

## 🚨 **故障排除**

### 常见问题

**1. 构建失败**
```bash
# 检查构建日志中的错误信息
# 常见原因：
- 环境变量未设置
- 数据库连接失败
- 依赖包安装失败
```

**2. 数据库连接错误**
```bash
# 检查：
- DATABASE_URL 格式是否正确
- Neon 数据库是否正常运行
- 网络连接是否正常
```

**3. 函数超时**
```bash
# Netlify 函数有 10 秒超时限制
# 如果数据库操作较慢，考虑：
- 优化查询
- 使用连接池
- 分批处理大量数据
```

### 调试步骤
1. 查看 Netlify 构建日志
2. 检查函数执行日志
3. 验证环境变量设置
4. 测试数据库连接

## 📊 **性能指标**

部署成功后，你应该看到：
- ⚡ **冷启动时间**: < 2 秒
- 🗜️ **文件压缩率**: 70-85%
- 📈 **页面加载速度**: < 3 秒
- 🔄 **API 响应时间**: < 500ms

## 🔄 **更新部署**

当你推送新代码到 GitHub 时：
1. Netlify 会自动触发新的构建
2. 数据库迁移会自动运行
3. 新版本会自动部署

## 💡 **最佳实践**

1. **定期备份数据库**：使用 Neon 的备份功能
2. **监控性能**：定期检查 Netlify Analytics
3. **安全更新**：及时更新依赖包
4. **环境隔离**：为开发和生产使用不同的数据库

## 🎉 **部署完成！**

恭喜！你的 Wendeal Reports 现在已经成功部署到 Netlify。

**下一步**：
- 📝 开始上传你的第一个报告
- 🎨 自定义主题和样式
- 📊 监控使用情况和性能
- 🔧 根据需要调整配置

如果遇到任何问题，请查看故障排除部分或联系支持。
