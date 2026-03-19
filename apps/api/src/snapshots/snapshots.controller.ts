import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { CollaborationService } from '../collaboration/collaboration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpacePermissionGuard } from '../common/guards/space-permission.guard';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

class CreateSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}

@Controller('documents/:docId/snapshots')
@UseGuards(JwtAuthGuard, SpacePermissionGuard)
export class SnapshotsController {
  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly collaborationService: CollaborationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /documents/:docId/snapshots
   * List all snapshots for a document
   */
  @Get()
  findAll(@Param('docId') docId: string) {
    return this.snapshotsService.findAll(docId);
  }

  /**
   * POST /documents/:docId/snapshots
   * Manually create a snapshot
   */
  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(
    @Param('docId') docId: string,
    @Body() dto: CreateSnapshotDto,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.snapshotsService.create(docId, req.user.id as string, dto.message);
  }

  /**
   * GET /documents/:docId/snapshots/:snapshotId
   * Get a single snapshot (for preview)
   */
  @Get(':snapshotId')
  findOne(
    @Param('docId') docId: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.snapshotsService.findOne(docId, snapshotId);
  }

  /**
   * POST /documents/:docId/snapshots/:snapshotId/restore
   * Restore document to a specific snapshot.
   *
   * Sequence:
   *  1. Set restoring lock (blocks onStoreDocument)
   *  2. restore() — writes fresh ydocData to DB
   *  3. closeConnections — kicks WS clients, Hocuspocus unloads in-memory doc
   *     When clients reconnect, Hocuspocus fetches the freshly-written data.
   *  4. Lock kept for 5 more seconds via setTimeout in restore()
   *
   * IMPORTANT: We must write to DB BEFORE closing connections. Otherwise the
   * HocuspocusProvider auto-reconnects after being kicked, causing Hocuspocus
   * to re-fetch the OLD ydocData (restore hasn't written yet). By the time
   * the restore writes, Hocuspocus already has the old data in memory.
   */
  @Post(':snapshotId/restore')
  async restore(
    @Param('docId') docId: string,
    @Param('snapshotId') snapshotId: string,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id as string;

    // Get ydocKey first
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      select: { ydocKey: true },
    });

    // Step 1: Set the restoring lock so onStoreDocument skips writes
    if (doc?.ydocKey) {
      this.snapshotsService.markRestoringDoc(doc.ydocKey);
    }

    // Step 2: Write restored content to DB (lock blocks any concurrent stores)
    const result = await this.snapshotsService.restore(docId, snapshotId, userId);

    // Step 3: Close all WS connections — this causes Hocuspocus to
    // unload the in-memory document. When clients reconnect, Hocuspocus
    // will fetch the freshly-written ydocData from DB.
    if (doc?.ydocKey) {
      await this.collaborationService.closeDocumentConnections(doc.ydocKey);
    }

    return result;
  }
}
