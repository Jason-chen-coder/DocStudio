import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/explore', '/public/'],
        disallow: [
          '/dashboard',
          '/spaces/',
          '/admin/',
          '/profile',
          '/auth/',
          '/invite/',
          '/api/',
          '/simple/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
