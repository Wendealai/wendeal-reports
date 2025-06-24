/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify 部署配置
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 环境变量配置
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
  },
  // 实验性功能
  experimental: {
    esmExternals: true,
  },
};

module.exports = nextConfig;