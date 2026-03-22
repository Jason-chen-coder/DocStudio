import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface SearchResultRow {
  id: string;
  title: string;
  content: string | null;
  spaceId: string;
  updatedAt: Date;
  spaceName: string;
  rank: number;
}

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

    const offset = (page - 1) * limit;

    // 2. 构建 tsquery：按空格拆分词，用 | (OR) 连接
    //    使用 'simple' 配置，不分词，中英文通用
    const sanitized = query.replace(/['"\\]/g, '').trim();
    const words = sanitized.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    // tsquery 格式：'word1' | 'word2' | 'word3'（OR 匹配）
    const tsqueryStr = words.map((w) => `'${w}'`).join(' | ');
    const likePattern = `%${sanitized}%`;

    // 3. 全文搜索 + ILIKE fallback
    //    tsvector @@ tsquery 使用 GIN 索引
    //    ILIKE 作为中文子串 fallback
    const documents = await this.prisma.$queryRaw<SearchResultRow[]>`
      SELECT
        d.id,
        d.title,
        d.content,
        d."spaceId",
        d."updatedAt",
        s.name as "spaceName",
        COALESCE(ts_rank(d.search_vector, to_tsquery('simple', ${tsqueryStr})), 0) as rank
      FROM documents d
      JOIN spaces s ON s.id = d."spaceId"
      WHERE d."spaceId" = ANY(${accessibleSpaceIds})
        AND d."deletedAt" IS NULL
        AND (
          d.search_vector @@ to_tsquery('simple', ${tsqueryStr})
          OR d.title ILIKE ${likePattern}
          OR d.content ILIKE ${likePattern}
        )
      ORDER BY rank DESC, d."updatedAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // 4. 查询总数
    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM documents d
      WHERE d."spaceId" = ANY(${accessibleSpaceIds})
        AND d."deletedAt" IS NULL
        AND (
          d.search_vector @@ to_tsquery('simple', ${tsqueryStr})
          OR d.title ILIKE ${likePattern}
          OR d.content ILIKE ${likePattern}
        )
    `;

    const total = Number(countResult[0]?.count ?? 0);

    // 5. 生成搜索结果（含片段）
    const data = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      snippet: this.extractSnippet(doc.content, sanitized),
      spaceId: doc.spaceId,
      spaceName: doc.spaceName,
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
        .join(
          node.type === 'doc' ||
            node.type === 'bulletList' ||
            node.type === 'orderedList'
            ? '\n'
            : ' ',
        );
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
