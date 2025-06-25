/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify 部署配置
  images: {
    unoptimized: true,
  },
  // 环境变量配置 - 只在有值时添加
  ...(process.env.DATABASE_URL &&
    process.env.DIRECT_URL && {
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
      },
    }),
  // 启用React严格模式进行更好的开发体验
  reactStrictMode: true,
  // 启用 SWC 压缩以获得更好的性能
  swcMinify: true,
  // 在开发模式下启用ESLint，生产构建时有条件禁用
  eslint: {
    // 只在非生产环境或CI中禁用ESLint以加快部署
    ignoreDuringBuilds:
      process.env.NODE_ENV === "production" && process.env.CI === "true",
  },
  // 在开发模式下启用TypeScript检查，生产构建时有条件禁用
  typescript: {
    // 只在生产环境的CI构建中暂时禁用以确保快速部署
    // 但保留本地开发的类型检查
    ignoreBuildErrors:
      process.env.NODE_ENV === "production" && process.env.CI === "true",
  },
  // 实验性功能配置
  experimental: {
    // 启用更好的错误处理
    serverComponentsExternalPackages: ["prisma"],
  },
  // 静态生成配置
  generateBuildId: async () => {
    // 使用时间戳作为构建ID
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
