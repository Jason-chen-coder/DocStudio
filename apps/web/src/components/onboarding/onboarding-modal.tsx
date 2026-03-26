'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const steps = [
  {
    title: '欢迎来到 DocStudio!',
    description: '一个强大的实时协作文档平台，让团队协作更高效。',
    icon: '👋',
  },
  {
    title: '创建工作空间',
    description: '工作空间是你组织文档的地方。你可以按项目、团队或主题创建不同的空间。',
    icon: '📁',
  },
  {
    title: '编写文档',
    description: '使用富文本编辑器创建文档，支持表格、代码块、数学公式、画板等 40+ 种内容类型。',
    icon: '📝',
  },
  {
    title: '邀请协作',
    description: '邀请团队成员加入空间，实时协作编辑文档。试试输入 / 唤出斜杠命令，或用 [[ 快速链接文档。',
    icon: '🤝',
  },
];

export function OnboardingModal() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible || !user || user.onboardingCompleted) return null;

  async function complete() {
    setVisible(false);
    try {
      await apiRequest('/users/onboarding-complete', { method: 'POST' });
      if (user) updateUser({ ...user, onboardingCompleted: true });
    } catch {
      // 静默失败
    }
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl mx-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-[#333DFC]' : 'w-1.5 bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {current.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={complete}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            跳过
          </button>
          <button
            onClick={isLast ? complete : () => setStep(step + 1)}
            className="rounded-xl bg-[#333DFC] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2930D9] transition-colors shadow-lg shadow-[#333DFC]/25"
          >
            {isLast ? '开始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
