import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
      <div className="text-center px-6">
        <h1 className="text-8xl font-extrabold text-[var(--color-primary)] tracking-tight">
          404
        </h1>
        <p className="mt-4 text-2xl font-semibold text-[var(--color-foreground)]">
          页面不存在
        </p>
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          你访问的页面可能已被删除或地址有误
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            返回工作台
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
