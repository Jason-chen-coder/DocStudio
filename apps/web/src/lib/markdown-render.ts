import MarkdownIt from 'markdown-it';
import { all, createLowlight } from 'lowlight';

// Syntax highlighter using lowlight (same engine as the code block editor)
const lowlight = createLowlight(all);

/** Convert hast nodes to HTML string */
function hastToHtml(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return escapeHtml(node.value || '');
  if (node.type === 'element') {
    const tag = node.tagName || 'span';
    const cls = node.properties?.className;
    const attrs = cls ? ` class="${Array.isArray(cls) ? cls.join(' ') : cls}"` : '';
    const children = (node.children || []).map(hastToHtml).join('');
    return `<${tag}${attrs}>${children}</${tag}>`;
  }
  if (node.type === 'root') {
    return (node.children || []).map(hastToHtml).join('');
  }
  return '';
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Singleton markdown-it instance with syntax highlighting
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight(str, lang) {
    try {
      if (lang && lowlight.registered(lang)) {
        const tree = lowlight.highlight(lang, str);
        return `<pre class="hljs"><code class="language-${lang}">${hastToHtml(tree)}</code></pre>`;
      }
      const tree = lowlight.highlightAuto(str);
      return `<pre class="hljs"><code>${hastToHtml(tree)}</code></pre>`;
    } catch {
      return '';
    }
  },
});

/**
 * Render a markdown string to HTML with syntax-highlighted code blocks.
 * Used by AI Chat Panel and AI Result Panel.
 */
export function renderMarkdown(text: string): string {
  return md.render(text);
}
