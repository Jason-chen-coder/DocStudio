import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import '@radix-ui/themes/styles.css';
import './globals.css';
import { Theme } from '@radix-ui/themes';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';
import { GlobalLoading } from '@/components/layout/global-loading';
import { siteConfig } from '@/lib/site-config';
import { WebSiteJsonLd } from '@/components/seo/json-ld';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.creator }],
  creator: siteConfig.creator,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 512,
        height: 512,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/docStudio_icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <WebSiteJsonLd />
        {/* 在 HTML 解析阶段立即初始化主题，避免白屏闪烁（FOUC）
            必须与 useTheme hook 的逻辑完全一致：
            1. 优先读 theme-mode key（light / dark / system）
            2. 兼容旧版 theme key
            3. system 模式跟随系统偏好 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('theme-mode');if(!m){var legacy=localStorage.getItem('theme');if(legacy==='light'||legacy==='dark'){m=legacy;localStorage.setItem('theme-mode',m);localStorage.removeItem('theme')}else{m='system'}}var isDark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(isDark){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.className} ${geistMono.variable} antialiased`}>
        <Theme accentColor="blue">
          <AuthProvider>
            <GlobalLoading />
            {children}
          </AuthProvider>
        </Theme>
        {/* Toaster 必须在 Theme/AuthProvider 外部，作为 body 直接子元素，
            否则会被父级 stacking context 困住，被 Radix Dialog Portal 遮挡 */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
