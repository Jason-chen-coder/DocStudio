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
      // 生产环境（Nginx 反代 MinIO）：取消注释并填写实际域名
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.xxx.com',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
