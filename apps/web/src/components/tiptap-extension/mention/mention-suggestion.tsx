import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { MentionList, type MentionListRef, type MentionUser } from './mention-list';
import type { SuggestionOptions, SuggestionKeyDownProps } from '@tiptap/suggestion';

/**
 * Creates the suggestion config for @mentions.
 * `fetchMembers` is injected by the editor to query space members.
 */
export function createMentionSuggestion(
  fetchMembers: (query: string) => Promise<MentionUser[]>,
): Partial<SuggestionOptions> {
  return {
    items: async ({ query }) => {
      if (!query) return fetchMembers('');
      return fetchMembers(query);
    },

    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
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
