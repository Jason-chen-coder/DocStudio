import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathNodeView } from './math-node-view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: (latex?: string) => ReturnType;
    };
  }
}

export const MathExtension = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes) => ({
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-math-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math-block': '' }), 0];
  },

  addCommands() {
    return {
      insertMathBlock:
        (latex = '') =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { latex },
            })
            .run(),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },

  addInputRules() {
    // $$ triggers math block insertion
    return [];
  },
});
