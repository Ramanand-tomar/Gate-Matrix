export interface TopicPerformance {
  topicName: string;
  totalFreshResponses: number;
  correctCount: number;
  testCount: number;
  accuracyPercentage: number;
  signal: 'Needs work' | 'Building' | 'Strong recently' | 'Need more evidence';
  recommendedAction?: string;
}

/**
 * Calculates topic mastery evidence according to PRD specification:
 * - < 10 responses: "Need more evidence"
 * - < 50% accuracy: "Needs work" (Red)
 * - 50% to 79% accuracy: "Building" (Amber)
 * - >= 80% accuracy: "Strong recently" (Teal)
 */
export function calculateTopicMastery(
  topicName: string,
  correctCount: number,
  totalFreshResponses: number,
  testCount: number
): TopicPerformance {
  if (totalFreshResponses < 10) {
    return {
      topicName,
      totalFreshResponses,
      correctCount,
      testCount,
      accuracyPercentage: totalFreshResponses > 0 ? parseFloat(((correctCount / totalFreshResponses) * 100).toFixed(1)) : 0,
      signal: 'Need more evidence',
      recommendedAction: 'Take a short diagnostic quiz',
    };
  }

  const accuracyPercentage = parseFloat(((correctCount / totalFreshResponses) * 100).toFixed(1));

  let signal: TopicPerformance['signal'] = 'Building';
  let recommendedAction = 'Maintain with periodic revision';

  if (accuracyPercentage < 50) {
    signal = 'Needs work';
    recommendedAction = `Practice ${topicName} topic questions`;
  } else if (accuracyPercentage >= 80) {
    signal = 'Strong recently';
    recommendedAction = 'Maintain with fresh questions';
  }

  return {
    topicName,
    totalFreshResponses,
    correctCount,
    testCount,
    accuracyPercentage,
    signal,
    recommendedAction,
  };
}
