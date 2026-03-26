'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
      <div className="text-center px-6">
        <h1 className="text-8xl font-extrabold text-red-500 tracking-tight">
          500
        </h1>
        <p className="mt-4 text-2xl font-semibold text-[var(--color-foreground)]">
          出了点问题
        </p>
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          应用发生了意外错误，请稍后重试
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            重试
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            回到首页
          </a>
        </div>
      </div>
    </div>
  );
}
