'use client';

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { CalloutType } from './callout-extension';

const CALLOUT_CONFIG: Record<
  CalloutType,
  {
    icon: typeof Info;
    label: string;
    bg: string;
    border: string;
    iconColor: string;
  }
> = {
  info: {
    icon: Info,
    label: '信息',
    bg: 'bg-blue-50 dark:bg-blue-900/15',
    border: 'border-blue-200 dark:border-blue-800/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    label: '警告',
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    border: 'border-amber-200 dark:border-amber-800/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: XCircle,
    label: '错误',
    bg: 'bg-red-50 dark:bg-red-900/15',
    border: 'border-red-200 dark:border-red-800/40',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  success: {
    icon: CheckCircle,
    label: '成功',
    bg: 'bg-green-50 dark:bg-green-900/15',
    border: 'border-green-200 dark:border-green-800/40',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

const TYPES: CalloutType[] = ['info', 'warning', 'error', 'success'];

export function CalloutNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const calloutType = (node.attrs.type as CalloutType) || 'info';
  const config = CALLOUT_CONFIG[calloutType];
  const Icon = config.icon;

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isEditable = editor.isEditable;

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  return (
    <NodeViewWrapper
      className={`relative rounded-xl border-l-4 ${config.bg} ${config.border} px-5 py-4 my-3`}
      data-callout-type={calloutType}
    >
      {/* Icon + type picker */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-0.5" ref={pickerRef}>
          <button
            type="button"
            contentEditable={false}
            onClick={() => isEditable && setShowPicker(!showPicker)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${config.iconColor} ${
              isEditable ? 'hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer' : ''
            }`}
            title={isEditable ? '切换提示类型' : config.label}
          >
            <Icon className="w-4.5 h-4.5" />
          </button>

          {/* Type picker dropdown */}
          {showPicker && (
            <div
              contentEditable={false}
              className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]"
            >
              {TYPES.map((t) => {
                const c = CALLOUT_CONFIG[t];
                const TypeIcon = c.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      updateAttributes({ type: t });
                      setShowPicker(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                      t === calloutType
                        ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <TypeIcon className={`w-4 h-4 ${c.iconColor}`} />
                    <span className="text-gray-700 dark:text-gray-300">{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Editable content */}
        <div className="flex-1 min-w-0">
          <NodeViewContent className="callout-content" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
