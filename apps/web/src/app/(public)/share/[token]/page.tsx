"use client"

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Lock, User, CalendarDays, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { getCdnUrl } from '@/lib/cdn';

interface ShareInfo {
  token: string;
  type: 'PUBLIC' | 'PASSWORD';
  documentTitle: string;
  expiresAt: string | null;
  hasPassword: boolean;
}

interface DocMeta {
  title: string;
  content: string;
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

/** 分享页底部文档元数据栏 */
function DocMetaFooter({ meta }: { meta: DocMeta }) {
  const avatarUrl = getCdnUrl(meta.creator?.avatarUrl);

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-8 pt-6 pb-10 px-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {/* 作者 */}
        <div className="flex items-center gap-2 min-w-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={meta.creator!.name}
              width={24}
              height={24}
              unoptimized
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-300" />
            </div>
          )}
          <span className="truncate">
            {meta.creator?.name ?? '匿名'}
          </span>
        </div>

        <span className="hidden sm:block text-gray-300 dark:text-gray-600">·</span>

        {/* 创建时间 */}
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          <span>创建于 {formatDate(meta.createdAt)}</span>
        </div>

        <span className="hidden sm:block text-gray-300 dark:text-gray-600">·</span>

        {/* 最近更新 */}
        <div className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
          <span>更新于 {formatDate(meta.updatedAt)}</span>
        </div>
      </div>
    </footer>
  );
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);

  const [docMeta, setDocMeta] = useState<DocMeta | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchShareInfo() {
      try {
        setLoading(true);
        const data = await api.get(`/share/${token}`);
        setShareInfo(data as any);

        const pwd = searchParams.get('pwd');
        if (pwd && (data as any).type === 'PASSWORD') {
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

  useEffect(() => {
    if (shareInfo && shareInfo.type === 'PUBLIC') {
      fetchContent();
    }
  }, [shareInfo]);

  const fetchContent = async (tokenOverride?: string) => {
    try {
      setContentLoading(true);
      const headers: any = {};
      if (tokenOverride || accessToken) {
        headers['Authorization'] = `Bearer ${tokenOverride || accessToken}`;
      }

      const res: any = await api.get(`/share/${token}/content`, { headers });
      setDocMeta({
        title: res.title,
        content: res.content,
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
        creator: res.creator ?? null,
      });
    } catch (err: any) {
      console.error(err);
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
      const newToken = res.accessToken;
      setAccessToken(newToken);
      await fetchContent(newToken);
    } catch (err: any) {
      console.error(err);
      toast.error('密码错误');
    } finally {
      setVerifying(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">无法访问文档</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // ─── Password gate ───
  if (shareInfo?.type === 'PASSWORD' && !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">请输入访问密码</h2>
            <p className="mt-2 text-sm text-gray-500">
              此文档受密码保护，请输入密码继续访问。
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={verifying || !password}>
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              验证并访问
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ─── 内容加载中 ───
  if (contentLoading || !docMeta) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ─── 正文 + 底部元数据 ───
  return (
    <div className="editor-container bg-white" style={{ height: '100vh' }}>
      <SimpleEditor
        content={docMeta.content}
        editable={false}
        footer={<DocMetaFooter meta={docMeta} />}
      />
    </div>
  );
}

