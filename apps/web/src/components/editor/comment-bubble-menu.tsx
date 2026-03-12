"use client"

import { useState, useRef } from "react"
import { type Editor } from "@tiptap/react"
import { BubbleMenu } from '@tiptap/react/menus'
import { MessageSquarePlus } from "lucide-react"

interface CommentBubbleMenuProps {
  editor: Editor
  onAddComment: (quote: string, firstMessage: string) => string
  onCommentAdded?: (commentId: string) => void
}

export function CommentBubbleMenu({
  editor,
  onAddComment,
  onCommentAdded,
}: CommentBubbleMenuProps) {
  const [isInputOpen, setIsInputOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleOpenInput = () => {
    setIsInputOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSubmit = () => {
    const text = inputValue.trim()
    if (!text) return

    const { from, to } = editor.state.selection
    const quote = editor.state.doc.textBetween(from, to, " ")

    const commentId = onAddComment(quote, text)
    editor.chain().focus().setCommentMark(commentId).run()

    setInputValue("")
    setIsInputOpen(false)
    onCommentAdded?.(commentId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      setIsInputOpen(false)
      setInputValue("")
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        animation: "shift-away",
        duration: [150, 100],
        onHide: () => {
          setIsInputOpen(false)
          setInputValue("")
        },
      }}
      shouldShow={({ editor, state }) => {
        const { selection } = state
        const { empty } = selection
        // Only show when there is a non-empty selection and editor is editable
        return !empty && editor.isEditable
      }}
      className="comment-bubble-menu"
    >
      {!isInputOpen ? (
        <button
          type="button"
          className="comment-bubble-trigger"
          onClick={handleOpenInput}
          title="添加评论"
        >
          <MessageSquarePlus size={15} />
          <span>评论</span>
        </button>
      ) : (
        <div className="comment-bubble-input-panel">
          <textarea
            ref={inputRef}
            className="comment-bubble-textarea"
            placeholder="写下你的评论… (⌘↵ 提交)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="comment-bubble-actions">
            <button
              type="button"
              className="comment-bubble-cancel"
              onClick={() => {
                setIsInputOpen(false)
                setInputValue("")
              }}
            >
              取消
            </button>
            <button
              type="button"
              className="comment-bubble-submit"
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
            >
              提交
            </button>
          </div>
        </div>
      )}
    </BubbleMenu>
  )
}
