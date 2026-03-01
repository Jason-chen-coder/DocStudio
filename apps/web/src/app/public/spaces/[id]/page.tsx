import { Metadata } from 'next';
import { publicService } from '@/services/public-service';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const { id } = await params;
        const space = await publicService.getPublicSpace(id);
        return {
            title: `${space.name} | DocStudio Open Workspace`,
            description: space.description || `Explore ${space.name} public documents.`,
        };
    } catch {
        return {
            title: 'Public Workspace | DocStudio'
        };
    }
}

export default function PublicSpaceWelcome() {
    return (
        <div className="h-full flex items-center justify-center p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 m-8 rounded-2xl shadow-sm">
            <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">欢迎访问公开工作空间 👋</h2>
                <p className="text-gray-500 dark:text-gray-400">
                    这是一个公开的知识库。你可以在左侧导航栏中浏览该空间下的所有文档。
                </p>
            </div>
        </div>
    );
}
