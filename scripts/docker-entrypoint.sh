#!/bin/sh

# 设置错误时退出
set -e

echo "🚀 Starting Wendeal Reports..."

# 检查数据库文件是否存在，如果不存在则初始化
if [ ! -f "/app/data/wendeal.db" ]; then
    echo "📦 Initializing database..."
    
    # 确保数据目录存在
    mkdir -p /app/data
    
    # 设置数据库URL
    export DATABASE_URL="file:/app/data/wendeal.db"
    
    # 运行数据库迁移
    npx prisma migrate deploy
    
    # 生成Prisma客户端
    npx prisma generate
    
    echo "✅ Database initialized successfully!"
else
    echo "📊 Database already exists, running migrations..."
    export DATABASE_URL="file:/app/data/wendeal.db"
    npx prisma migrate deploy
fi

# 确保上传目录存在
mkdir -p /app/public/uploads

# 启动应用
echo "🌟 Starting the application..."
exec "$@" 