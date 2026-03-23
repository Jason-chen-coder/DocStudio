import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { DocumentLinkList, type DocumentLinkListRef, type DocumentLinkItem } from './document-link-list';
import type { SuggestionOptions, SuggestionKeyDownProps } from '@tiptap/suggestion';

/**
 * Creates the suggestion config for [[ document links.
 * `fetchDocuments` is injected by the editor to query space documents.
 */
export function createDocumentLinkSuggestion(
  fetchDocuments: (query: string) => Promise<DocumentLinkItem[]>,
): Partial<SuggestionOptions<DocumentLinkItem>> {
  return {
    items: async ({ query }) => {
      return fetchDocuments(query);
    },

    render: () => {
      let component: ReactRenderer<DocumentLinkListRef> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(DocumentLinkList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            animation: 'shift-away',
            maxWidth: 'none',
          });
        },

        onUpdate: (props) => {
          component?.updateProps(props);
          if (!props.clientRect) return;
          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
          popup = null;
          component = null;
        },
      };
    },
  };
}
