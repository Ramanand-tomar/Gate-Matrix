import { describe, it, expect } from 'vitest';
import { normalizePaper, SourcePaper } from '@/lib/normalizer';

describe('Phase 03 — Schema Normalizer Unit Tests', () => {
  const mockPaper: SourcePaper = {
    title: 'CS Sample Test 2026',
    branch: 'COMPUTER SCIENCE ENGINEERING',
    provider: 'GO Classes',
    series: 'GATE 2026',
    file_name: 'test_01.json',
    total_questions: 3,
    questions: [
      {
        qnum: '1',
        qtype: 'MCQ',
        correct_answer: 'B',
        marks: { positive: '2.0', negative: '0.66' },
        question_text: 'Worst-case binary search complexity?',
        question_html: '<div>Worst-case binary search complexity?</div>',
        options: {
          A: { text: 'O(1)', html: '<div>O(1)</div>' },
          B: { text: 'O(log n)', html: '<div>O(log n)</div>' },
        },
      },
      {
        qnum: '2',
        qtype: 'MSQ',
        correct_answer: 'A,C',
        marks: { positive: '2.0', negative: '0' },
        question_text: 'Select all prime numbers.',
        options: {
          A: { text: '2', html: '<div>2</div>' },
          B: { text: '4', html: '<div>4</div>' },
          C: { text: '5', html: '<div>5</div>' },
        },
      },
      {
        qnum: '3',
        qtype: 'NAT',
        correct_answer: '20',
        nat_range: { low: '19.5', high: '20.5' },
        marks: { positive: '2.0', negative: '0' },
        question_text: 'Cartesian product of 5 and 4 elements?',
      },
    ],
  };

  it('P03-V04: Parses MCQ, MSQ, and NAT into separate questionVersions and restricted answerKeys', () => {
    const { testVersion, questionVersions, answerKeys } = normalizePaper(mockPaper, 'cs_sample_01');

    expect(testVersion.testId).toBe('cs_sample_01');
    expect(testVersion.branchCode).toBe('CS');
    expect(testVersion.totalQuestions).toBe(3);

    expect(questionVersions).toHaveLength(3);
    expect(questionVersions[0].qtype).toBe('MCQ');

    expect(answerKeys).toHaveLength(3);
    expect(answerKeys[0].correctOptions).toEqual(['B']);
    expect(answerKeys[1].correctOptions).toEqual(['A', 'C']);
    expect(answerKeys[2].natRange).toEqual({ low: 19.5, high: 20.5 });
  });

  it('P03-V06: Preserves exact rational fraction representation for decimal negative penalties (0.66 -> 66/100)', () => {
    const { answerKeys } = normalizePaper(mockPaper, 'cs_sample_01');

    expect(answerKeys[0].marksNegativeRational).toEqual({ num: 66, den: 100 });
  });
});
