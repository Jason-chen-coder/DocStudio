import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Y from 'yjs';

const MAX_SNAPSHOTS = 50;
const AUTO_SNAPSHOT_INTERVAL_HOURS = 0.5; // 30 minutes

/**
 * In-memory set of ydocKeys currently being restored.
 * While a key is present, the Hocuspocus onStoreDocument hook skips DB writes
 * to prevent the old in-memory CRDT from overwriting the restored ydocData.
 */
const restoringDocs = new Set<string>();

/**
 * Decode a stored Y.Snapshot binary into a Tiptap-compatible JSON object.
 *
 * The snapshot stored in `ydocData` is encoded via `Y.encodeSnapshot()` which
 * captures only the *visible* state at that point in time (compact, no history).
 * To read content back we must reconstruct a full YDoc by:
 *   1. Creating an empty YDoc
 *   2. Applying the snapshot's item-clock state directly (via a temporary
 *      full-update that restores the captured state)
 *
 * Tiptap stores its document in the XmlFragment named "default" (or "content"
 * depending on the collaboration extension config). We try both names.
 */
function ydocSnapshotToTiptapJson(ydocSnapshotBytes: Uint8Array): object | null {
  try {
    const decodedSnapshot = Y.decodeSnapshot(ydocSnapshotBytes);

    // Build a temporary YDoc and restore the snapshot state into it.
    // Y.createDocFromSnapshot needs an existing YDoc with the CRDT history;
    // since we stored a self-contained Y.Snapshot we use an empty base doc.
    const baseDoc = new Y.Doc();
    const restoredDoc = Y.createDocFromSnapshot(baseDoc, decodedSnapshot);

    // Tiptap collaboration extension uses 'content' as the shared type name
    // (configured via field: "content" in CustomCollaboration.configure)
    const fragmentNames = ['content', 'default'];
    let tiptapJson: object | null = null;

    for (const name of fragmentNames) {
      const fragment = restoredDoc.getXmlFragment(name);
      if (fragment.length > 0) {
        // Convert the XmlFragment to a Tiptap-compatible ProseMirror JSON doc
        tiptapJson = xmlFragmentToTiptapJson(fragment);
        break;
      }
    }

    baseDoc.destroy();
    restoredDoc.destroy();
    return tiptapJson;
  } catch {
    return null;
  }
}

/**
 * Convert a Y.XmlFragment to a Tiptap/ProseMirror JSON document.
 * This mirrors what @tiptap/extension-collaboration does internally.
 */
function xmlFragmentToTiptapJson(fragment: Y.XmlFragment): object {
  const content: object[] = [];
  // forEach callback signature: (item: YXmlElement|YXmlText, index: number, self) => void
  fragment.forEach((child) => {
    content.push(xmlElementToNode(child));
  });
  return { type: 'doc', content };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function xmlElementToNode(node: any): object {
  if (node instanceof Y.XmlText) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delta = (node.toDelta() as Array<{ insert?: string }>);
    return {
      type: 'text',
      text: delta.map((d) => d.insert ?? '').join(''),
    };
  }

  if (node instanceof Y.XmlElement) {
    const tag = node.nodeName as string;
    const { type, attrs: typeAttrs } = tagToTiptapType(tag);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elementAttrs = node.getAttributes() as Record<string, unknown>;
    // Merge element attributes with type-derived attributes (e.g. heading level)
    const mergedAttrs = { ...elementAttrs, ...typeAttrs };
    const childContent: object[] = [];
    // YXmlElement extends YXmlFragment, so forEach is available
    (node as unknown as Y.XmlFragment).forEach((child) => {
      childContent.push(xmlElementToNode(child));
    });
    return {
      type,
      ...(Object.keys(mergedAttrs).length > 0 ? { attrs: mergedAttrs } : {}),
      ...(childContent.length > 0 ? { content: childContent } : {}),
    };
  }

  return { type: 'text', text: '' };
}

/**
 * Convert an HTML tag name to a Tiptap node type.
 * For heading tags (h1-h6), also returns the level as attrs.
 */
function tagToTiptapType(tag: string): { type: string; attrs?: Record<string, unknown> } {
  const lower = tag.toLowerCase();
  const headingMatch = /^h([1-6])$/.exec(lower);
  if (headingMatch) {
    return { type: 'heading', attrs: { level: Number(headingMatch[1]) } };
  }
  const map: Record<string, string> = {
    p: 'paragraph',
    ul: 'bulletList',
    ol: 'orderedList',
    li: 'listItem',
    blockquote: 'blockquote',
    pre: 'codeBlock',
    code: 'code',
    hr: 'horizontalRule',
    br: 'hardBreak',
    img: 'image',
    table: 'table',
    tr: 'tableRow',
    th: 'tableHeader',
    td: 'tableCell',
    strong: 'bold',
    em: 'italic',
    s: 'strike',
    u: 'underline',
    a: 'link',
  };
  return { type: map[lower] ?? lower };
}

/**
 * Extract Tiptap JSON from a full Yjs state update binary (not a Y.Snapshot).
 * Used when creating snapshots — we receive the live state update from Hocuspocus.
 */
function ydocUpdateToTiptapJson(updateBytes: Uint8Array): object | null {
  try {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, updateBytes);

    const fragmentNames = ['content', 'default'];
    let tiptapJson: object | null = null;

    for (const name of fragmentNames) {
      const fragment = doc.getXmlFragment(name);
      if (fragment.length > 0) {
        tiptapJson = xmlFragmentToTiptapJson(fragment);
        break;
      }
    }

    doc.destroy();
    return tiptapJson;
  } catch {
    return null;
  }
}

// Minimal Tiptap/ProseMirror node shape used for fallback restoration
interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: TiptapNode[];
}

/**
 * Convert a Tiptap ProseMirror JSON doc into a Yjs XmlFragment.
 * Mirrors y-prosemirror's createTypeFromElementNode/createTypeFromTextNodes.
 */
function tiptapJsonToXmlFragment(doc: TiptapNode, fragment: Y.XmlFragment): void {
  const nodes = doc.content ?? [];
  const xmlNodes = nodes.map(nodeToXml).filter((n): n is Y.XmlElement | Y.XmlText => n !== null);
  if (xmlNodes.length > 0) {
    fragment.insert(0, xmlNodes);
  }
}

/**
 * Convert inline text nodes (consecutive text-type children of an element)
 * into a single Y.XmlText using applyDelta — exactly as y-prosemirror does.
 */
function createYXmlTextFromTextNodes(nodes: TiptapNode[]): Y.XmlText {
  const yText = new Y.XmlText();
  const delta = nodes.map((node) => ({
    insert: node.text ?? '',
    attributes: marksToAttributes(node.marks ?? []),
  }));
  yText.applyDelta(delta);
  return yText;
}

function marksToAttributes(marks: Array<{ type: string; attrs?: Record<string, unknown> }>): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const mark of marks) {
    if (mark.attrs && Object.keys(mark.attrs).length > 0) {
      attrs[mark.type] = mark.attrs;
    } else {
      attrs[mark.type] = true;
    }
  }
  return attrs;
}

/**
 * Normalize children: group consecutive text nodes into arrays,
 * leave element nodes as-is. Mirrors y-prosemirror's normalizePNodeContent.
 */
function normalizeChildren(children: TiptapNode[]): Array<TiptapNode | TiptapNode[]> {
  const result: Array<TiptapNode | TiptapNode[]> = [];
  let textGroup: TiptapNode[] = [];

  for (const child of children) {
    if (child.type === 'text') {
      textGroup.push(child);
    } else {
      if (textGroup.length > 0) {
        result.push(textGroup);
        textGroup = [];
      }
      result.push(child);
    }
  }
  if (textGroup.length > 0) {
    result.push(textGroup);
  }
  return result;
}

function nodeToXml(node: TiptapNode): Y.XmlElement | Y.XmlText | null {
  if (node.type === 'text') {
    // Standalone text node — wrap in XmlText via applyDelta
    return createYXmlTextFromTextNodes([node]);
  }

  const tag = tiptapTypeToTag(node.type, node.attrs);
  const el = new Y.XmlElement(tag);

  if (node.attrs) {
    for (const [k, v] of Object.entries(node.attrs)) {
      if (v !== null && v !== undefined) {
        el.setAttribute(k, String(v));
      }
    }
  }

  if (node.content && node.content.length > 0) {
    const normalized = normalizeChildren(node.content);
    const children = normalized.map((n) => {
      if (Array.isArray(n)) {
        // Group of text nodes → single Y.XmlText with applyDelta
        return createYXmlTextFromTextNodes(n);
      }
      return nodeToXml(n);
    }).filter((n): n is Y.XmlElement | Y.XmlText => n !== null);

    if (children.length > 0) {
      el.insert(0, children);
    }
  } else {
    // Empty block node (e.g. empty paragraph): insert an empty XmlText
    // so y-prosemirror can find the cursor position inside it.
    el.insert(0, [new Y.XmlText()]);
  }

  return el;
}

function tiptapTypeToTag(type: string, attrs?: Record<string, unknown>): string {
  if (type === 'heading') {
    const level = Number(attrs?.level) || 1;
    return `h${Math.min(Math.max(level, 1), 6)}`;
  }
  const map: Record<string, string> = {
    paragraph: 'p',
    bulletList: 'ul',
    orderedList: 'ol',
    listItem: 'li',
    blockquote: 'blockquote',
    codeBlock: 'pre',
    horizontalRule: 'hr',
    hardBreak: 'br',
    image: 'img',
    table: 'table',
    tableRow: 'tr',
    tableHeader: 'th',
    tableCell: 'td',
  };
  return map[type] ?? type;
}

@Injectable()
export class SnapshotsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Called by CollaborationService.store hook to check if a restore is in progress. */
  isRestoringDoc(ydocKey: string): boolean {
    return restoringDocs.has(ydocKey);
  }

  /** Called by SnapshotsController before closeConnections to block onStoreDocument. */
  markRestoringDoc(ydocKey: string): void {
    restoringDocs.add(ydocKey);
  }

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
   * Get a single snapshot's content (for preview).
   *
   * Returns the snapshot metadata + a `contentJson` field containing the
   * Tiptap-compatible ProseMirror JSON decoded from `ydocData`.
   * Falls back to the stored `content` string if Yjs decoding fails.
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

    // Attempt to decode Tiptap JSON from the stored Y.Snapshot binary
    let contentJson: object | null = null;

    if (snapshot.ydocData) {
      contentJson = ydocSnapshotToTiptapJson(new Uint8Array(snapshot.ydocData));
    }

    // Fallback: try parsing the stored content string as Tiptap JSON
    if (!contentJson && snapshot.content) {
      try {
        const parsed = JSON.parse(snapshot.content) as unknown;
        if (typeof parsed === 'object' && parsed !== null) {
          contentJson = parsed as object;
        }
      } catch {
        // content is plain text — wrap it in a minimal Tiptap doc
        if (snapshot.content.trim()) {
          contentJson = {
            type: 'doc',
            content: snapshot.content
              .split('\n')
              .filter((line) => line.trim())
              .map((line) => ({
                type: 'paragraph',
                content: [{ type: 'text', text: line }],
              })),
          };
        }
      }
    }

    // Strip raw binary from response — return only serialisable fields
    return {
      id: snapshot.id,
      docId: snapshot.docId,
      content: snapshot.content,
      message: snapshot.message,
      createdBy: snapshot.createdBy,
      createdAt: snapshot.createdAt,
      creator: snapshot.creator,
      contentJson,
    };
  }

  /**
   * Manually create a snapshot from the document's current state.
   * If `ydocStateUpdate` is provided (a raw Yjs binary update), it is used
   * to encode a compact Y.Snapshot for lossless Yjs restoration AND to
   * synchronously extract Tiptap JSON for the `content` preview field.
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
    let snapshotBytes: Buffer | null = null;
    let tiptapJsonContent: string | null = null;

    const rawUpdate = ydocStateUpdate ?? (doc.ydocData ? new Uint8Array(doc.ydocData) : null);
    if (rawUpdate) {
      try {
        const tempDoc = new Y.Doc();
        Y.applyUpdate(tempDoc, rawUpdate);
        const snap = Y.snapshot(tempDoc);
        snapshotBytes = Buffer.from(Y.encodeSnapshot(snap));
        tempDoc.destroy();
      } catch {
        snapshotBytes = null;
      }

      // Synchronously extract Tiptap JSON from the live update for preview use
      const tiptapJson = ydocUpdateToTiptapJson(rawUpdate);
      if (tiptapJson) {
        tiptapJsonContent = JSON.stringify(tiptapJson);
      }
    }

    // Fallback: keep whatever was in doc.content (may be plain text or empty)
    const contentToStore = tiptapJsonContent ?? doc.content ?? '';

    const snapshot = await this.prisma.documentSnapshot.create({
      data: {
        docId,
        content: contentToStore,     // Tiptap JSON string (or plain text fallback)
        ydocData: snapshotBytes,      // Compact Y.Snapshot binary for restoration
        message,
        createdBy: userId,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.pruneSnapshots(docId);
    return snapshot;
  }

  /**
   * Auto-create snapshot (called by Hocuspocus onStoreDocument).
   * Only creates a snapshot if more than AUTO_SNAPSHOT_INTERVAL_HOURS has passed.
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
   * Strategy: create a brand-new YDoc and apply the snapshot content as a
   * fresh update — this completely severs the old CRDT history so that
   * reconnecting Hocuspocus clients cannot merge stale content back in.
   */
  async restore(docId: string, snapshotId: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    const snapshot = await this.prisma.documentSnapshot.findFirst({
      where: { id: snapshotId, docId },
    });
    if (!snapshot) throw new NotFoundException('Snapshot not found');

    // The restoring lock is set by the controller BEFORE closeConnections is
    // called, so onStoreDocument is already blocked. We just need to ensure
    // the lock extends 5 seconds past our DB write to cover any late flushes.
    const ydocKey = doc.ydocKey ?? null;

    try {
      // 1. Auto-save current version before restoring (safety net)
      await this.create(docId, userId, '恢复前自动备份');

      // 2. Build a completely fresh YDoc from the snapshot's content.
      //    We do NOT use Y.createDocFromSnapshot — that requires the full CRDT
      //    history as a base, and reusing existing history causes clients to
      //    re-merge stale content on reconnect. A brand-new YDoc severs all
      //    shared history.
      let restoredYdocData: Buffer | null = null;

      // Strategy A: Build Y.Doc from snapshot.content (Tiptap JSON or plain text)
      const contentToRestore = snapshot.content;
      if (contentToRestore) {
        try {
          let tiptapJson: TiptapNode | null = null;

          // Try parsing as Tiptap JSON
          if (contentToRestore.trimStart().startsWith('{')) {
            try {
              const parsed = JSON.parse(contentToRestore) as unknown;
              if (typeof parsed === 'object' && parsed !== null) {
                tiptapJson = parsed as TiptapNode;
              }
            } catch {
              // not valid JSON
            }
          }

          // Fallback: wrap plain text in a minimal Tiptap document structure
          if (!tiptapJson && contentToRestore.trim()) {
            tiptapJson = {
              type: 'doc',
              content: contentToRestore.split('\n').map((line) => ({
                type: 'paragraph',
                ...(line.trim()
                  ? { content: [{ type: 'text', text: line }] }
                  : {}),
              })),
            };
          }

          if (tiptapJson) {
            const freshDoc = new Y.Doc();
            const fragment = freshDoc.getXmlFragment('content');
            tiptapJsonToXmlFragment(tiptapJson, fragment);

            // Verify the fragment actually has content before encoding
            if (fragment.length > 0) {
              restoredYdocData = Buffer.from(Y.encodeStateAsUpdate(freshDoc));
            }
            freshDoc.destroy();
          }
        } catch {
          restoredYdocData = null;
        }
      }

      // Strategy B: If content-based restoration failed, try decoding the
      // Y.Snapshot binary against the current document's CRDT history.
      if (!restoredYdocData && snapshot.ydocData && doc.ydocData) {
        try {
          const decodedSnapshot = Y.decodeSnapshot(new Uint8Array(snapshot.ydocData));
          const baseDoc = new Y.Doc();
          Y.applyUpdate(baseDoc, new Uint8Array(doc.ydocData));
          const snapshotDoc = Y.createDocFromSnapshot(baseDoc, decodedSnapshot);

          const fragmentNames = ['content', 'default'];
          let snapshotTiptapJson: TiptapNode | null = null;
          for (const name of fragmentNames) {
            const frag = snapshotDoc.getXmlFragment(name);
            if (frag.length > 0) {
              snapshotTiptapJson = xmlFragmentToTiptapJson(frag) as TiptapNode;
              break;
            }
          }

          baseDoc.destroy();
          snapshotDoc.destroy();

          if (snapshotTiptapJson) {
            const freshDoc = new Y.Doc();
            const fragment = freshDoc.getXmlFragment('content');
            tiptapJsonToXmlFragment(snapshotTiptapJson, fragment);
            if (fragment.length > 0) {
              restoredYdocData = Buffer.from(Y.encodeStateAsUpdate(freshDoc));
            }
            freshDoc.destroy();
          }
        } catch {
          // Y.Snapshot decoding failed — CRDT history may have been severed
        }
      }

      // 3. Write restored content + fresh ydocData back to the document.
      const updated = await this.prisma.document.update({
        where: { id: docId },
        data: {
          content: snapshot.content,
          ydocData: restoredYdocData ?? null,
        },
      });
      return updated;
    } finally {
      // Keep the lock for 5 seconds to cover any in-flight debounced store
      // that fires after closeConnections kicks the WebSocket clients.
      if (ydocKey) {
        setTimeout(() => restoringDocs.delete(ydocKey), 5000);
      }
    }
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
