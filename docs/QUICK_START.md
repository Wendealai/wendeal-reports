# 🚀 Wendeal Reports 快速部署指南

## 一键部署到服务器

### 方法一：使用部署脚本（推荐）

#### Windows用户：

```cmd
# 1. 克隆项目
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports

# 2. 运行部署脚本
deploy.bat dev    # 开发环境
deploy.bat prod   # 生产环境
```

#### Linux/Mac用户：

```bash
# 1. 克隆项目
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports

# 2. 给脚本执行权限
chmod +x deploy.sh

# 3. 运行部署脚本
./deploy.sh dev   # 开发环境
./deploy.sh prod  # 生产环境
```

### 方法二：手动部署

```bash
# 1. 克隆项目
git clone https://github.com/Wendealai/wendeal-reports.git
cd wendeal-reports

# 2. 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置 JWT_SECRET

# 3. 启动应用
docker-compose up -d --build
```

## 🌐 访问应用

- **开发环境**: http://localhost:7575
- **生产环境**: http://your-server-ip:7575

## 🔧 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f wendeal-reports

# 重启应用
docker-compose restart wendeal-reports

# 停止应用
docker-compose down

# 更新应用
git pull origin master
docker-compose up -d --build
```

## 📊 健康检查

```bash
curl http://localhost:7575/api/health
```

## 🔒 生产环境注意事项

1. **设置强密码**：

   ```bash
   # 生成JWT密钥
   openssl rand -base64 32
   ```

2. **配置防火墙**：

   ```bash
   # Ubuntu/Debian
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **设置SSL证书**：
   ```bash
   # 使用Let's Encrypt
   sudo certbot certonly --standalone -d your-domain.com
   ```

## 📁 数据持久化

- 数据库文件：`/var/lib/docker/volumes/wendeal-reports_wendeal_data`
- 上传文件：`/var/lib/docker/volumes/wendeal-reports_wendeal_uploads`

## 🆘 故障排除

### 常见问题

1. **端口被占用**：

   ```bash
       # 检查端口占用
    netstat -tulpn | grep :7575
    # 或修改 docker-compose.yml 中的端口映射
   ```

2. **权限问题**：

   ```bash
   # 检查Docker权限
   sudo usermod -aG docker $USER
   # 重新登录或重启
   ```

3. **内存不足**：
   ```bash
   # 检查系统资源
   docker system df
   # 清理未使用的镜像
   docker system prune
   ```

## 📞 获取帮助

- 查看详细文档：`DOCKER_DEPLOYMENT.md`
- GitHub Issues：https://github.com/Wendealai/wendeal-reports/issues
- 健康检查：http://localhost:7575/api/health
