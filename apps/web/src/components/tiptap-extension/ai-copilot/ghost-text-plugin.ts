import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const ghostTextPluginKey = new PluginKey('aiGhostText');

export interface GhostTextState {
  text: string | null;
  pos: number; // cursor position where ghost text appears
}

/**
 * ProseMirror plugin that renders ghost text (AI autocomplete suggestion)
 * as a gray inline decoration after the cursor.
 */
export function createGhostTextPlugin() {
  return new Plugin<GhostTextState>({
    key: ghostTextPluginKey,

    state: {
      init(): GhostTextState {
        return { text: null, pos: 0 };
      },
      apply(tr, prev): GhostTextState {
        const meta = tr.getMeta(ghostTextPluginKey);
        if (meta !== undefined) {
          return meta as GhostTextState;
        }
        // Clear ghost text on any user edit (not just selection change)
        if (tr.docChanged) {
          return { text: null, pos: 0 };
        }
        return prev;
      },
    },

    props: {
      decorations(state) {
        const pluginState = ghostTextPluginKey.getState(state) as GhostTextState | undefined;
        if (!pluginState?.text || !pluginState.pos) {
          return DecorationSet.empty;
        }

        // Create a widget decoration that shows the ghost text
        const widget = Decoration.widget(pluginState.pos, () => {
          const span = document.createElement('span');
          span.className = 'ai-ghost-text';
          span.textContent = pluginState.text!;
          span.setAttribute('data-ghost', 'true');
          return span;
        }, { side: 1 }); // side: 1 means after the cursor position

        return DecorationSet.create(state.doc, [widget]);
      },

      // Handle keyboard shortcuts for ghost text
      handleKeyDown(view, event) {
        const pluginState = ghostTextPluginKey.getState(view.state) as GhostTextState | undefined;
        if (!pluginState?.text) return false;

        if (event.key === 'Escape') {
          event.preventDefault();
          // Dismiss ghost text
          const { tr } = view.state;
          tr.setMeta(ghostTextPluginKey, { text: null, pos: 0 });
          view.dispatch(tr);
          return true;
        }

        return false;
      },
    },
  });
}
