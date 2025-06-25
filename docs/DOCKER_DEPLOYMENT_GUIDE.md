# Wendeal Reports Docker 部署指南

## 📋 目录

- [快速开始](#快速开始)
- [部署模式](#部署模式)
- [环境配置](#环境配置)
- [服务管理](#服务管理)
- [数据备份](#数据备份)
- [监控维护](#监控维护)
- [故障排除](#故障排除)

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 一键部署

#### Windows

```bash
# 运行部署脚本
deploy.bat

# 或使用 Make 命令
make init
make up
```

#### Linux/Mac

```bash
# 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 或使用 Make 命令
make init
make up
```

## 🎯 部署模式

### 1. 开发环境

适用于本地开发和测试：

```bash
# 使用 Make
make dev

# 或使用 Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

**特性：**

- 热重载支持
- 调试日志级别
- 开发专用数据库
- 源代码挂载

### 2. 基本生产环境

适用于小型部署：

```bash
# 使用 Make
make up

# 或使用 Docker Compose
docker-compose up -d
```

**包含服务：**

- Wendeal Reports 主应用
- 自动数据库备份
- 健康检查

### 3. 完整生产环境

适用于生产级部署：

```bash
# 使用 Make
make prod

# 或使用 Docker Compose
docker-compose --profile production up -d
```

**包含服务：**

- Wendeal Reports 主应用
- Nginx 反向代理
- Redis 缓存
- 自动数据库备份
- Watchtower 自动更新
- 完整监控

## ⚙️ 环境配置

### 环境变量文件

复制并编辑环境变量文件：

```bash
cp env.example .env
```

### 关键配置项

```bash
# 应用配置
NODE_ENV=production
PORT=7575
APP_NAME=Wendeal Reports
APP_URL=http://your-domain.com

# 安全配置（必须修改）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 数据库配置
DATABASE_URL=file:/app/data/wendeal.db

# 文件上传限制
MAX_FILE_SIZE=10485760

# 日志级别
LOG_LEVEL=info

# 域名配置（用于 Nginx）
DOMAIN=your-domain.com

# 备份配置
BACKUP_SCHEDULE=0 2 * * *
```

### SSL 证书配置

如果使用 HTTPS，将证书文件放置在：

```
nginx/ssl/cert.pem
nginx/ssl/key.pem
```

## 🛠️ 服务管理

### Make 命令（推荐）

```bash
# 查看所有命令
make help

# 基本操作
make build          # 构建镜像
make up             # 启动服务
make down           # 停止服务
make restart        # 重启服务
make logs           # 查看日志
make status         # 查看状态

# 开发环境
make dev            # 启动开发环境
make dev-logs       # 查看开发日志
make dev-down       # 停止开发环境

# 生产环境
make prod           # 启动完整生产环境
make prod-down      # 停止生产环境

# 维护操作
make backup         # 手动备份
make clean          # 清理资源
make health         # 健康检查
make monitor        # 监控日志
```

### Docker Compose 命令

```bash
# 基本操作
docker-compose up -d                    # 启动服务
docker-compose down                     # 停止服务
docker-compose logs -f wendeal-reports  # 查看日志
docker-compose ps                       # 查看状态

# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose --profile production up -d

# 重建镜像
docker-compose build --no-cache
```

## 💾 数据备份

### 自动备份

系统每天凌晨2点自动备份数据库，保留7天：

```bash
# 查看备份服务状态
docker-compose logs db-backup

# 修改备份计划（在 .env 文件中）
BACKUP_SCHEDULE=0 2 * * *  # 每天凌晨2点
```

### 手动备份

```bash
# 使用 Make
make backup

# 使用脚本
./deploy.sh backup

# 手动操作
mkdir -p backups
docker-compose exec wendeal-reports cp /app/data/wendeal.db /tmp/backup.db
docker cp wendeal-reports-app:/tmp/backup.db ./backups/manual-backup-$(date +%Y%m%d-%H%M%S).db
```

### 数据恢复

```bash
# 使用 Make
make restore BACKUP=wendeal-backup-20241201-020000.db

# 手动恢复
docker cp ./backups/backup-file.db wendeal-reports-app:/tmp/restore.db
docker-compose exec wendeal-reports cp /tmp/restore.db /app/data/wendeal.db
docker-compose restart wendeal-reports
```

## 📊 监控维护

### 健康检查

```bash
# 检查服务健康状态
make health

# 或直接访问
curl http://localhost:7575/api/health
```

### 日志监控

```bash
# 实时监控所有日志
make monitor

# 查看特定服务日志
docker-compose logs -f wendeal-reports
docker-compose logs -f nginx
docker-compose logs -f redis
```

### 资源监控

```bash
# 查看容器资源使用
docker stats

# 查看服务状态
make status
```

### 自动更新

Watchtower 服务会自动检查并更新镜像：

```bash
# 查看更新日志
docker-compose logs watchtower

# 手动触发更新
docker-compose restart watchtower
```

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突

```bash
# 检查端口占用
netstat -tulpn | grep :7575

# 修改端口（在 .env 文件中）
PORT=8080
```

#### 2. 权限问题

```bash
# 修复数据目录权限
sudo chown -R 1000:1000 ./data
```

#### 3. 内存不足

```bash
# 检查内存使用
docker stats --no-stream

# 清理未使用资源
make clean
```

#### 4. 数据库锁定

```bash
# 重启应用
docker-compose restart wendeal-reports

# 检查数据库文件
docker-compose exec wendeal-reports ls -la /app/data/
```

### 调试模式

```bash
# 启用调试日志
echo "LOG_LEVEL=debug" >> .env
docker-compose restart wendeal-reports

# 进入容器调试
docker-compose exec wendeal-reports sh
```

### 完全重置

```bash
# 警告：这将删除所有数据
make reset

# 或手动操作
docker-compose down -v
docker volume rm wendeal-reports_wendeal_data wendeal-reports_wendeal_uploads
```

## 🌐 生产环境建议

### 安全配置

1. 修改默认 JWT_SECRET
2. 配置防火墙规则
3. 使用 HTTPS（配置 SSL 证书）
4. 定期更新镜像
5. 监控日志异常

### 性能优化

1. 配置 Redis 缓存
2. 使用 Nginx 反向代理
3. 启用 Gzip 压缩
4. 配置静态文件缓存
5. 监控资源使用

### 备份策略

1. 定期数据库备份
2. 备份上传文件
3. 备份配置文件
4. 测试恢复流程

## 📞 技术支持

如果遇到问题，请：

1. 查看日志：`make logs`
2. 检查状态：`make status`
3. 健康检查：`make health`
4. 查看文档：本指南
5. 提交 Issue：GitHub 仓库

---

**版本：** v2.0.0  
**更新时间：** 2024年12月  
**维护者：** Wendeal Reports Team
