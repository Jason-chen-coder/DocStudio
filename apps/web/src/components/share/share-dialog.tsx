"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  CopyIcon,
  Loader2,
  Trash2,
  Link2,
  Eye,
  Clock,
  Plus,
  ArrowLeft,
  ShieldAlert,
  Globe,
  Lock,
} from "lucide-react"
import { api } from "@/lib/api"

interface ShareLink {
  id: string
  token: string
  type: "PUBLIC" | "PASSWORD"
  expiresAt: string | null
  viewCount: number
  isActive: boolean
  isExpired: boolean
  createdAt: string
}

interface ShareDialogProps {
  documentId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type DialogView = "list" | "create"

export function ShareDialog({ documentId, trigger, open: controlledOpen, onOpenChange }: ShareDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [view, setView] = useState<DialogView>("list")
  const [loading, setLoading] = useState(false)
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loadingShares, setLoadingShares] = useState(false)

  // Create form state
  const [type, setType] = useState<"PUBLIC" | "PASSWORD">("PUBLIC")
  const [password, setPassword] = useState("")
  const [expiresIn, setExpiresIn] = useState("never")
  const [newShareLink, setNewShareLink] = useState("")

  const fetchShares = useCallback(async () => {
    try {
      setLoadingShares(true)
      const data = await api.get<ShareLink[]>(`/share/doc/${documentId}/list`)
      setShares(data)
    } catch (error) {
      console.error("Failed to fetch shares:", error)
    } finally {
      setLoadingShares(false)
    }
  }, [documentId])

  useEffect(() => {
    if (open) {
      fetchShares()
      setView("list")
      setNewShareLink("")
    }
  }, [open, fetchShares])

  const handleCreateShare = async () => {
    try {
      setLoading(true)
      let expiresAt = null
      if (expiresIn !== "never") {
        const date = new Date()
        if (expiresIn === "1h") date.setHours(date.getHours() + 1)
        if (expiresIn === "1d") date.setDate(date.getDate() + 1)
        if (expiresIn === "7d") date.setDate(date.getDate() + 7)
        expiresAt = date.toISOString()
      }

      const res = await api.post("/share", {
        documentId,
        type,
        password: type === "PASSWORD" ? password : undefined,
        expiresAt,
      })

      const link = `${window.location.origin}/share/${res.token}`
      setNewShareLink(link)
      toast.success("分享链接已生成")
      // Refresh list
      fetchShares()
    } catch (error) {
      console.error(error)
      toast.error("创建分享失败")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    try {
      await api.delete(`/share/${shareId}`)
      toast.success("分享链接已删除")
      setShares((prev) => prev.filter((s) => s.id !== shareId))
    } catch (error) {
      console.error(error)
      toast.error("删除失败")
    }
  }

  const copyLink = async (token?: string) => {
    const link = token
      ? `${window.location.origin}/share/${token}`
      : newShareLink
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Dialog focus trap 可能导致 clipboard API 失败，使用 fallback
      const textarea = document.createElement("textarea")
      textarea.value = link
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    toast.success("链接已复制")
  }

  const resetCreateForm = () => {
    setType("PUBLIC")
    setPassword("")
    setExpiresIn("never")
    setNewShareLink("")
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return "永久"
    const d = new Date(expiresAt)
    if (d < new Date()) return "已过期"
    return formatDate(expiresAt)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === "create" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setView("list")
                  resetCreateForm()
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {view === "list" ? "分享管理" : "创建分享链接"}
          </DialogTitle>
          <DialogDescription>
            {view === "list"
              ? "管理此文档的所有分享链接。"
              : "创建一个新的链接与他人分享此文档。"}
          </DialogDescription>
        </DialogHeader>

        {view === "list" ? (
          <div className="space-y-3">
            {/* Create button */}
            <Button
              className="w-full"
              onClick={() => {
                setView("create")
                resetCreateForm()
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              创建新的分享链接
            </Button>

            {/* Share list */}
            {loadingShares ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无分享链接
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                      share.isExpired || !share.isActive
                        ? "opacity-60 bg-muted/30"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {share.type === "PUBLIC" ? (
                          <Globe className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          {share.type === "PUBLIC" ? "公开" : "密码"}
                        </span>
                        {share.isExpired && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                            已过期
                          </span>
                        )}
                        {!share.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-medium">
                            已停用
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatExpiry(share.expiresAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {share.viewCount} 次查看
                        </span>
                        <span>{formatDate(share.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyLink(share.token)}
                        title="复制链接"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteShare(share.id)}
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Create view */
          <>
            {!newShareLink ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    模式
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(v: "PUBLIC" | "PASSWORD") => setType(v)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">直接访问</SelectItem>
                      <SelectItem value="PASSWORD">密码访问</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "PASSWORD" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      密码
                    </Label>
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="col-span-3"
                      placeholder="设置访问密码"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expires" className="text-right">
                    有效期
                  </Label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="选择有效期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">永久有效</SelectItem>
                      <SelectItem value="1h">1小时</SelectItem>
                      <SelectItem value="1d">1天</SelectItem>
                      <SelectItem value="7d">7天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleCreateShare}
                    disabled={loading || (type === "PASSWORD" && !password)}
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    生成链接
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="flex items-center space-x-2">
                  <Input defaultValue={newShareLink} readOnly className="flex-1" />
                  <Button size="sm" className="px-3" onClick={() => copyLink()}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>
                    {type === "PASSWORD"
                      ? "请将密码单独告知接收者，不要与链接一起发送。"
                      : "任何获得此链接的人都可以查看文档。"}
                  </span>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setView("list")
                      resetCreateForm()
                    }}
                  >
                    返回列表
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
