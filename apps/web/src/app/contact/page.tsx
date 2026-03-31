'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicHeader } from '@/components/layout/public-header';
import { Github, MessageCircle, BookOpen, Pen, ArrowUpRight, QrCode } from 'lucide-react';

const PLATFORMS = [
  {
    icon: Github,
    label: 'GitHub',
    handle: 'Jason-chen-coder',
    href: 'https://github.com/Jason-chen-coder',
    desc: '开源项目 & 代码',
    color: '#24292f',
  },
  {
    icon: Pen,
    label: '掘金',
    handle: 'Jason Chen',
    href: 'https://juejin.cn/user/2084329779363928',
    desc: '技术文章 & 分享',
    color: '#1E80FF',
  },
  {
    icon: BookOpen,
    label: 'CSDN',
    handle: 'weixin_39085822',
    href: 'https://blog.csdn.net/weixin_39085822',
    desc: '博客 & 技术笔记',
    color: '#FC5531',
  },
];

const TAGS = ['TypeScript', 'Vue', 'React', 'Flutter', 'Node.js', 'Open Source'];
const WECHAT_COLOR = '#07C160';
const easeExpo = [0.16, 1, 0.3, 1] as const;

function TypewriterText({
  text,
  typingSpeed = 55,
  pauseDuration = 1200,
  deletingSpeed = 30,
  cursorCharacter = '_',
}: {
  text: string;
  typingSpeed?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  cursorCharacter?: string;
}) {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting' | 'done'>('typing');

  useEffect(() => {
    if (phase === 'typing') {
      if (displayed.length < text.length) {
        const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), typingSpeed);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('pausing'), pauseDuration);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'pausing') {
      setPhase('deleting');
    }
    if (phase === 'deleting') {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), deletingSpeed);
        return () => clearTimeout(t);
      } else {
        setPhase('typing');
      }
    }
  }, [displayed, phase, text, typingSpeed, pauseDuration, deletingSpeed]);

  return (
    <span>
      {displayed}
      <span className="typewriter-cursor">{cursorCharacter}</span>
    </span>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeExpo } },
};

function WeChatCard() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  return (
    <div ref={ref} className="relative h-full">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        className="w-full h-full flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-200/80 dark:border-white/[0.07] hover:border-[#07C160]/30 hover:scale-[1.02] hover:shadow-md dark:hover:shadow-black/40 active:scale-[0.98] transition-all duration-200 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        style={{ background: `${WECHAT_COLOR}08` }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${WECHAT_COLOR}18` }}
        >
          <MessageCircle className="w-6 h-6" style={{ color: WECHAT_COLOR }} />
        </div>
        <div className="text-center min-w-0 w-full">
          <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">微信</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">添加微信交流</p>
        </div>
        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
          <span className="text-[11px] font-mono truncate">chx561864073</span>
          <QrCode className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity duration-150" />
        </div>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.97, transition: { duration: 0.14 } }}
            transition={{ duration: 0.2, ease: easeExpo }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
          >
            <div className="bg-white dark:bg-[#1C1C20] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/50 border border-gray-200/80 dark:border-white/[0.08] p-3 flex flex-col items-center gap-2">
              <Image
                src="/we_chat.png"
                alt="微信二维码"
                width={960}
                height={960}
                className="rounded-xl w-[180px] max-w-[70vw] h-auto"
                unoptimized
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">扫码添加微信</p>
            </div>
            <div className="flex justify-center">
              <div className="w-2.5 h-2.5 bg-white dark:bg-[#1C1C20] border-r border-b border-gray-200/80 dark:border-white/[0.08] rotate-45 -mt-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen relative bg-[#FAFAF9] dark:bg-[#0D0D10] overflow-hidden">
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Warm top glow */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 pointer-events-none bg-gradient-to-b from-violet-100/40 dark:from-violet-900/[0.08] to-transparent"
      />

      <PublicHeader />

      <div className="relative min-h-screen px-4 pt-10 flex flex-col items-center justify-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-[360px] flex flex-col items-center"
        >
          {/* Profile */}
          <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
            {/* GitHub avatar */}
            <div className="relative mb-4">
              <div className="w-[84px] h-[84px] rounded-2xl overflow-hidden ring-[3px] ring-white dark:ring-[#0D0D10] shadow-lg shadow-black/10 dark:shadow-black/40">
                <Image
                  src="https://avatars.githubusercontent.com/Jason-chen-coder"
                  alt="Jason Chen"
                  width={84}
                  height={84}
                  className="w-full h-full object-cover"
                  unoptimized
                  priority
                />
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-[2.5px] border-[#FAFAF9] dark:border-[#0D0D10]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>

            {/* Greeting */}
            <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5 tracking-wide">
              Hi, I&apos;m
            </p>
            <h1 className="text-[22px] font-bold text-gray-900 dark:text-gray-50 tracking-tight leading-tight">
              Jason Chen
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
              Full-Stack Developer · DocStudio 作者
            </p>

            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium px-2 py-[3px] rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 border border-gray-200/70 dark:border-white/[0.07]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Slogan — typewriter effect */}
            <p className="mt-4 text-sm text-center text-gray-400 dark:text-gray-500 italic leading-relaxed min-h-[1.5em] w-full">
              <TypewriterText
                text="Code happily, embrace open source, and enjoy life."
                typingSpeed={55}
                pauseDuration={2000}
                deletingSpeed={28}
                cursorCharacter="_"
              />
            </p>
          </motion.div>

          {/* Platform cards — 2×2 grid */}
          <motion.div variants={fadeUp} className="w-full grid grid-cols-2 gap-3">
            {PLATFORMS.map(({ icon: Icon, label, handle, href, desc, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-200/80 dark:border-white/[0.07] hover:scale-[1.02] hover:shadow-md dark:hover:shadow-black/40 active:scale-[0.98] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                style={{ background: `${color}08` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}40`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-150">
                  <span className="text-[11px] font-mono truncate max-w-[100px]">{handle}</span>
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                </div>
              </a>
            ))}

            {/* WeChat card */}
            <WeChatCard />
          </motion.div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              © {new Date().getFullYear()} Jason Chen · Built with{' '}
              <Link
                href="/"
                className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-150"
              >
                DocStudio
              </Link>
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              遇到问题？查看{' '}
              <Link
                href="/help"
                className="text-violet-600 dark:text-violet-400 hover:underline underline-offset-2"
              >
                帮助
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .typewriter-cursor {
          display: inline-block;
          margin-left: 1px;
          animation: tw-blink 0.6s step-start infinite;
        }
        @keyframes tw-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .typewriter-cursor { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
