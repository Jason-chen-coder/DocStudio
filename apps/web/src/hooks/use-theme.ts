'use client';

import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_CHANGE_EVENT = 'theme-mode-change';

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme-mode');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  // 兼容旧版 key
  const legacy = localStorage.getItem('theme');
  if (legacy === 'light' || legacy === 'dark') {
    localStorage.setItem('theme-mode', legacy);
    localStorage.removeItem('theme');
    return legacy;
  }
  return 'system';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

/** 广播主题变更给同一页面内的所有 useTheme 实例 */
function broadcastChange(newMode: ThemeMode) {
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newMode }));
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // 初始化
  useEffect(() => {
    const storedMode = getStoredMode();
    const resolved = resolveTheme(storedMode);
    setMode(storedMode);
    setTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  // 监听同页面其他组件的主题变更
  useEffect(() => {
    const handler = (e: Event) => {
      const newMode = (e as CustomEvent<ThemeMode>).detail;
      setMode(newMode);
      const resolved = resolveTheme(newMode);
      setTheme(resolved);
      // applyTheme 已由触发方调用，此处不重复
    };
    window.addEventListener(THEME_CHANGE_EVENT, handler);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
  }, []);

  // 监听系统主题变化（仅 system 模式下生效）
  useEffect(() => {
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  // 设置主题模式（设置页用）
  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
    const resolved = resolveTheme(newMode);
    setTheme(resolved);
    applyTheme(resolved);
    broadcastChange(newMode);
  }, []);

  // 快捷切换（亮 ↔ 暗，Header 按钮用）
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setMode(newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme-mode', newTheme);
    applyTheme(newTheme);
    broadcastChange(newTheme);
  }, [theme]);

  return { theme, mode, toggleTheme, setThemeMode, mounted };
}
