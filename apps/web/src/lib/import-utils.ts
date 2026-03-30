import { generateJSON } from '@tiptap/core';
import { getBaseExtensions } from './tiptap-extensions';
import { sanitizeHtml } from './sanitize';

export const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPT_STRING = '.md,.html,.htm,.docx';

export interface ParsedDocument {
  title: string;
  content: object; // Tiptap JSON
}

/**
 * Get file extension (lowercase, without dot)
 */
function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
}

/**
 * Strip file extension from filename to use as default title
 */
function filenameToTitle(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(0, dot) : filename;
}

/**
 * Convert HTML string to Tiptap JSON using the shared extension schema.
 */
function htmlToTiptapJSON(html: string): object {
  try {
    const extensions = getBaseExtensions();
    return generateJSON(sanitizeHtml(html), extensions);
  } catch {
    throw new Error('无法解析文件内容，请检查文件格式是否正确');
  }
}

/**
 * Parse a Markdown file into Tiptap JSON.
 * Uses markdown-it to convert MD → HTML, then generateJSON to get Tiptap JSON.
 */
export async function parseMarkdownFile(file: File): Promise<ParsedDocument> {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error('文件内容为空');
  }

  // Dynamic import to keep bundle small
  const MarkdownIt = (await import('markdown-it')).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskLists = (await import('markdown-it-task-lists' as any)).default;

  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
  md.use(taskLists, { enabled: true, label: true });

  // Extract title: if first line is an H1, use it as title
  let title = filenameToTitle(file.name);
  let content = text;

  const h1Match = text.match(/^#\s+(.+?)(?:\n|$)/);
  if (h1Match) {
    title = h1Match[1].trim();
    // Remove the H1 line from content to avoid duplication
    content = text.slice(h1Match[0].length);
  }

  const html = md.render(content);
  const json = htmlToTiptapJSON(html);

  return { title, content: json };
}

/**
 * Parse an HTML file into Tiptap JSON.
 * Extracts <title> for document title, <body> for content.
 */
export async function parseHTMLFile(file: File): Promise<ParsedDocument> {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error('文件内容为空');
  }

  // Extract title from <title> tag
  let title = filenameToTitle(file.name);
  const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    title = titleMatch[1].trim();
  }

  // Extract body content
  let bodyHtml = text;
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyHtml = bodyMatch[1];
  }

  const json = htmlToTiptapJSON(bodyHtml);

  return { title, content: json };
}

/**
 * Parse a DOCX file into Tiptap JSON.
 * Uses mammoth to convert DOCX → HTML, then generateJSON.
 */
export async function parseDocxFile(file: File): Promise<ParsedDocument> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  if (!html.trim()) {
    throw new Error('文件内容为空');
  }

  const title = filenameToTitle(file.name);
  const json = htmlToTiptapJSON(html);

  return { title, content: json };
}

/**
 * Parse any supported file based on its extension.
 */
export async function parseFile(file: File): Promise<ParsedDocument> {
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error('文件过大，最大支持 10MB');
  }

  const ext = getExtension(file.name);

  switch (ext) {
    case 'md':
      return parseMarkdownFile(file);
    case 'html':
    case 'htm':
      return parseHTMLFile(file);
    case 'docx':
      return parseDocxFile(file);
    default:
      throw new Error(`不支持的文件格式: .${ext}`);
  }
}

/**
 * Get a human-readable label for the file type.
 */
export function getFileTypeLabel(filename: string): string {
  const ext = getExtension(filename);
  switch (ext) {
    case 'md': return 'Markdown';
    case 'html':
    case 'htm': return 'HTML';
    case 'docx': return 'Word';
    default: return ext.toUpperCase();
  }
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
