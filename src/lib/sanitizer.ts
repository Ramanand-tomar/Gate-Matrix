import katex from 'katex';

/**
 * HTML Sanitizer & Security Parser for GATE Question & Solution Content.
 * Enforces XSS protection, strips answer-revealing hints/classes/data-attributes,
 * and renders LaTeX math formulas safely using KaTeX.
 */

// List of allowed tags for questions and solutions
const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'br', 'b', 'strong', 'i', 'em', 'u', 'sub', 'sup',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'ul', 'ol', 'li', 'code', 'pre', 'img', 'details', 'summary', 'blockquote'
]);

// Dangerous attributes to strip
const DISALLOWED_ATTR_PREFIXES = ['on', 'data-correct', 'data-right', 'data-nat'];

export interface SanitizeOptions {
  stripSolutions?: boolean;
  renderMath?: boolean;
}

export function sanitizeHtml(htmlString: string, options: SanitizeOptions = {}): string {
  if (!htmlString) return '';

  let sanitized = htmlString;

  // 1. Remove dangerous script and iframe blocks
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

  // 4b. Clean broken [IMAGE] placeholders inside img tags if any remain
  sanitized = sanitized.replace(/<img\s+[^>]*src=["']\[IMAGE\]["'][^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/\[IMAGE\]/gi, '');

  // 4c. Strip embedded <input> and <label> tags from scraped question/option payloads to prevent double radio/checkbox inputs
  sanitized = sanitized.replace(/<input\b[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/<\/?label\b[^>]*>/gi, '');

  // 5. Render LaTeX math delimiters ($...$, $$...$$, \(...\), \[...\]) if enabled
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
