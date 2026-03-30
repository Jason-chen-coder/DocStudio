import DOMPurify from 'dompurify';

/**
 * 清理 HTML 内容，防止 XSS 攻击。
 * 用于：导入 HTML/DOCX、AI 结果渲染、模板预览等所有 dangerouslySetInnerHTML 场景。
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // 允许 Tiptap 需要的标签
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'rel', 'data-type', 'data-language', 'data-math', 'data-callout-type', 'colspan', 'rowspan'],
    // 禁止危险属性
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    // 禁止 script / style 标签
    FORBID_TAGS: ['script', 'style'],
  });
}
