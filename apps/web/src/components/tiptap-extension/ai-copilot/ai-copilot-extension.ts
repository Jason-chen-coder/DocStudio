import { Extension } from '@tiptap/core';
import { createGhostTextPlugin } from './ghost-text-plugin';

/**
 * Tiptap extension that adds AI Copilot ghost text support.
 * The actual autocomplete triggering is handled by the useAiCopilot hook.
 * This extension only provides the ProseMirror plugin for rendering ghost text.
 */
export const AiCopilotExtension = Extension.create({
  name: 'aiCopilot',

  addProseMirrorPlugins() {
    return [createGhostTextPlugin()];
  },
});
