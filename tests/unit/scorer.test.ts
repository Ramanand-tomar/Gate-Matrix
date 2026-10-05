import { describe, it, expect } from 'vitest';
import { scoreTestAttempt, ScorerItemKey, UserResponse } from '@/lib/scorer';

describe('Phase 07 — Pure Server Scorer Golden Fixtures', () => {
  const sampleKeys: Record<string, ScorerItemKey> = {
    q1: {
      qvid: 'q1',
      qtype: 'MCQ',
      correctOptions: ['B'],
      natRange: null,
      marksPositive: 2,
      marksNegativeRational: { num: 66, den: 100 }, // -0.66
    },
    q2: {
      qvid: 'q2',
      qtype: 'MSQ',
      correctOptions: ['A', 'C'],
      natRange: null,
      marksPositive: 2,
      marksNegativeRational: { num: 0, den: 1 },
    },
    q3: {
      qvid: 'q3',
      qtype: 'NAT',
      correctOptions: [],
      natRange: { low: 2.49, high: 2.51 },
      marksPositive: 2,
      marksNegativeRational: { num: 0, den: 1 },
    },
  };

  it('P07-V01: Scores MCQ correct (+2) and MCQ wrong (-0.66 penalty)', () => {
    const responsesCorrect: Record<string, UserResponse> = {
      q1: { qvid: 'q1', selectedOptions: ['B'] },
    };
    const summaryCorrect = scoreTestAttempt({ q1: sampleKeys.q1 }, responsesCorrect);
    expect(summaryCorrect.netScore).toBe(2);
    expect(summaryCorrect.correctCount).toBe(1);

    const responsesWrong: Record<string, UserResponse> = {
      q1: { qvid: 'q1', selectedOptions: ['A'] },
    };
    const summaryWrong = scoreTestAttempt({ q1: sampleKeys.q1 }, responsesWrong);
    expect(summaryWrong.netScore).toBe(-0.66);
    expect(summaryWrong.wrongCount).toBe(1);
    expect(summaryWrong.totalPenaltyMarks).toBe(0.66);
  });

  it('P07-V01: MSQ exact match awards +2, partial selection awards 0', () => {
    // Exact match (reordered A,C as C,A)
    const exactResp: Record<string, UserResponse> = {
      q2: { qvid: 'q2', selectedOptions: ['C', 'A'] },
    };
    const summaryExact = scoreTestAttempt({ q2: sampleKeys.q2 }, exactResp);
    expect(summaryExact.netScore).toBe(2);
    expect(summaryExact.correctCount).toBe(1);

    // Partial selection (only A)
    const partialResp: Record<string, UserResponse> = {
      q2: { qvid: 'q2', selectedOptions: ['A'] },
    };
    const summaryPartial = scoreTestAttempt({ q2: sampleKeys.q2 }, partialResp);
    expect(summaryPartial.netScore).toBe(0);
    expect(summaryPartial.wrongCount).toBe(1);
  });

  it('P07-V01: NAT range boundary tests [2.49, 2.51]', () => {
    // Boundary endpoints
    const lowResp = scoreTestAttempt({ q3: sampleKeys.q3 }, { q3: { qvid: 'q3', natValue: '2.49' } });
    expect(lowResp.correctCount).toBe(1);

    const highResp = scoreTestAttempt({ q3: sampleKeys.q3 }, { q3: { qvid: 'q3', natValue: '2.51' } });
    expect(highResp.correctCount).toBe(1);

    // Outside boundary
    const outResp = scoreTestAttempt({ q3: sampleKeys.q3 }, { q3: { qvid: 'q3', natValue: '2.5101' } });
    expect(outResp.correctCount).toBe(0);
    expect(outResp.wrongCount).toBe(1);
  });
});
