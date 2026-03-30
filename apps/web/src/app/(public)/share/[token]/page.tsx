"use client"

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2,
  Lock,
  User,
  CalendarDays,
  RefreshCw,
  FileText,
  AlertTriangle,
  Eye,
  Share2,
  Check,
  LogIn,
} from 'lucide-react';
import Image from 'next/image';
import { getCdnUrl } from '@/lib/cdn';
import { useAuth } from '@/lib/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ShareInfo {
  token: string;
  type: 'PUBLIC' | 'PASSWORD';
  documentTitle: string;
  expiresAt: string | null;
  hasPassword: boolean;
  document?: DocMeta;
}

interface DocMeta {
  title: string;
  content: string | object;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return formatDate(iso);
}

/* ─────────────────────────────────────────────────────────
   Top Navigation Bar
   ───────────────────────────────────────────────────────── */
function ShareHeader({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left: brand + title */}
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="/"
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
            title="返回首页"
          >
            <Image
              src="/docStudio_icon.png"
              alt="DocStudio"
              width={28}
              height={28}
              className="shadow-sm"
              unoptimized
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 hidden sm:block">
              DocStudio
            </span>
          </a>

          {title && (
            <>
              <span className="text-gray-300 dark:text-gray-600 hidden sm:block">/</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-[300px]">
                {title}
              </span>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mr-2">
            <Eye className="w-3.5 h-3.5" />
            <span>只读</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
              text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors cursor-pointer"
            title="复制链接"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600 dark:text-green-400">已复制</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">分享</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Author Card + Document Metadata
   ───────────────────────────────────────────────────────── */
function DocMetaFooter({ meta }: { meta: DocMeta }) {
  const avatarUrl = getCdnUrl(meta.creator?.avatarUrl);

  return (
    <footer className="mt-16 mb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
          <FileText className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
        </div>

        {/* Author card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-xl
          bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
          {/* Avatar */}
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={meta.creator!.name}
              width={48}
              height={48}
              unoptimized
              className="rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
              flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
          )}

          <div className="flex flex-col items-center sm:items-start gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {meta.creator?.name ?? '匿名用户'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30
                text-blue-600 dark:text-blue-400 font-medium">
                作者
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                <span>创建于 {formatDate(meta.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>更新于 {formatRelativeDate(meta.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-300 dark:text-gray-600">
            由 DocStudio 提供支持
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   Loading Skeleton
   ───────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <ShareHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        {/* Title skeleton */}
        <div className="h-8 w-2/3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-8" />

        {/* Content skeleton lines */}
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-4 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-20 w-full bg-gray-50 dark:bg-gray-900 rounded-lg mt-6" />
          <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded mt-4" />
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Error State
   ───────────────────────────────────────────────────────── */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <ShareHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20
            flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            无法访问文档
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
              text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20
              hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Password Gate
   ───────────────────────────────────────────────────────── */
function PasswordGate({
  title,
  password,
  setPassword,
  verifying,
  onSubmit,
}: {
  title: string;
  password: string;
  setPassword: (v: string) => void;
  verifying: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <ShareHeader title={title} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Lock icon */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl
              bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20
              border border-blue-100 dark:border-blue-800/30
              flex items-center justify-center">
              <Lock className="w-7 h-7 text-blue-500 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              需要密码访问
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              此文档受密码保护，请输入密码以查看内容
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="请输入访问密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 text-sm rounded-xl border-gray-200 dark:border-gray-700
                  focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                  transition-shadow"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-medium
                bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
                shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              disabled={verifying || !password}
            >
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              验证并访问
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Share Page
   ───────────────────────────────────────────────────────── */
export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);

  const [docMeta, setDocMeta] = useState<DocMeta | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // ─── Document Link click handling ───
  const [linkDialog, setLinkDialog] = useState<{
    open: boolean;
    title: string;
    documentId: string;
    spaceId: string;
    status: 'no-login' | 'no-access';
  }>({ open: false, title: '', documentId: '', spaceId: '', status: 'no-login' });
  const [checkingAccess, setCheckingAccess] = useState(false);

  const handleDocumentLinkClick = useCallback(
    async (e: Event) => {
      const { documentId, spaceId, title } = (e as CustomEvent).detail;
      if (!documentId || checkingAccess) return;

      // Not logged in
      if (!user) {
        setLinkDialog({ open: true, title, documentId, spaceId, status: 'no-login' });
        return;
      }

      // Logged in — check access, navigate directly if ok
      setCheckingAccess(true);
      try {
        await apiRequest(`/documents/${documentId}/exists`, { method: 'HEAD' });
        // Has access — open directly, no dialog needed
        window.open(
          `/spaces/${spaceId}/documents/${documentId}?readonly=true`,
          '_blank',
          'noopener,noreferrer',
        );
      } catch {
        setLinkDialog({ open: true, title, documentId, spaceId, status: 'no-access' });
      } finally {
        setCheckingAccess(false);
      }
    },
    [user, checkingAccess],
  );

  useEffect(() => {
    window.addEventListener('document-link-click', handleDocumentLinkClick);
    return () => window.removeEventListener('document-link-click', handleDocumentLinkClick);
  }, [handleDocumentLinkClick]);

  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchShareInfo() {
      try {
        setLoading(true);
        const data: any = await api.get(`/share/${token}`);
        setShareInfo(data);

        // PUBLIC shares include content directly — no second API call needed
        if (data.type === 'PUBLIC' && data.document) {
          setDocMeta({
            title: data.document.title,
            content: data.document.content,
            createdAt: data.document.createdAt,
            updatedAt: data.document.updatedAt,
            creator: data.document.creator ?? null,
          });
        }

        const pwd = searchParams.get('pwd');
        if (pwd && data.type === 'PASSWORD') {
          setPassword(pwd);
        }
      } catch (err: any) {
        setError(err.message || '链接无效或已过期');
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchShareInfo();
  }, [token, searchParams]);

  /** Fetch content for PASSWORD shares after verification */
  const fetchContent = async (verifiedToken: string) => {
    try {
      setContentLoading(true);
      const res: any = await api.get(`/share/${token}/content`, {
        headers: { Authorization: `Bearer ${verifiedToken}` },
      });
      setDocMeta({
        title: res.title,
        content: res.content,
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
        creator: res.creator ?? null,
      });
    } catch {
      toast.error('无法加载文档内容');
    } finally {
      setContentLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      setVerifying(true);
      const res: any = await api.post(`/share/${token}/verify`, { password });
      setVerified(true);
      await fetchContent(res.accessToken);
    } catch {
      toast.error('密码错误');
    } finally {
      setVerifying(false);
    }
  };

  // ─── Loading ───
  if (loading || contentLoading) {
    return <LoadingSkeleton />;
  }

  // ─── Error ───
  if (error) {
    return <ErrorState message={error} />;
  }

  // ─── Password gate ───
  if (shareInfo?.type === 'PASSWORD' && !verified) {
    return (
      <PasswordGate
        title={shareInfo.documentTitle}
        password={password}
        setPassword={setPassword}
        verifying={verifying}
        onSubmit={handlePasswordSubmit}
      />
    );
  }

  // ─── Content not loaded yet ───
  if (!docMeta) {
    return <LoadingSkeleton />;
  }

  // ─── Document View ───
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <ShareHeader title={docMeta.title} />
      <main className="editor-container" style={{ height: 'calc(100vh - 57px)' }}>
        <SimpleEditor
          content={docMeta.content}
          editable={false}
          footer={<DocMetaFooter meta={docMeta} />}
        />
      </main>

      {/* ─── Document Link Access Dialog ─── */}
      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="truncate">{linkDialog.title}</span>
            </DialogTitle>
            <DialogDescription>
              {linkDialog.status === 'no-login' && '你需要登录后才能查看此文档'}
              {linkDialog.status === 'no-access' && '你没有权限访问此文档，请联系文档所有者获取权限'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            {linkDialog.status === 'no-login' && (
              <Button
                onClick={() => {
                  const returnUrl = encodeURIComponent(window.location.href);
                  window.location.href = `/auth/login?returnTo=${returnUrl}`;
                }}
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                去登录
              </Button>
            )}

            {linkDialog.status === 'no-access' && (
              <Button
                onClick={() => setLinkDialog((prev) => ({ ...prev, open: false }))}
              >
                知道了
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
