import { Injectable, Logger } from '@nestjs/common';
import { SpacesService } from '../spaces/spaces.service';
import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { tiptapJsonToYDocBinary } from '../common/ydoc-utils';
import {
  WELCOME_DOCUMENT_TITLE,
  WELCOME_DOCUMENT_CONTENT,
  WELCOME_CONTENT_JSON,
  DEFAULT_SPACE_NAME,
  DEFAULT_SPACE_DESCRIPTION,
} from './welcome-document.seed';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly spacesService: SpacesService,
    private readonly documentsService: DocumentsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 为新用户创建默认工作空间和欢迎文档。
   * Fire-and-forget：失败仅打日志，不阻塞注册流程。
   */
  async setupNewUser(userId: string): Promise<void> {
    try {
      // 1. 创建默认空间
      const space = await this.spacesService.create(userId, {
        name: DEFAULT_SPACE_NAME,
        description: DEFAULT_SPACE_DESCRIPTION,
      });

      this.logger.log(
        `Created default space "${space.name}" (${space.id}) for user ${userId}`,
      );

      // 2. 在空间中创建欢迎文档
      const document = await this.documentsService.create(
        space.id,
        userId,
        {
          title: WELCOME_DOCUMENT_TITLE,
          content: WELCOME_DOCUMENT_CONTENT,
        },
      );

      // 3. 生成 Yjs 二进制数据，使文档通过协作路径加载（与用户手动创建的文档一致）
      const ydocData = tiptapJsonToYDocBinary(WELCOME_CONTENT_JSON);
      await this.prisma.document.update({
        where: { id: document.id },
        data: { ydocData },
      });

      this.logger.log(
        `Created welcome document "${document.title}" (${document.id}) in space ${space.id}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to setup onboarding for user ${userId}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 不抛出异常 — 注册流程不受影响
    }
  }
}
