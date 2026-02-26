"use client"

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
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
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
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
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { Pin, PinOff } from "lucide-react"

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
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

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

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
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
  content?: string
  onUpdate?: (content: string) => void
  editable?: boolean
  showTableOfContents?: boolean
  /** 在编辑器内容底部追加的自定义渲染（与内容共享同一滚动容器） */
  footer?: ReactNode
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
}: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
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

  const editor = useEditor({
    immediatelyRender: false,
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
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate: (items) => {
          const currentActive = items.find((item) => item.isActive)

          setTableOfContentsItems(
            items.map((item) => ({
              id: item.id,
              level: item.level,
              textContent: item.textContent,
              isActive: item.isActive,
            }))
          )

          setActiveTocId(currentActive?.id ?? null)
        },
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
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
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  useEffect(() => {
    if (editor && content !== undefined) {
      // Prevent cursor jumping if content is same (though strictly likely different ref strings)
      // For read-only/share view this is safer.
      if (editor.getHTML() !== content) { 
         // Defer content update to avoid flushSync error during render cycle
         setTimeout(() => {
            if (editor.isDestroyed) return;
            editor.commands.setContent(content);
         }, 0);
      }
    }
  }, [editor, content])

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
      className={`simple-editor-wrapper h-full${editable ? " has-toolbar" : ""}${isTocPinned ? " is-toc-pinned" : ""}`}
      data-mode={editable ? "edit" : "preview"}
    >
      <EditorContext.Provider value={{ editor }}>
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
          <div className="simple-editor-content" ref={contentRef}>
            <EditorContent editor={editor} role="presentation" />
            {footer}
          </div>

          {showTableOfContents && tableOfContentsItems.length > 0 && (
            <aside
              className={`simple-editor-toc${isTocPinned ? " is-pinned" : ""}`}
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

              <div className="simple-editor-toc-drawer">
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
    </div>
  )
}
