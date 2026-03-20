/**
 * Site-wide configuration for SEO and metadata.
 * Uses NEXT_PUBLIC_SITE_URL env var in production, falls back to localhost.
 */
export const siteConfig = {
  name: 'DocStudio',
  title: 'DocStudio - 实时协作文档平台',
  description:
    '团队知识管理和实时协作平台。支持多人实时编辑、灵活权限控制、富文本编辑器，可自托管部署。',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  locale: 'zh_CN',
  language: 'zh-CN',
  creator: 'DocStudio Team',
  keywords: [
    'DocStudio',
    '文档协作',
    '实时协作',
    '知识管理',
    '团队协作',
    '在线文档',
    '自托管',
    'wiki',
  ],
  ogImage: '/docStudio_icon.png',
} as const;
