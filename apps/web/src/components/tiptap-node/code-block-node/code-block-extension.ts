import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { CodeBlockNodeView } from "./code-block-node-view"

/**
 * Extended CodeBlockLowlight with a React NodeView that renders
 * a language selector dropdown and copy button in the top-right corner.
 */
export const CodeBlockWithLanguageSelector = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView)
  },
})
