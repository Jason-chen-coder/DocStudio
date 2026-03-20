import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CalloutNodeView } from './callout-node-view';

export type CalloutType = 'info' | 'warning' | 'error' | 'success';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      insertCallout: (type?: CalloutType) => ReturnType;
      toggleCalloutType: (type: CalloutType) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'info' as CalloutType,
        parseHTML: (element) =>
          (element.getAttribute('data-callout-type') as CalloutType) || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-callout': '' }),
      0,
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (type: CalloutType = 'info') =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { type },
              content: [{ type: 'paragraph' }],
            })
            .run();
        },
      toggleCalloutType:
        (type: CalloutType) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const node = selection.$anchor.node(-1);
          if (node?.type.name !== this.name) return false;

          const pos = selection.$anchor.before(-1);
          if (dispatch) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, type });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },

  addInputRules() {
    // :::info / :::warning / :::error / :::success + space
    return (['info', 'warning', 'error', 'success'] as const).map((type) =>
      wrappingInputRule({
        find: new RegExp(`^:::${type}\\s$`),
        type: this.type,
        getAttributes: () => ({ type }),
      }),
    );
  },
});
