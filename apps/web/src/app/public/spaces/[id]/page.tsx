import { Metadata } from 'next';
import { publicService } from '@/services/public-service';
import { siteConfig } from '@/lib/site-config';
import { SpaceJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const { id } = await params;
        const space = await publicService.getPublicSpace(id);
        const title = `${space.name} | DocStudio 公开知识库`;
        const description = space.description || `探索 ${space.name} 的公开文档和知识内容。`;
        const url = `${siteConfig.url}/public/spaces/${id}`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                url,
                type: 'website',
                siteName: siteConfig.name,
            },
            twitter: {
                card: 'summary',
                title,
                description,
            },
            alternates: {
                canonical: url,
            },
        };
    } catch {
        return {
            title: 'Public Workspace | DocStudio',
        };
    }
}

export default async function PublicSpaceWelcome({ params }: { params: Promise<{ id: string }> }) {
    let spaceJsonLd = null;
    let breadcrumbJsonLd = null;

    try {
        const { id } = await params;
        const space = await publicService.getPublicSpace(id);
        spaceJsonLd = <SpaceJsonLd space={space as any} />;
        breadcrumbJsonLd = (
            <BreadcrumbJsonLd
                items={[
                    { name: '首页', url: siteConfig.url },
                    { name: '探索', url: `${siteConfig.url}/explore` },
                    { name: space.name, url: `${siteConfig.url}/public/spaces/${id}` },
                ]}
            />
        );
    } catch {
        // Ignore errors for JSON-LD - page will still render
    }

    return (
        <>
            {spaceJsonLd}
            {breadcrumbJsonLd}
            <div className="h-full flex items-center justify-center p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 m-8 rounded-2xl shadow-sm">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">欢迎访问公开工作空间 👋</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        这是一个公开的知识库。你可以在左侧导航栏中浏览该空间下的所有文档。
                    </p>
                </div>
            </div>
        </>
    );
}
