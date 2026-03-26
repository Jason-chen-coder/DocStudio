import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          &larr; 返回首页
        </Link>

        <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">隐私政策</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-10">最后更新：2026 年 3 月 26 日</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[var(--color-foreground)]">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 信息收集</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们在你使用 DocStudio 服务时收集以下信息：
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-[var(--color-muted-foreground)]">
              <li>账号信息：邮箱地址、用户名、密码（加密存储）</li>
              <li>内容数据：你创建的文档、评论、上传的文件</li>
              <li>使用数据：功能使用情况、访问日志、设备信息</li>
              <li>Cookies：用于维持登录状态和用户偏好</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 信息使用</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们使用收集的信息来：
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-[var(--color-muted-foreground)]">
              <li>提供、维护和改进 DocStudio 服务</li>
              <li>处理你的账号注册和身份验证</li>
              <li>发送服务相关通知（如密码重置、安全提醒）</li>
              <li>分析使用趋势以优化产品体验</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 信息共享</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们不会出售你的个人信息。仅在以下情况下共享数据：
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-[var(--color-muted-foreground)]">
              <li>经你明确同意</li>
              <li>与你所在团队的成员共享协作内容</li>
              <li>法律要求或响应合法的法律程序</li>
              <li>保护 DocStudio 及其用户的权利和安全</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 数据安全</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们采用行业标准的安全措施保护你的数据，包括传输加密（TLS）、密码哈希存储、访问控制和定期安全审计。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 数据保留与删除</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们在你使用服务期间保留你的数据。你可以随时请求删除你的账号和所有相关数据。
              删除回收站中的文档将在 30 天后自动永久删除。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 你的权利</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-muted-foreground)]">
              <li>访问和导出你的数据</li>
              <li>更正不准确的个人信息</li>
              <li>请求删除你的账号和数据</li>
              <li>撤回对数据处理的同意</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 联系我们</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              如果你对隐私政策有任何疑问，请通过 privacy@docstudio.app 联系我们。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
