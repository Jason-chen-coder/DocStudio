'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { documentService } from '@/services/document-service';
import { spaceService } from '@/services/space-service';
import {
  Lock,
  Unlock,
  Shield,
  UserPlus,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { getCdnUrl } from '@/lib/cdn';
import { FadeIn } from '@/components/ui/fade-in';

interface DocPermission {
  id: string;
  userId: string;
  permission: 'EDITOR' | 'VIEWER';
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

interface SpaceMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

interface DocumentPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  spaceId: string;
  isRestricted: boolean;
  onRestrictedChange: (isRestricted: boolean) => void;
}

export function DocumentPermissionDialog({
  open,
  onOpenChange,
  documentId,
  spaceId,
  isRestricted,
  onRestrictedChange,
}: DocumentPermissionDialogProps) {
  const [permissions, setPermissions] = useState<DocPermission[]>([]);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [perms, spaceMembers] = await Promise.all([
        documentService.getDocumentPermissions(documentId),
        spaceService.getMembers(spaceId),
      ]);
      setPermissions(perms);
      setMembers(spaceMembers);
    } catch {
      toast.error('加载权限信息失败');
    } finally {
      setLoading(false);
    }
  }, [open, documentId, spaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRestricted = async () => {
    setToggling(true);
    try {
      const result = await documentService.setRestricted(documentId, !isRestricted);
      onRestrictedChange(result.isRestricted);
      toast.success(result.isRestricted ? '已启用文档级权限' : '已恢复继承空间权限');
    } catch {
      toast.error('操作失败');
    } finally {
      setToggling(false);
    }
  };

  const handleSetPermission = async (userId: string, permission: 'EDITOR' | 'VIEWER') => {
    try {
      await documentService.setDocumentPermission(documentId, userId, permission);
      await loadData();
      toast.success('权限已更新');
    } catch {
      toast.error('更新失败');
    }
  };

  const handleAddUser = async (userId: string) => {
    setAddingUser(userId);
    try {
      await documentService.setDocumentPermission(documentId, userId, 'EDITOR');
      await loadData();
      toast.success('已添加用户');
    } catch {
      toast.error('添加失败');
    } finally {
      setAddingUser(null);
    }
  };

  const handleRemovePermission = async (userId: string) => {
    try {
      await documentService.removeDocumentPermission(documentId, userId);
      await loadData();
      toast.success('已移除权限');
    } catch {
      toast.error('移除失败');
    }
  };

  if (!open) return null;

  // 已有权限的用户 ID 集合
  const permittedUserIds = new Set(permissions.map((p) => p.userId));
  // 可添加的成员（排除 OWNER/ADMIN 和已有权限的）
  const addableMembers = members.filter(
    (m) => !permittedUserIds.has(m.userId) && m.role !== 'OWNER' && m.role !== 'ADMIN',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <FadeIn duration={0.2}>
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[480px] max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                文档权限管理
              </h3>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* 限制访问开关 */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                {isRestricted ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    限制访问
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRestricted
                      ? '仅指定用户可访问，OWNER/ADMIN 不受限'
                      : '所有空间成员均可按空间角色访问'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleRestricted}
                disabled={toggling}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  isRestricted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    isRestricted ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 权限列表（仅在启用限制后显示） */}
            {isRestricted && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* 已有权限的用户 */}
                    {permissions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          已授权用户
                        </p>
                        <div className="space-y-1">
                          {permissions.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                {perm.user.avatarUrl ? (
                                  <Image
                                    src={getCdnUrl(perm.user.avatarUrl) || ''}
                                    alt={perm.user.name}
                                    width={32}
                                    height={32}
                                    unoptimized
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  perm.user.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {perm.user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {perm.user.email}
                                </p>
                              </div>
                              <select
                                value={perm.permission}
                                onChange={(e) =>
                                  handleSetPermission(
                                    perm.userId,
                                    e.target.value as 'EDITOR' | 'VIEWER',
                                  )
                                }
                                className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer"
                              >
                                <option value="EDITOR">可编辑</option>
                                <option value="VIEWER">只读</option>
                              </select>
                              <button
                                onClick={() => handleRemovePermission(perm.userId)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-gray-400 hover:text-red-500 transition-colors"
                                title="移除权限"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 可添加的成员 */}
                    {addableMembers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          添加成员
                        </p>
                        <div className="space-y-1">
                          {addableMembers.map((member) => (
                            <div
                              key={member.userId}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                {member.avatarUrl ? (
                                  <Image
                                    src={getCdnUrl(member.avatarUrl) || ''}
                                    alt={member.name}
                                    width={32}
                                    height={32}
                                    unoptimized
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  member.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {member.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {member.email}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddUser(member.userId)}
                                disabled={addingUser === member.userId}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                              >
                                {addingUser === member.userId ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3 h-3" />
                                )}
                                添加
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {permissions.length === 0 && addableMembers.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        没有可管理的成员
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
