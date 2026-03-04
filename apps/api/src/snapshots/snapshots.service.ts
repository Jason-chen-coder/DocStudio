import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Y from 'yjs';

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
   * Manually create a snapshot from the document's current state.
   * If `ydocStateUpdate` is provided (a raw Yjs binary update), it is used
   * to encode a compact Y.Snapshot for lossless Yjs restoration.
   * Otherwise, falls back to storing the document's persisted ydocData.
   */
  async create(
    docId: string,
    userId: string,
    message?: string,
    ydocStateUpdate?: Uint8Array,
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // ── Yjs Snapshot encoding ──────────────────────────────────────────────
    // Y.snapshot() captures ONLY the current visible state (not the full CRDT
    // history log), making it much more compact than storing the raw ydocData.
    // This is what enables efficient version history storage.
    let snapshotBytes: Buffer | null = null;

    const rawUpdate = ydocStateUpdate ?? (doc.ydocData ? new Uint8Array(doc.ydocData) : null);
    if (rawUpdate) {
      try {
        const tempDoc = new Y.Doc();
        Y.applyUpdate(tempDoc, rawUpdate);
        // encodeSnapshot only captures the document structure visible at this point
        // in time — not the full CRDT update log — so it's much smaller.
        const snap = Y.snapshot(tempDoc);
        snapshotBytes = Buffer.from(Y.encodeSnapshot(snap));
        tempDoc.destroy();
      } catch {
        // If snapshot encoding fails, fall back to null — the HTML content is still stored
        snapshotBytes = null;
      }
    }

    const snapshot = await this.prisma.documentSnapshot.create({
      data: {
        docId,
        content: doc.content,         // HTML fallback for preview
        ydocData: snapshotBytes,       // Compact Y.Snapshot binary
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
   * Auto-create snapshot (called by Hocuspocus onStoreDocument).
   * Only creates a snapshot if more than AUTO_SNAPSHOT_INTERVAL_HOURS has passed.
   * Accepts the live Yjs state binary (`ydocStateUpdate`) directly from the
   * Hocuspocus store hook — this is more precise than reading the DB.
   */
  async autoSnapshot(docId: string, userId: string, ydocStateUpdate?: Uint8Array) {
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
      return this.create(docId, userId, '自动保存', ydocStateUpdate);
    }
    return null;
  }

  /**
   * Restore document to a snapshot version.
   *
   * Restoration Strategy:
   * - If the snapshot has a Y.Snapshot (`ydocData`), we decode it and produce
   *   a fresh full `Y.encodeStateAsUpdate()` from the restored state. This new
   *   binary is written back to the document's `ydocData`, so the next time
   *   Hocuspocus loads the document, it serves the restored content.
   * - The restored HTML content is also written for immediate API reads.
   */
  async restore(docId: string, snapshotId: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    const snapshot = await this.prisma.documentSnapshot.findFirst({
      where: { id: snapshotId, docId },
    });
    if (!snapshot) throw new NotFoundException('Snapshot not found');

    // 1. Auto-save current version before restoring (safety net)
    await this.create(docId, userId, '恢复前自动备份');

    // 2. Decode the Y.Snapshot back into a full Yjs update binary
    let restoredYdocData: Buffer | null = null;
    if (snapshot.ydocData) {
      try {
        const snapshotBytes = new Uint8Array(snapshot.ydocData);

        // We need the original ydocData to restore from the snapshot.
        // The snapshot only stores the visible state at a point in time;
        // to reconstruct a full YDoc we need to replay history up to that snapshot.
        const currentYdocBinary = doc.ydocData ? new Uint8Array(doc.ydocData) : null;

        if (currentYdocBinary) {
          const restoredDoc = new Y.Doc();
          // Apply the current full update log
          Y.applyUpdate(restoredDoc, currentYdocBinary);

          // Apply the Y.Snapshot to rewind the doc to the snapshot's state
          const decodedSnapshot = Y.decodeSnapshot(snapshotBytes);
          const rewindDoc = Y.createDocFromSnapshot(restoredDoc, decodedSnapshot);

          // Re-encode as a full update (which is what Hocuspocus expects in ydocData)
          restoredYdocData = Buffer.from(Y.encodeStateAsUpdate(rewindDoc));

          restoredDoc.destroy();
          rewindDoc.destroy();
        }
      } catch {
        // If Yjs restoration fails, fall back to writing null
        // (the HTML content will still be restored correctly for non-collaborative reads)
        restoredYdocData = null;
      }
    }

    // 3. Write restored content + ydocData back to the document
    return this.prisma.document.update({
      where: { id: docId },
      data: {
        content: snapshot.content,
        // If we successfully decoded a Yjs snapshot, use that.
        // Otherwise fall back to whatever was in the snapshot's ydocData.
        ydocData: restoredYdocData ?? snapshot.ydocData ?? null,
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
