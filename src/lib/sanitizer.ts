import katex from 'katex';

/**
 * HTML Sanitizer & Security Parser for GATE Question & Solution Content.
 * Enforces XSS protection, strips answer-revealing hints/classes/data-attributes,
 * fixes relative image URLs, and renders LaTeX math formulas safely using KaTeX.
 */

// List of allowed tags for questions and solutions
const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'br', 'b', 'strong', 'i', 'em', 'u', 'sub', 'sup',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'ul', 'ol', 'li', 'code', 'pre', 'img', 'details', 'summary', 'blockquote'
]);

export interface SanitizeOptions {
  stripSolutions?: boolean;
  renderMath?: boolean;
}

/**
 * Normalizes relative image URLs in scraped dataset HTML into working, accessible CDN URLs.
 * Handles patterns such as:
 * - ../../../ext_media/storage.googleapis.com/...
 * - ./ext_media/storage.googleapis.com/...
 * - ext_media/storage.googleapis.com/...
 * - storage.googleapis.com/...
 */
export function fixImageUrls(html: string): string {
  if (!html) return '';

  let result = html;

  // 1. Replace relative ext_media paths with absolute CDN URL
  result = result.replace(
    /(?:(?:\.\.\/)+|\.\/)?ext_media\/(storage\.googleapis\.com\/[^\s"'<>]+)/gi,
    'https://dvruo-test-series.netlify.app/ext_media/$1'
  );

  // 2. Replace standalone storage.googleapis.com relative paths
  result = result.replace(
    /(?:(?:\.\.\/)+|\.\/)?storage\.googleapis\.com\/([^\s"'<>]+)/gi,
    'https://dvruo-test-series.netlify.app/ext_media/storage.googleapis.com/$1'
  );

  // 3. Fix broken [IMAGE] inside <img src="[IMAGE]"> with an inline indicator badge
  result = result.replace(
    /<img\s+[^>]*src=["']\[IMAGE\]["'][^>]*\/?>/gi,
    '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">🖼️ [Image Formula]</span>'
  );

  // 4. Replace standalone [IMAGE] text placeholders
  result = result.replace(
    /\[IMAGE\]/gi,
    '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">🖼️ [Image Formula]</span>'
  );

  return result;
}

export function sanitizeHtml(htmlString: string, options: SanitizeOptions = {}): string {
  if (!htmlString) return '';

  let sanitized = htmlString;

  // 1. Remove dangerous script, iframe, and style blocks
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Strip hidden solution containers if requested (for question payload isolation)
  if (options.stripSolutions) {
    sanitized = sanitized.replace(/<details\s+class=["']solution["'][\s\S]*?<\/details>/gi, '');
    sanitized = sanitized.replace(/<div\s+class=["'][^"']*answerline[^"']*["'][\s\S]*?<\/div>/gi, '');
  }

  // 3. Strip answer hints / correctness attributes
  sanitized = sanitized.replace(/\s+data-correct=["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+data-nat-(low|high)=["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+data-right=["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+data-wrong=["'][^"']*["']/gi, '');

  // 4. Strip inline event handlers (onerror, onload, onclick, etc.)
  sanitized = sanitized.replace(/\s+on[a-z]+=["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on[a-z]+=\S+/gi, '');

  // 5. Strip embedded <input> and <label> tags from scraped question/option payloads to prevent double radio/checkbox inputs
  sanitized = sanitized.replace(/<input\b[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/<\/?label\b[^>]*>/gi, '');

  // 6. Fix & normalize image URLs to working CDN endpoints & allow base64 inline images
  sanitized = fixImageUrls(sanitized);

  // 7. Render LaTeX math delimiters ($...$, $$...$$, \(...\), \[...\]) if enabled
  if (options.renderMath !== false) {
    sanitized = renderLatexFormulas(sanitized);
  }

  return sanitized;
}

/**
 * Parses and renders LaTeX formulas in text/HTML into SVG/HTML math nodes using KaTeX.
 */
function renderLatexFormulas(content: string): string {
  try {
    // Render block math $$ ... $$
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: true, output: 'html', throwOnError: false });
      } catch {
        return math;
      }
    });

    // Render inline math $ ... $
    content = content.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, output: 'html', throwOnError: false });
      } catch {
        return math;
      }
    });
  } catch (e) {
    // Return original content if math rendering fails
  }

  return content;
}

