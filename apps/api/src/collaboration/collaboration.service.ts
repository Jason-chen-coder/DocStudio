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
// import Document from '@tiptap/extension-document';
// import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { SnapshotsService } from '../snapshots/snapshots.service';

// A minimal set of extensions to allow parsing the YDoc on the server.
// const serverExtensions = [Document, Paragraph, Text];

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
              // Skip storing if this document is currently being restored.
              // This prevents the in-memory CRDT (which still holds the old state)
              // from overwriting the freshly-written ydocData in the DB.
              if (snapshotsService.isRestoringDoc(documentName)) {
                logger.log(`Skipping store for ${documentName} — restore in progress`);
                return;
              }

              try {
                // 1. Store the binary YDoc state and get doc info in a single query
                const docRecord = await prisma.document.update({
                  where: { ydocKey: documentName },
                  data: { ydocData: Buffer.from(state) },
                  select: { id: true, createdBy: true },
                });

                // 1b. Trigger auto-snapshot (max once per 30 min) using the live Yjs state.
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

                  // Recursively extract plain text from Yjs XmlElement/XmlText toJSON output.
                  // toJSON() can produce various shapes depending on node type:
                  //   XmlText  → string (the text content directly)
                  //   XmlElement → { nodeName, attrs?, children? } or similar
                  //   Nested content may be in .children, .content, or node itself
                  const extractText = (node: any): string => {
                    if (typeof node === 'string') return node;
                    if (!node) return '';

                    // XmlText.toJSON() returns the delta, but toString() returns plain text
                    if (typeof node.toString === 'function' && node.constructor?.name === 'XmlText') {
                      return node.toString();
                    }

                    // Handle plain object from toJSON()
                    if (typeof node === 'object') {
                      // Direct text property (Tiptap text nodes)
                      if (node.type === 'text' && typeof node.text === 'string') return node.text;
                      // text content
                      if (typeof node.content === 'string') return node.content;

                      // Recurse into children array
                      if (Array.isArray(node.children)) {
                        return node.children.map((c: any) => extractText(c)).join('');
                      }
                      if (Array.isArray(node.content)) {
                        return node.content.map((c: any) => extractText(c)).join('');
                      }
                    }
                    return '';
                  };

                  // Method 1: Use toString() on each child element (most reliable)
                  let plainText = '';
                  xmlFragment.forEach((child) => {
                    const text = typeof child.toString === 'function'
                      ? child.toString()
                      : extractText((child as any).toJSON?.() ?? child);
                    if (text) plainText += text + '\n';
                  });

                  // Method 2: Fallback — try toJSON() on the whole fragment
                  if (!plainText.trim()) {
                    const json: any = xmlFragment.toJSON();
                    if (typeof json === 'string') {
                      plainText = json;
                    } else if (Array.isArray(json)) {
                      plainText = json.map((item: any) => extractText(item)).join('\n');
                    }
                  }

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
            const secret = process.env.JWT_SECRET;
            if (!secret) {
              throw new Error('JWT_SECRET environment variable is not set');
            }
            payload = jwtService.verify<{ sub: string; email: string }>(token, {
              secret,
            });
          } catch (err) {
            throw new Error(
              err instanceof Error ? err.message : 'Unauthorized: invalid token',
            );
          }

          const userId = payload.sub;

          // Verify user exists and is not disabled
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, avatarUrl: true, isDisabled: true },
          });

          if (!user) {
            throw new Error('Unauthorized: user not found');
          }

          if (user.isDisabled) {
            throw new Error('Unauthorized: account is disabled');
          }

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

          return { user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl } };
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

  /**
   * Force-close all WebSocket connections for a document and unload it
   * from Hocuspocus memory. This ensures the next client connection
   * triggers a fresh DB fetch instead of reusing stale in-memory state.
   */
  async closeDocumentConnections(ydocKey: string): Promise<void> {
    if (this.server) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this.server.closeConnections(ydocKey);

        // Force-unload the document from Hocuspocus in-memory cache.
        // Without this, Hocuspocus may serve stale state to reconnecting
        // clients instead of re-fetching the restored ydocData from DB.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const doc = this.server.documents?.get(ydocKey);
        if (doc) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          await this.server.unloadDocument(doc);
          this.logger.log(`Unloaded document from memory: ${ydocKey}`);
        }

        this.logger.log(`Closed connections for document: ${ydocKey}`);
      } catch (err) {
        this.logger.warn(`Failed to close connections for ${ydocKey}: ${String(err)}`);
      }
    }
  }
}
