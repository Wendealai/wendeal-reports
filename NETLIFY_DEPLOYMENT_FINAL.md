# 🚀 Netlify 部署指南 - 最终版本

## 📋 部署前检查清单

### ✅ 代码准备
- [x] 本地构建成功 (`npm run build`)
- [x] 无TypeScript错误
- [x] 无ESLint警告
- [x] 代码已推送到GitHub: https://github.com/Wendealai/wendeal-reports

### ✅ 配置文件
- [x] `netlify.toml` - 简化配置，使用标准插件
- [x] `next.config.js` - 移除复杂配置，确保兼容性
- [x] `package.json` - 统一构建脚本
- [x] `.env.example` - 环境变量示例

## 🚀 Netlify 部署步骤

### 步骤 1: 创建新站点
1. 登录 [Netlify Dashboard](https://app.netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub 并授权
4. 选择仓库: `Wendealai/wendeal-reports`
5. 分支选择: `main`

### 步骤 2: 构建设置
Netlify应该自动检测到`netlify.toml`配置，如果没有，请手动设置：

```
Build command: npm run build
Publish directory: .next
```

### 步骤 3: 环境变量设置
在 Site settings → Environment variables 中添加：

```bash
# 必需的环境变量
DATABASE_URL=file:/tmp/dev.db?connection_limit=1&pool_timeout=10
JWT_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=your-32-character-nextauth-secret
DEFAULT_USER_ID=cmbusc9x00000x2w0fqyu591k
NODE_ENV=production
```

#### 🔑 生成安全密钥
在本地终端运行以下命令生成密钥：

```bash
# 生成JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成NEXTAUTH_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤 4: 部署触发
1. 点击 "Deploy site"
2. 等待构建完成（通常需要2-5分钟）
3. 检查构建日志确保无错误

## 🔍 部署后验证

### 1. 基础功能测试
访问以下URL验证功能：

```
https://your-site-name.netlify.app
https://your-site-name.netlify.app/dashboard
https://your-site-name.netlify.app/api/health
```

### 2. API端点测试
```bash
# 数据库初始化
curl https://your-site-name.netlify.app/api/init/database

# 获取报告列表
curl https://your-site-name.netlify.app/api/reports

# 获取分类列表
curl https://your-site-name.netlify.app/api/categories
```

### 3. 功能验证清单
- [ ] 首页正确重定向到dashboard
- [ ] 侧边栏显示默认分类
- [ ] 可以创建新报告
- [ ] 文件上传功能正常
- [ ] 搜索和过滤功能正常

## 🛠️ 故障排除

### 构建失败
如果构建失败，请检查：
1. **Node.js版本**: 确保使用Node.js 18
2. **依赖安装**: 检查`npm install`是否成功
3. **Prisma生成**: 确保`prisma generate`成功执行

### 运行时错误
如果应用运行时出错：
1. **环境变量**: 确保所有必需的环境变量都已设置
2. **函数日志**: 在Netlify Dashboard → Functions 中查看日志
3. **数据库初始化**: 手动访问`/api/init/database`端点

### 常见错误及解决方案

#### 1. "Database connection failed"
- 检查`DATABASE_URL`环境变量
- 确认使用`/tmp/dev.db`路径
- 验证连接参数正确

#### 2. "Function timeout"
- 检查Netlify函数是否在10秒内完成
- 优化数据库查询
- 考虑分页处理大量数据

#### 3. "Module not found"
- 确保所有依赖都在`package.json`中
- 检查导入路径是否正确
- 验证TypeScript配置

## 📊 性能优化建议

### 1. 数据库优化
- 使用连接池限制: `connection_limit=1`
- 设置超时: `pool_timeout=10`
- 实现查询缓存

### 2. 函数优化
- 最小化冷启动时间
- 复用数据库连接
- 优化日志输出

### 3. 前端优化
- 启用图片优化
- 实现代码分割
- 使用CDN加速

## 🔗 有用链接

- **GitHub仓库**: https://github.com/Wendealai/wendeal-reports
- **Netlify文档**: https://docs.netlify.com/frameworks/next-js/
- **Next.js部署指南**: https://nextjs.org/docs/deployment
- **Prisma Netlify指南**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-netlify

## 📞 支持

如果遇到问题：
1. 检查本文档的故障排除部分
2. 查看Netlify构建日志
3. 检查GitHub Issues
4. 联系技术支持

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19  
**状态**: 🟢 准备部署 