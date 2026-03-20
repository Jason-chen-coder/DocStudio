import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { CollectionPageJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
    title: '探索公开知识库',
    description: '发现其他人分享的优秀文档、团队知识和个人思考。',
    openGraph: {
        title: '探索公开知识库 | DocStudio',
        description: '发现其他人分享的优秀文档、团队知识和个人思考。',
        url: `${siteConfig.url}/explore`,
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: '探索公开知识库 | DocStudio',
        description: '发现其他人分享的优秀文档、团队知识和个人思考。',
    },
    alternates: {
        canonical: `${siteConfig.url}/explore`,
    },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <CollectionPageJsonLd />
            {children}
        </>
    );
}
