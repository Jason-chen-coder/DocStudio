import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '探索公开知识库 | DocStudio',
    description: '发现其他人分享的优秀文档、团队知识和个人思考。',
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
