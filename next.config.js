/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-here',
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 