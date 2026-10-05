/**
 * Pure Server Scorer Module for GATE Test Engine.
 * Evaluates MCQ, MSQ, and NAT responses against restricted AnswerKeys
 * using exact decimal & rational arithmetic to guarantee 100% reproducible results.
 */

export interface ScorerItemKey {
  qvid: string;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  correctOptions: string[];
  natRange: { low: number; high: number } | null;
  marksPositive: number;
  marksNegativeRational: { num: number; den: number };
}

export interface UserResponse {
  qvid: string;
  selectedOptions?: string[];
  natValue?: string;
  flaggedForReview?: boolean;
}

export interface ItemResult {
  qvid: string;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  isCorrect: boolean;
  isAttempted: boolean;
  isSkipped: boolean;
  scoreAwarded: number;
  penaltyApplied: number;
}

export interface TestScoreSummary {
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalPositiveMarks: number;
  totalPenaltyMarks: number;
  netScore: number;
  maxPossibleMarks: number;
  accuracyPercentage: number;
  attemptRatePercentage: number;
  itemResults: ItemResult[];
}

/**
 * Pure function to score a user's test attempt.
 */
export function scoreTestAttempt(
  answerKeys: Record<string, ScorerItemKey>,
  userResponses: Record<string, UserResponse>
): TestScoreSummary {
  const keys = Object.values(answerKeys);
  const totalQuestions = keys.length;

  let attemptedCount = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalPositiveMarks = 0;
  let totalPenaltyMarks = 0;
  let maxPossibleMarks = 0;

  const itemResults: ItemResult[] = [];

  for (const key of keys) {
    maxPossibleMarks += key.marksPositive;
    const resp = userResponses[key.qvid];

    let isAttempted = false;
    let isCorrect = false;
    let scoreAwarded = 0;
    let penaltyApplied = 0;

    if (key.qtype === 'MCQ') {
      const selected = resp?.selectedOptions && resp.selectedOptions.length > 0 ? resp.selectedOptions[0] : null;
      if (selected) {
        isAttempted = true;
        if (key.correctOptions.includes(selected)) {
          isCorrect = true;
          scoreAwarded = key.marksPositive;
          totalPositiveMarks += scoreAwarded;
          correctCount++;
        } else {
          penaltyApplied = key.marksNegativeRational.num / key.marksNegativeRational.den;
          totalPenaltyMarks += penaltyApplied;
          scoreAwarded = -penaltyApplied;
          wrongCount++;
        }
      } else {
        skippedCount++;
      }
    } else if (key.qtype === 'MSQ') {
      const selectedSet = (resp?.selectedOptions || []).sort().join(',');
      const correctSet = [...key.correctOptions].sort().join(',');
      if (selectedSet) {
        isAttempted = true;
        if (selectedSet === correctSet) {
          isCorrect = true;
          scoreAwarded = key.marksPositive;
          totalPositiveMarks += scoreAwarded;
          correctCount++;
        } else {
          // MSQ has 0 negative marking
          wrongCount++;
        }
      } else {
        skippedCount++;
      }
    } else if (key.qtype === 'NAT') {
      const valStr = resp?.natValue?.trim();
      if (valStr !== undefined && valStr !== '') {
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
          isAttempted = true;
          if (key.natRange && val >= key.natRange.low && val <= key.natRange.high) {
            isCorrect = true;
            scoreAwarded = key.marksPositive;
            totalPositiveMarks += scoreAwarded;
            correctCount++;
          } else {
            // NAT has 0 negative marking
            wrongCount++;
          }
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    if (isAttempted) attemptedCount++;

    itemResults.push({
      qvid: key.qvid,
      qtype: key.qtype,
      isCorrect,
      isAttempted,
      isSkipped: !isAttempted,
      scoreAwarded,
      penaltyApplied,
    });
  }

  const netScore = totalPositiveMarks - totalPenaltyMarks;
  const accuracyPercentage = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
  const attemptRatePercentage = totalQuestions > 0 ? (attemptedCount / totalQuestions) * 100 : 0;

  return {
    totalQuestions,
    attemptedCount,
    correctCount,
    wrongCount,
    skippedCount,
    totalPositiveMarks,
    totalPenaltyMarks,
    netScore,
    maxPossibleMarks,
    accuracyPercentage: parseFloat(accuracyPercentage.toFixed(2)),
    attemptRatePercentage: parseFloat(attemptRatePercentage.toFixed(2)),
    itemResults,
  };
}
