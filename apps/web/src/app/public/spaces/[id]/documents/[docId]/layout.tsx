import { Metadata } from 'next';
import { publicService } from '@/services/public-service';

export async function generateMetadata({ params }: { params: Promise<{ docId: string }> }): Promise<Metadata> {
    try {
        const { docId } = await params;
        const doc = await publicService.getPublicDocument(docId);
        return {
            title: `${doc.title} | DocStudio`,
            description: doc.content ? String(doc.content).slice(0, 150) : 'DocStudio Public Document',
        };
    } catch {
        return {
            title: 'Public Document | DocStudio'
        };
    }
}

export default function PublicDocumentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
