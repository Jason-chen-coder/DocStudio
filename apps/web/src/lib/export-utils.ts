import type { Editor } from '@tiptap/core';

/**
 * Convert Tiptap editor content to Markdown.
 * Uses a recursive traversal of the JSON document structure.
 */
export function editorToMarkdown(editor: Editor): string {
  const json = editor.getJSON();
  return jsonToMarkdown(json);
}

function jsonToMarkdown(node: any, listDepth = 0): string {
  if (!node) return '';

  switch (node.type) {
    case 'doc':
      return (node.content || []).map((c: any) => jsonToMarkdown(c)).join('\n\n');

    case 'heading': {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${inlineContent(node)}`;
    }

    case 'paragraph':
      return inlineContent(node);

    case 'bulletList':
      return (node.content || [])
        .map((item: any) => jsonToMarkdown(item, listDepth))
        .join('\n');

    case 'orderedList':
      return (node.content || [])
        .map((item: any, i: number) => {
          const indent = '   '.repeat(listDepth);
          const lines = listItemContent(item);
          return `${indent}${i + 1}. ${lines}`;
        })
        .join('\n');

    case 'listItem': {
      const indent = '   '.repeat(listDepth);
      return `${indent}- ${listItemContent(node)}`;
    }

    case 'taskList':
      return (node.content || [])
        .map((item: any) => jsonToMarkdown(item, listDepth))
        .join('\n');

    case 'taskItem': {
      const indent = '   '.repeat(listDepth);
      const checked = node.attrs?.checked ? 'x' : ' ';
      return `${indent}- [${checked}] ${listItemContent(node)}`;
    }

    case 'blockquote': {
      const inner = (node.content || []).map((c: any) => jsonToMarkdown(c)).join('\n');
      return inner.split('\n').map((line: string) => `> ${line}`).join('\n');
    }

    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      const code = (node.content || []).map((c: any) => c.text || '').join('');
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'horizontalRule':
      return '---';

    case 'table': {
      const rows = node.content || [];
      if (rows.length === 0) return '';
      const lines: string[] = [];
      rows.forEach((row: any, ri: number) => {
        const cells = (row.content || []).map((cell: any) => {
          return (cell.content || []).map((c: any) => inlineContent(c)).join(' ');
        });
        lines.push(`| ${cells.join(' | ')} |`);
        if (ri === 0) {
          lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
        }
      });
      return lines.join('\n');
    }

    case 'callout': {
      const type = node.attrs?.type || 'info';
      const inner = (node.content || []).map((c: any) => jsonToMarkdown(c)).join('\n');
      return `:::${type}\n${inner}\n:::`;
    }

    case 'mathBlock': {
      const latex = node.attrs?.latex || '';
      return `$$\n${latex}\n$$`;
    }

    case 'image': {
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      return `![${alt}](${src})`;
    }

    default:
      if (node.content) {
        return (node.content || []).map((c: any) => jsonToMarkdown(c)).join('\n\n');
      }
      return '';
  }
}

function inlineContent(node: any): string {
  if (!node.content) return '';
  return node.content.map((child: any) => inlineNode(child)).join('');
}

function listItemContent(node: any): string {
  if (!node.content) return '';
  return node.content.map((c: any) => {
    if (c.type === 'paragraph') return inlineContent(c);
    return jsonToMarkdown(c);
  }).join('\n');
}

function inlineNode(node: any): string {
  if (node.type === 'text') {
    let text = node.text || '';
    const marks = node.marks || [];
    for (const mark of marks) {
      switch (mark.type) {
        case 'bold':
          text = `**${text}**`;
          break;
        case 'italic':
          text = `*${text}*`;
          break;
        case 'strike':
          text = `~~${text}~~`;
          break;
        case 'code':
          text = `\`${text}\``;
          break;
        case 'link':
          text = `[${text}](${mark.attrs?.href || ''})`;
          break;
      }
    }
    return text;
  }
  if (node.type === 'mention') {
    return `@${node.attrs?.label || node.attrs?.id || ''}`;
  }
  if (node.type === 'hardBreak') return '\n';
  return '';
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export editor content as Markdown file
 */
export function exportAsMarkdown(editor: Editor, title: string) {
  const md = editorToMarkdown(editor);
  const filename = `${title || '文档'}.md`;
  downloadFile(md, filename, 'text/markdown;charset=utf-8');
}

/**
 * Export editor content as HTML (printable / PDF-ready)
 */
export function exportAsHTML(editor: Editor, title: string) {
  const html = editor.getHTML();
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || '文档'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 2em; margin-top: 0; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    code { background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f4f4f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #e5e7eb; margin-left: 0; padding-left: 16px; color: #6b7280; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title || '文档'}</h1>
  ${html}
</body>
</html>`;

  const filename = `${title || '文档'}.html`;
  downloadFile(fullHtml, filename, 'text/html;charset=utf-8');
}
