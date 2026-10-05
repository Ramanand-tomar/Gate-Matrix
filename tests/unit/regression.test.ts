import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitizer';
import { normalizePaper } from '@/lib/normalizer';
import { scoreTestAttempt } from '@/lib/scorer';
import { checkUserEntitlement } from '@/lib/commerce/entitlements';
import { calculateTopicMastery } from '@/lib/analytics';

describe('Phase 11 — Integrated Vertical Regression Suite', () => {
  it('P11-V01: End-to-End Vertical Pipeline (Audit -> Normalize -> Sanitize -> Score -> Entitlement -> Mastery)', () => {
    // 1. Raw paper item
    const rawPaper = {
      title: 'Integrated Regression Test CS',
      branch: 'COMPUTER SCIENCE ENGINEERING',
      provider: 'GO Classes',
      series: 'GATE 2026',
      file_name: 'reg_01.json',
      total_questions: 1,
      questions: [
        {
          qnum: '1',
          qtype: 'MCQ',
          correct_answer: 'B',
          marks: { positive: '2.0', negative: '0.66' },
          question_html: '<div>What is $O(1)$?</div>',
          options: { A: { text: 'N', html: '<div>N</div>' }, B: { text: 'Constant', html: '<div>Constant</div>' } },
        },
      ],
    };

    // 2. Normalize
    const { testVersion, questionVersions, answerKeys } = normalizePaper(rawPaper, 'reg_cs_01');
    expect(testVersion.branchCode).toBe('CS');
    expect(questionVersions[0].qvid).toBe('reg_cs_01_q1');

    // 3. Sanitize
    const cleanHtml = sanitizeHtml(questionVersions[0].questionHtml, { stripSolutions: true });
    expect(cleanHtml).toContain('katex');

    // 4. Score
    const keyMap = { [answerKeys[0].qvid]: answerKeys[0] };
    const userResponses = { reg_cs_01_q1: { qvid: 'reg_cs_01_q1', selectedOptions: ['B'] } };
    const scoreSummary = scoreTestAttempt(keyMap, userResponses);
    expect(scoreSummary.netScore).toBe(2);

    // 5. Entitlement
    const userGrants = [{
      grantId: 'g1',
      userId: 'user_reg',
      productType: 'BRANCH_PASS' as const,
      branchCode: 'CS',
      productId: 'cs_pass',
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2027-12-31T23:59:59Z',
      isActive: true,
      orderId: 'ord_reg',
    }];
    const entitlement = checkUserEntitlement(userGrants, 'CS', 'reg_cs_01');
    expect(entitlement.hasAccess).toBe(true);

    // 6. Analytics
    const mastery = calculateTopicMastery('Algorithms', 15, 18, 3);
    expect(mastery.signal).toBe('Strong recently');
  });
});
