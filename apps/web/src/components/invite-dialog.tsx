'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useState } from 'react';
import { Role } from '@/types/space';
import { spaceService } from '@/services/space-service';

interface InviteDialogProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteDialog({ spaceId, isOpen, onClose }: InviteDialogProps) {
  const [role, setRole] = useState<Role>('VIEWER');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [message, setMessage] = useState<{ open: boolean; title: string; content: string }>({
    open: false,
    title: '',
    content: ''
  });

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInviteLink('');
    
    try {
      const result = await spaceService.inviteMember(spaceId, { 
          role, 
          email: email.trim() || undefined 
      });
      
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
      
    } catch {

      setMessage({
        open: true,
        title: '错误',
        content: '创建邀请失败'
      });
    } finally {
      setLoading(false);
    }
  }
  
  // Wait, I strictly defined Promise<void> in service. I need to fix that.

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">邀请成员</h2>
        
        {!inviteLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                角色
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="VIEWER">访问者</option>
                <option value="EDITOR">编辑者</option>
                <option value="ADMIN">管理员</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱 (可选)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="限制特定邮箱..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '生成中...' : '生成链接'}
              </button>
            </div>
          </form>
        ) : (
             <div className="space-y-4">
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                     分享此链接邀请他人加入工作空间。
                 </p>
                 <div className="flex gap-2">
                     <input 
                        readOnly 
                        value={inviteLink}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-900 text-sm"
                     />
                     <button
                        onClick={() => {
                            navigator.clipboard.writeText(inviteLink);
                            setMessage({
                                open: true,
                                title: '提示',
                                content: '已复制!'
                            });
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium"
                     >
                         复制
                     </button>
                 </div>
                 <div className="flex justify-end pt-2">
                     <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                     >
                         完成
                     </button>
                 </div>
             </div>
        )}
      </div>

      <AlertDialog open={message.open} onOpenChange={(open) => !open && setMessage(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{message.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {message.content}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMessage(prev => ({ ...prev, open: false }))}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
