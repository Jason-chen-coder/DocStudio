import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PublicSpace {
  id: string;
  name: string;
  updatedAt: string;
}

interface PublicDocument {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * Fetch all public spaces from the backend.
 * Uses a large limit to get everything for sitemap generation.
 */
async function fetchAllPublicSpaces(): Promise<PublicSpace[]> {
  try {
    const res = await fetch(`${API_URL}/public/spaces?page=1&limit=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch document tree for a public space.
 */
async function fetchSpaceDocTree(spaceId: string): Promise<PublicDocument[]> {
  try {
    const res = await fetch(`${API_URL}/public/spaces/${spaceId}/docs/tree`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Flatten nested document tree into a flat array.
 */
function flattenDocTree(docs: (PublicDocument & { children?: PublicDocument[] })[]): PublicDocument[] {
  const result: PublicDocument[] = [];
  for (const doc of docs) {
    result.push(doc);
    if ((doc as any).children?.length) {
      result.push(...flattenDocTree((doc as any).children));
    }
  }
  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic: all public spaces
  const spaces = await fetchAllPublicSpaces();
  const spacePages: MetadataRoute.Sitemap = spaces.map((space) => ({
    url: `${baseUrl}/public/spaces/${space.id}`,
    lastModified: new Date(space.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Dynamic: all public documents (from each space's doc tree)
  const docPages: MetadataRoute.Sitemap = [];
  for (const space of spaces) {
    const docs = await fetchSpaceDocTree(space.id);
    const flatDocs = flattenDocTree(docs);
    for (const doc of flatDocs) {
      docPages.push({
        url: `${baseUrl}/public/spaces/${space.id}/documents/${doc.id}`,
        lastModified: new Date(doc.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...spacePages, ...docPages];
}
