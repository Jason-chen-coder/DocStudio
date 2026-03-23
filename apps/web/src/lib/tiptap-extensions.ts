/**
 * Shared Tiptap extension list for content schema definition.
 *
 * Used by:
 * - SimpleEditor (editor rendering)
 * - import-utils.ts (generateJSON for file import)
 * - export-utils.ts (if needed in future)
 *
 * Only includes content-defining extensions (nodes + marks).
 * Excludes editor-only extensions: Collaboration, SlashCommands,
 * ImageUploadNode, CommentMark, Mention, Selection, TableOfContents.
 */

import { StarterKit } from "@tiptap/starter-kit"
import { CodeBlockWithLanguageSelector } from "@/components/tiptap-node/code-block-node"
import { ImageExtension } from "@/components/tiptap-node/image-node/image-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { CalloutExtension } from "@/components/tiptap-node/callout-node"
import { MathExtension } from "@/components/tiptap-node/math-node"
import { DrawingExtension } from "@/components/tiptap-node/drawing-node"
import { DocumentLink } from "@/components/tiptap-extension/document-link"
import { all, createLowlight } from "lowlight"

const lowlight = createLowlight(all)

/**
 * Returns the base set of Tiptap extensions that define the document schema.
 * These extensions are needed by `generateJSON()` to correctly parse HTML
 * into Tiptap-compatible ProseMirror JSON.
 */
export function getBaseExtensions(options?: { disableUndoRedo?: boolean }) {
  return [
    StarterKit.configure({
      undoRedo: options?.disableUndoRedo ? false : undefined,
      horizontalRule: false,
      codeBlock: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    CodeBlockWithLanguageSelector.configure({
      lowlight,
      defaultLanguage: 'javascript',
      languageClassPrefix: 'language-',
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    ImageExtension,
    Typography,
    Superscript,
    Subscript,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    CalloutExtension,
    MathExtension,
    DrawingExtension,
    DocumentLink, // Schema-only (no suggestion config) for import/export support
  ]
}
