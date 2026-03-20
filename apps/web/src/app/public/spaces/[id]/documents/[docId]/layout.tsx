import { Metadata } from 'next';
import { publicService } from '@/services/public-service';
import { siteConfig } from '@/lib/site-config';
import { DocumentJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

/**
 * Extract plain text description from Tiptap JSON content.
 */
function extractDescription(content: string | null | undefined, maxLen = 160): string {
    if (!content) return '';
    try {
        const json = JSON.parse(content);
        const texts: string[] = [];
        function walk(node: any) {
            if (node.type === 'text' && typeof node.text === 'string') texts.push(node.text);
            if (Array.isArray(node.content)) node.content.forEach(walk);
        }
        walk(json);
        const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
        return joined.length > maxLen ? joined.slice(0, maxLen) + '...' : joined;
    } catch {
        const text = String(content).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; docId: string }> }): Promise<Metadata> {
    try {
        const { id, docId } = await params;
        const doc = await publicService.getPublicDocument(docId);
        const title = doc.title;
        const description = extractDescription(doc.content as any) || `${doc.title} - DocStudio 公开文档`;
        const url = `${siteConfig.url}/public/spaces/${id}/documents/${docId}`;

        return {
            title,
            description,
            openGraph: {
                title: `${title} | DocStudio`,
                description,
                url,
                type: 'article',
                siteName: siteConfig.name,
                ...(doc.createdAt && { publishedTime: doc.createdAt }),
                ...(doc.updatedAt && { modifiedTime: doc.updatedAt }),
            },
            twitter: {
                card: 'summary',
                title: `${title} | DocStudio`,
                description,
            },
            alternates: {
                canonical: url,
            },
        };
    } catch {
        return {
            title: 'Public Document | DocStudio',
        };
    }
}

export default async function PublicDocumentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string; docId: string }>;
}) {
    let jsonLdElements = null;

    try {
        const { id, docId } = await params;
        const doc = await publicService.getPublicDocument(docId);

        jsonLdElements = (
            <>
                <DocumentJsonLd
                    document={{
                        ...doc,
                        content: doc.content as any,
                        space: { id, name: '' },
                    }}
                />
                <BreadcrumbJsonLd
                    items={[
                        { name: '首页', url: siteConfig.url },
                        { name: '探索', url: `${siteConfig.url}/explore` },
                        { name: '工作空间', url: `${siteConfig.url}/public/spaces/${id}` },
                        { name: doc.title, url: `${siteConfig.url}/public/spaces/${id}/documents/${docId}` },
                    ]}
                />
            </>
        );
    } catch {
        // Ignore errors - page will still render
    }

    return (
        <>
            {jsonLdElements}
            {children}
        </>
    );
}
