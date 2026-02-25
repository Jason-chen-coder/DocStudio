import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // MinIO（本地开发）
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      // 如需生产环境，在此追加，例如：
      // { protocol: 'https', hostname: 'your-minio.example.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
