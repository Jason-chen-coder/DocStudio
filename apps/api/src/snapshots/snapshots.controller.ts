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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpacePermissionGuard } from '../common/guards/space-permission.guard';
import { IsOptional, IsString, MaxLength } from 'class-validator';

class CreateSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;
}

@Controller('documents/:docId/snapshots')
@UseGuards(JwtAuthGuard, SpacePermissionGuard)
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

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
  create(
    @Param('docId') docId: string,
    @Body() dto: CreateSnapshotDto,
    @Req() req: any,
  ) {
    return this.snapshotsService.create(docId, req.user.id, dto.message);
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
   * Restore document to a specific snapshot
   */
  @Post(':snapshotId/restore')
  restore(
    @Param('docId') docId: string,
    @Param('snapshotId') snapshotId: string,
    @Req() req: any,
  ) {
    return this.snapshotsService.restore(docId, snapshotId, req.user.id);
  }
}
