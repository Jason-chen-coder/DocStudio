export type TemplateScope = 'SYSTEM' | 'SPACE' | 'USER';
export type TemplateCategory = 'MEETING' | 'TECH' | 'REPORT' | 'REQUIREMENT' | 'GUIDE' | 'OTHER';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string; // Tiptap JSON (only returned by getTemplate)
  icon: string;
  category: TemplateCategory;
  scope: TemplateScope;
  spaceId: string | null;
  createdBy: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// List item (no content field to save bandwidth)
export type TemplateListItem = Omit<DocumentTemplate, 'content'>;

export interface CreateTemplateDto {
  name: string;
  description?: string;
  content: string;
  icon?: string;
  category?: TemplateCategory;
  scope: TemplateScope;
  spaceId?: string;
}

export interface SaveAsTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  icon?: string;
  category?: TemplateCategory;
  scope: TemplateScope;
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  MEETING: '会议记录',
  TECH: '技术文档',
  REPORT: '报告周报',
  REQUIREMENT: '需求文档',
  GUIDE: '指南教程',
  OTHER: '其他',
};

export const SCOPE_LABELS: Record<TemplateScope, string> = {
  SYSTEM: '系统内置',
  SPACE: '空间模板',
  USER: '我的模板',
};

export const ALL_CATEGORIES: TemplateCategory[] = [
  'MEETING', 'TECH', 'REPORT', 'REQUIREMENT', 'GUIDE', 'OTHER',
];
