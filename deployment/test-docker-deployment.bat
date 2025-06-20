@echo off
chcp 65001 >nul
echo ========================================
echo    Wendeal Reports Docker 部署测试
echo ========================================
echo.

echo 🔍 检查Docker环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose未安装
    exit /b 1
)

echo ✅ Docker环境正常

echo.
echo 🔧 验证配置文件...
docker-compose config >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose.yml配置错误
    exit /b 1
)

docker-compose -f docker-compose.dev.yml config >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose.dev.yml配置错误
    exit /b 1
)

echo ✅ 配置文件验证通过

echo.
echo 🏗️ 测试镜像构建...
docker-compose build wendeal-reports
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    exit /b 1
)

echo ✅ 镜像构建成功

echo.
echo 🚀 启动测试环境...
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo ❌ 服务启动失败
    exit /b 1
)

echo ✅ 服务启动成功

echo.
echo ⏳ 等待服务就绪...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 检查服务状态...
docker-compose -f docker-compose.dev.yml ps

echo.
echo 🏥 健康检查...
curl -f http://localhost:7575/api/health 2>nul
if %errorlevel% neq 0 (
    echo ❌ 健康检查失败
    echo 📋 查看日志:
    docker-compose -f docker-compose.dev.yml logs --tail=20 wendeal-reports
    goto cleanup
)

echo ✅ 健康检查通过

echo.
echo 🌐 测试Web访问...
curl -f http://localhost:7575 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Web访问测试失败，但服务可能正常运行
) else (
    echo ✅ Web访问正常
)

echo.
echo 📊 资源使用情况:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo.
echo ✅ 部署测试完成！
echo 📱 访问地址: http://localhost:7575
echo 📋 查看日志: docker-compose -f docker-compose.dev.yml logs -f
echo 🛑 停止服务: docker-compose -f docker-compose.dev.yml down

goto end

:cleanup
echo.
echo 🧹 清理测试环境...
docker-compose -f docker-compose.dev.yml down
echo ❌ 测试失败

:end
echo.
pause 