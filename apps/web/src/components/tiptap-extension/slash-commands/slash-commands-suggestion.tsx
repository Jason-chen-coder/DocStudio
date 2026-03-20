import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { SlashCommandsList, type SlashCommandsListRef } from './slash-commands-list';
import type { SuggestionOptions, SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { SlashCommandItem } from './slash-commands-items';

/**
 * Renders the slash command suggestion popup using tippy.js + React.
 * Passed as `suggestion.render` to the SlashCommands extension.
 */
export const slashCommandsSuggestion: Partial<SuggestionOptions<SlashCommandItem>>['render'] =
  () => {
    let component: ReactRenderer<SlashCommandsListRef> | null = null;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashCommandsList, {
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
  };
