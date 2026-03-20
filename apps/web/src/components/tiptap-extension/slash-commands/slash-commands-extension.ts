import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { SLASH_COMMAND_ITEMS, type SlashCommandItem } from './slash-commands-items';

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: { editor: any; range: any; props: SlashCommandItem }) => {
          // Delete the slash and query text
          editor.chain().focus().deleteRange(range).run();
          // Execute the command
          props.command(editor);
        },
        items: ({ query }: { query: string }): SlashCommandItem[] => {
          const q = query.toLowerCase().trim();
          if (!q) return SLASH_COMMAND_ITEMS;

          return SLASH_COMMAND_ITEMS.filter((item) => {
            return (
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.aliases.some((alias) => alias.includes(q))
            );
          });
        },
      } satisfies Partial<SuggestionOptions<SlashCommandItem>>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
