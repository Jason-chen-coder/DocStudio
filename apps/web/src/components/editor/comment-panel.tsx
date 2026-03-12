"use client"

import { useState, useRef, useEffect } from "react"
import type { CommentThread } from "@/hooks/use-comments"
import { Check, X, MessageSquare, ChevronDown } from "lucide-react"

interface CommentPanelProps {
  threads: CommentThread[]
  activeCommentId: string | null
  onReply: (threadId: string, text: string) => void
  onResolve: (threadId: string) => void
  onDelete: (threadId: string) => void
  onSelectThread: (threadId: string | null) => void
  currentUser?: string
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "刚刚"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function Avatar({
  author,
  color,
  avatarUrl,
}: {
  author: string
  color: string
  avatarUrl?: string
}) {
  return avatarUrl ? (
    <img
      className="comment-avatar"
      src={avatarUrl}
      alt={author}
      title={author}
    />
  ) : (
    <div
      className="comment-avatar"
      style={{ backgroundColor: color }}
      title={author}
    >
      {author.charAt(0).toUpperCase()}
    </div>
  )
}

function ThreadCard({
  thread,
  isActive,
  onReply,
  onResolve,
  onDelete,
  onClick,
}: {
  thread: CommentThread
  isActive: boolean
  onReply: (text: string) => void
  onResolve: () => void
  onDelete: () => void
  onClick: () => void
}) {
  const [replyText, setReplyText] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const handleReply = () => {
    const text = replyText.trim()
    if (!text) return
    onReply(text)
    setReplyText("")
  }

  const hasMoreMessages = thread.messages.length > 1
  const visibleMessages =
    isExpanded || isActive ? thread.messages : [thread.messages[0]]

  return (
    <div
      className={`comment-thread-card${
        isActive ? " is-active" : ""
      }${thread.resolved ? " is-resolved" : ""}`}
      onClick={onClick}
    >
      {/* Quote */}
      <div className="comment-thread-quote">
        <span className="comment-quote-bar" />
        <span className="comment-quote-text">{thread.quote}</span>
      </div>

      {/* Messages */}
      <div className="comment-messages">
        {visibleMessages.map((msg) => (
          <div key={msg.id} className="comment-message">
            <div className="comment-message-header">
              <Avatar author={msg.author} color={msg.avatarColor} avatarUrl={msg.avatarUrl} />
              <span className="comment-author">{msg.author}</span>
              <span className="comment-time">{timeAgo(msg.createdAt)}</span>
            </div>
            <p className="comment-message-text">{msg.text}</p>
          </div>
        ))}

        {hasMoreMessages && !isExpanded && !isActive && (
          <button
            className="comment-expand-btn"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(true)
            }}
          >
            <ChevronDown size={12} />
            还有 {thread.messages.length - 1} 条回复
          </button>
        )}
      </div>

      {/* Reply input (only when active) */}
      {isActive && !thread.resolved && (
        <div className="comment-reply-area">
          <textarea
            ref={textareaRef}
            className="comment-reply-textarea"
            placeholder="回复… (⌘↵ 提交)"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleReply()
              }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            rows={2}
          />
          <div className="comment-reply-actions">
            <button
              className="comment-action-btn comment-action-resolve"
              onClick={(e) => {
                e.stopPropagation()
                onResolve()
              }}
              title="标记为已解决"
            >
              <Check size={13} /> 解决
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="comment-action-btn comment-action-delete"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title="删除评论"
            >
              <X size={13} />
            </button>
            <button
              className="comment-action-btn comment-action-submit"
              disabled={!replyText.trim()}
              onClick={(e) => {
                e.stopPropagation()
                handleReply()
              }}
            >
              回复
            </button>
          </div>
        </div>
      )}

      {thread.resolved && (
        <div className="comment-resolved-badge">
          <Check size={11} /> 已解决
        </div>
      )}
    </div>
  )
}

export function CommentPanel({
  threads,
  activeCommentId,
  onReply,
  onResolve,
  onDelete,
  onSelectThread,
}: CommentPanelProps) {
  const activeThreads = threads.filter((t) => !t.resolved)
  const resolvedThreads = threads.filter((t) => t.resolved)
  const [showResolved, setShowResolved] = useState(false)

  if (threads.length === 0) {
    return (
      <div className="comment-panel-empty">
        <MessageSquare size={28} strokeWidth={1.5} />
        <p>暂无评论</p>
        <span>选中文字即可添加评论</span>
      </div>
    )
  }

  return (
    <div className="comment-panel">
      <div className="comment-panel-section">
        {activeThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            isActive={activeCommentId === thread.id}
            onReply={(text) => onReply(thread.id, text)}
            onResolve={() => onResolve(thread.id)}
            onDelete={() => onDelete(thread.id)}
            onClick={() =>
              onSelectThread(
                activeCommentId === thread.id ? null : thread.id
              )
            }
          />
        ))}
      </div>

      {resolvedThreads.length > 0 && (
        <div className="comment-panel-resolved-section">
          <button
            className="comment-resolved-toggle"
            onClick={() => setShowResolved((v) => !v)}
          >
            <Check size={13} />
            已解决 ({resolvedThreads.length})
            <ChevronDown
              size={13}
              style={{
                transform: showResolved ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {showResolved &&
            resolvedThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isActive={activeCommentId === thread.id}
                onReply={(text) => onReply(thread.id, text)}
                onResolve={() => onResolve(thread.id)}
                onDelete={() => onDelete(thread.id)}
                onClick={() =>
                  onSelectThread(
                    activeCommentId === thread.id ? null : thread.id
                  )
                }
              />
            ))}
        </div>
      )}
    </div>
  )
}
