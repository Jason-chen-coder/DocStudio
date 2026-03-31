'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { ArrowRight, Globe, Lock, Zap, Sparkles, Layout, Users, Database, BrainCircuit, Link2, History, FileInput, BarChart3, WifiOff, MessageSquareText, Search, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicHeader } from '@/components/layout/public-header';
import CardSwap, { Card } from '@/components/CardSwap';
import GradientText from '@/components/GradientText';
import Grainient from '@/components/Grainient';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiNestjs, SiPrisma, SiPostgresql, SiFastify, SiMinio, SiFramer, SiRadixui, SiSwagger } from 'react-icons/si';
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import BorderGlow from '@/components/BorderGlow';
import { useTheme } from '@/hooks/use-theme';
import CountUp from '@/components/ui/count-up';
import { toast } from 'sonner';

const isStaticDemo = !!process.env.NEXT_PUBLIC_BASE_PATH;

const mockSpaces = [
  {
    id: 'mock-1',
    name: '前端设计系统',
    description: '构建可扩展、无障碍且精美的现代 Web 应用设计系统全面指南。',
    icon: <Layout className="w-5 h-5" />,
    color: 'bg-blue-500',
    owner: 'Alex Rivera',
  },
  {
    id: 'mock-2',
    name: '人工智能与机器学习基础',
    description: '探索神经网络、深度学习的基础知识，以及在生产环境中的实用 AI 部署方案。',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-purple-500',
    owner: 'Dr. Sarah Chen',
  },
  {
    id: 'mock-3',
    name: '系统架构设计',
    description: '涵盖分布式系统设计、缓存策略及高可用微服务架构的进阶指南。',
    icon: <Database className="w-5 h-5" />,
    color: 'bg-emerald-500',
    owner: 'David Thompson',
  }
];

const reviews = [
  {
    name: "Alex Rivera",
    username: "@alex",
    body: "DocStudio 彻底改变了我们团队的知识管理方式，协作变得前所未有的流畅。支持毫秒级同步，完全不用担心冲突。",
    color: "bg-blue-500",
  },
  {
    name: "Sarah Chen",
    username: "@sarah",
    body: "它有着令人惊叹的现代化界面，Markdown 支持非常完美。这是我用过的体验最好的文档工具。",
    color: "bg-purple-500",
  },
  {
    name: "David Thompson",
    username: "@david",
    body: "企业级的数据安全保障和灵活的权限配置，让我们非常放心地将核心业务资料存放在这。",
    color: "bg-emerald-500",
  },
  {
    name: "Emily Wang",
    username: "@emily",
    body: "公开知识库功能让我们的产品手册展现变得异常简单，而且 SEO 效果出奇的好！",
    color: "bg-rose-500",
  },
  {
    name: "Michael Liu",
    username: "@michael",
    body: "私有化部署非常容易，Docker 一键搞定，太棒了！开发团队非常专业，强烈推荐。",
    color: "bg-amber-500",
  },
  {
    name: "Jessica Zhang",
    username: "@jessica",
    body: "Yjs 底层架构加上现代化的编辑器设计，这几乎是我们梦寐以求的产品。赞！",
    color: "bg-indigo-500",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  color,
  name,
  username,
  body,
}: {
  color: string;
  name: string;
  username: string;
  body: string;
}) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <figure
      className={cn(
        "relative h-full w-72 cursor-pointer overflow-hidden rounded-2xl border p-5",
        // light styles
        "border-gray-200 bg-white hover:bg-gray-50/80 shadow-sm",
        // dark styles
        "dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/80 dark:shadow-none"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-lg ring-2 ring-gray-100 dark:ring-gray-800", color)}>
          {initial}
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-semibold text-gray-900 dark:text-white">
            {name}
          </figcaption>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{username}</p>
        </div>
      </div>
      <blockquote className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{body}</blockquote>
    </figure>
  );
};

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.documentElement.style.overscrollBehavior = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 导航栏 */}
      <PublicHeader />

      <main className="relative">
        {/* Animated Background Elements */}
        <div className="absolute top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] rounded-full"
          />
        </div>

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center items-center px-4 relative pt-20 pb-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 z-0">
            <Grainient
              color1="#fcfcfc"
              color2="#1445b8"
              color3="#71cbf4"
              timeSpeed={0.25}
              colorBalance={0.06}
              warpStrength={2.1}
              warpFrequency={6.3}
              warpSpeed={3.9}
              warpAmplitude={49}
              blendAngle={-73}
              blendSoftness={0.7}
              rotationAmount={1440}
              noiseScale={4}
              grainAmount={0}
              grainScale={8}
              grainAnimated
              contrast={1.5}
              gamma={1}
              saturation={1}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />
            {/* Subtle overlay for text legibility */}
            <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px]" />
          </div>

          <div className="max-w-4xl mx-auto text-center w-full relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              全新一代知识库平台
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-[1.1]"
            >
              实时协作的<br />
              <span className="relative inline-block mt-2">
                <GradientText
                  colors={['#295dfb', '#274bffff', '#609affff']}
                  animationSpeed={2}
                  showBorder={false}
                >
                  知识管理平台
                </GradientText>
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  initial={{ strokeDashoffset: 1000 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeInOut" }}
                  viewBox="0 0 300 12" fill="none"
                >
                  <path d="M2.5 9.5C80.5 -1.5 220.5 -1.5 297.5 9.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-blue-500/30" />
                </motion.svg>
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              连接团队思想，沉淀核心知识。从个人笔记到企业级文档共享，DocStudio 为您提供流畅、强大的编辑与协作体验。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {isStaticDemo ? (
                <button
                  onClick={() => toast.info('功能开发中，敬请期待！')}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-lg transition shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  开始免费使用 <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-lg transition shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  开始免费使用 <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link href="/explore" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 rounded-full font-medium text-lg transition flex items-center justify-center gap-2">
                探索公开知识库
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Bento Grid 2.0 */}
        <section className="py-32 bg-slate-50 dark:bg-[#050505] relative overflow-hidden">
          {/* Subtle Dynamic Mesh */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 xl:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-20 text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-slate-600 dark:text-zinc-300 text-xs font-bold tracking-widest uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                下一代编纂体验
              </div>
              <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-6">
                重新定义<br className="hidden md:block" />团队知识共享
              </h3>
              <p className="text-lg text-slate-500 dark:text-zinc-400 max-w-[65ch] leading-relaxed mx-auto md:mx-0">
                放弃那些零散混乱的旧时代工具。DocStudio 专为追求极致效率与审美的现代团队打造，从底层架构到交互细节，每一处皆经过精心雕琢。
              </p>
            </motion.div>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto md:auto-rows-[280px]">

              {/* Card 1: 实时协作 (6 cols, 2 rows) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="md:col-span-6 md:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] fill-transparent p-10 flex flex-col justify-between"
              >
                <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] z-10" />
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 blur-[80px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-110" />

                <div className="relative z-20">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 ring-1 ring-blue-100 dark:ring-blue-800/50 shadow-sm">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">毫秒级实时协作</h4>
                  <p className="text-slate-500 dark:text-zinc-400 text-lg leading-relaxed max-w-[90%]">
                    基于 Yjs 与 Hocuspocus 的底层 CRDT 架构，支持百人规模毫秒级实时编辑。告别冲突合并的烦恼，体验如丝般顺滑的多人同行。
                  </p>
                </div>

                {/* Animated Interactive Mock */}
                <div className="relative w-full h-52 mt-8 border border-slate-100 dark:border-zinc-800/70 rounded-[1.5rem] bg-slate-50/50 dark:bg-[#0a0a0a] overflow-hidden flex items-center justify-center shadow-inner">
                  {/* Fake document skeleton */}
                  <div className="w-full px-12 py-8 h-full flex flex-col">
                    <div className="w-1/3 h-5 bg-slate-200/50 dark:bg-zinc-800/50 rounded inline-block mb-6" />
                    <div className="w-3/4 h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded inline-block mb-4" />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-[1.5s] w-1/2 h-3 bg-blue-500/20 dark:bg-blue-500/20 rounded inline-block mb-4 ml-6" />
                  </div>

                  {/* Cursor 1 */}
                  <motion.div
                    animate={{ x: [0, 40, 10, 0], y: [0, -20, 15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/3 z-30 flex flex-col items-start drop-shadow-md"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-rose-500 fill-rose-500 -ml-1 -mt-1 scale-110">
                      <path d="M5.65376 21.2673L2.5734 3.0142C2.46467 2.37025 3.04856 1.83832 3.67034 1.9547L21.4925 5.29298C22.1465 5.41551 22.3168 6.27306 21.7853 6.67134L15.3407 11.5L20.2188 19.3409C20.5828 19.9261 20.3546 20.6976 19.7212 21.0189L17.7583 22.0143C17.1524 22.3216 16.4168 22.1062 16.0396 21.5165L11.1664 13.8827L5.59253 19.2312C5.1221 19.6826 4.34149 19.3871 4.28676 18.7302L5.65376 21.2673Z" />
                    </svg>
                    <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full rounded-tl-none ml-[18px] -mt-[2px] shadow-sm transform-gpu">Jason</div>
                  </motion.div>

                  {/* Cursor 2 */}
                  <motion.div
                    animate={{ x: [0, -30, 20, 0], y: [0, 30, -5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/3 left-2/3 z-30 flex flex-col items-start drop-shadow-md"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-500 fill-emerald-500 -ml-1 -mt-1 scale-110">
                      <path d="M5.65376 21.2673L2.5734 3.0142C2.46467 2.37025 3.04856 1.83832 3.67034 1.9547L21.4925 5.29298C22.1465 5.41551 22.3168 6.27306 21.7853 6.67134L15.3407 11.5L20.2188 19.3409C20.5828 19.9261 20.3546 20.6976 19.7212 21.0189L17.7583 22.0143C17.1524 22.3216 16.4168 22.1062 16.0396 21.5165L11.1664 13.8827L5.59253 19.2312C5.1221 19.6826 4.34149 19.3871 4.28676 18.7302L5.65376 21.2673Z" />
                    </svg>
                    <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full rounded-tl-none ml-[18px] -mt-[2px] shadow-sm transform-gpu">Sarah</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Card 2: 极简编辑器 (6 cols, 1 row) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-6 md:row-span-1 group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 flex flex-col sm:flex-row items-center justify-between gap-8"
              >
                <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] z-10" />

                <div className="relative z-20 flex-1 max-w-full sm:max-w-[60%]">
                  <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 ring-1 ring-indigo-100 dark:ring-indigo-800/50">
                    <Layout className="w-5 h-5" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">极简强大的编辑器</h4>
                  <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-[15px]">
                    多模式快捷输入与斜杠命令，抛弃繁琐菜单。排版优雅，让你重新专注创作本身。
                  </p>
                </div>

                <div className="relative w-40 h-[140px] border border-slate-100 dark:border-zinc-800/80 rounded-[1.25rem] bg-slate-50 dark:bg-[#0a0a0a] p-4 flex flex-col gap-2 overflow-hidden shadow-inner transform-gpu transition-transform duration-[600ms] group-hover:-translate-x-2 group-hover:scale-[1.03] group-hover:-rotate-2">
                  <div className="w-8 h-8 rounded bg-indigo-500/10 mb-2 flex items-center justify-center text-indigo-500/80 shrink-0">
                    <span className="font-mono text-sm font-bold">/</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                  <div className="w-4/5 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                  <motion.div
                    animate={{ width: ["0%", "50%", "0%"], opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full mt-2"
                  />
                </div>
              </motion.div>

              {/* Row 2 splits */}

              {/* Card 3: 公开分享 (3 cols, 1 row) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-3 md:row-span-1 group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 flex flex-col justify-center text-center py-12 md:py-8"
              >
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] z-10" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-purple-500/5 dark:from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="mx-auto w-12 h-12 rounded-[1rem] bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 relative z-20 ring-1 ring-purple-100 dark:ring-purple-800/50 transition-transform group-hover:rotate-[15deg] group-hover:scale-110 duration-500">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">一键公开分享</h4>
                <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[200px] mx-auto">
                  快速搭建团队静态博客与极速产品帮助手册
                </p>
              </motion.div>

              {/* Card 4: 数据管控 (3 cols, 1 row) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="md:col-span-3 md:row-span-1 group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 flex flex-col justify-center text-center py-12 md:py-8"
              >
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] z-10" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/5 dark:from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="mx-auto w-12 h-12 rounded-[1rem] bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 relative z-20 ring-1 ring-emerald-100 dark:ring-emerald-800/50 transition-transform group-hover:-rotate-[15deg] group-hover:scale-110 duration-500">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">核心数据掌控</h4>
                <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[200px] mx-auto">
                  原生支持 Docker 单测部署与深度权限切片控制
                </p>
              </motion.div>

              {/* Row 3 Items */}

              {/* Card 5: 空间管理 (7 cols, 1 row) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="md:col-span-7 md:row-span-1 group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 flex flex-col md:flex-row items-center justify-between"
              >
                <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] z-10" />
                <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.05),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_50%)] pointer-events-none" />

                <div className="relative z-20 max-w-full md:max-w-[60%]">
                  <div className="w-12 h-12 rounded-[1rem] bg-orange-50 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 ring-1 ring-orange-100 dark:ring-orange-800/50 transition-transform group-hover:-translate-y-1 duration-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">井然有序的团队空间</h4>
                  <p className="text-slate-500 dark:text-zinc-400 leading-relaxed text-[15px]">
                    灵活的成员编组与权限划分，为企业内不同项目建立专属信息围栏，让核心资产流而不乱。
                  </p>
                </div>

                <div className="relative flex w-32 justify-end pr-4 h-full items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-900 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-white text-sm font-bold absolute right-[4.5rem] z-30 shadow-md transform-gpu transition-all duration-500 group-hover:-translate-x-3 group-hover:-rotate-6 bg-[url('https://avatar.vercel.sh/jack')] bg-cover">Jack</div>
                  <div className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-900 bg-orange-400 dark:bg-orange-600 flex items-center justify-center text-white text-sm font-bold absolute right-9 z-20 shadow-md transform-gpu transition-all duration-500 group-hover:-translate-x-1 hover:z-40 bg-[url('https://avatar.vercel.sh/emily')] bg-cover">Tim</div>
                  <div className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-900 bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold absolute right-0 z-10 shadow-md ring-1 ring-white/10 ring-inset">
                    +12
                  </div>
                </div>
              </motion.div>

              {/* Card 6: 交互体验 (5 cols, 1 row) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="md:col-span-5 md:row-span-1 group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 flex flex-col justify-center"
              >
                <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] z-10" />

                <div className="w-12 h-12 rounded-[1rem] bg-pink-50 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6 ring-1 ring-pink-100 dark:ring-pink-800/50 transition-transform group-hover:scale-[1.15] duration-[600ms] ease-out">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">现代化交互美学</h4>
                <p className="text-slate-500 dark:text-zinc-400 text-[15px] leading-relaxed pr-6">
                  精雕细琢的暗箱模式与平滑动画。无论大屏还是移动端，始终保持全端致美体验。
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Public Spaces Preview (Mock Data) */}
              {/* ==================== Highlight Features ==================== */}
        <section className="py-24 bg-white dark:bg-gray-950 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium mb-4">
                更多能力
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                从 AI 写作到数据洞察
              </h3>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                每一项功能都经过打磨，为你和团队提供极致的文档体验。
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: BrainCircuit, title: "AI 辅助写作", desc: "续写、润色、翻译、摘要，Copilot 补全，AI 文档对话", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30" },
                { icon: Link2, title: "文档互链", desc: "[[ 语法即时搜索链接，构建知识网络", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/30" },
                { icon: History, title: "版本历史", desc: "自动快照与手动存档，随时回溯并一键恢复", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
                { icon: FileInput, title: "导入导出", desc: "Markdown / HTML / Word 导入，PDF 一键导出", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30" },
                { icon: BarChart3, title: "数据洞察", desc: "空间面板、文档 PV/UV、个人生产力指标", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
                { icon: WifiOff, title: "离线编辑", desc: "IndexedDB 本地缓存，断网可编辑，CRDT 无缝合并", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-900/30" },
                { icon: MessageSquareText, title: "行内评论", desc: "选中文字发起评论线程，支持多人回复与解决", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30" },
                { icon: Search, title: "全文搜索", desc: "标题与正文检索，结果高亮，快速定位知识", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-5 hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:shadow-sm"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", feature.bg, feature.color)}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">{feature.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== Public Spaces Preview ==================== */}
        <section className="py-24 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/50">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start gap-16">
              {/* Left */}
              <div className="lg:max-w-md shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium mb-4">
                  <Users className="w-3.5 h-3.5" />
                  社区
                </div>
                <h4 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  灵感碰撞，<br />
                  <span className="text-blue-600 dark:text-blue-400">知识在此生长</span>
                </h4>
                <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                  管理个人文档的同时，探索社区中的优质公开知识库，发现技术前沿、设计规范和行业洞察。
                </p>
                <Link href="/explore" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-sm group">
                  浏览更多 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Right - Static Cards */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {mockSpaces.map((space) => (
                  <div key={space.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col transition-shadow hover:shadow-md">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4", space.color)}>
                      {space.icon}
                    </div>
                    <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-2 leading-snug">{space.name}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-grow mb-4">{space.description}</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium", space.color)}>
                        {space.owner[0]}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{space.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* Premium Tech Stack Section */}
        <section className="py-24 w-full border-t border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-[#0a0a0a] overflow-hidden relative">
          {/* Subtle Dynamic Mesh & Grid Base */}
          <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
          <div className="absolute top-0 inset-x-0 h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-zinc-700 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

          <div className="flex flex-col items-center max-w-7xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold tracking-widest uppercase mb-8 border border-slate-200 shadow-sm dark:border-zinc-700"
            >
              <Database className="w-3.5 h-3.5" /> 现代化的技术底座
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight text-center"
            >
              构建在开源生态之上
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-slate-500 dark:text-zinc-400 max-w-2xl text-center mb-16 leading-relaxed"
            >
              我们只选择被全球顶尖团队验证过的前沿技术栈，只为在面对海量高并发协作需求时，依然能提供卓越的性能与极致丝滑的体验。
            </motion.p>

            <div className="relative flex w-full max-w-[100vw] flex-col items-center justify-center overflow-hidden">
              <Marquee pauseOnHover className="[--duration:40s] mb-5">
                {[
                  { icon: SiNextdotjs, name: "Next.js", color: "text-black dark:text-white" },
                  { icon: SiReact, name: "React", color: "text-sky-500" },
                  { icon: SiTypescript, name: "TypeScript", color: "text-blue-600" },
                  { icon: SiTailwindcss, name: "Tailwind CSS", color: "text-cyan-400" },
                  { icon: SiFramer, name: "Framer Motion", color: "text-black dark:text-white" },
                  { icon: SiRadixui, name: "Radix UI", color: "text-black dark:text-white" },
                ].map((tech) => (
                  <div key={tech.name} className="group relative flex cursor-default items-center gap-4 overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white p-3 pr-6 transition-all hover:bg-slate-50 hover:shadow-lg hover:-translate-y-1 dark:border-white/5 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 backdrop-blur-md mx-3 ring-1 ring-black/[0.02] dark:ring-white/[0.02]">
                    <div className="absolute inset-0 pointer-events-none rounded-[1.25rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-[0.85rem] bg-slate-50 dark:bg-zinc-800/80 ring-1 ring-slate-200/50 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                      <tech.icon className={cn("h-7 w-7 transition-all group-hover:drop-shadow-md", tech.color)} />
                    </div>
                    <div className="flex flex-col ml-1 transform-gpu transition-all duration-300 group-hover:translate-x-1">
                      <span className="text-[1.05rem] font-bold tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                        {tech.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                        Frontend & UI
                      </span>
                    </div>
                  </div>
                ))}
              </Marquee>

              <Marquee reverse pauseOnHover className="[--duration:45s]">
                {[
                  { icon: SiNestjs, name: "NestJS", color: "text-red-500" },
                  { icon: SiFastify, name: "Fastify", color: "text-black dark:text-white" },
                  { icon: SiPrisma, name: "Prisma", color: "text-indigo-500" },
                  { icon: SiPostgresql, name: "PostgreSQL", color: "text-blue-500" },
                  { icon: SiMinio, name: "MinIO", color: "text-red-500" },
                  { icon: SiSwagger, name: "Swagger", color: "text-emerald-500" },
                ].map((tech) => (
                  <div key={tech.name} className="group relative flex cursor-default items-center gap-4 overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white p-3 pr-6 transition-all hover:bg-slate-50 hover:shadow-lg hover:-translate-y-1 dark:border-white/5 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 backdrop-blur-md mx-3 ring-1 ring-black/[0.02] dark:ring-white/[0.02]">
                    <div className="absolute inset-0 pointer-events-none rounded-[1.25rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-[0.85rem] bg-slate-50 dark:bg-zinc-800/80 ring-1 ring-slate-200/50 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300">
                      <tech.icon className={cn("h-7 w-7 transition-all group-hover:drop-shadow-md", tech.color)} />
                    </div>
                    <div className="flex flex-col ml-1 transform-gpu transition-all duration-300 group-hover:translate-x-1">
                      <span className="text-[1.05rem] font-bold tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                        {tech.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                        Backend & Infra
                      </span>
                    </div>
                  </div>
                ))}
              </Marquee>

              {/* Seamless Fade Edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-slate-50/50 dark:from-[#0a0a0a]"></div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-slate-50/50 dark:from-[#0a0a0a]"></div>
            </div>
          </div>
        </section>

        {/* Community Reviews Section */}
        <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden border-t border-slate-100 dark:border-zinc-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">来自社区的声音</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">看看大家是如何使用 DocStudio 提升效率的</p>
            </motion.div>
          </div>

          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <Marquee pauseOnHover className="[--duration:40s]">
              {firstRow.map((review) => (
                <ReviewCard key={review.username} {...review} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:40s] mt-4">
              {secondRow.map((review) => (
                <ReviewCard key={review.username} {...review} />
              ))}
            </Marquee>

            {/* Gradient Overlays */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white dark:from-gray-950"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white dark:from-gray-950"></div>
          </div>
        </section>
        {/* ==================== Bottom CTA ==================== */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Gradient bg — soft radial spotlight, not a color block */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/80 to-blue-100/50 dark:from-transparent dark:via-blue-950/20 dark:to-indigo-950/30" />
          {/* Radial center glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-400/[0.12] dark:bg-blue-500/[0.07] rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              {/* Headline — large, confident */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] mb-6">
                开始用 DocStudio<br />
                <span className="text-blue-600 dark:text-blue-400">重新定义团队协作</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
                从个人笔记到团队知识库，分钟级上手，让知识真正流动起来。
              </p>

              {/* CTA — BorderGlow wraps the primary button for interactive delight */}
              <div className="flex flex-col items-center gap-5">
                <BorderGlow
                  edgeSensitivity={30}
                  glowColor={isDark ? '230 70 65' : '230 85 60'}
                  backgroundColor={isDark ? '#1e3a8a' : '#2563eb'}
                  borderRadius={14}
                  glowRadius={25}
                  glowIntensity={isDark ? 1 : 0.8}
                  coneSpread={35}
                  animated={false}
                  colors={['#6366f1', '#3b82f6', '#60a5fa']}
                  className="w-full sm:w-auto"
                >
                  {isStaticDemo ? (
                    <button
                      onClick={() => toast.info('功能开发中，敬请期待！')}
                      className="inline-flex items-center justify-center gap-2.5 w-full px-10 py-4 text-white font-semibold text-base transition-opacity duration-150 hover:opacity-90 cursor-pointer"
                    >
                      免费开始使用 <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center justify-center gap-2.5 w-full px-10 py-4 text-white font-semibold text-base transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    >
                      免费开始使用 <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                </BorderGlow>
                <Link
                  href="/explore"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 underline underline-offset-4 decoration-gray-300 dark:decoration-gray-600 hover:decoration-blue-400"
                >
                  或先探索公开知识库
                </Link>
              </div>
            </motion.div>

            {/* Stats bar — visual density + social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-16 flex items-center justify-center gap-8 sm:gap-12"
            >
              {[
                { to: 500, suffix: '+', label: '活跃用户', delay: 0 },
                { to: 10, suffix: 'K+', label: '文档创建', delay: 0.15 },
                { to: 99.9, suffix: '%', label: '服务可用性', delay: 0.3 },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    <CountUp to={stat.to} duration={2} delay={stat.delay} separator="," />
                    <span>{stat.suffix}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-[#FAFAF9] dark:bg-[#0D0D10] border-t border-gray-200/70 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/docStudio_icon.png`} alt="DocStudio" width={22} height={22} style={{ width: 22, height: 'auto' }} />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">DocStudio</span>
              </div>
              <p className="text-[13px] text-gray-500 dark:text-gray-500 leading-relaxed max-w-[220px]">
                为现代团队打造的实时协作文档平台
              </p>
              <a
                href="https://github.com/Jason-chen-coder/DocStudio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-fit"
              >
                <Github className="w-3.5 h-3.5" />
                Jason-chen-coder
              </a>
            </div>

            {/* Open source projects */}
            <div className="md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-4">
                开源项目
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 divide-y divide-gray-100/80 dark:divide-white/[0.04] sm:divide-y-0">
                {[
                  {
                    name: 'Mxgraph-EasyFlowEditor',
                    desc: '基于 mxGraph + Vue 的可视化流程图编辑器',
                    stars: '214',
                    href: 'https://github.com/Jason-chen-coder/Mxgraph-EasyFlowEditor',
                    lang: 'Vue',
                  },
                  {
                    name: 'D3-EasyFlowRender',
                    desc: '基于 D3.js 的拓扑图可视化渲染库',
                    stars: '44',
                    href: 'https://github.com/Jason-chen-coder/D3-EasyFlowRender',
                    lang: 'JavaScript',
                  },
                  {
                    name: 'Monaco-EasyCodeEditor',
                    desc: '基于 Monaco Editor 的在线代码编辑器',
                    stars: '27',
                    href: 'https://github.com/Jason-chen-coder/Monaco-EasyCodeEditor',
                    lang: 'JavaScript',
                  },
                  {
                    name: 'Flutter-EasySpeechRecognition',
                    desc: '基于 Sherpa-ONNX 的本地语音识别 App',
                    stars: '28',
                    href: 'https://github.com/Jason-chen-coder/Flutter-EasySpeechRecognition',
                    lang: 'Flutter',
                  },
                  {
                    name: 'Webpack5Mfp-Node-Nacos',
                    desc: 'Webpack 5 模块联邦 + Node + Nacos 微前端实践',
                    stars: '22',
                    href: 'https://github.com/Jason-chen-coder/Webpack5Mfp-Node-Nacos',
                    lang: 'JavaScript',
                  },
                  {
                    name: 'JsPlumb-EasyFlowEditor',
                    desc: '基于 JsPlumb 的拖拽式流程图编辑器',
                    stars: '—',
                    href: 'https://github.com/Jason-chen-coder/JsPlumb-EasyFlowEditor',
                    lang: 'Vue',
                  },
                ].map((proj) => (
                  <a
                    key={proj.name}
                    href={proj.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between py-3 group hover:bg-gray-50/60 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors duration-150"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 truncate">
                        {proj.name}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 leading-relaxed truncate">
                        {proj.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0 mt-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">★ {proj.stars}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-500 border border-gray-200/70 dark:border-white/[0.06]">
                        {proj.lang}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-gray-200/60 dark:border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              © {new Date().getFullYear()} Jason Chen · DocStudio. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/help" className="text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">帮助</Link>
              <Link href="/contact" className="text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">联系</Link>
              <a
                href="https://github.com/Jason-chen-coder/DocStudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
}
