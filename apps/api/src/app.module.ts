import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SpacesModule } from './spaces/spaces.module';
import { MinioModule } from './common/minio/minio.module';
import { DocumentsModule } from './documents/documents.module';
import { ShareModule } from './share/share.module';
import { AdminModule } from './admin/admin.module';
import { PublicModule } from './modules/public/public.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { FilesModule } from './files/files.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { FastifyThrottlerGuard } from './common/guards/fastify-throttler.guard';

import { SnapshotsModule } from './snapshots/snapshots.module';
import { SearchModule } from './search/search.module';
import { ActivityModule } from './activity/activity.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    PrismaModule,
    // Rate Limiting — 全局默认 60次/分钟，各 endpoint 可通过 @Throttle() 单独覆盖
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 60,  // 60 requests per minute
      },
    ]),
    AuthModule,
    UsersModule,
    SpacesModule,
    MinioModule,
    DocumentsModule,
    ShareModule,
    AdminModule,
    PublicModule,
    CollaborationModule,
    FilesModule,
    SnapshotsModule,
    SearchModule,
    ActivityModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: FastifyThrottlerGuard,
    },
  ],
})
export class AppModule {}
