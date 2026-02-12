'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Role, Space, SpaceMember } from '@/types/space';
import { InviteDialog } from '@/components/invite-dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmState =
  | { type: 'CHANGE_ROLE'; userId: string; newRole: Role; currentRole: Role }
  | { type: 'REMOVE_MEMBER'; userId: string; memberName: string }
  | null;

export default function MembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && id) {
      loadData();
    }
  }, [user, authLoading, id, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [spaceData, membersData] = await Promise.all([
        spaceService.getSpace(id),
        spaceService.getMembers(id),
      ]);
      setSpace(spaceData);
      setMembers(membersData);
    } catch {
      console.error('Failed to load members');
      // alert('Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  const canManage = space?.myRole === 'OWNER' || space?.myRole === 'ADMIN';

  function handleRoleChange(userId: string, newRole: Role) {
    const member = members.find(m => m.userId === userId);
    if (!member) return;
    setConfirmState({
      type: 'CHANGE_ROLE',
      userId,
      newRole,
      currentRole: member.role,
    });
  }

  function handleRemove(userId: string) {
    const member = members.find(m => m.userId === userId);
    if (!member) return;
    setConfirmState({
      type: 'REMOVE_MEMBER',
      userId,
      memberName: member.name,
    });
  }

  async function executeConfirm() {
    if (!confirmState) return;

    try {
      if (confirmState.type === 'CHANGE_ROLE') {
        const { userId, newRole } = confirmState;
        await spaceService.updateMemberRole(id, userId, newRole);
        setMembers(members.map(m => m.userId === userId ? { ...m, role: newRole } : m));
      } else if (confirmState.type === 'REMOVE_MEMBER') {
        const { userId } = confirmState;
        await spaceService.removeMember(id, userId);
        setMembers(members.filter(m => m.userId !== userId));
      }
    } catch {
      setError('操作失败');
    } finally {
      setConfirmState(null);
    }
  }

  if (loading || !space) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
           <button onClick={() => router.push(`/spaces/${id}`)} className="text-sm text-gray-500 hover:text-gray-900 mb-2">
               ← 返回工作空间
           </button>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">成员管理</h1>
           <p className="text-gray-500 text-sm">管理此工作空间的成员权限。</p>
        </div>
        {canManage && (
            <button
                onClick={() => setInviteOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                邀请成员
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                姓名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                邮箱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <tr key={member.userId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      {member.name}
                      {member.userId === space.ownerId && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">拥有者</span>}
                      {member.userId === user?.id && <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">你</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {member.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {canManage && member.userId !== space.ownerId && member.userId !== user?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                        className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                      >
                          <option value="VIEWER">访问者</option>
                          <option value="EDITOR">编辑者</option>
                          <option value="ADMIN">管理员</option>
                      </select>
                  ) : (
                      <span className="capitalize">{member.role.toLowerCase()}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canManage && member.userId !== space.ownerId && member.userId !== user?.id && (
                    <button
                      onClick={() => handleRemove(member.userId)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                    >
                      移除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteDialog
        spaceId={id}
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

      <AlertDialog open={!!confirmState} onOpenChange={(open) => !open && setConfirmState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState?.type === 'CHANGE_ROLE' ? '修改成员角色' : '移除成员'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState?.type === 'CHANGE_ROLE'
                ? `确定要将此成员的角色更改为 ${confirmState.newRole} 吗？`
                : `确定要移除成员 ${confirmState?.type === 'REMOVE_MEMBER' ? confirmState.memberName : ''} 吗？此操作无法撤销。`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirm} className={confirmState?.type === 'REMOVE_MEMBER' ? 'bg-red-600 hover:bg-red-700' : ''}>
              {confirmState?.type === 'REMOVE_MEMBER' ? '确认移除' : '确认修改'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
