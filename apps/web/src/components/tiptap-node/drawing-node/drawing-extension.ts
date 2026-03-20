import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DrawingNodeView } from './drawing-node-view';

export interface DrawingLine {
  id: string;
  color: string;
  size: number;
  path: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    drawing: {
      insertDrawing: () => ReturnType;
    };
  }
}

export const DrawingExtension = Node.create({
  name: 'drawing',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      lines: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute('data-lines');
          if (data) {
            try {
              return JSON.parse(data);
            } catch {
              return [];
            }
          }
          return [];
        },
        renderHTML: (attributes) => ({
          'data-lines': JSON.stringify(attributes.lines),
        }),
      },
      width: {
        default: 800,
      },
      height: {
        default: 300,
      },
      displayWidth: {
        default: null,
      },
      panX: {
        default: 0,
      },
      panY: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="drawing"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'drawing' }),
    ];
  },

  addCommands() {
    return {
      insertDrawing:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { lines: [], width: 800, height: 300 },
            })
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingNodeView);
  },
});
