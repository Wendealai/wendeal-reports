# Wendeal Reports Docker 部署工具
.PHONY: help build up down restart logs clean dev prod backup restore status

# 默认目标
help:
	@echo "Wendeal Reports Docker 部署命令:"
	@echo ""
	@echo "基本命令:"
	@echo "  make build     - 构建Docker镜像"
	@echo "  make up        - 启动服务（生产模式）"
	@echo "  make down      - 停止服务"
	@echo "  make restart   - 重启服务"
	@echo "  make logs      - 查看日志"
	@echo "  make status    - 查看服务状态"
	@echo ""
	@echo "开发命令:"
	@echo "  make dev       - 启动开发环境"
	@echo "  make dev-logs  - 查看开发环境日志"
	@echo "  make dev-down  - 停止开发环境"
	@echo ""
	@echo "生产命令:"
	@echo "  make prod      - 启动完整生产环境（包含Nginx、Redis等）"
	@echo "  make prod-down - 停止生产环境"
	@echo ""
	@echo "维护命令:"
	@echo "  make backup    - 手动备份数据库"
	@echo "  make restore   - 恢复数据库备份"
	@echo "  make clean     - 清理未使用的Docker资源"
	@echo "  make reset     - 重置所有数据（危险操作）"

# 构建镜像
build:
	@echo "构建Docker镜像..."
	docker-compose build --no-cache

# 启动服务（基本模式）
up:
	@echo "启动Wendeal Reports服务..."
	docker-compose up -d
	@echo "服务已启动，访问地址: http://localhost:7575"

# 停止服务
down:
	@echo "停止服务..."
	docker-compose down

# 重启服务
restart: down up

# 查看日志
logs:
	docker-compose logs -f wendeal-reports

# 查看服务状态
status:
	@echo "服务状态:"
	docker-compose ps
	@echo ""
	@echo "容器资源使用:"
	docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# 开发环境
dev:
	@echo "启动开发环境..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "开发环境已启动，访问地址: http://localhost:7575"

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f wendeal-reports

dev-down:
	@echo "停止开发环境..."
	docker-compose -f docker-compose.dev.yml down

# 生产环境（包含所有服务）
prod:
	@echo "启动完整生产环境..."
	docker-compose --profile production up -d
	@echo "生产环境已启动"
	@echo "HTTP访问: http://localhost"
	@echo "应用访问: http://localhost:7575"

prod-down:
	@echo "停止生产环境..."
	docker-compose --profile production down

# 备份数据库
backup:
	@echo "创建数据库备份..."
	@mkdir -p ./backups
	docker-compose exec wendeal-reports cp /app/data/wendeal.db /tmp/backup.db
	docker cp $$(docker-compose ps -q wendeal-reports):/tmp/backup.db ./backups/wendeal-backup-$$(date +%Y%m%d-%H%M%S).db
	@echo "备份完成，保存在 ./backups/ 目录"

# 恢复数据库
restore:
	@echo "可用的备份文件:"
	@ls -la ./backups/ 2>/dev/null || echo "没有找到备份文件"
	@echo ""
	@echo "使用方法: make restore BACKUP=备份文件名"
	@if [ -n "$(BACKUP)" ]; then \
		echo "恢复备份: $(BACKUP)"; \
		docker cp ./backups/$(BACKUP) $$(docker-compose ps -q wendeal-reports):/tmp/restore.db; \
		docker-compose exec wendeal-reports cp /tmp/restore.db /app/data/wendeal.db; \
		docker-compose restart wendeal-reports; \
		echo "数据库恢复完成"; \
	fi

# 清理Docker资源
clean:
	@echo "清理未使用的Docker资源..."
	docker system prune -f
	docker volume prune -f
	@echo "清理完成"

# 重置所有数据（危险操作）
reset:
	@echo "警告: 这将删除所有数据！"
	@echo "按 Ctrl+C 取消，或等待10秒继续..."
	@sleep 10
	docker-compose down -v
	docker volume rm wendeal-reports_wendeal_data wendeal-reports_wendeal_uploads 2>/dev/null || true
	@echo "所有数据已重置"

# 查看环境变量
env:
	@echo "当前环境变量配置:"
	@cat env.example

# 初始化环境
init:
	@echo "初始化部署环境..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "已创建 .env 文件，请根据需要修改配置"; \
	else \
		echo ".env 文件已存在"; \
	fi
	@mkdir -p nginx/ssl
	@echo "环境初始化完成"

# 更新镜像
update:
	@echo "更新Docker镜像..."
	docker-compose pull
	docker-compose build --no-cache
	docker-compose up -d
	@echo "更新完成"

# 健康检查
health:
	@echo "检查服务健康状态..."
	@curl -f http://localhost:7575/api/health 2>/dev/null && echo "✅ 服务正常" || echo "❌ 服务异常"

# 监控日志
monitor:
	@echo "实时监控所有服务日志..."
	docker-compose logs -f 