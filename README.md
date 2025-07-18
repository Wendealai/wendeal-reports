# 📊 Wendeal Reports - 智能报告管理系统

> 一个现代化的HTML报告上传、管理和查看系统，支持文件优化、分类管理、全文搜索等功能。

[![Deploy Status](https://img.shields.io/badge/deploy-success-brightgreen)](https://github.com/wendeal/wendeal-reports)
[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://docker.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ 主要特性

- 🚀 **现代化界面**: 基于 Next.js 14 和 Tailwind CSS 的响应式设计
- 📁 **智能分类管理**: 支持预定义和自定义分类，拖拽排序
- 🔍 **全文搜索**: 快速搜索报告内容和元数据
- 📊 **文件优化**: 自动压缩和优化HTML文件
- 🔒 **安全验证**: 文件类型和内容安全检查
- 🐳 **Docker支持**: 一键部署，支持多种环境
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🏷️ **标签系统**: 灵活的标签管理和过滤
- 📈 **实时统计**: 文件大小、数量等统计信息
- 🔄 **自动初始化**: 数据库和用户数据自动创建

## 🎯 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL
- **部署**: Docker, Docker Compose
- **文件处理**: 文件压缩、格式验证、元数据提取
- **UI组件**: Radix UI, Lucide Icons

## 🚀 快速开始

### 方法一：Docker 部署（推荐）

#### 标准环境部署

```bash
# 克隆项目
git clone https://github.com/wendeal/wendeal-reports.git
cd wendeal-reports

# 复制环境配置
cp .env.docker .env

# 启动服务
docker compose up -d

# 查看服务状态
docker compose ps
```

#### ZimaOS 专用部署

如果您使用 ZimaOS 或其他只读根目录系统：

```bash
# 进入项目目录
cd /DATA/wendeal-reports

# 运行专用部署脚本
chmod +x scripts/deploy-zimaos.sh
./scripts/deploy-zimaos.sh
```

或手动配置：

```bash
# 设置Docker配置目录
export DOCKER_CONFIG=/DATA/.docker
mkdir -p /DATA/.docker

# 启动服务
docker compose up -d
```

### 方法二：本地开发

```bash
# 克隆项目
git clone https://github.com/wendeal/wendeal-reports.git
cd wendeal-reports

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 配置数据库连接

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

## 📋 系统要求

### 生产环境
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 最少 2GB，推荐 4GB+
- **存储**: 最少 5GB 可用空间
- **操作系统**: Linux, macOS, Windows

### 开发环境
- **Node.js**: 18.0+
- **PostgreSQL**: 13+
- **npm**: 8.0+

## 🔧 配置说明

### 环境变量

```bash
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/database"
DIRECT_URL="postgresql://user:password@localhost:5432/database"

# 应用配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 文件上传配置
MAX_FILE_SIZE="10485760"  # 10MB
UPLOAD_DIR="./public/uploads"

# 用户配置
DEFAULT_USER_ID="your-user-id"
```

### Docker配置

查看 `docker-compose.yml` 和 `.env.docker` 了解完整的容器配置。

## 📚 使用指南

### 1. 上传报告

1. 访问应用主页
2. 点击 "上传文件" 或拖拽文件到上传区域
3. 选择分类（可选）
4. 点击 "开始上传"

### 2. 管理分类

1. 进入 "分类管理" 页面
2. 创建、编辑或删除分类
3. 拖拽调整分类顺序
4. 设置分类颜色和图标

### 3. 搜索报告

- 使用顶部搜索框进行全文搜索
- 按分类、标签或状态过滤
- 使用高级搜索功能

### 4. 数据库管理

访问 `/admin/database-status` 页面可以：
- 检查数据库初始化状态
- 手动初始化数据库
- 查看用户和分类信息

## 🛠️ 维护和管理

### 查看日志

```bash
# 查看应用日志
docker compose logs -f app

# 查看数据库日志
docker compose logs -f postgres

# 查看所有日志
docker compose logs -f
```

### 备份数据

```bash
# 创建数据库备份
docker compose exec postgres pg_dump -U wendeal wendeal_reports > backup.sql

# 恢复数据库
docker compose exec -T postgres psql -U wendeal wendeal_reports < backup.sql
```

### 更新应用

```bash
# 停止服务
docker compose down

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose up -d --build
```

## 🔍 故障排除

### 常见问题

1. **上传失败 - "关联数据错误"**
   - 检查数据库初始化状态
   - 访问 `/admin/database-status` 手动初始化

2. **容器无法启动**
   - 检查端口是否被占用
   - 查看 Docker 日志排查问题

3. **文件上传超时**
   - 检查文件大小限制
   - 验证网络连接稳定性

4. **ZimaOS 部署问题**
   - 确保在 `/DATA` 目录下操作
   - 使用专用部署脚本

### 健康检查

访问以下端点检查系统状态：
- 健康检查: `http://localhost:11280/api/health`
- 数据库状态: `http://localhost:11280/admin/database-status`

## 📖 API 文档

### 主要端点

- `GET /api/health` - 系统健康检查
- `GET /api/reports` - 获取报告列表
- `POST /api/reports` - 上传新报告
- `GET /api/categories` - 获取分类列表
- `POST /api/admin/init-database` - 初始化数据库

## 🤝 贡献指南

1. Fork 此仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Prisma](https://prisma.io/) - 数据库工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://radix-ui.com/) - UI 组件库

## 📞 联系方式

- 项目主页: [https://github.com/wendeal/wendeal-reports](https://github.com/wendeal/wendeal-reports)
- 问题反馈: [GitHub Issues](https://github.com/wendeal/wendeal-reports/issues)

---

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**
