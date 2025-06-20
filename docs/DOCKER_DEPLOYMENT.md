# Wendeal Reports Docker 部署指南

本指南将帮助您使用Docker在服务器上部署Wendeal Reports应用。

## 📋 前置要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 至少2GB可用内存
- 至少5GB可用磁盘空间

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/wendeal/wendeal-reports.git
cd wendeal-reports
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp env.example .env

# 编辑环境变量（重要：修改JWT_SECRET）
nano .env
```

### 3. 构建和启动

```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

### 4. 访问应用

- 开发环境：http://localhost:7575
- 生产环境：http://your-server-ip:7575

## 🔧 详细配置

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `DATABASE_URL` | 数据库连接字符串 | `file:/app/data/wendeal.db` | 是 |
| `JWT_SECRET` | JWT签名密钥 | - | 是 |
| `NODE_ENV` | 运行环境 | `production` | 否 |
| `APP_NAME` | 应用名称 | `Wendeal Reports` | 否 |
| `APP_URL` | 应用URL | `http://localhost:7575` | 否 |

### 数据持久化

应用使用Docker volumes来持久化数据：

- `wendeal_data`: 数据库文件
- `wendeal_uploads`: 上传的文件

### 端口配置

- **开发环境**: 7575
- **生产环境**: 7575 (HTTP), 443 (HTTPS)

## 🛠️ 管理命令

### 查看日志

```bash
# 查看应用日志
docker-compose logs -f wendeal-reports

# 查看最近100行日志
docker-compose logs --tail=100 wendeal-reports
```

### 重启服务

```bash
# 重启应用
docker-compose restart wendeal-reports

# 重新构建并启动
docker-compose up -d --build
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除volumes（注意：会删除数据）
docker-compose down -v
```

### 数据库管理

```bash
# 进入容器执行数据库命令
docker-compose exec wendeal-reports sh

# 在容器内运行Prisma命令
npx prisma studio
npx prisma migrate reset
```

## 🔒 生产环境安全配置

### 1. 设置强密码

```bash
# 生成强JWT密钥
openssl rand -base64 32
```

### 2. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. 设置SSL证书（推荐使用Let's Encrypt）

```bash
# 安装certbot
sudo apt install certbot

# 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com
```

### 4. 配置Nginx反向代理

创建 `nginx.conf` 文件：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream wendeal_app {
        server wendeal-reports:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        location / {
            proxy_pass http://wendeal_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📊 监控和维护

### 健康检查

应用提供健康检查端点：

```bash
curl http://localhost:7575/api/health
```

### 备份数据

```bash
# 备份数据库
docker-compose exec wendeal-reports cp /app/data/wendeal.db /app/data/backup-$(date +%Y%m%d).db

# 复制备份到主机
docker cp wendeal-reports-app:/app/data/backup-$(date +%Y%m%d).db ./
```

### 更新应用

```bash
# 拉取最新代码
git pull origin master

# 重新构建并启动
docker-compose up -d --build
```

## 🐛 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 检查日志
   docker-compose logs wendeal-reports
   ```

2. **数据库连接错误**
   ```bash
   # 检查数据库文件权限
   docker-compose exec wendeal-reports ls -la /app/data/
   ```

3. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :7575
   ```

### 重置应用

```bash
# 停止服务并删除数据
docker-compose down -v

# 重新启动
docker-compose up -d
```

## 📞 支持

如果您遇到问题，请：

1. 查看应用日志
2. 检查GitHub Issues
3. 创建新的Issue并提供详细信息

---

**注意**: 在生产环境中，请确保定期备份数据并监控应用性能。 