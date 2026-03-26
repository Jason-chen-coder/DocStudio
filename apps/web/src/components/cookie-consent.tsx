'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // 延迟显示，避免影响首屏加载
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          我们使用 Cookie 来提升你的使用体验。继续使用本站即表示你同意我们的{' '}
          <Link href="/privacy" className="text-[#333DFC] hover:underline">
            隐私政策
          </Link>
          。
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={accept}
            className="flex-1 rounded-lg bg-[#333DFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#2930D9] transition-colors"
          >
            接受
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            仅必要
          </button>
        </div>
      </div>
    </div>
  );
}
