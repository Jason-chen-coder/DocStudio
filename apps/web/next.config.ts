import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
