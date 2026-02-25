import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import '@radix-ui/themes/styles.css';
import './globals.css';
import { Theme } from '@radix-ui/themes';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';
import { GlobalLoading } from '@/components/layout/global-loading';

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
  title: 'DocStudio - 实时协作文档平台',
  description: '团队知识管理和实时协作平台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${plusJakartaSans.className} ${geistMono.variable} antialiased`}>
        <Theme>
          <AuthProvider>
            <GlobalLoading />
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </Theme>
      </body>
    </html>
  );
}
