import { Node, mergeAttributes } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { PluginKey, Plugin } from '@tiptap/pm/state';
import type { DocumentLinkItem } from './document-link-list';

const DocumentLinkPluginKey = new PluginKey('documentLinkSuggestion');

export interface DocumentLinkOptions {
  HTMLAttributes: Record<string, unknown>;
  suggestion: Partial<SuggestionOptions<DocumentLinkItem>>;
}

export const DocumentLink = Node.create<DocumentLinkOptions>({
  name: 'documentLink',

  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'document-link-tag',
      },
      suggestion: {
        char: '[[',
        pluginKey: DocumentLinkPluginKey,
        command: ({ editor, range, props }) => {
          // Delete the [[ trigger + query text, then insert the node
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'documentLink',
              attrs: {
                documentId: props.id,
                spaceId: props.spaceId,
                title: props.title,
              },
            })
            .run();
        },
      } as Partial<SuggestionOptions<DocumentLinkItem>>,
    };
  },

  addAttributes() {
    return {
      documentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-document-id'),
        renderHTML: (attributes) => ({
          'data-document-id': attributes.documentId,
        }),
      },
      spaceId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-space-id'),
        renderHTML: (attributes) => ({
          'data-space-id': attributes.spaceId,
        }),
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') || element.textContent,
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'span[data-document-link]' },
      { tag: 'a[data-document-link]' }, // backward compat with old content
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const href = `/spaces/${node.attrs.spaceId}/documents/${node.attrs.documentId}`;
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-document-link': '',
        'data-document-id': node.attrs.documentId,
        'data-space-id': node.attrs.spaceId,
        'data-title': node.attrs.title,
        'data-href': href,
        role: 'link',
        tabindex: '0',
      }),
      node.attrs.title || '文档链接',
    ];
  },

  renderText({ node }) {
    return node.attrs.title || '文档链接';
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isDocLink = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) return false;

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isDocLink = true;
              tr.insertText('', pos, pos + node.nodeSize);
              return false;
            }
          });

          return isDocLink;
        }),
    };
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];

    // Click handler: open document link in new tab
    plugins.push(
      new Plugin({
        props: {
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            const el = target.closest('[data-document-link]') as HTMLElement | null;
            if (!el) return false;

            event.preventDefault();
            event.stopPropagation();

            const documentId = el.getAttribute('data-document-id');
            const spaceId = el.getAttribute('data-space-id');
            const title = el.getAttribute('data-title') || '文档链接';

            // In share/public pages, dispatch event for the page to handle
            // (permission check + login gate needed)
            if (typeof window !== 'undefined' && window.location.pathname.includes('/share/')) {
              window.dispatchEvent(
                new CustomEvent('document-link-click', {
                  detail: { documentId, spaceId, title },
                }),
              );
              return true;
            }

            // In app pages, open directly in new tab
            const href = el.getAttribute('data-href');
            if (href && !href.includes('/null/')) {
              window.open(href, '_blank', 'noopener,noreferrer');
            }
            return true;
          },
        },
      }),
    );

    // Only register Suggestion plugin when a render function is provided
    // (i.e. when configured with suggestion in the editor, not in base extensions for import/export)
    if (this.options.suggestion?.render) {
      plugins.push(
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      );
    }

    return plugins;
  },
});
