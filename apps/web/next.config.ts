import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成独立部署包，用于 Docker 容器（减小镜像体积）
  output: 'standalone',
  images: {
    remotePatterns: [
      // 开发环境：直连本地 MinIO
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      // Mock images
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        pathname: '/**',
      },
      // GitHub avatars
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      // 生产环境（Nginx 反代 MinIO）：取消注释并填写实际域名
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.xxx.com',
      //   pathname: '/**',
      // },
    ],
  },
  webpack: (config) => {
    // Force a single version of yjs to fix "Yjs was already imported" error
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: require.resolve('yjs'),
    };
    return config;
  },
  experimental: {
    // @ts-expect-error turbo configuration type might vary across Next.js versions
    turbo: {
      resolveAlias: {
        yjs: 'yjs',
      },
    },
  },
};

export default nextConfig;
