import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitizer';

describe('Phase 02 — Safe HTML & Math Sanitizer Tests', () => {
  it('P02-V04: Strips malicious <script> tags and onerror event handlers', () => {
    const maliciousInput = `<p>What is 2+2?</p><script>alert('xss')</script><img src="x" onerror="alert(1)" />`;
    const clean = sanitizeHtml(maliciousInput);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror=');
    expect(clean).toContain('<p>What is 2+2?</p>');
  });

  it('P02-V05: Disarms answer-revealing data-correct attributes and solution containers when stripSolutions=true', () => {
    const rawQuestionHtml = `
      <div class="qtext" data-correct="B" data-nat-low="10" data-nat-high="10">
        Find the value of $x$.
      </div>
      <details class="solution">
        <summary>Solution</summary>
        <p>The answer is 10 because $x=10$.</p>
      </details>
    `;

    const clean = sanitizeHtml(rawQuestionHtml, { stripSolutions: true });

    expect(clean).not.toContain('data-correct=');
    expect(clean).not.toContain('data-nat-low=');
    expect(clean).not.toContain('<details class="solution">');
    expect(clean).toContain('Find the value of');
  });

  it('P02-V08: Successfully renders LaTeX math expressions into KaTeX output', () => {
    const mathInput = `Calculate $E = mc^2$ and $$\\int_0^1 x dx$$`;
    const clean = sanitizeHtml(mathInput);

    expect(clean).toContain('katex');
    expect(clean).toContain('mord');
  });
});
