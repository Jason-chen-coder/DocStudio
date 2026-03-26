'use client';

import { useEffect, useState, useCallback } from 'react';
import { aiService, type AiConfigWithSource, type AiAdminUsage } from '@/services/ai-service';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/fade-in';
import {
  Bot,
  Save,
  RotateCcw,
  Loader2,
  Zap,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';

interface FieldRowProps {
  label: string;
  value: string | number;
  source: 'custom' | 'default';
  type?: 'text' | 'password' | 'number';
  placeholder?: string;
  onChange: (val: string) => void;
  onReset: () => void;
}

function FieldRow({ label, value, source, type = 'text', placeholder, onChange, onReset }: FieldRowProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-1.5 py-0.5 rounded ${
            source === 'custom'
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {source === 'custom' ? '自定义' : '环境变量'}
          </span>
          {source === 'custom' && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" />
              恢复默认
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type={isPassword && !showPassword ? 'password' : type === 'number' ? 'number' : 'text'}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AiSettingsPage() {
  const [config, setConfig] = useState<AiConfigWithSource | null>(null);
  const [usage, setUsage] = useState<AiAdminUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    provider: '',
    apiKey: '',
    baseUrl: '',
    model: '',
    dailyLimit: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [cfg, usg] = await Promise.all([
        aiService.getConfig(),
        aiService.getAdminUsage(),
      ]);
      setConfig(cfg);
      setUsage(usg);
      setForm({
        provider: cfg.provider.value,
        apiKey: cfg.apiKey.source === 'custom' ? '' : '', // Don't pre-fill API key
        baseUrl: cfg.baseUrl.value,
        model: cfg.model.value,
        dailyLimit: String(cfg.dailyLimit.value),
      });
    } catch (err) {
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = {};
      if (form.provider && form.provider !== config?.provider.value) data.provider = form.provider;
      if (form.apiKey) data.apiKey = form.apiKey;
      if (form.baseUrl && form.baseUrl !== config?.baseUrl.value) data.baseUrl = form.baseUrl;
      if (form.model && form.model !== config?.model.value) data.model = form.model;
      if (form.dailyLimit && Number(form.dailyLimit) !== config?.dailyLimit.value) {
        data.dailyLimit = Number(form.dailyLimit);
      }

      if (Object.keys(data).length === 0) {
        toast.info('没有需要保存的修改');
        setSaving(false);
        return;
      }

      const updated = await aiService.updateConfig(data);
      setConfig(updated);
      setForm((prev) => ({ ...prev, apiKey: '' })); // Clear API key input after save
      toast.success('配置已保存');
    } catch (err) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (field: string) => {
    try {
      const updated = await aiService.resetField(field);
      setConfig(updated);
      toast.success(`已恢复${field}为默认值`);
    } catch {
      toast.error('重置失败');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn delay={0} y={20}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI 模型配置</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">配置 AI 写作助手的模型、密钥和用量限制</p>
          </div>
        </div>
      </FadeIn>

      {/* Config Form */}
      <FadeIn delay={0.1} y={20}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5">
          <FieldRow
            label="Provider"
            value={form.provider}
            source={config?.provider.source || 'default'}
            placeholder="minimax"
            onChange={(v) => setForm((p) => ({ ...p, provider: v }))}
            onReset={() => handleReset('provider')}
          />

          <FieldRow
            label="API Base URL"
            value={form.baseUrl}
            source={config?.baseUrl.source || 'default'}
            placeholder="https://api.minimax.io/v1"
            onChange={(v) => setForm((p) => ({ ...p, baseUrl: v }))}
            onReset={() => handleReset('baseUrl')}
          />

          <FieldRow
            label="API Key"
            value={form.apiKey || (config?.apiKey.source === 'custom' ? config.apiKey.maskedValue : '')}
            source={config?.apiKey.source || 'default'}
            type="password"
            placeholder={config?.apiKey.source === 'custom' ? config.apiKey.maskedValue : '输入 API Key'}
            onChange={(v) => setForm((p) => ({ ...p, apiKey: v }))}
            onReset={() => handleReset('apiKey')}
          />

          <FieldRow
            label="模型名称"
            value={form.model}
            source={config?.model.source || 'default'}
            placeholder="MiniMax-Text-01"
            onChange={(v) => setForm((p) => ({ ...p, model: v }))}
            onReset={() => handleReset('model')}
          />

          <FieldRow
            label="每日用量限额（每用户）"
            value={form.dailyLimit}
            source={config?.dailyLimit.source || 'default'}
            type="number"
            placeholder="50"
            onChange={(v) => setForm((p) => ({ ...p, dailyLimit: v }))}
            onReset={() => handleReset('dailyLimit')}
          />

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存配置
            </button>
          </div>
        </div>
      </FadeIn>

    </div>
  );
}
