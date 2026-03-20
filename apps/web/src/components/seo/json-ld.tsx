import { siteConfig } from '@/lib/site-config';

/* ------------------------------------------------------------------ */
/*  Type definitions for JSON-LD structured data                       */
/* ------------------------------------------------------------------ */

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Generic JSON-LD script tag renderer.
 * Injects structured data into the page <head> for search engines.
 */
function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  WebSite – for the home page                                        */
/* ------------------------------------------------------------------ */

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        inLanguage: siteConfig.language,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/explore?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  CollectionPage – for the explore page                              */
/* ------------------------------------------------------------------ */

export function CollectionPageJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '探索公开知识库',
        description: '发现其他人分享的优秀文档、团队知识和个人思考。',
        url: `${siteConfig.url}/explore`,
        isPartOf: {
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
        },
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  WebPage – for public space pages                                   */
/* ------------------------------------------------------------------ */

interface SpaceJsonLdProps {
  space: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    owner?: {
      name?: string | null;
    } | null;
    _count?: {
      documents?: number;
    };
  };
}

export function SpaceJsonLd({ space }: SpaceJsonLdProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: space.name,
        description: space.description || `${space.name} 公开知识库`,
        url: `${siteConfig.url}/public/spaces/${space.id}`,
        dateCreated: space.createdAt,
        dateModified: space.updatedAt,
        isPartOf: {
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
        },
        ...(space.owner?.name && {
          author: {
            '@type': 'Person',
            name: space.owner.name,
          },
        }),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Article – for public document pages                                */
/* ------------------------------------------------------------------ */

interface DocumentJsonLdProps {
  document: {
    id: string;
    title: string;
    content?: string | null;
    createdAt?: string;
    updatedAt?: string;
    creator?: {
      name?: string | null;
    } | null;
    space?: {
      id: string;
      name: string;
    } | null;
  };
}

export function DocumentJsonLd({ document: doc }: DocumentJsonLdProps) {
  // Extract plain text description from content (first 200 chars)
  const description = extractTextDescription(doc.content, 200);

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: doc.title,
        description: description || `${doc.title} - DocStudio 公开文档`,
        url: doc.space
          ? `${siteConfig.url}/public/spaces/${doc.space.id}/documents/${doc.id}`
          : `${siteConfig.url}/public/docs/${doc.id}`,
        ...(doc.createdAt && { datePublished: doc.createdAt }),
        ...(doc.updatedAt && { dateModified: doc.updatedAt }),
        ...(doc.creator?.name && {
          author: {
            '@type': 'Person',
            name: doc.creator.name,
          },
        }),
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          url: siteConfig.url,
        },
        isPartOf: {
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
        },
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList – for navigation context                            */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: extract plain text from Tiptap JSON content                */
/* ------------------------------------------------------------------ */

function extractTextDescription(
  content: string | null | undefined,
  maxLength: number
): string {
  if (!content) return '';

  try {
    // Try parsing as Tiptap JSON
    const json = JSON.parse(content);
    const texts: string[] = [];
    extractTextsFromNode(json, texts);
    const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
    return joined.length > maxLength
      ? joined.slice(0, maxLength) + '...'
      : joined;
  } catch {
    // Fallback: treat as plain text
    const text = String(content).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }
}

function extractTextsFromNode(
  node: Record<string, unknown>,
  texts: string[]
): void {
  if (node.type === 'text' && typeof node.text === 'string') {
    texts.push(node.text);
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      extractTextsFromNode(child as Record<string, unknown>, texts);
    }
  }
}
