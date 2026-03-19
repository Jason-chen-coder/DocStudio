'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { spaceService } from '@/services/space-service';
import { Space } from '@/types/space';
import Link from 'next/link';
import { useDocuments } from '@/hooks/use-documents';
import CountUp from '@/components/ui/count-up';
import {
  FileText,
  Plus,
  Clock,
  Users,
  Settings,
  Activity,
  LayoutTemplate,
  Globe,
  Lock,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { TemplatePickerModal } from '@/components/template/template-picker-modal';
import { FadeIn } from '@/components/ui/fade-in';

// ────────────────────── helpers ──────────────────────

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  if (hr < 24) return `${hr} 小时前`;
  if (day < 30) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN');
}

// ────────────────────── page ──────────────────────

export default function SpaceDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const { documents, loading: docsLoading, createDocument } = useDocuments(id);

  useEffect(() => {
    async function loadSpace() {
      try {
        setSpaceLoading(true);
        const data = await spaceService.getSpace(id);
        setSpace(data);
      } catch (error) {
        console.error('Failed to load space', error);
      } finally {
        setSpaceLoading(false);
      }
    }
    if (user && id) loadSpace();
  }, [user, id]);

  const handleCreate = () => setShowTemplatePicker(true);

  const handleTemplateSelect = async (data: { title: string; content: string }) => {
    try {
      const newDoc = await createDocument({ title: data.title, content: data.content, spaceId: id });
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${id}/documents/${newDoc.id}`);
    } catch { /* toast in hook */ }
  };

  const handleSkipTemplate = async () => {
    try {
      const newDoc = await createDocument({ title: '无标题文档', spaceId: id });
      window.dispatchEvent(new Event('document-updated'));
      router.push(`/spaces/${id}/documents/${newDoc.id}`);
    } catch { /* toast in hook */ }
  };

  // ─── loading skeleton ───
  if (spaceLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 px-12 py-14">
          <div className="h-9 w-56 bg-white/60 dark:bg-gray-700 rounded-lg mb-3" />
          <div className="h-5 w-80 bg-white/40 dark:bg-gray-700 rounded mb-8" />
          <div className="flex gap-3">
            <div className="h-11 w-32 bg-white/50 dark:bg-gray-700 rounded-xl" />
            <div className="h-11 w-28 bg-white/50 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-7">
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <FolderOpen className="w-14 h-14 mb-4 opacity-40" />
        <p className="text-base">空间不存在或无权访问</p>
      </div>
    );
  }

  const isAdmin = space.myRole === 'OWNER' || space.myRole === 'ADMIN';
  const hasDocuments = documents.length > 0;
  const docCount = space._count?.documents ?? documents.length;
  const memberCount = space._count?.permissions ?? 0;

  return (
    <div className="space-y-8">

      {/* ═══════ Hero Banner ═══════ */}
      <FadeIn delay={0} y={30}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border border-blue-100/80 dark:border-gray-700 px-12 py-12">
        {/* decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-200/30 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-violet-200/20 dark:bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-indigo-200/20 dark:bg-indigo-500/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Tags row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full">
              {space.isPublic
                ? <><Globe className="w-3.5 h-3.5" /> 公开空间</>
                : <><Lock className="w-3.5 h-3.5" /> 私有空间</>
              }
            </span>
            {space.myRole && (
              <span className="text-[13px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1.5 rounded-full">
                {space.myRole === 'OWNER' ? '所有者' : space.myRole === 'ADMIN' ? '管理员' : space.myRole === 'EDITOR' ? '编辑者' : '查看者'}
              </span>
            )}
          </div>

          {/* Title + description */}
          <h1 className="text-3xl font-bold mt-4 tracking-tight text-gray-900 dark:text-white">
            {space.name}
          </h1>
          {space.description && (
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400 max-w-lg">
              {space.description}
            </p>
          )}

          {/* Bottom row: stats + actions */}
          <div className="flex items-end justify-between mt-10">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { value: docCount, label: '文档', icon: FileText, loading: docsLoading, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { value: memberCount, label: '成员', icon: Users, loading: false, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${s.color.split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color.split(' ').slice(2).join(' ')}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold leading-none text-gray-900 dark:text-white">
                      {s.loading ? (
                        <span className="tabular-nums text-gray-300 dark:text-gray-600">–</span>
                      ) : (
                        <CountUp from={0} to={s.value} duration={2} direction="up" />
                      )}
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新建文档
              </button>
              {isAdmin && (
                <Link
                  href={`/spaces/${space.id}/settings`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  设置
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* ═══════ Quick Nav Cards ═══════ */}
      <FadeIn delay={0.15} y={30}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <QuickAction
          icon={<Activity className="w-5 h-5" />}
          label="活动日志"
          desc="查看空间操作记录"
          href={`/spaces/${space.id}/activity`}
          color="blue"
        />
        {isAdmin && (
          <QuickAction
            icon={<Users className="w-5 h-5" />}
            label="成员管理"
            desc="管理空间成员权限"
            href={`/spaces/${space.id}/members`}
            color="violet"
          />
        )}
        {isAdmin && (
          <QuickAction
            icon={<LayoutTemplate className="w-5 h-5" />}
            label="模板管理"
            desc="管理文档模板"
            href={`/spaces/${space.id}/templates`}
            color="amber"
          />
        )}
        {isAdmin ? (
          <QuickAction
            icon={<Settings className="w-5 h-5" />}
            label="空间设置"
            desc="空间名称与配置"
            href={`/spaces/${space.id}/settings`}
            color="emerald"
          />
        ) : (
          <QuickAction
            icon={<Users className="w-5 h-5" />}
            label="查看成员"
            desc="查看空间成员列表"
            href={`/spaces/${space.id}/members`}
            color="violet"
          />
        )}
      </div>
      </FadeIn>

      {/* ═══════ Documents ═══════ */}
      <FadeIn delay={0.3} y={30}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-7">
        {docsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !hasDocuments ? (
          /* ─── Empty State ─── */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              开始创建你的第一篇文档
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs text-center">
              从模板快速开始，或创建空白文档自由书写
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新建文档
            </button>
          </div>
        ) : (
          /* ─── Document Grid ─── */
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    最近文档
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    共 {docCount} 篇文档
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新建
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.slice(0, 9).map(doc => (
                <Link
                  key={doc.id}
                  href={`/spaces/${space.id}/documents/${doc.id}`}
                  className="group flex items-start gap-3 p-5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {doc.title || '无标题文档'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        {timeAgo(doc.updatedAt)}
                      </span>
                      {doc.creator && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {doc.creator.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 mt-3 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </div>

            {documents.length > 9 && (
              <div className="mt-5 text-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  以及其他 {documents.length - 9} 篇文档，可在左侧文档树查看
                </span>
              </div>
            )}
          </>
        )}
      </div>
      </FadeIn>

      {/* ═══════ Template Picker ═══════ */}
      <TemplatePickerModal
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        spaceId={id}
        onSelect={handleTemplateSelect}
        onSkip={handleSkipTemplate}
      />
    </div>
  );
}

// ────────────────────── sub-components ──────────────────────

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    icon: 'text-violet-600 dark:text-violet-400',
    hover: 'group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    hover: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    hover: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30',
  },
} as const;

function QuickAction({
  icon,
  label,
  desc,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  href: string;
  color: keyof typeof COLOR_MAP;
}) {
  const c = COLOR_MAP[color];
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-2xl p-5 flex flex-col gap-3 transition-all cursor-pointer hover:shadow-sm"
    >
      <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.hover} flex items-center justify-center flex-shrink-0 transition-colors`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
          {label}
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
