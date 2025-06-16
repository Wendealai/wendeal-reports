/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用standalone输出模式，用于Docker部署
  output: 'standalone',
  
  // 实验性功能
  experimental: {
    // 启用服务器组件日志
    serverComponentsExternalPackages: ['prisma'],
  },
  
  // 图片配置
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // 环境变量配置
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

module.exports = nextConfig; 