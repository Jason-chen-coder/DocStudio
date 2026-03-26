'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { ghostTextPluginKey } from '@/components/tiptap-extension/ai-copilot';
import { streamCompletion } from '@/services/ai-service';

const DEBOUNCE_MS = 800;

/**
 * Hook that triggers AI autocomplete suggestions as ghost text in the editor.
 *
 * - Fires after user stops typing for 800ms
 * - Only triggers at end of paragraph (not in code blocks, tables, etc.)
 * - Shows ghost text via ProseMirror decoration
 * - Tab accepts, Esc dismisses, any edit clears
 */
export function useAiCopilot(editor: Editor | null, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearGhostText = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const { tr } = editor.state;
    tr.setMeta(ghostTextPluginKey, { text: null, pos: 0 });
    editor.view.dispatch(tr);
  }, [editor]);

  const triggerAutocomplete = useCallback(async () => {
    if (!editor || editor.isDestroyed || !enabled) return;

    const { state } = editor;
    const { from, to, $from } = state.selection;

    // Only trigger on collapsed cursor (no selection)
    if (from !== to) return;

    // Don't trigger in code blocks, tables, or other non-paragraph nodes
    const parentNode = $from.parent;
    if (parentNode.type.name !== 'paragraph') return;

    // Don't trigger if paragraph is empty
    const currentText = parentNode.textContent;
    if (!currentText || currentText.length < 3) return;

    // Get context: current paragraph + up to 2 preceding paragraphs
    const contextParts: string[] = [];
    let blocksBefore = 0;
    let pos = $from.before($from.depth);

    // Walk backwards to find preceding paragraphs
    while (pos > 1 && blocksBefore < 2) {
      try {
        const resolvedPos = state.doc.resolve(pos - 1);
        const node = resolvedPos.parent;
        if (node.type.name === 'paragraph' && node.textContent) {
          contextParts.unshift(node.textContent);
          blocksBefore++;
        }
        const newPos = resolvedPos.before(resolvedPos.depth);
        if (newPos >= pos) break; // prevent infinite loop
        pos = newPos;
      } catch {
        break; // safety net for edge cases
      }
    }

    const context = contextParts.length > 0 ? contextParts.join('\n') : undefined;

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let result = '';
      for await (const chunk of streamCompletion(
        { command: 'autocomplete', text: currentText, context },
        controller.signal,
      )) {
        if (controller.signal.aborted) return;
        if (chunk.type === 'text' && chunk.content) {
          result += chunk.content;
        }
        if (chunk.type === 'error') return;
      }

      if (controller.signal.aborted || !result.trim()) return;
      if (editor.isDestroyed) return;

      // Verify cursor hasn't moved
      const currentFrom = editor.state.selection.from;
      if (currentFrom !== from) return;

      // Show ghost text
      const { tr } = editor.state;
      tr.setMeta(ghostTextPluginKey, { text: result.trim(), pos: from });
      editor.view.dispatch(tr);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI Copilot error:', err);
      }
    }
  }, [editor, enabled]);

  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      // Clear existing ghost text immediately on edit
      clearGhostText();

      // Cancel pending request
      abortRef.current?.abort();

      // Debounce new autocomplete trigger
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(triggerAutocomplete, DEBOUNCE_MS);
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [editor, enabled, triggerAutocomplete, clearGhostText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
