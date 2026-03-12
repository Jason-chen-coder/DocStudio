import { Mark, mergeAttributes } from "@tiptap/core"

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentMark: {
      setCommentMark: (commentId: string) => ReturnType
      unsetCommentMark: (commentId: string) => ReturnType
    }
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: "commentMark",

  // Do NOT extend the mark when the user types immediately after it
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {}
          return { "data-comment-id": attributes.commentId }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "comment-mark",
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId })
        },
      unsetCommentMark:
        (commentId: string) =>
        ({ state, tr, dispatch }) => {
          // Remove only spans that match this commentId
          const { doc } = state
          let found = false
          doc.descendants((node, pos) => {
            if (!node.isText) return
            node.marks.forEach((mark) => {
              if (
                mark.type.name === "commentMark" &&
                mark.attrs.commentId === commentId
              ) {
                found = true
                tr.removeMark(pos, pos + node.nodeSize, mark.type)
              }
            })
          })
          if (found && dispatch) dispatch(tr)
          return found
        },
    }
  },
})
