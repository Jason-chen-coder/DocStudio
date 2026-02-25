"use client"

import { useState } from "react"
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
import { CopyIcon, Loader2 } from "lucide-react"
import { api } from "@/lib/api" // Assuming api client exists

interface ShareDialogProps {
  documentId: string
  trigger?: React.ReactNode
}

export function ShareDialog({ documentId, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<"PUBLIC" | "PASSWORD">("PUBLIC")
  const [password, setPassword] = useState("")
  const [expiresIn, setExpiresIn] = useState("never")
  const [shareLink, setShareLink] = useState("")

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

      let link = `${window.location.origin}/share/${res.token}`
      if (type === "PASSWORD" && password) {
        link += `?pwd=${encodeURIComponent(password)}`
      }
      setShareLink(link)
      toast.success("分享链接已生成")
    } catch (error) {
      console.error(error)
      toast.error("创建分享失败")
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast.success("链接已复制")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">分享</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享文档</DialogTitle>
          <DialogDescription>
            创建一个链接与他人分享此文档。
          </DialogDescription>
        </DialogHeader>
        
        {!shareLink ? (
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
                <Button onClick={handleCreateShare} disabled={loading || (type === "PASSWORD" && !password)}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  生成链接
                </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={shareLink}
                readOnly
              />
            </div>
            <Button size="sm" className="px-3" onClick={copyLink}>
              <span className="sr-only">Copy</span>
              <CopyIcon className="h-4 w-4" />
            </Button>
            
             <Button variant="ghost" onClick={() => setShareLink("")}>重置</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
