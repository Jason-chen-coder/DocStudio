import { useState, useCallback, useEffect } from "react"

export interface CommentThread {
  id: string
  /** 被高亮文字的快照（仅展示用） */
  quote: string
  messages: CommentMessage[]
  createdAt: Date
  resolved: boolean
}

export interface CommentMessage {
  id: string
  author: string
  avatarColor: string
  avatarUrl?: string
  text: string
  createdAt: Date
}

/** 从 JSON 字符串（数据库存储格式）反序列化，Date 字段还原为 Date 对象 */
export function deserializeThreads(json: string | null | undefined): CommentThread[] {
  if (!json) return []
  try {
    const raw = JSON.parse(json) as CommentThread[]
    return raw.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      messages: t.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
    }))
  } catch {
    return []
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function avatarColor(author: string) {
  const colors = [
    "#4F46E5",
    "#0891B2",
    "#059669",
    "#D97706",
    "#DC2626",
    "#7C3AED",
    "#DB2777",
  ]
  let hash = 0
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function useComments(
  currentUser: string = "我",
  initialThreads?: CommentThread[],
  onChange?: (threads: CommentThread[]) => void,
  currentUserAvatarUrl?: string,
) {
  const [threads, setThreads] = useState<CommentThread[]>(initialThreads ?? [])

  // When initialThreads changes (e.g. document loaded), sync into state
  useEffect(() => {
    if (initialThreads) {
      setThreads(initialThreads)
    }
  }, [initialThreads])

  const notify = useCallback(
    (updated: CommentThread[]) => {
      onChange?.(updated)
    },
    [onChange]
  )

  const addThread = useCallback(
    (quote: string, firstMessage: string): string => {
      const id = generateId()
      const message: CommentMessage = {
        id: generateId(),
        author: currentUser,
        avatarColor: avatarColor(currentUser),
        avatarUrl: currentUserAvatarUrl,
        text: firstMessage,
        createdAt: new Date(),
      }
      const newThread: CommentThread = {
        id,
        quote,
        messages: [message],
        createdAt: new Date(),
        resolved: false,
      }
      setThreads((prev) => {
        const updated = [...prev, newThread]
        notify(updated)
        return updated
      })
      return id
    },
    [currentUser, notify]
  )

  const replyToThread = useCallback(
    (threadId: string, text: string) => {
      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: generateId(),
                    author: currentUser,
                    avatarColor: avatarColor(currentUser),
                    avatarUrl: currentUserAvatarUrl,
                    text,
                    createdAt: new Date(),
                  },
                ],
              }
            : t
        )
        notify(updated)
        return updated
      })
    },
    [currentUser, notify]
  )

  const resolveThread = useCallback(
    (threadId: string) => {
      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.id === threadId ? { ...t, resolved: true } : t
        )
        notify(updated)
        return updated
      })
    },
    [notify]
  )

  const deleteThread = useCallback(
    (threadId: string) => {
      setThreads((prev) => {
        const updated = prev.filter((t) => t.id !== threadId)
        notify(updated)
        return updated
      })
    },
    [notify]
  )

  return { threads, addThread, replyToThread, resolveThread, deleteThread }
}
