import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CollaborationService } from './collaboration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => SnapshotsModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
