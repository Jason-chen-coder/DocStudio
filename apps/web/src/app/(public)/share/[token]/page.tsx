"use client"

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

interface ShareInfo {
  token: string;
  type: 'PUBLIC' | 'PASSWORD';
  documentTitle: string;
  expiresAt: string | null;
  hasPassword: boolean;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  
  // Content state
  const [content, setContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  
  // Password state
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchShareInfo() {
      try {
        console.log('Fetching share info for token:', token);
        setLoading(true);
        // This endpoint returns public info about the share link
        const data = await api.get(`/share/${token}`); 
        console.log('Share info received:', data);
        // Adapting to axios/fetch wrapper return type, assuming data is returned directly or in data property
        // Based on previous api.ts, it returns json directly.
        setShareInfo(data as any); 
        
        // Auto-fill password if present in URL
        const pwd = searchParams.get('pwd');
        if (pwd && data.type === 'PASSWORD') {
            setPassword(pwd);
        }
      } catch (err: any) {
        console.error('Error fetching share info:', err);
        setError(err.message || '链接无效或已过期');
      } finally {
        setLoading(false);
      }
    }
    
    if (token) {
      fetchShareInfo();
    }
  }, [token, searchParams]);

  useEffect(() => {
     if (shareInfo && shareInfo.type === 'PUBLIC') {
        console.log('Public share, fetching content...');
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
          setContent(res.content);
      } catch (err: any) {
          console.error(err);
          toast.error('无法加载文档内容');
          if (err.message.includes('Password required')) {
              // Should not happen if flow is correct
          }
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

  if (loading) {
     return (
         <div className="flex h-screen items-center justify-center bg-gray-50">
             <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
         </div>
     );
  }

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
                      <div>
                          <Input
                              type="password"
                              placeholder="输入密码"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full"
                              autoFocus
                          />
                      </div>
                      <Button type="submit" className="w-full" disabled={verifying || !password}>
                          {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          验证并访问
                      </Button>
                  </form>
              </div>
          </div>
      );
  }

  // Content View
  return (
      <div className="editor-container min-h-screen bg-white " style={{ height: '100vh' }}>
           <SimpleEditor 
              content={content} 
              editable={false} // Should be read-only for visitors
           />
      </div>
  );
}
