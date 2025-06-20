@echo off
chcp 65001 >nul
echo ========================================
echo    Wendeal Reports Docker 部署工具
echo ========================================
echo.

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Docker，请先安装Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过

REM 显示部署选项
echo.
echo 请选择部署模式:
echo 1. 开发环境 (推荐用于测试)
echo 2. 基本生产环境
echo 3. 完整生产环境 (包含Nginx、Redis等)
echo 4. 查看服务状态
echo 5. 停止所有服务
echo 6. 查看日志
echo 7. 备份数据库
echo 8. 清理Docker资源
echo 0. 退出
echo.

set /p choice="请输入选择 (0-8): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto basic
if "%choice%"=="3" goto production
if "%choice%"=="4" goto status
if "%choice%"=="5" goto stop
if "%choice%"=="6" goto logs
if "%choice%"=="7" goto backup
if "%choice%"=="8" goto clean
if "%choice%"=="0" goto end
goto invalid

:dev
echo.
echo 🚀 启动开发环境...
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
echo.
echo ✅ 开发环境启动成功！
echo 📱 访问地址: http://localhost:7575
echo 📋 查看日志: docker-compose -f docker-compose.dev.yml logs -f
goto end

:basic
echo.
echo 🚀 启动基本生产环境...
REM 检查环境变量文件
if not exist .env (
    echo 📝 创建环境变量文件...
    copy env.example .env
    echo ⚠️  请编辑 .env 文件设置生产环境配置
    pause
)
docker-compose down
docker-compose build
docker-compose up -d
echo.
echo ✅ 基本生产环境启动成功！
echo 📱 访问地址: http://localhost:7575
goto end

:production
echo.
echo 🚀 启动完整生产环境...
REM 检查环境变量文件
if not exist .env (
    echo 📝 创建环境变量文件...
    copy env.example .env
    echo ⚠️  请编辑 .env 文件设置生产环境配置
    pause
)
REM 创建nginx目录
if not exist nginx\ssl mkdir nginx\ssl
docker-compose --profile production down
docker-compose --profile production build
docker-compose --profile production up -d
echo.
echo ✅ 完整生产环境启动成功！
echo 📱 HTTP访问: http://localhost
echo 📱 直接访问: http://localhost:7575
echo 🔧 Redis: localhost:6379
goto end

:status
echo.
echo 📊 服务状态:
docker-compose ps
echo.
echo 📈 资源使用:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
goto end

:stop
echo.
echo 🛑 停止所有服务...
docker-compose down
docker-compose -f docker-compose.dev.yml down
docker-compose --profile production down
echo ✅ 所有服务已停止
goto end

:logs
echo.
echo 📋 查看日志 (按Ctrl+C退出):
docker-compose logs -f wendeal-reports
goto end

:backup
echo.
echo 💾 创建数据库备份...
if not exist backups mkdir backups
docker-compose exec wendeal-reports cp /app/data/wendeal.db /tmp/backup.db 2>nul
if %errorlevel% neq 0 (
    echo ❌ 备份失败，请确保服务正在运行
    goto end
)
for /f "tokens=2 delims==" %%i in ('wmic OS Get localdatetime /value') do set datetime=%%i
set backup_name=wendeal-backup-%datetime:~0,8%-%datetime:~8,6%.db
docker cp wendeal-reports-app:/tmp/backup.db backups\%backup_name%
echo ✅ 备份完成: backups\%backup_name%
goto end

:clean
echo.
echo 🧹 清理Docker资源...
docker system prune -f
docker volume prune -f
echo ✅ 清理完成
goto end

:invalid
echo ❌ 无效选择，请重新运行脚本
goto end

:end
echo.
echo 📚 更多命令:
echo   make help     - 查看所有可用命令
echo   make status   - 查看服务状态
echo   make logs     - 查看日志
echo   make backup   - 备份数据库
echo.
pause 