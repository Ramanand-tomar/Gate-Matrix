import { NextResponse } from 'next/server';
import { saveAttempt, getUserAttempts, getPaperById } from '@/lib/firebase/models';
import { scoreTestAttempt, ScorerItemKey, UserResponse } from '@/lib/scorer';

export const dynamic = 'force-dynamic';

// GET /api/attempts?uid=XYZ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ success: false, error: 'User uid required' }, { status: 400 });
    }

    const attempts = await getUserAttempts(uid);
    return NextResponse.json({ success: true, count: attempts.length, attempts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/attempts (Submit test attempt with server-side scoring verification - GM-10/R3)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, paper_id, answers, time_taken_seconds } = body;

    if (!uid || !paper_id) {
      return NextResponse.json({ success: false, error: 'uid and paper_id are required' }, { status: 400 });
    }

    let finalScore = body.score || 0;
    let maxScore = body.max_score || 0;
    let accuracy = body.accuracy || 0;
    let paperTitle = body.paper_title || 'GATE Test Attempt';

    // Fetch official paper and perform server-side scoring check if available
    const paper = await getPaperById(paper_id);
    if (paper && paper.questions && paper.questions.length > 0) {
      paperTitle = paper.title;
      const answerKeys: Record<string, ScorerItemKey> = {};
      const userResponses: Record<string, UserResponse> = {};

      paper.questions.forEach((q, idx) => {
        const qvid = q.question_id || `q_${idx + 1}`;
        const correctOpt = Array.isArray(q.correct_answer)
          ? q.correct_answer
          : typeof q.correct_answer === 'string'
          ? [q.correct_answer]
          : q.correct_answer != null
          ? [String(q.correct_answer)]
          : ['A'];

        answerKeys[qvid] = {
          qvid,
          qtype: q.type || 'MCQ',
          correctOptions: correctOpt,
          natRange: null,
          marksPositive: q.marks || 1,
          marksNegativeRational: { num: q.negative_marks || 0, den: 1 },
        };

        const userAns = answers ? answers[idx + 1] : undefined;
        if (userAns) {
          userResponses[qvid] = {
            qvid,
            selectedOptions: typeof userAns === 'string' ? [userAns] : Array.isArray(userAns) ? userAns : [],
            natValue: typeof userAns === 'number' || typeof userAns === 'string' ? String(userAns) : undefined,
          };
        }
      });

      const scoreSummary = scoreTestAttempt(answerKeys, userResponses);
      finalScore = scoreSummary.netScore;
      maxScore = scoreSummary.maxPossibleMarks;
      accuracy = scoreSummary.accuracyPercentage;
    }

    const attemptPayload = {
      uid,
      paper_id,
      paper_title: paperTitle,
      score: finalScore,
      max_score: maxScore,
      accuracy,
      answers: answers || {},
      time_taken_seconds: time_taken_seconds || 0,
    };

    const result = await saveAttempt(attemptPayload);
    return NextResponse.json({ success: true, attempt: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
