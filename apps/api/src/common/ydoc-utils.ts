import * as Y from 'yjs';

/**
 * Convert a Y.XmlFragment to a Tiptap/ProseMirror JSON document.
 * This mirrors what @tiptap/extension-collaboration does internally.
 */
export function xmlFragmentToTiptapJson(fragment: Y.XmlFragment): object {
  const content: object[] = [];
  fragment.forEach((child) => {
    const node = xmlElementToNode(child);
    if (node) content.push(node);
  });
  return { type: 'doc', content };
}

/**
 * Convert a Yjs XML node to a ProseMirror/Tiptap JSON node.
 * Returns null for invalid nodes (e.g. empty text nodes) which ProseMirror rejects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function xmlElementToNode(node: any): object | null {
  if (node instanceof Y.XmlText) {
    const delta = node.toDelta() as Array<{
      insert?: string;
      attributes?: Record<string, unknown>;
    }>;

    // Multi-segment delta: produce separate text nodes for each segment
    // But since we return a single node here, join text and handle single-segment marks
    if (delta.length === 1 && delta[0].insert) {
      const text = delta[0].insert as string;
      // ProseMirror does not allow empty text nodes
      if (!text) return null;

      const result: Record<string, unknown> = { type: 'text', text };
      if (delta[0].attributes && Object.keys(delta[0].attributes).length > 0) {
        result.marks = Object.entries(delta[0].attributes).map(
          ([type, attrs]) => {
            if (typeof attrs === 'object' && attrs !== null) {
              return { type, attrs };
            }
            return { type };
          },
        );
      }
      return result;
    }

    // Multi-segment or empty delta
    const text = delta.map((d) => d.insert ?? '').join('');
    // ProseMirror does not allow empty text nodes
    if (!text) return null;
    return { type: 'text', text };
  }

  if (node instanceof Y.XmlElement) {
    const tag = node.nodeName as string;
    const { type, attrs: typeAttrs } = tagToTiptapType(tag);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elementAttrs = node.getAttributes() as Record<string, unknown>;
    const mergedAttrs = { ...elementAttrs, ...typeAttrs };

    // Recursively convert children, filtering out invalid (null) nodes
    const childContent: object[] = [];
    (node as unknown as Y.XmlFragment).forEach((child) => {
      const childNode = xmlElementToNode(child);
      if (childNode) childContent.push(childNode);
    });

    return {
      type,
      ...(Object.keys(mergedAttrs).length > 0 ? { attrs: mergedAttrs } : {}),
      ...(childContent.length > 0 ? { content: childContent } : {}),
    };
  }

  // Unknown node type — skip rather than producing invalid empty text
  return null;
}

/**
 * Convert a Yjs XmlElement nodeName to a Tiptap node type.
 *
 * Tiptap collaboration stores nodes in Yjs using their original camelCase
 * Tiptap names (e.g. "bulletList", "taskItem", "horizontalRule").
 * Only a few nodes use HTML tag names (p, ul, ol, li, h1-h6, etc.).
 * We map the HTML tags to Tiptap names, and pass everything else through as-is.
 */
function tagToTiptapType(tag: string): {
  type: string;
  attrs?: Record<string, unknown>;
} {
  // Heading tags: h1-h6
  const headingMatch = /^h([1-6])$/i.exec(tag);
  if (headingMatch) {
    return { type: 'heading', attrs: { level: Number(headingMatch[1]) } };
  }

  // HTML tag → Tiptap type mapping (only for actual HTML tags)
  const htmlTagMap: Record<string, string> = {
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

  const lower = tag.toLowerCase();
  if (htmlTagMap[lower]) {
    return { type: htmlTagMap[lower] };
  }

  // Already a Tiptap camelCase name (bulletList, taskItem, drawing, etc.) — pass through as-is
  return { type: tag };
}

/**
 * Extract Tiptap JSON from a full Yjs state update binary.
 * Returns a ProseMirror-compatible JSON doc, or null on failure.
 */
export function ydocUpdateToTiptapJson(
  updateBytes: Uint8Array,
): object | null {
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
