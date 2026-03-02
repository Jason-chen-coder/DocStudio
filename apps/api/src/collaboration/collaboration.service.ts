/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Server,
  onAuthenticatePayload,
  onConnectPayload,
  onDisconnectPayload,
} from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollaborationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollaborationService.name);
  private server: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const prisma = this.prisma;
    const jwtService = this.jwtService;
    const logger = this.logger;

    const collabPort = Number(process.env.COLLAB_PORT) || 1234;

    this.server = new Server({
      port: collabPort,

      extensions: [
        new Database({
          fetch: async ({ documentName }: { documentName: string }) => {
            try {
              const doc = await prisma.document.findUnique({
                where: { ydocKey: documentName },
              });
              return doc?.ydocData ?? null;
            } catch (err) {
              logger.error(`Failed to fetch ydoc for ${documentName}`, err);
              return null;
            }
          },
          store: async ({
            documentName,
            state,
          }: {
            documentName: string;
            state: Uint8Array;
          }) => {
            try {
              await prisma.document.update({
                where: { ydocKey: documentName },
                data: { ydocData: Buffer.from(state) },
              });
            } catch (err) {
              logger.error(`Failed to store ydoc for ${documentName}`, err);
            }
          },
        }),
      ],

      async onAuthenticate(data: onAuthenticatePayload) {
        const { token, documentName } = data;

        if (!token) {
          throw new Error('Unauthorized: no token provided');
        }

        let payload: { sub: string; email: string };
        try {
          payload = jwtService.verify<{ sub: string; email: string }>(token, {
            secret: process.env.JWT_SECRET || 'your-secret-key',
          });
        } catch {
          throw new Error('Unauthorized: invalid token');
        }

        const userId = payload.sub;

        const doc = await prisma.document.findUnique({
          where: { ydocKey: documentName },
          include: {
            space: {
              include: {
                permissions: { where: { userId } },
              },
            },
          },
        });

        if (!doc) {
          throw new Error('Document not found');
        }

        const isOwner = doc.space.ownerId === userId;
        const isMember = doc.space.permissions.length > 0;

        if (!isOwner && !isMember) {
          throw new Error('Unauthorized: no access to this document');
        }

        // Set read-only for VIEWERs
        const permission = doc.space.permissions[0];
        if (permission?.role === 'VIEWER') {
          (data as any).connection.readOnly = true;
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, avatarUrl: true },
        });

        return { user };
      },

      async onConnect(data: onConnectPayload): Promise<void> {
        logger.log(`Client connected to document: ${data.documentName}`);
      },

      async onDisconnect(data: onDisconnectPayload): Promise<void> {
        logger.log(`Client disconnected from document: ${data.documentName}`);
      },
    });

    await this.server.listen();
    this.logger.log(
      `🔄 Hocuspocus collaboration server listening on port ${collabPort}`,
    );
  }

  async onModuleDestroy() {
    if (this.server) {
      try {
        await this.server.destroy();
        this.logger.log('Hocuspocus server destroyed');
      } catch {
        // ignore errors during cleanup
      }
    }
  }
}
