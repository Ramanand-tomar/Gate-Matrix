import { NextRequest, NextResponse } from 'next/server';
import { sanitizeHtml } from '@/lib/sanitizer';

/**
 * Learner Question DTO Server Endpoint.
 * Projects learner-safe question version, strictly stripping answer keys and solution text.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qvid: string }> }
) {
  const { qvid } = await params;

  if (!qvid) {
    return NextResponse.json({ error: 'Missing qvid parameter' }, { status: 400 });
  }

  // Simulated server document projection (In production, fetched via adminDb)
  const learnerDto = {
    qvid,
    qtype: 'MCQ',
    qnum: '1',
    questionHtml: sanitizeHtml('<div>What is the time complexity of binary search?</div>', { stripSolutions: true }),
    options: {
      A: { text: 'O(1)', html: '<div>O(1)</div>' },
      B: { text: 'O(log n)', html: '<div>O(log n)</div>' },
      C: { text: 'O(n)', html: '<div>O(n)</div>' },
      D: { text: 'O(n^2)', html: '<div>O(n^2)</div>' },
    },
    // STRICT SECURITY GUARANTEE: correct_answer, nat_range, and solution_html are EXCLUDED
  };

  return NextResponse.json(learnerDto, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
