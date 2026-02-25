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
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-br from-[#333DFC]/5 via-[#333DFC]/10 to-[#333DFC]/20'}`}>
      {/* Left Side - Form Area */}
      <div className="w-full  flex flex-col bg-white dark:bg-gray-900 lg:rounded-r-[3rem]">
        {/* Header with Logo and Theme Toggle */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/docStudio_icon.png"
              alt="DocStudio"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              DocStudio
            </span>
          </div>
          
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? (
                <Moon theme="outline" size="20" fill="currentColor" className="text-gray-600" />
              ) : (
                <Sun theme="outline" size="20" fill="currentColor" className="text-yellow-400" />
              )}
            </button>
          )}
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>
      </div>

      {/* Right Side - Brand Area (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[100%] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#333DFC]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#333DFC]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/50 to-transparent rounded-full blur-3xl" />
        
        {/* Floating Elements */}
        <div className="floating-el floating-el-a absolute top-20 left-20 w-20 h-20 bg-white/40 rounded-3xl rotate-12 blur-sm" />
        <div className="floating-el floating-el-b absolute bottom-32 right-24 w-16 h-16 bg-[#333DFC]/20 rounded-2xl -rotate-12" />
        <div className="floating-el floating-el-c absolute top-1/3 right-16 w-12 h-12 bg-white/30 rounded-full" />

        {/* Brand Content */}
        <div className="relative z-10 text-center max-w-md animate-fade-in">
          {/* Illustration */}
          <div className="mb-10 flex justify-center">
            <div className="relative">
              {/* Main Circle */}
              <div className="w-56 h-56 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#333DFC] to-[#5C63FF] rounded-full shadow-2xl shadow-[#333DFC]/30" />
                
                {/* Floating Elements */}
                <div className="icon-floating icon-floating-a absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl rotate-12 shadow-lg shadow-emerald-500/30" />
                <div className="icon-floating icon-floating-b absolute -bottom-2 -left-8 w-24 h-24 bg-gradient-to-br from-violet-400 to-purple-500 rounded-[2rem] -rotate-6 shadow-lg shadow-purple-500/30" />
                <div className="icon-floating icon-floating-c absolute top-1/2 -right-10 w-14 h-14 bg-gradient-to-br from-sky-300 to-blue-400 rounded-full shadow-md shadow-blue-400/30" />
                
                {/* App Icon Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/docStudio_icon.png"
                    alt="DocStudio App Icon"
                    width={96}
                    height={96}
                    className="rounded-full shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 tracking-tight">
            实时协作，高效创作
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            下一代知识管理与团队协作平台
          </p>
          
          {/* Feature Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
              🚀 实时同步
            </span>
            <span className="px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
              🔒 安全可靠
            </span>
            <span className="px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
              ⚡ 极速体验
            </span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .floating-el {
          will-change: transform;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .floating-el-a {
          animation-name: floatA;
          animation-duration: 5.8s;
        }

        .floating-el-b {
          animation-name: floatB;
          animation-duration: 6.6s;
        }

        .floating-el-c {
          animation-name: floatC;
          animation-duration: 5.2s;
        }

        .icon-floating {
          will-change: transform;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .icon-floating-a {
          animation-name: iconFloatA;
          animation-duration: 3.8s;
        }

        .icon-floating-b {
          animation-name: iconFloatB;
          animation-duration: 4.6s;
        }

        .icon-floating-c {
          animation-name: iconFloatC;
          animation-duration: 3.4s;
        }

        @keyframes floatA {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(12deg);
          }
          50% {
            transform: translate3d(0, -8px, 0) rotate(9deg);
          }
        }

        @keyframes floatB {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(-12deg);
          }
          50% {
            transform: translate3d(0, 9px, 0) rotate(-8deg);
          }
        }

        @keyframes floatC {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -7px, 0);
          }
        }

        @keyframes iconFloatA {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(12deg) scale(1);
          }
          50% {
            transform: translate3d(6px, -14px, 0) rotate(20deg) scale(1.05);
          }
        }

        @keyframes iconFloatB {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(-6deg) scale(1);
          }
          50% {
            transform: translate3d(-8px, 12px, 0) rotate(-14deg) scale(1.06);
          }
        }

        @keyframes iconFloatC {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(10px, -10px, 0) scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}
