"use client"

import React, { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { type Editor, EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Collaboration ---
import { CustomCollaboration } from "./custom-collaboration"
import { ySyncPluginKey } from 'y-prosemirror'
import type { HocuspocusProvider } from "@hocuspocus/provider"
import type * as Y from "yjs"
import type { CollabUser } from "@/hooks/use-collaboration"

// --- Comment Extensions ---
import { CommentMark } from "@/components/tiptap-extension/comment-mark-extension"
import { SlashCommands, slashCommandsSuggestion } from "@/components/tiptap-extension/slash-commands"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import Mention from "@tiptap/extension-mention"
import { createMentionSuggestion } from "@/components/tiptap-extension/mention"
import { DocumentLink, createDocumentLinkSuggestion } from "@/components/tiptap-extension/document-link"
import { spaceService } from "@/services/space-service"
import { documentService } from "@/services/document-service"
import { useComments } from "@/hooks/use-comments"
import type { CommentThread } from "@/hooks/use-comments"
import { CommentBubbleMenu } from "@/components/editor/comment-bubble-menu"
import { CommentPanel } from "@/components/editor/comment-panel"
import { AiBubbleMenu } from "@/components/editor/ai-bubble-menu"
import { ImageBubbleMenu } from "@/components/editor/image-bubble-menu"
import { AiInlinePanel } from "@/components/editor/ai-inline-panel"
import { AiChatPanel } from "@/components/editor/ai-chat-panel"
import { useAiSubscription } from "@/hooks/use-ai-subscription"

// --- Shared base extensions (schema-defining nodes & marks) ---
import { getBaseExtensions } from "@/lib/tiptap-extensions"
import { Selection } from "@tiptap/extensions"
import {
  TableOfContents,
  getHierarchicalIndexes,
} from "@tiptap/extension-table-of-contents"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import { TablePopover } from "@/components/tiptap-ui/table-popover"
import { EmojiPopover } from "@/components/tiptap-ui/emoji-popover"
import { BlockMenu } from "@/components/tiptap-extension/block-menu"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
// UndoRedoButton replaced by SmartUndoRedoButton below (collab compat)
// import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { Undo2, Redo2 } from "lucide-react"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { Pin, PinOff, Minus, Sparkles, MoreHorizontal } from "lucide-react"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

// import content from "@/components/tiptap-templates/simple/data/content.json"

/** Simple toolbar button for inserting horizontal rule */
function HorizontalRuleButton() {
  const { editor } = useTiptapEditor()
  if (!editor) return null
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().setHorizontalRule().run()}
      className="tiptap-button flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      title="分割线"
      aria-label="插入分割线"
    >
      <Minus className="w-4 h-4" />
    </button>
  )
}

/**
 * Undo/Redo button that works in BOTH collab (Yjs) and non-collab modes.
 *
 * The key insight: CustomCollaboration.addCommands() registers undo/redo
 * commands that properly handle Tiptap's dry-run (dispatch=undefined) check.
 * So we just use the standard editor.can().undo() / editor.commands.undo() API.
 * No need to import y-prosemirror here — all handled in custom-collaboration.ts.
 */
function SmartUndoRedoButton({ action }: { action: "undo" | "redo" }) {
  const { editor } = useTiptapEditor()
  const [canDo, setCanDo] = useState(false)

  useEffect(() => {
    if (!editor) return

    const check = () => {
      if (!editor.isEditable) { setCanDo(false); return }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const can = editor.can() as any
        const possible = action === "undo" ? !!can.undo() : !!can.redo()
        setCanDo(possible)
      } catch {
        setCanDo(false)
      }
    }

    check()
    editor.on("transaction", check)
    return () => {
      editor.off("transaction", check)
    }
  }, [editor, action])

  const handleClick = useCallback(() => {
    if (!editor) return
    try {
      if (action === "undo") editor.chain().focus().undo().run()
      else editor.chain().focus().redo().run()
    } catch { /* noop */ }
  }, [editor, action])

  const Icon = action === "undo" ? Undo2 : Redo2
  const label = action === "undo" ? "Undo" : "Redo"

  return (
    <button
      type="button"
      disabled={!canDo}
      onClick={handleClick}
      className="tiptap-button flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:hover:bg-transparent"
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

/**
 * Overflow-aware toolbar: items that don't fit in one line are moved to a "more" dropdown.
 * Uses IntersectionObserver to detect which groups are fully visible.
 */
function OverflowToolbar({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const [overflowIndices, setOverflowIndices] = useState<Set<number>>(new Set())
  const [moreOpen, setMoreOpen] = useState(false)

  // Convert children to array for indexing
  const items = React.Children.toArray(children)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkOverflow = () => {
      const containerRight = container.getBoundingClientRect().right
      // Reserve space for the "more" button (~44px)
      const moreWidth = moreRef.current?.getBoundingClientRect().width ?? 44
      const threshold = containerRight - moreWidth - 8
      const newOverflow = new Set<number>()

      const childEls = container.querySelectorAll<HTMLElement>('[data-toolbar-item]')
      childEls.forEach((el) => {
        const idx = parseInt(el.dataset.toolbarItem || '0', 10)
        const elRight = el.getBoundingClientRect().right
        if (elRight > threshold) {
          newOverflow.add(idx)
        }
      })

      setOverflowIndices((prev) => {
        if (prev.size === newOverflow.size && [...prev].every((v) => newOverflow.has(v))) return prev
        return newOverflow
      })
    }

    const observer = new ResizeObserver(checkOverflow)
    observer.observe(container)
    // Initial check
    requestAnimationFrame(checkOverflow)

    return () => observer.disconnect()
  }, [items.length])

  const hasOverflow = overflowIndices.size > 0

  return (
    <div className="flex items-center w-full min-w-0 relative">
      {/* Main toolbar row */}
      <div ref={containerRef} className="flex items-center gap-[1.375rem] flex-1 min-w-0 overflow-hidden">
        {items.map((child, i) => (
          <div
            key={i}
            data-toolbar-item={i}
            className="flex-shrink-0"
            style={{ visibility: overflowIndices.has(i) ? 'hidden' : 'visible' }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* More button */}
      <div ref={moreRef} className={`flex-shrink-0 ml-1 ${hasOverflow ? '' : 'hidden'}`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={`tiptap-button flex items-center px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
              moreOpen
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="更多工具"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 flex items-center gap-2 whitespace-nowrap">
                {items.map((child, i) =>
                  overflowIndices.has(i) ? (
                    <div key={i} className="flex-shrink-0">{child}</div>
                  ) : null,
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <OverflowToolbar>
      <ToolbarGroup>
        <SmartUndoRedoButton action="undo" />
        <SmartUndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal
        />
        <BlockquoteButton />
        <CodeBlockButton />
        <HorizontalRuleButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarGroup>
        <TablePopover />
        <EmojiPopover />
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </OverflowToolbar>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export interface SimpleEditorProps {
  content?: string | object
  onUpdate?: (props: { editor: Editor }) => void
  editable?: boolean
  showTableOfContents?: boolean
  /** 在编辑器内容底部追加的自定义渲染（与内容共享同一滚动容器） */
  footer?: ReactNode
  /** Collaboration mode: pass provider + ydoc to enable Yjs real-time collab */
  provider?: HocuspocusProvider
  ydoc?: Y.Doc
  /** Current user info for collab cursor display */
  collabUser?: CollabUser
  /** Callback fired when editor is fully mounted and ready for interaction */
  onReady?: (editor: Editor) => void
  /** Pre-loaded comment threads (from DB) */
  initialCommentThreads?: CommentThread[]
  /** Called whenever comment threads change, for persistence */
  onCommentsChange?: (threads: CommentThread[]) => void
  /** Called when a comment is added or replied to (for notifications) */
  onCommentEvent?: (event: import('@/hooks/use-comments').CommentEvent) => void
  /** Space ID for @mention member lookup and [[ document link search */
  spaceId?: string
  /** Document ID to exclude from [[ document link suggestions (self-link prevention) */
  documentId?: string
  /** AI Chat state (controlled by parent for sidebar mode) */
  isAiChatOpen?: boolean
  onAiChatToggle?: () => void
  aiChatMode?: 'floating' | 'sidebar'
  onAiChatModeChange?: (mode: 'floating' | 'sidebar') => void
}

type TableOfContentsItem = {
  id: string
  level: number
  textContent: string
  isActive: boolean
}

export function SimpleEditor({
  content,
  onUpdate,
  editable = true,
  showTableOfContents = true,
  footer,
  provider,
  ydoc,
  collabUser,
  onReady,
  initialCommentThreads,
  onCommentsChange,
  onCommentEvent,
  spaceId,
  documentId,
  isAiChatOpen: isAiChatOpenProp,
  onAiChatToggle,
  aiChatMode: aiChatModeProp,
  onAiChatModeChange,
}: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false)
  // AI Chat: use parent-controlled state if provided, else internal
  const [internalAiChatOpen, setInternalAiChatOpen] = useState(false)
  const [internalAiChatMode, setInternalAiChatMode] = useState<'floating' | 'sidebar'>('floating')
  const isAiChatOpen = isAiChatOpenProp ?? internalAiChatOpen
  const aiChatMode = aiChatModeProp ?? internalAiChatMode
  const toggleAiChat = onAiChatToggle ?? (() => setInternalAiChatOpen((v) => !v))
  const setAiChatMode = onAiChatModeChange ?? setInternalAiChatMode
  const { threads, addThread, replyToThread, resolveThread, deleteThread } =
    useComments(collabUser?.name ?? "我", initialCommentThreads, onCommentsChange, collabUser?.avatarUrl ?? undefined, onCommentEvent)
  const [tableOfContentsItems, setTableOfContentsItems] = useState<
    TableOfContentsItem[]
  >([])
  const [activeTocId, setActiveTocId] = useState<string | null>(null)
  const [isTocPinned, setIsTocPinned] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  /** 点击 TOC 跳转时锁住高亮，防止 scroll 事件期间抖动 */
  const isScrollingRef = useRef(false)
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── AI Inline Panel state ──
  const [showAiInlinePanel, setShowAiInlinePanel] = useState(false)
  const [aiSelection, setAiSelection] = useState<{ text: string; range: { from: number; to: number }; coords: { top: number; left: number } } | null>(null)

  const isCollabMode = !!(provider && ydoc)

  const editor = useEditor({
    immediatelyRender: false,
    // ── React Performance Optimization ─────────────────────────────────────
    // Prevent React re-renders on every transaction (cursor move, remote sync, etc.)
    // Toolbar/UI state that depends on selection is handled via useEditorState hook
    // in child components, so the parent SimpleEditor doesn't need to re-render.
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      // Base content-defining extensions (shared with import-utils)
      ...getBaseExtensions({ disableUndoRedo: isCollabMode }),
      Selection,
      CommentMark,
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate: (items) => {
          const currentActive = items.find((item) => item.isActive)
          const currentActiveId = currentActive?.id ?? null

          setTableOfContentsItems((prevItems: TableOfContentsItem[]) => {
            const newItems = items.map((item) => ({
              id: item.id,
              level: item.level,
              textContent: item.textContent,
              isActive: item.isActive,
            }))

            if (prevItems.length !== newItems.length) return newItems;

            let isDifferent = false;
            for (let i = 0; i < prevItems.length; i++) {
              if (
                prevItems[i].id !== newItems[i].id ||
                prevItems[i].level !== newItems[i].level ||
                prevItems[i].textContent !== newItems[i].textContent ||
                prevItems[i].isActive !== newItems[i].isActive
              ) {
                isDifferent = true;
                break;
              }
            }

            return isDifferent ? newItems : prevItems;
          })

          setActiveTocId((prev: string | null) => prev !== currentActiveId ? currentActiveId : prev)
        },
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      // @Mention — type @ to search and tag space members
      ...(spaceId
        ? [
          Mention.configure({
            HTMLAttributes: {
              class: 'mention-tag',
            },
            suggestion: createMentionSuggestion(async (query) => {
              try {
                const members = await spaceService.getMembers(spaceId);
                const q = query.toLowerCase();
                return members
                  .filter(
                    (m) =>
                      !q ||
                      m.name.toLowerCase().includes(q) ||
                      (m.email && m.email.toLowerCase().includes(q)),
                  )
                  .slice(0, 8)
                  .map((m) => ({
                    id: m.userId,
                    name: m.name,
                    email: m.email,
                    avatarUrl: m.avatarUrl ?? null,
                  }));
              } catch {
                return [];
              }
            }),
          }),
        ]
        : []),
      // Document Link — type [[ to search and link documents
      ...(spaceId
        ? [
          DocumentLink.configure({
            suggestion: createDocumentLinkSuggestion(async (query) => {
              try {
                const docs = await documentService.getDocuments(spaceId);
                const q = query.toLowerCase();
                return docs
                  .filter(
                    (d) =>
                      d.id !== documentId &&
                      !d.deletedAt &&
                      (!q || d.title.toLowerCase().includes(q)),
                  )
                  .slice(0, 8)
                  .map((d) => ({
                    id: d.id,
                    title: d.title || '无标题文档',
                    spaceId: d.spaceId,
                  }));
              } catch {
                return [];
              }
            }),
          }),
        ]
        : []),
      // Slash Commands (/ menu)
      SlashCommands.configure({
        suggestion: {
          ...SlashCommands.options.suggestion,
          render: slashCommandsSuggestion,
        },
      }),
      // Collaboration extensions (only when provider + ydoc are present)
      ...(isCollabMode
        ? [
          CustomCollaboration.configure({
            document: ydoc,
            field: "content",
            provider: provider,
            user: collabUser || null,
          }),
        ]
        : []),
    ],
    // In collab mode, don't pass initial content (Yjs manages it from server)
    content: isCollabMode ? undefined : content,
    editable,
    onCreate: ({ editor }: { editor: Editor }) => {
      onReady?.(editor);
    },
    onUpdate: ({ editor, transaction }) => {
      // In collab mode, Yjs fires onUpdate for EVERY remote update too.
      // Only call the callback for local user-initiated changes
      // (i.e. when the transaction isn't a purely remote Yjs sync).
      if (isCollabMode && transaction.getMeta(ySyncPluginKey)) return;
      onUpdate?.({ editor });
    },
  })

  // ── AI Inline Panel opener ──
  const openAiInlinePanel = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    if (from === to) return
    const text = editor.state.doc.textBetween(from, to, ' ')
    if (!text) return
    // Get coordinates: left from selection start, top from selection end bottom
    const startCoords = editor.view.coordsAtPos(from)
    const endCoords = editor.view.coordsAtPos(to)
    setAiSelection({
      text,
      range: { from, to },
      coords: { top: endCoords.bottom, left: startCoords.left },
    })
    setShowAiInlinePanel(true)
    // Force BubbleMenu to re-evaluate shouldShow by dispatching an empty transaction
    requestAnimationFrame(() => {
      if (editor && !editor.isDestroyed) {
        editor.view.dispatch(editor.state.tr)
      }
    })
  }, [editor])

  // AI subscription state (gates all AI features)
  const aiSub = useAiSubscription()


  const [toolbarHeight, setToolbarHeight] = useState(0)

  // Detect click on comment-marked text → open panel and activate thread
  useEffect(() => {
    if (!editor) return
    const handleClick = () => {
      const { state } = editor
      const { from } = state.selection
      // Walk marks at cursor position
      const resolvedPos = state.doc.resolve(from)
      const marks = resolvedPos.marks()
      const commentMark = marks.find((m) => m.type.name === "commentMark")
      if (commentMark) {
        const threadId = commentMark.attrs.commentId as string
        setActiveCommentId(threadId)
        setIsCommentPanelOpen(true)
      }
    }
    const dom = editor.view.dom
    dom.addEventListener("click", handleClick)
    return () => dom.removeEventListener("click", handleClick)
  }, [editor])

  useEffect(() => {
    if (toolbarRef.current) {
      setToolbarHeight(toolbarRef.current.getBoundingClientRect().height)
    }
  }, [toolbarRef]) // The ref object itself doesn't change, but it's safe

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarHeight,
  })

  const scrollToHeading = (id: string) => {
    // 立即高亮点击的目标，并锁定不让 scroll 事件覆盖
    setActiveTocId(id)
    isScrollingRef.current = true

    // 清除上一次的解锁定时器
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current)
    }

    const target = document.getElementById(id)
    if (!target) return

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      const timeout = setTimeout(() => setMobileView("main"), 0)
      return () => clearTimeout(timeout)
    }
  }, [isMobile, mobileView])

  useEffect(() => {
    // Only update content in non-collab mode (collab mode is driven by Yjs)
    if (editor && !isCollabMode && content !== undefined) {
      // Content may be: a Tiptap JSON object, a JSON string, or an HTML string
      let parsed: unknown = content;
      if (typeof content === 'string' && content.trimStart().startsWith('{')) {
        try {
          parsed = JSON.parse(content);
        } catch {
          // not valid JSON — treat as HTML string
        }
      }
      // Defer to avoid flushSync error during render cycle
      setTimeout(() => {
        if (editor.isDestroyed) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor.commands.setContent(parsed as any);
      }, 0);
    }
  }, [editor, content, isCollabMode])

  useEffect(() => {
    if (editor && editable !== undefined) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  useEffect(() => {
    const scrollContainer = contentRef.current
    if (!scrollContainer || tableOfContentsItems.length === 0) return

    const updateActiveTocByScroll = () => {
      // 滚动期间若是由点击触发的，锁定高亮不跟随滚动抖动
      // 每次 scroll 事件都重置解锁定时器，150ms 无新 scroll 事件即视为滚动结束
      if (isScrollingRef.current) {
        if (scrollEndTimerRef.current) {
          clearTimeout(scrollEndTimerRef.current)
        }
        scrollEndTimerRef.current = setTimeout(() => {
          isScrollingRef.current = false
        }, 150)
        return
      }

      const currentScrollTop = scrollContainer.scrollTop
      const threshold = 8
      let currentId: string | null = tableOfContentsItems[0]?.id ?? null

      for (const item of tableOfContentsItems) {
        const heading = document.getElementById(item.id)
        if (!heading) continue

        if (heading.offsetTop - threshold <= currentScrollTop) {
          currentId = item.id
          continue
        }

        break
      }

      setActiveTocId((prev) => (prev === currentId ? prev : currentId))
    }

    updateActiveTocByScroll()
    scrollContainer.addEventListener("scroll", updateActiveTocByScroll, {
      passive: true,
    })

    return () => {
      scrollContainer.removeEventListener("scroll", updateActiveTocByScroll)
    }
  }, [tableOfContentsItems])

  return (
    <div
      className={`simple-editor-wrapper dark:bg-gray-800 h-full${editable ? " has-toolbar" : ""}${isTocPinned ? " is-toc-pinned" : ""}${isCommentPanelOpen ? " has-comment-panel" : ""}`}
      data-mode={editable ? "edit" : "preview"}
    >
      <EditorContext.Provider value={{ editor }}>
        {editor && editable && (
          <>
            <AiBubbleMenu
              editor={editor}
              isAiPanelOpen={showAiInlinePanel}
              onAiPanelOpen={openAiInlinePanel}
              canUseCommand={aiSub.isSubscribed ? aiSub.canUseCommand : undefined}
              onAddComment={addThread}
              onCommentAdded={(id) => {
                setActiveCommentId(id)
                setIsCommentPanelOpen(true)
              }}
            />
            <ImageBubbleMenu
              editor={editor}
              onAddComment={addThread}
              onCommentAdded={(id) => {
                setActiveCommentId(id)
                setIsCommentPanelOpen(true)
              }}
            />
          </>
        )}
        {/* AI Inline Panel (portal, positioned below selection) */}
        {showAiInlinePanel && editor && aiSelection && (
          <AiInlinePanel
            editor={editor}
            selectedText={aiSelection.text}
            selectionRange={aiSelection.range}
            canUseCommand={aiSub.isSubscribed ? aiSub.canUseCommand : undefined}
            onClose={() => { setShowAiInlinePanel(false); setAiSelection(null); }}
            anchorCoords={aiSelection.coords}
          />
        )}
        {editable && (
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        )}

        <div className="simple-editor-main">
          <div className="simple-editor-content relative" ref={contentRef}>
            {editable && editor && <BlockMenu editor={editor} />}
            <EditorContent editor={editor} role="presentation" />
            {footer}
            {/* AI Chat floating toggle (requires subscription with chat feature) */}
            {editable && aiSub.canUseChat && (
              <button
                type="button"
                onClick={toggleAiChat}
                className={`group fixed bottom-6 right-6 z-30 flex items-center gap-0 p-2.5 rounded-full shadow-lg transition-all duration-200 text-sm font-medium ${
                  isAiChatOpen
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:pr-4 hover:gap-2'
                }`}
                title={isAiChatOpen ? '关闭 AI 助手' : '打开 AI 助手'}
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                {!isAiChatOpen && (
                  <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-200">
                    AI 助手
                  </span>
                )}
              </button>
            )}
          </div>

          {isCommentPanelOpen && (
            <aside className="simple-editor-comment-panel" aria-label="评论">
              <div className="comment-panel-header">
                <span className="comment-panel-title">评论</span>
                <button
                  type="button"
                  className="comment-panel-close"
                  onClick={() => {
                    setIsCommentPanelOpen(false)
                    setActiveCommentId(null)
                  }}
                  aria-label="关闭评论面板"
                >
                  ✕
                </button>
              </div>
              <CommentPanel
                threads={threads}
                activeCommentId={activeCommentId}
                onReply={replyToThread}
                onResolve={(id) => {
                  resolveThread(id)
                  if (editor) editor.commands.unsetCommentMark(id)
                }}
                onDelete={(id) => {
                  deleteThread(id)
                  if (editor) editor.commands.unsetCommentMark(id)
                }}
                onSelectThread={setActiveCommentId}
              />
            </aside>
          )}

          {/* Sidebar AI Chat is rendered by parent (DocumentPage) */}

          {showTableOfContents && tableOfContentsItems.length > 0 && (
            <aside
              className={`simple-editor-toc${isTocPinned ? " is-pinned" : ""} dark:bg-gray-800`}
              aria-label="Table of contents"
            >
              <div className="simple-editor-toc-progress" aria-hidden="true">
                {tableOfContentsItems.map((item) => {
                  const isItemActive = activeTocId === item.id

                  return (
                    <div
                      key={item.id}
                      className={`toc-sidebar-progress-line${isItemActive ? " is-active" : ""}`}
                      style={
                        {
                          "--toc-depth": item.level,
                        } as CSSProperties
                      }
                    />
                  )
                })}
              </div>

              <div className="simple-editor-toc-drawer bg-white dark:bg-gray-800">
                <div className="simple-editor-toc-header">
                  <p className="simple-editor-toc-title">目录</p>
                  <button
                    type="button"
                    className="simple-editor-toc-pin-button"
                    aria-label={isTocPinned ? "取消置顶目录" : "置顶目录"}
                    title={isTocPinned ? "取消置顶" : "置顶"}
                    onClick={() => setIsTocPinned((prev) => !prev)}
                  >
                    {isTocPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                </div>

                <ul className="simple-editor-toc-list">
                  {tableOfContentsItems.map((item) => {
                    const isItemActive = activeTocId === item.id

                    return (
                      <li
                        key={item.id}
                        className={`simple-editor-toc-item simple-editor-toc-item-level-${item.level}`}
                      >
                        <button
                          type="button"
                          className={`simple-editor-toc-link${isItemActive ? " is-active" : ""}`}
                          aria-current={isItemActive ? "true" : undefined}
                          onClick={() => scrollToHeading(item.id)}
                        >
                          {item.textContent}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </EditorContext.Provider>

      {/* Floating AI Chat (rendered outside editor context to avoid layout impact) */}
      {isAiChatOpen && editor && aiChatMode === 'floating' && (
        <AiChatPanel
          editor={editor}
          documentId={documentId}
          onClose={toggleAiChat}
          mode="floating"
          onModeChange={setAiChatMode}
        />
      )}
    </div>
  )
}
