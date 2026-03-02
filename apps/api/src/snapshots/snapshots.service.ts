import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_SNAPSHOTS = 50;
const AUTO_SNAPSHOT_INTERVAL_HOURS = 1;

@Injectable()
export class SnapshotsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get snapshot list for a document (sorted by newest first)
   */
  async findAll(docId: string) {
    await this.ensureDocumentExists(docId);
    return this.prisma.documentSnapshot.findMany({
      where: { docId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        message: true,
        createdAt: true,
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Get a single snapshot's content (for preview)
   */
  async findOne(docId: string, snapshotId: string) {
    const snapshot = await this.prisma.documentSnapshot.findFirst({
      where: { id: snapshotId, docId },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }
    return snapshot;
  }

  /**
   * Manually create a snapshot
   */
  async create(docId: string, userId: string, message?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const snapshot = await this.prisma.documentSnapshot.create({
      data: {
        docId,
        content: doc.content,
        ydocData: doc.ydocData ?? undefined,
        message,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Enforce max snapshot limit (keep newest MAX_SNAPSHOTS)
    await this.pruneSnapshots(docId);

    return snapshot;
  }

  /**
   * Auto-create snapshot (called by Hocuspocus onStoreDocument or by document save logic).
   * Only creates a snapshot if more than AUTO_SNAPSHOT_INTERVAL_HOURS has passed.
   */
  async autoSnapshot(docId: string, userId: string) {
    const lastSnapshot = await this.prisma.documentSnapshot.findFirst({
      where: { docId },
      orderBy: { createdAt: 'desc' },
    });

    const intervalMs = AUTO_SNAPSHOT_INTERVAL_HOURS * 60 * 60 * 1000;
    const now = Date.now();

    if (
      !lastSnapshot ||
      now - lastSnapshot.createdAt.getTime() > intervalMs
    ) {
      return this.create(docId, userId, '自动保存');
    }
    return null;
  }

  /**
   * Restore document to a snapshot version
   */
  async restore(docId: string, snapshotId: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    const snapshot = await this.prisma.documentSnapshot.findFirst({
      where: { id: snapshotId, docId },
    });
    if (!snapshot) throw new NotFoundException('Snapshot not found');

    // 1. Auto-save current version before restoring
    await this.create(docId, userId, '恢复前自动备份');

    // 2. Restore document content and ydocData
    return this.prisma.document.update({
      where: { id: docId },
      data: {
        content: snapshot.content,
        ydocData: snapshot.ydocData ?? null,
        // Clear ydocKey to force a fresh Yjs session after restore
        // (clients will reconnect and get the restored content)
      },
    });
  }

  private async ensureDocumentExists(docId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  private async pruneSnapshots(docId: string) {
    const snapshots = await this.prisma.documentSnapshot.findMany({
      where: { docId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (snapshots.length > MAX_SNAPSHOTS) {
      const toDelete = snapshots.slice(MAX_SNAPSHOTS).map((s) => s.id);
      await this.prisma.documentSnapshot.deleteMany({
        where: { id: { in: toDelete } },
      });
    }
  }
}
