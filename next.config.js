/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify 部署配置
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 环境变量配置 - 只在有值时添加
  ...(process.env.DATABASE_URL && process.env.DIRECT_URL && {
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
    },
  }),
  // 实验性功能
  experimental: {
    esmExternals: true,
  },
  // Netlify 函数配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/.netlify/functions/:path*',
      },
    ];
  },
};

module.exports = nextConfig;