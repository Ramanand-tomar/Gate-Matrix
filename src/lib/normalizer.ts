/**
 * Data Normalizer Module for GATE Test Papers.
 * Transforms raw source JSON papers into normalized, versioned Firestore structures:
 * 1. QuestionVersion (Public Learner DTO)
 * 2. AnswerKey (Private Restricted Document)
 * 3. TestVersion (Test Manifest & Item Sequence)
 */

export interface SourceQuestion {
  qnum: string;
  qtype: string;
  correct_answer?: string;
  nat_range?: { low: string; high: string } | null;
  marks?: { positive: string; negative: string };
  tags?: string;
  question_text?: string;
  question_html?: string;
  question_images?: string[];
  options?: Record<string, { text: string; html: string }>;
  answer_text?: string;
  solution_text?: string;
  solution_html?: string;
  solution_images?: string[];
}

export interface SourcePaper {
  title: string;
  branch: string;
  provider: string;
  series: string;
  file_name: string;
  total_questions: number;
  questions: SourceQuestion[];
}

export interface NormalizedQuestionVersion {
  qvid: string;
  paperId: string;
  qnum: string;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  questionHtml: string;
  questionText: string;
  options: Record<string, { text: string; html: string }>;
  tags: string[];
}

export interface NormalizedAnswerKey {
  qvid: string;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  correctOptions: string[];
  natRange: { low: number; high: number } | null;
  marksPositive: number;
  marksNegativeRational: { num: number; den: number };
  solutionHtml: string;
  solutionText: string;
}

export interface NormalizedTestVersion {
  testId: string;
  title: string;
  branchCode: string;
  provider: string;
  seriesLabel: string;
  totalQuestions: number;
  items: Array<{
    itemId: string;
    ordinal: number;
    qvid: string;
    qtype: 'MCQ' | 'MSQ' | 'NAT';
  }>;
}

/**
 * Normalizes a raw source paper into versioned documents.
 */
export function normalizePaper(paper: SourcePaper, paperId: string): {
  testVersion: NormalizedTestVersion;
  questionVersions: NormalizedQuestionVersion[];
  answerKeys: NormalizedAnswerKey[];
} {
  const branchCode = getBranchCode(paper.branch);
  const items: NormalizedTestVersion['items'] = [];
  const questionVersions: NormalizedQuestionVersion[] = [];
  const answerKeys: NormalizedAnswerKey[] = [];

  paper.questions.forEach((q, index) => {
    const ordinal = index + 1;
    const qvid = `${paperId}_q${ordinal}`;
    const itemId = `item_${qvid}`;
    const qtype = (q.qtype || 'MCQ').toUpperCase() as 'MCQ' | 'MSQ' | 'NAT';

    // 1. Question Version (Learner facing)
    questionVersions.push({
      qvid,
      paperId,
      qnum: q.qnum || String(ordinal),
      qtype,
      questionHtml: q.question_html || '',
      questionText: q.question_text || '',
      options: q.options || {},
      tags: q.tags ? q.tags.split('•').map(t => t.trim()) : [],
    });

    // 2. Answer Key (Private server scoring only)
    const posMarks = parseFloat(q.marks?.positive || '2.0');
    const negStr = q.marks?.negative || '0.66';
    const negRational = parseRationalPenalty(negStr);

    let correctOptions: string[] = [];
    if (q.correct_answer) {
      correctOptions = q.correct_answer
        .replace(/Correct answer:/i, '')
        .split(/[,]/)
        .map(o => o.trim())
        .filter(Boolean);
    }

    let natRange: { low: number; high: number } | null = null;
    if (q.nat_range && q.nat_range.low !== undefined) {
      natRange = {
        low: parseFloat(q.nat_range.low),
        high: parseFloat(q.nat_range.high),
      };
    } else if (qtype === 'NAT' && q.correct_answer) {
      const val = parseFloat(q.correct_answer.replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) {
        natRange = { low: val, high: val };
      }
    }

    answerKeys.push({
      qvid,
      qtype,
      correctOptions,
      natRange,
      marksPositive: posMarks,
      marksNegativeRational: negRational,
      solutionHtml: q.solution_html || '',
      solutionText: q.solution_text || '',
    });

    // 3. Test Item Reference
    items.push({
      itemId,
      ordinal,
      qvid,
      qtype,
    });
  });

  const testVersion: NormalizedTestVersion = {
    testId: paperId,
    title: paper.title,
    branchCode,
    provider: paper.provider || 'UNKNOWN',
    seriesLabel: paper.series || 'DEFAULT',
    totalQuestions: items.length,
    items,
  };

  return { testVersion, questionVersions, answerKeys };
}

function getBranchCode(branchRaw: string): string {
  const upper = (branchRaw || '').toUpperCase();
  if (upper.includes('COMPUTER')) return 'CS';
  if (upper.includes('DATA SCIENCE')) return 'DA';
  if (upper.includes('CIVIL')) return 'CE';
  if (upper.includes('ELECTRICAL')) return 'EE';
  if (upper.includes('ELECTRONICS')) return 'EC';
  if (upper.includes('MECHANICAL')) return 'ME';
  return 'GEN';
}

function parseRationalPenalty(negStr: string): { num: number; den: number } {
  const val = parseFloat(negStr);
  if (isNaN(val) || val === 0) return { num: 0, den: 1 };
  if (negStr.includes('0.66') || negStr.includes('0.67')) return { num: 66, den: 100 };
  if (negStr.includes('0.33')) return { num: 33, den: 100 };
  return { num: Math.round(val * 100), den: 100 };
}
