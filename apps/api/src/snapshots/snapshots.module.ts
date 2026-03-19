import { Module, forwardRef } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController } from './snapshots.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CollaborationModule),
  ],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
