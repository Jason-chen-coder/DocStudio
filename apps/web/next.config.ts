import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const basePath = isGithubPages ? '/DocStudio' : '';

const nextConfig: NextConfig = {
  // GitHub Pages 使用静态导出，Docker 部署使用 standalone 模式
  output: isGithubPages ? 'export' : 'standalone',
  // GitHub Pages 部署在子路径 /DocStudio 下
  basePath,
  // 将 basePath 暴露给客户端代码，用于静态资源路径拼接
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    // GitHub Pages 不支持 next/image 优化，需要关闭
    unoptimized: isGithubPages,
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
