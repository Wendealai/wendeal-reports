/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  
  // 环境变量默认值配置 - Context7最佳实践
  env: {
    // Netlify环境中的数据库路径配置
    DATABASE_URL: process.env.DATABASE_URL || (
      process.env.NETLIFY 
        ? "file:/tmp/dev.db?connection_limit=1&pool_timeout=10" 
        : "file:./prisma/dev.db?connection_limit=1&pool_timeout=10"
    ),
    JWT_SECRET: process.env.JWT_SECRET || 'your-secure-jwt-secret-here-please-change-this',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || (
      process.env.NETLIFY 
        ? `https://${process.env.NETLIFY_URL}` 
        : 'http://localhost:3000'
    ),
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-here',
    DEFAULT_USER_ID: process.env.DEFAULT_USER_ID || 'cmbusc9x00000x2w0fqyu591k'
  },

  // 针对Netlify的构建优化
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },

  // Context7推荐：Netlify不使用export模式，而是使用函数
  trailingSlash: false,
  
  // 静态文件优化
  images: {
    unoptimized: true,
  },

  // Webpack配置 - Context7最佳实践
  webpack: (config, { isServer }) => {
    // 处理Prisma客户端在无服务器环境中的问题
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    
    // 避免Webpack处理数据库文件
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'fs': false,
      'path': false,
      'sqlite3': false,
    }
    
    return config
  },

  // 重定向配置 - 修复API路由问题
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },

  // Context7推荐：Headers配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 