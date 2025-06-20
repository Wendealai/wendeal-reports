/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  
  // 环境变量默认值配置
  env: {
    // Netlify环境中的数据库路径配置 - Context7最佳实践
    DATABASE_URL: process.env.DATABASE_URL || (
      process.env.NETLIFY 
        ? "file:/tmp/dev.db?connection_limit=1&pool_timeout=10" 
        : "file:./dev.db?connection_limit=1&pool_timeout=10"
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

  // 静态文件处理
  output: process.env.NETLIFY ? 'export' : undefined,

  // Webpack配置
  webpack: (config, { isServer }) => {
    // Context7推荐：处理Prisma客户端在无服务器环境中的问题
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    
    return config
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig 