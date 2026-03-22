'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  adminAPI,
  AdminUserItem,
  AdminSpaceItem,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { Search, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, KeyRound, Ban, CheckCircle, Trash2, AlertTriangle, ShieldCheck, CircleSlash, CircleDot } from 'lucide-react';
import { getCdnUrl } from '@/lib/cdn';
import { FadeIn } from '@/components/ui/fade-in';

// ─── 修改密码弹窗 ─────────────────────────────────────────────────────────────
function ChangePasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mismatch = confirm.length > 0 && pw !== confirm;

  async function handleSubmit() {
    if (pw.length < 8) { setError('密码至少需要 8 位'); return; }
    if (mismatch) return;
    setLoading(true);
    setError('');
    try {
      await adminAPI.updatePassword(user.id, pw);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">修改用户密码</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">用户：{user.name}（{user.email}）</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">新密码 <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              placeholder="至少 8 位"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">确认新密码 <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 outline-none transition-colors ${mismatch ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
              placeholder="再次输入新密码"
            />
            {mismatch && <p className="text-xs text-red-500 mt-1.5">两次密码不一致</p>}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">管理员直接设置，无需原密码</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
          <button
            onClick={handleSubmit}
            disabled={loading || mismatch || pw.length < 8}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '修改中...' : '确认修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 禁用确认弹窗 ─────────────────────────────────────────────────────────────
function DisableModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await adminAPI.updateStatus(user.id, !user.isDisabled);
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{user.isDisabled ? '启用账号' : '禁用账号'}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          确定要{user.isDisabled ? '启用' : '禁用'}用户「{user.name}」的账号吗？
          {!user.isDisabled && '禁用后该用户将无法登录。'}
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-40 transition-colors ${user.isDisabled ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            {loading ? '操作中...' : (user.isDisabled ? '确认启用' : '确认禁用')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 删除确认弹窗 ─────────────────────────────────────────────────────────────
function DeleteModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const confirmed = inputName === user.name;

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    setError('');
    try {
      await adminAPI.deleteUser(user.id);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || '删除失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400">危险操作：删除用户</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">此操作将永久删除用户「{user.name}」及其所有数据，包括：</p>
        <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc pl-5 mb-4">
          <li>所属工作空间（共 {user.spaceCount} 个）</li>
          <li>创建的文档（共 {user.documentCount} 篇）</li>
        </ul>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            请输入用户名以确认：<span className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</span>
          </label>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
            placeholder={`输入"${user.name}"确认`}
          />
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">取消</button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '删除中...' : '永久删除'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 操作菜单 ─────────────────────────────────────────────────────────────────
type ModalType = 'password' | 'disable' | 'delete' | null;

function ActionMenu({
  user,
  currentUserId,
  onAction,
}: {
  user: AdminUserItem;
  currentUserId: string;
  onAction: (type: ModalType) => void;
}) {
  const [open, setOpen] = useState(false);
  const isProtected = user.isSuperAdmin || user.id === currentUserId;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-20 text-sm">
            <button
              onClick={() => { onAction('password'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-left transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> 修改密码
            </button>
            {isProtected ? (
              <div className="px-3 py-2 text-gray-300 dark:text-gray-600 cursor-not-allowed flex items-center gap-2" title={user.isSuperAdmin ? '不能操作超级管理员' : '不能操作自己'}>
                <Ban className="w-3.5 h-3.5" />
                <span>{user.isDisabled ? '启用账号' : '禁用账号'}</span>
              </div>
            ) : (
              <button
                onClick={() => { onAction('disable'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors"
              >
                {user.isDisabled ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Ban className="w-3.5 h-3.5 text-orange-500" />}
                <span className="text-gray-700 dark:text-gray-300">{user.isDisabled ? '启用账号' : '禁用账号'}</span>
              </button>
            )}
            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
            {isProtected ? (
              <div className="px-3 py-2 text-gray-300 dark:text-gray-600 cursor-not-allowed flex items-center gap-2" title={user.isSuperAdmin ? '不能操作超级管理员' : '不能删除自己'}>
                <Trash2 className="w-3.5 h-3.5" /> 删除用户
              </div>
            ) : (
              <button
                onClick={() => { onAction('delete'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 text-left text-red-500 dark:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> 删除用户
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 状态徽章 ─────────────────────────────────────────────────────────────────
function StatusBadge({ user }: { user: AdminUserItem }) {
  if (user.isSuperAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium">
        <ShieldCheck className="w-3 h-3" /> 超管
      </span>
    );
  }
  if (user.isDisabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
        <CircleSlash className="w-3 h-3" /> 禁用
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium">
      <CircleDot className="w-3 h-3" /> 正常
    </span>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [spaces, setSpaces] = useState<AdminSpaceItem[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  // 弹窗状态
  const [modalUser, setModalUser] = useState<AdminUserItem | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const [limit, setLimit] = useState(10);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // 防抖搜索
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }

  // 加载空间列表（用于筛选下拉）
  useEffect(() => {
    adminAPI.getSpaces().then(setSpaces).catch(console.error);
  }, []);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        page,
        limit,
        search: search || undefined,
        spaceId: selectedSpaceId || undefined,
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedSpaceId, limit]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // 搜索/筛选变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [search, selectedSpaceId]);

  function openModal(user: AdminUserItem, type: ModalType) {
    setModalUser(user);
    setModalType(type);
  }

  function closeModal() {
    setModalUser(null);
    setModalType(null);
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* 页头 */}
      <FadeIn y={16} duration={0.4}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">用户管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">共 {total} 位用户</p>
        </div>
      </FadeIn>

      {/* 搜索 + 筛选 */}
      <FadeIn delay={0.1} y={16} duration={0.4}>
      <div className="flex items-center gap-3 mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索用户名或邮箱..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="relative inline-flex items-center">
          <select
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="appearance-none border border-gray-300 dark:border-gray-600 rounded-md pl-3 pr-8 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
          >
            <option value="">全部空间</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.memberCount} 人）
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
      </FadeIn>

      {/* 用户表格 */}
      <FadeIn delay={0.2} y={16} duration={0.4}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1 min-h-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">邮箱</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">空间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">文档</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">加入时间</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 dark:bg-gray-700 rounded ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 dark:bg-gray-700 rounded ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-14 bg-gray-100 dark:bg-gray-700 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500">暂无用户</td></tr>
              ) : users.map((u) => {
                const avatarUrl = getCdnUrl(u.avatarUrl);
                return (
                  <tr key={u.id} className="border-t border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt={u.name} width={32} height={32} unoptimized className="rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-xs flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">{u.spaceCount}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 tabular-nums">{u.documentCount}</td>
                    <td className="px-4 py-3"><StatusBadge user={u} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        user={u}
                        currentUserId={currentUser?.id ?? ''}
                        onAction={(type) => openModal(u, type)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </FadeIn>

      {/* 分页 */}
      <FadeIn delay={0.3} y={12} duration={0.4}>
      <div className="flex items-center justify-between mt-4 pt-2 text-sm text-gray-500 dark:text-gray-400 shrink-0">
        <div className="flex items-center gap-3">
          <label className="whitespace-nowrap">每页</label>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          >
            {[5, 10, 30, 50].map((n) => (
              <option key={n} value={n}>{n} 条</option>
            ))}
          </select>
          <span className="tabular-nums">{page} / {totalPages} 页，共 {total} 条</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> 上一页
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            下一页 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      </FadeIn>

      {/* 弹窗 */}
      {modalUser && modalType === 'password' && (
        <ChangePasswordModal user={modalUser} onClose={closeModal} onSuccess={loadUsers} />
      )}
      {modalUser && modalType === 'disable' && (
        <DisableModal user={modalUser} onClose={closeModal} onSuccess={loadUsers} />
      )}
      {modalUser && modalType === 'delete' && (
        <DeleteModal user={modalUser} onClose={closeModal} onSuccess={loadUsers} />
      )}
    </div>
  );
}
