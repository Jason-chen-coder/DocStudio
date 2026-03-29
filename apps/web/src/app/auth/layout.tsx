'use client';

import Image from 'next/image';
import { useTheme } from '@/hooks/use-theme';
import { Sun, Moon } from '@icon-park/react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <div className="min-h-dvh flex bg-white dark:bg-[#0F0F13]">
      {/* Left — form area */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-dvh">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 sm:px-10 py-5">
          <a href="/" className="flex items-center gap-2.5">
            <Image
              src="/docStudio_icon.png"
              alt="DocStudio"
              width={30}
              height={30}
            />
            <span className="text-[0.9375rem] font-semibold text-gray-900 dark:text-white tracking-tight">
              DocStudio
            </span>
          </a>

          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? (
                <Moon theme="outline" size="16" fill="currentColor" className="text-gray-400" />
              ) : (
                <Sun theme="outline" size="16" fill="currentColor" className="text-gray-500" />
              )}
            </button>
          )}
        </header>

        {/* Form — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10">
          <div className="w-full max-w-[400px] auth-enter">
            {children}
          </div>
        </div>

        {/* Bottom — terms */}
        <footer className="px-6 sm:px-10 py-5 text-[0.75rem] text-gray-400 dark:text-gray-500">
          登录即表示你同意{' '}
          <a href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors">服务条款</a>
          {' '}和{' '}
          <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors">隐私政策</a>
        </footer>
      </div>

      {/* Right — brand area (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#333DFC]">
        {/* Geometric shapes — animated */}
        <div className="absolute inset-0">
          <div className="geo-circle absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-white/[0.08]" />
          <div className="geo-block absolute -top-10 -right-10 w-[300px] h-[300px] bg-[#5C63FF] rotate-12 rounded-3xl" />
          <div className="geo-square absolute top-1/3 right-1/4 w-[120px] h-[120px] bg-white/[0.06] rounded-2xl rotate-[-8deg]" />
          <div className="geo-line absolute bottom-1/4 left-1/4 w-[200px] h-[1px] bg-white/[0.12] rotate-[-30deg]" />
        </div>

        {/* Brand content */}
        <div className="relative z-10 flex flex-col items-start justify-center px-12 xl:px-16 brand-enter">
          <h2 className="text-[clamp(2.25rem,3.5vw,3rem)] font-extrabold text-white leading-[1.15] tracking-tight">
            与团队一起，<br />
            构建知识
          </h2>
          <p className="mt-4 text-[1rem] text-white/70 leading-relaxed max-w-[22rem]">
            实时协作编辑、版本管理、权限控制。为技术团队打造的下一代文档工具。
          </p>

          {/* Collaboration avatars */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/20 ring-2 ring-[#333DFC] flex items-center justify-center text-[11px] font-semibold text-white">J</div>
              <div className="w-8 h-8 rounded-full bg-emerald-400/80 ring-2 ring-[#333DFC] flex items-center justify-center text-[11px] font-semibold text-white">A</div>
              <div className="w-8 h-8 rounded-full bg-amber-400/80 ring-2 ring-[#333DFC] flex items-center justify-center text-[11px] font-semibold text-white">K</div>
            </div>
            <span className="text-[0.8125rem] text-white/60">
              <span className="text-white/90 font-medium">1,200+</span> 团队正在使用
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-enter {
          animation: authEnter 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .brand-enter {
          animation: brandEnter 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 100ms;
        }

        @keyframes authEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes brandEnter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .geo-circle {
          animation: driftCircle 22s ease-in-out infinite;
          will-change: transform;
        }
        .geo-block {
          animation: driftBlock 18s ease-in-out infinite;
          will-change: transform;
        }
        .geo-square {
          animation: driftSquare 15s ease-in-out infinite;
          will-change: transform;
        }
        .geo-line {
          animation: driftLine 20s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes driftCircle {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(50px, -30px) scale(1.05); }
          50%  { transform: translate(30px, -60px) scale(0.97); }
          75%  { transform: translate(-20px, -25px) scale(1.03); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes driftBlock {
          0%   { transform: rotate(12deg) translate(0, 0) scale(1); }
          30%  { transform: rotate(20deg) translate(-40px, 30px) scale(1.06); }
          60%  { transform: rotate(8deg) translate(-20px, 60px) scale(0.95); }
          100% { transform: rotate(12deg) translate(0, 0) scale(1); }
        }
        @keyframes driftSquare {
          0%   { transform: rotate(-8deg) translate(0, 0) scale(1); }
          35%  { transform: rotate(4deg) translate(35px, -40px) scale(1.1); }
          70%  { transform: rotate(-12deg) translate(-15px, -20px) scale(0.92); }
          100% { transform: rotate(-8deg) translate(0, 0) scale(1); }
        }
        @keyframes driftLine {
          0%   { transform: rotate(-30deg) scaleX(1); opacity: 0.12; }
          33%  { transform: rotate(-20deg) scaleX(1.6); opacity: 0.25; }
          66%  { transform: rotate(-35deg) scaleX(0.8); opacity: 0.08; }
          100% { transform: rotate(-30deg) scaleX(1); opacity: 0.12; }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-enter, .brand-enter { animation: none; opacity: 1; }
          .geo-circle, .geo-block, .geo-square, .geo-line { animation: none; }
        }
      `}</style>
    </div>
  );
}
