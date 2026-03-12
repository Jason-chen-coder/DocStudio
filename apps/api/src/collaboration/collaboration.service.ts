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
import * as Y from 'yjs';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { SnapshotsService } from '../snapshots/snapshots.service';

// A minimal set of extensions to allow parsing the YDoc on the server.
const serverExtensions = [Document, Paragraph, Text];

@Injectable()
export class CollaborationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollaborationService.name);
  private server: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly snapshotsService: SnapshotsService,
  ) {}

  async onModuleInit() {
    const prisma = this.prisma;
    const jwtService = this.jwtService;
    const logger = this.logger;
    const snapshotsService = this.snapshotsService;

    const collabPort = Number(process.env.COLLAB_PORT) || 1234;

    this.server = new Server(
      {
        port: collabPort,

        // ── Store debounce ────────────────────────────────────────────────────
        // Hocuspocus calls onStoreDocument after each incoming update.
        // debounce: wait 2s after the last update before storing (batches rapid keystrokes).
        // maxDebounce: guarantee a store at least every 30s even during continuous typing.
        // This dramatically reduces DB write frequency during active editing sessions.
        debounce: 2000,
        maxDebounce: 30000,

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
                // 1. Store the binary YDoc state
                await prisma.document.update({
                  where: { ydocKey: documentName },
                  data: { ydocData: Buffer.from(state) },
                });

                // 1b. Trigger auto-snapshot (max once per hour) using the live Yjs state.
                // We pass `state` directly so the snapshot service does not need a
                // redundant DB round-trip to fetch ydocData.
                const docRecord = await prisma.document.findUnique({
                  where: { ydocKey: documentName },
                  select: { id: true, createdBy: true },
                });
                if (docRecord) {
                  snapshotsService
                    .autoSnapshot(docRecord.id, docRecord.createdBy, state)
                    .catch((err: unknown) =>
                      logger.warn(
                        `Auto-snapshot skipped for ${documentName}: ${String(err)}`,
                      ),
                    );
                }

                // 2. Extract plain text for search/preview purposes
                try {
                  const ydoc = new Y.Doc();
                  Y.applyUpdate(ydoc, state);
                  const xmlFragment = ydoc.getXmlFragment('content');

                  // Extract plain text by recursively traversing the fragment
                  const extractText = (node: any): string => {
                    if (node.type === 'text') {
                      return node.content || '';
                    }
                    let text = '';
                    if (node.children) {
                      node.children.forEach((child: any) => {
                        text += extractText(child);
                      });
                    }
                    return text;
                  };

                  let plainText = '';
                  xmlFragment.forEach((child) => {
                    const c = child as any;
                    if (typeof c.toJSON === 'function') {
                      const json = c.toJSON();
                      plainText += extractText(json) + '\n';
                    }
                  });

                  if (plainText.trim()) {
                    await prisma.document.update({
                      where: { ydocKey: documentName },
                      data: { content: plainText.trim() },
                    });
                  }
                } catch (parseErr) {
                  logger.warn(
                    `Failed to extract text from YDoc for ${documentName}`,
                    parseErr,
                  );
                }
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
      },
      // ── WebSocket-level permessage-deflate compression ────────────────────
      // This is spread into the underlying ws.WebSocketServer constructor.
      // Yjs binary deltas compress very well (typically 40–60% reduction),
      // so enabling this for large documents is highly beneficial.
      {
        perMessageDeflate: {
          // Only compress frames above 1KB; small pings are not worth compressing
          threshold: 1024,
          // Limit memory use by capping the window bits
          serverMaxWindowBits: 13,
          clientMaxWindowBits: 13,
          // Prevent context takeover for better CPU/memory tradeoffs in multi-client sessions
          serverNoContextTakeover: false,
          clientNoContextTakeover: false,
          // Zlib deflate options: level 6 is a good speed/ratio balance
          zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 6,
          },
          zlibInflateOptions: {
            chunkSize: 10 * 1024,
          },
          // Cap concurrent compression ops to avoid CPU spikes
          concurrencyLimit: 10,
        },
      },
    );

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
