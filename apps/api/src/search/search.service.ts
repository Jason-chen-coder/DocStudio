import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, query: string, page: number, limit: number) {
    // 1. 获取用户有权限的空间 ID 列表
    const permissions = await this.prisma.spacePermission.findMany({
      where: { userId },
      select: { spaceId: true },
    });
    const accessibleSpaceIds = permissions.map((p) => p.spaceId);

    if (accessibleSpaceIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const skip = (page - 1) * limit;

    const where = {
      spaceId: { in: accessibleSpaceIds },
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { content: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    // 2. 并行查询文档和总数
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          spaceId: true,
          updatedAt: true,
          space: { select: { id: true, name: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    // 3. 生成搜索结果（含片段）
    const data = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      snippet: this.extractSnippet(doc.content, query),
      spaceId: doc.spaceId,
      spaceName: doc.space.name,
      updatedAt: doc.updatedAt,
    }));

    return { data, total, page, limit };
  }

  /**
   * 从 Tiptap JSON 内容中提取纯文本
   */
  private extractTextFromTiptap(node: any): string {
    if (!node) return '';

    // 文本节点
    if (node.type === 'text' && typeof node.text === 'string') {
      return node.text;
    }

    // 递归处理子节点
    if (Array.isArray(node.content)) {
      return node.content
        .map((child: any) => this.extractTextFromTiptap(child))
        .join(node.type === 'doc' || node.type === 'bulletList' || node.type === 'orderedList' ? '\n' : ' ');
    }

    return '';
  }

  /**
   * 从内容中提取搜索片段，在匹配位置前后各取一段文本
   */
  private extractSnippet(
    content: string | null,
    query: string,
    windowSize = 150,
  ): string {
    if (!content) return '';

    // 提取纯文本
    let plainText: string;
    try {
      const json = JSON.parse(content);
      plainText = this.extractTextFromTiptap(json).trim();
    } catch {
      // 如果不是 JSON，去掉 HTML 标签作为后备
      plainText = content.replace(/<[^>]*>/g, '').trim();
    }

    if (!plainText) return '';

    const lowerText = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);

    // 没有在 content 中找到匹配（可能只匹配了 title），返回开头片段
    if (idx === -1) {
      return plainText.length > windowSize
        ? plainText.slice(0, windowSize) + '...'
        : plainText;
    }

    const halfWindow = Math.floor(windowSize / 2);
    const start = Math.max(0, idx - halfWindow);
    const end = Math.min(plainText.length, idx + query.length + halfWindow);

    let snippet = plainText.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < plainText.length) snippet = snippet + '...';

    return snippet;
  }
}
