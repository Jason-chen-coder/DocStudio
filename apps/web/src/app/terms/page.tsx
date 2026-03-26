import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服务条款',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          &larr; 返回首页
        </Link>

        <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">服务条款</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-10">最后更新：2026 年 3 月 26 日</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[var(--color-foreground)]">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 服务说明</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              DocStudio 是一个实时协作文档平台，为用户提供文档创建、编辑、协作和管理服务。
              使用本服务即表示你同意本条款。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 账号注册</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-muted-foreground)]">
              <li>你必须提供真实、准确的注册信息</li>
              <li>你有责任保管好你的账号密码</li>
              <li>每人限注册一个账号</li>
              <li>未满 16 周岁的用户需在监护人同意下使用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 用户行为规范</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">使用 DocStudio 时，你不得：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-[var(--color-muted-foreground)]">
              <li>上传违法、有害或侵犯他人权利的内容</li>
              <li>尝试未授权访问他人账号或数据</li>
              <li>干扰或破坏服务的正常运行</li>
              <li>使用自动化工具大规模抓取或滥用服务</li>
              <li>将服务用于任何非法目的</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 知识产权</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              你创建的内容归你所有。你授予 DocStudio 为提供服务所必需的使用许可。
              DocStudio 平台本身的商标、设计和代码受知识产权法保护。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 服务可用性</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们致力于提供稳定可靠的服务，但不保证服务 100% 不间断。
              我们可能因维护、升级或不可抗力因素暂时中断服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 免责声明</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              DocStudio 按&ldquo;现状&rdquo;提供服务。在法律允许的范围内，我们不对因使用服务而产生的任何
              间接、附带或惩罚性损害承担责任。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 账号终止</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              如果你违反本条款，我们有权暂停或终止你的账号。你也可以随时选择删除自己的账号。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 条款变更</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              我们可能会不时更新本条款。重大变更时将通过站内通知或邮件通知你。
              继续使用服务即表示你接受更新后的条款。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. 联系我们</h2>
            <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              如果你对服务条款有任何疑问，请通过 support@docstudio.app 联系我们。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
