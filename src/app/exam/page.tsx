'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MathRenderer } from '@/components/MathRenderer';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';

interface QuestionItem {
  qnum: number;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  marksPos: number;
  marksNeg: string;
  bodyHtml: string;
  options?: string[];
  correctAnswer?: any;
  solutionHtml?: string;
}

interface EvaluationItemResult {
  qidx: number;
  qnum: number;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  isAttempted: boolean;
  isCorrect: boolean;
  scoreAwarded: number;
  userAnsText: string;
  correctAnsText: string;
}

interface EvaluationSummary {
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  positiveMarks: number;
  penaltyMarks: number;
  netScore: number;
  maxMarks: number;
  accuracy: number;
  itemResults: EvaluationItemResult[];
}

function ExamEngineContent() {
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId');
  const { user } = useAuth();

  const fallbackQuestions: QuestionItem[] = [
    {
      qnum: 1,
      qtype: 'MCQ',
      marksPos: 2,
      marksNeg: '-0.66',
      bodyHtml: 'What is the worst-case time complexity of binary search on a sorted array of $n$ elements?',
      options: ['$O(1)$', '$O(\\log n)$', '$O(n)$', '$O(n^2)$'],
      correctAnswer: 1,
      solutionHtml: 'Each comparison halves the search interval, so comparisons grow logarithmically $O(\\log n)$.',
    },
    {
      qnum: 2,
      qtype: 'MSQ',
      marksPos: 2,
      marksNeg: '0.00',
      bodyHtml: 'Which of the following are prime numbers? Select all correct answers.',
      options: ['2', '4', '5', '9'],
      correctAnswer: [0, 2],
      solutionHtml: 'Two ($2$) and five ($5$) are prime numbers. Four and nine have factors other than 1 and themselves.',
    },
    {
      qnum: 3,
      qtype: 'NAT',
      marksPos: 2,
      marksNeg: '0.00',
      bodyHtml: 'A relation $R_1$ contains 5 rows and relation $R_2$ contains 4 rows. How many rows are in their Cartesian product $R_1 \\times R_2$?',
      correctAnswer: 20,
      solutionHtml: 'A Cartesian product pairs every row of $R_1$ with every row of $R_2$: $5 \\times 4 = 20$.',
    },
  ];

  const [questions, setQuestions] = useState<QuestionItem[]>(fallbackQuestions);
  const [paperTitle, setPaperTitle] = useState('GATE Official CBT Practice Paper');
  const [loadingDb, setLoadingDb] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [msqAnswers, setMsqAnswers] = useState<Record<number, number[]>>({});
  const [natAnswers, setNatAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [solutionFilter, setSolutionFilter] = useState<'ALL' | 'INCORRECT' | 'CORRECT' | 'UNATTEMPTED'>('ALL');

  useEffect(() => {
    async function loadPaperFromFirestore() {
      setLoadingDb(true);
      try {
        let targetId = paperId;
        if (!targetId) {
          const listRes = await fetch('/api/papers');
          const listData = await listRes.json();
          if (listData.success && listData.papers && listData.papers.length > 0) {
            targetId = listData.papers[0].paper_id;
          }
        }

        if (targetId) {
          const res = await fetch(`/api/papers/${targetId}`);
          const data = await res.json();
          if (data.success && data.paper && data.paper.questions && data.paper.questions.length > 0) {
            setPaperTitle(data.paper.title);
            const mappedQs: QuestionItem[] = data.paper.questions.map((q: any, idx: number) => {
              let optionsArr: string[] | undefined = undefined;
              if (q.options) {
                if (Array.isArray(q.options)) {
                  optionsArr = q.options.map((opt: any) =>
                    typeof opt === 'string' ? opt : opt?.html || opt?.text || String(opt)
                  );
                } else if (typeof q.options === 'object') {
                  optionsArr = Object.values(q.options).map((opt: any) =>
                    typeof opt === 'string' ? opt : opt?.html || opt?.text || String(opt)
                  );
                }
              }

              let pos = 1;
              let neg = 0;
              if (typeof q.marks === 'number') {
                pos = q.marks;
              } else if (typeof q.marks === 'string') {
                pos = parseFloat(q.marks) || 1;
              } else if (typeof q.marks === 'object' && q.marks !== null) {
                pos = parseFloat(q.marks.positive || q.marks.num || '1') || 1;
                if ('negative' in q.marks) {
                  neg = parseFloat(q.marks.negative) || 0;
                }
              }

              if (q.negative_marks !== undefined && q.negative_marks !== null) {
                if (typeof q.negative_marks === 'number') {
                  neg = q.negative_marks;
                } else if (typeof q.negative_marks === 'string') {
                  neg = parseFloat(q.negative_marks) || 0;
                }
              }

              return {
                qnum: idx + 1,
                qtype: (q.type as any) || 'MCQ',
                marksPos: pos,
                marksNeg: neg > 0 ? `-${neg}` : '0.00',
                bodyHtml: q.question_html || 'Question formulation',
                options: optionsArr,
                correctAnswer: q.correct_answer,
                solutionHtml: q.solution_html,
              };
            });
            setQuestions(mappedQs);
            setSecondsLeft(mappedQs.length * 120);
          }
        }
      } catch (err) {
        console.error('Failed loading paper questions:', err);
      } finally {
        setLoadingDb(false);
      }
    }
    loadPaperFromFirestore();
  }, [paperId]);

  useEffect(() => {
    if (isSubmitted || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, secondsLeft]);

  const currentQ = questions[currentIdx] || questions[0];

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMcqSelect = (optIdx: number) => {
    if (isSubmitted) return;
    setMcqAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleMsqToggle = (optIdx: number) => {
    if (isSubmitted) return;
    const current = msqAnswers[currentIdx] || [];
    const updated = current.includes(optIdx)
      ? current.filter((x) => x !== optIdx)
      : [...current, optIdx];
    setMsqAnswers((prev) => ({ ...prev, [currentIdx]: updated }));
  };

  const handleNatChange = (val: string) => {
    if (isSubmitted) return;
    setNatAnswers((prev) => ({ ...prev, [currentIdx]: val }));
  };

  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    if (q.qtype === 'MCQ') return mcqAnswers[idx] !== undefined;
    if (q.qtype === 'MSQ') return (msqAnswers[idx] || []).length > 0;
    if (q.qtype === 'NAT') return (natAnswers[idx] || '').trim() !== '';
    return false;
  };

  const clearResponse = () => {
    if (isSubmitted) return;
    if (currentQ.qtype === 'MCQ') {
      const copy = { ...mcqAnswers };
      delete copy[currentIdx];
      setMcqAnswers(copy);
    } else if (currentQ.qtype === 'MSQ') {
      const copy = { ...msqAnswers };
      delete copy[currentIdx];
      setMsqAnswers(copy);
    } else {
      const copy = { ...natAnswers };
      delete copy[currentIdx];
      setNatAnswers(copy);
    }
  };

  const toggleFlag = () => {
    if (isSubmitted) return;
    setFlagged((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  };

function formatCorrectAnswer(q: QuestionItem): string {
  if (q.correctAnswer === undefined || q.correctAnswer === null) return 'N/A';
  if (q.qtype === 'MCQ') {
    if (typeof q.correctAnswer === 'number') {
      const char = String.fromCharCode(65 + q.correctAnswer);
      return `Option ${char}`;
    }
    return `Option ${q.correctAnswer}`;
  }
  if (q.qtype === 'MSQ') {
    if (Array.isArray(q.correctAnswer)) {
      return q.correctAnswer
        .map((idx: any) =>
          typeof idx === 'number' ? `Option ${String.fromCharCode(65 + idx)}` : String(idx)
        )
        .join(', ');
    }
    return String(q.correctAnswer);
  }
  if (q.qtype === 'NAT') {
    if (typeof q.correctAnswer === 'object' && q.correctAnswer !== null) {
      if ('low' in q.correctAnswer && 'high' in q.correctAnswer) {
        return `Range [${q.correctAnswer.low} to ${q.correctAnswer.high}]`;
      }
    }
    return String(q.correctAnswer);
  }
  return String(q.correctAnswer);
}

function formatUserAnswer(
  q: QuestionItem,
  idx: number,
  mcqAnswers: Record<number, number>,
  msqAnswers: Record<number, number[]>,
  natAnswers: Record<number, string>
): { text: string; isAttempted: boolean } {
  if (q.qtype === 'MCQ') {
    const ans = mcqAnswers[idx];
    if (ans === undefined) return { text: 'Not Attempted', isAttempted: false };
    return { text: `Option ${String.fromCharCode(65 + ans)}`, isAttempted: true };
  }
  if (q.qtype === 'MSQ') {
    const ansArr = msqAnswers[idx] || [];
    if (ansArr.length === 0) return { text: 'Not Attempted', isAttempted: false };
    const text = ansArr.map((i) => `Option ${String.fromCharCode(65 + i)}`).join(', ');
    return { text, isAttempted: true };
  }
  if (q.qtype === 'NAT') {
    const val = (natAnswers[idx] || '').trim();
    if (!val) return { text: 'Not Attempted', isAttempted: false };
    return { text: val, isAttempted: true };
  }
  return { text: 'Not Attempted', isAttempted: false };
}

function evaluateSingleQuestion(
  q: QuestionItem,
  idx: number,
  mcqAnswers: Record<number, number>,
  msqAnswers: Record<number, number[]>,
  natAnswers: Record<number, string>
): EvaluationItemResult {
  const userRes = formatUserAnswer(q, idx, mcqAnswers, msqAnswers, natAnswers);
  const correctAnsText = formatCorrectAnswer(q);

  if (!userRes.isAttempted) {
    return {
      qidx: idx,
      qnum: q.qnum,
      qtype: q.qtype,
      isAttempted: false,
      isCorrect: false,
      scoreAwarded: 0,
      userAnsText: 'Not Attempted',
      correctAnsText,
    };
  }

  let isCorrect = false;
  let scoreAwarded = 0;
  const pos = q.marksPos;
  const neg = Math.abs(parseFloat(q.marksNeg) || 0);

  if (q.qtype === 'MCQ') {
    const selected = mcqAnswers[idx];
    let targetOpt = -1;
    if (typeof q.correctAnswer === 'number') targetOpt = q.correctAnswer;
    else if (typeof q.correctAnswer === 'string') {
      const match = q.correctAnswer.trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(match)) targetOpt = match.charCodeAt(0) - 65;
      else targetOpt = parseInt(match, 10);
    }

    if (selected === targetOpt) {
      isCorrect = true;
      scoreAwarded = pos;
    } else {
      scoreAwarded = -neg;
    }
  } else if (q.qtype === 'MSQ') {
    const selectedArr = (msqAnswers[idx] || []).slice().sort((a, b) => a - b);
    let targetArr: number[] = [];
    if (Array.isArray(q.correctAnswer)) {
      targetArr = q.correctAnswer
        .map((x: any) => (typeof x === 'number' ? x : String(x).charCodeAt(0) - 65))
        .sort((a, b) => a - b);
    }
    if (
      selectedArr.length === targetArr.length &&
      selectedArr.every((val, i) => val === targetArr[i])
    ) {
      isCorrect = true;
      scoreAwarded = pos;
    } else {
      scoreAwarded = 0;
    }
  } else if (q.qtype === 'NAT') {
    const val = parseFloat(natAnswers[idx] || '');
    if (!isNaN(val)) {
      let low = 0;
      let high = 0;
      if (typeof q.correctAnswer === 'number') {
        low = q.correctAnswer - 0.01;
        high = q.correctAnswer + 0.01;
      } else if (typeof q.correctAnswer === 'string') {
        const p = parseFloat(q.correctAnswer);
        low = p - 0.01;
        high = p + 0.01;
      } else if (typeof q.correctAnswer === 'object' && q.correctAnswer !== null) {
        low = parseFloat(q.correctAnswer.low);
        high = parseFloat(q.correctAnswer.high);
      }

      if (val >= low && val <= high) {
        isCorrect = true;
        scoreAwarded = pos;
      } else {
        scoreAwarded = 0;
      }
    }
  }

  return {
    qidx: idx,
    qnum: q.qnum,
    qtype: q.qtype,
    isAttempted: true,
    isCorrect,
    scoreAwarded,
    userAnsText: userRes.text,
    correctAnsText,
  };
}

  const handleSubmitTest = async () => {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let posMarks = 0;
    let negMarks = 0;
    let maxPossible = 0;

    const itemResults: EvaluationItemResult[] = [];

    questions.forEach((q, idx) => {
      maxPossible += q.marksPos;
      const res = evaluateSingleQuestion(q, idx, mcqAnswers, msqAnswers, natAnswers);
      itemResults.push(res);

      if (!res.isAttempted) {
        skipped++;
      } else if (res.isCorrect) {
        attempted++;
        correct++;
        posMarks += res.scoreAwarded;
      } else {
        attempted++;
        wrong++;
        negMarks += Math.abs(res.scoreAwarded);
      }
    });

    const netScore = posMarks - negMarks;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

    const summary: EvaluationSummary = {
      totalQuestions: questions.length,
      attemptedCount: attempted,
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      positiveMarks: parseFloat(posMarks.toFixed(2)),
      penaltyMarks: parseFloat(negMarks.toFixed(2)),
      netScore: parseFloat(netScore.toFixed(2)),
      maxMarks: parseFloat(maxPossible.toFixed(2)),
      accuracy: parseFloat(accuracy.toFixed(2)),
      itemResults,
    };

    setEvaluation(summary);
    setIsSubmitted(true);

    // Save attempt record to backend / Firestore
    try {
      const answersPayload: Record<string, any> = {};
      questions.forEach((q, idx) => {
        if (q.qtype === 'MCQ' && mcqAnswers[idx] !== undefined) answersPayload[idx + 1] = mcqAnswers[idx];
        if (q.qtype === 'MSQ' && (msqAnswers[idx] || []).length > 0) answersPayload[idx + 1] = msqAnswers[idx];
        if (q.qtype === 'NAT' && natAnswers[idx]) answersPayload[idx + 1] = natAnswers[idx];
      });

      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user ? user.uid : 'aspirant_learner_101',
          paper_id: paperId || '001_Advance_Level_Test-1_Full_Syllabus_GATE_2025_CS',
          paper_title: paperTitle,
          score: summary.netScore,
          max_score: summary.maxMarks,
          accuracy: summary.accuracy,
          answers: answersPayload,
          time_taken_seconds: timeSpentSeconds,
        }),
      });
    } catch (err) {
      console.error('Failed to save test attempt record:', err);
    }
  };

  const handleRestart = () => {
    setIsSubmitted(false);
    setEvaluation(null);
    setMcqAnswers({});
    setMsqAnswers({});
    setNatAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    setSecondsLeft(questions.length * 120);
    setTimeSpentSeconds(0);
  };

  const filteredResults = evaluation
    ? evaluation.itemResults.filter((res) => {
        if (solutionFilter === 'INCORRECT') return res.isAttempted && !res.isCorrect;
        if (solutionFilter === 'CORRECT') return res.isAttempted && res.isCorrect;
        if (solutionFilter === 'UNATTEMPTED') return !res.isAttempted;
        return true;
      })
    : [];

  return (
    <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1">
      {/* Test Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-0.5">
            Official GATE Computer Based Test (CBT)
          </span>
          <h1 className="text-2xl font-black text-[#14213d]">{paperTitle}</h1>
        </div>
        <div className="flex gap-2">
          {isSubmitted ? (
            <button
              onClick={handleRestart}
              className="bg-[#0f766e] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs hover:bg-[#115e59] transition-all"
            >
              🔄 Re-attempt Test
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="text-xs text-[#0f766e] border border-[#0f766e] font-bold px-3.5 py-1.5 rounded-xl hover:bg-[#e7f4f0] transition-colors"
            >
              Reset Test
            </button>
          )}
        </div>
      </div>

      {loadingDb ? (
        <div className="bg-white border border-[#dce3ec] rounded-3xl p-12 text-center text-[#526079] animate-pulse">
          Loading exam questions...
        </div>
      ) : isSubmitted && evaluation ? (
        /* Industry-Grade Result Scorecard & Solution Review Dashboard */
        <div className="space-y-8 animate-fadeIn">
          {/* Hero Scoreboard Cards */}
          <div className="bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white rounded-3xl p-8 shadow-xl border border-white/10">
            <div className="flex flex-wrap justify-between items-center gap-6 mb-8">
              <div>
                <span className="bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider block mb-2 w-fit">
                  GATE Test Scorecard Verified
                </span>
                <h2 className="text-3xl font-black">Performance Evaluation Complete</h2>
                <p className="text-xs text-gray-300 mt-1">
                  Candidate: <strong className="text-white">{user?.displayName || user?.email || 'GATE Aspirant'}</strong>
                </p>
              </div>
              <div className="text-right bg-white/10 p-5 rounded-2xl border border-white/15 backdrop-blur-md">
                <span className="text-xs text-gray-300 block uppercase tracking-wider font-bold mb-0.5">Net Score</span>
                <div className="text-4xl font-black text-[#8be0ce]">
                  {evaluation.netScore} <span className="text-base text-gray-300 font-normal">/ {evaluation.maxMarks}</span>
                </div>
              </div>
            </div>

            {/* Performance Stat Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-gray-400 block mb-1 font-bold">Accuracy</span>
                <div className="text-2xl font-black text-emerald-400">{evaluation.accuracy}%</div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-gray-400 block mb-1 font-bold">Questions Attempted</span>
                <div className="text-2xl font-black text-white">
                  {evaluation.attemptedCount} <span className="text-xs font-normal text-gray-400">/ {evaluation.totalQuestions}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-gray-400 block mb-1 font-bold">Positive vs Penalty</span>
                <div className="text-sm font-bold text-white">
                  <span className="text-emerald-400">+{evaluation.positiveMarks}</span> · <span className="text-rose-400">-{evaluation.penaltyMarks}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-gray-400 block mb-1 font-bold">Breakdown</span>
                <div className="text-xs font-bold space-x-2">
                  <span className="text-emerald-400">{evaluation.correctCount} Correct</span>
                  <span className="text-rose-400">{evaluation.wrongCount} Wrong</span>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions & Answer Key Review Section */}
          <div className="bg-white border border-[#dce3ec] rounded-3xl p-8 shadow-sm">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-[#dce3ec] pb-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#14213d]">Detailed Question & Solution Review</h3>
                <p className="text-xs text-[#526079] mt-0.5">
                  Review step-by-step mathematical explanations, official correct answers, and your selected options.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'INCORRECT', 'CORRECT', 'UNATTEMPTED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSolutionFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      solutionFilter === filter
                        ? 'bg-[#14213d] text-white shadow-xs'
                        : 'bg-[#f8fafc] text-[#526079] border border-[#dce3ec] hover:bg-gray-100'
                    }`}
                  >
                    {filter === 'ALL'
                      ? `All (${evaluation.totalQuestions})`
                      : filter === 'INCORRECT'
                      ? `Incorrect (${evaluation.wrongCount})`
                      : filter === 'CORRECT'
                      ? `Correct (${evaluation.correctCount})`
                      : `Unattempted (${evaluation.skippedCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Solutions List */}
            {filteredResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                No questions found in <strong>{solutionFilter}</strong> filter tab.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredResults.map((res) => {
                  const q = questions[res.qidx];
                  if (!q) return null;

                  return (
                    <div
                      key={res.qnum}
                      className={`border rounded-2xl p-6 transition-all ${
                        !res.isAttempted
                          ? 'border-[#dce3ec] bg-white'
                          : res.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      {/* Card Header Tag */}
                      <div className="flex justify-between items-center mb-4 border-b border-[#dce3ec]/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#14213d] text-white font-black text-xs px-2.5 py-1 rounded-lg">
                            Q{res.qnum}
                          </span>
                          <span className="bg-[#e7f4f0] text-[#0f766e] font-extrabold text-xs px-2.5 py-1 rounded-md">
                            {res.qtype}
                          </span>
                        </div>

                        {/* Result Status Badge */}
                        {!res.isAttempted ? (
                          <span className="bg-gray-100 text-gray-600 font-bold text-xs px-3 py-1 rounded-full">
                            ⚪ Unattempted (0.00)
                          </span>
                        ) : res.isCorrect ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full">
                            ✅ Correct (+{res.scoreAwarded.toFixed(2)})
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 font-bold text-xs px-3 py-1 rounded-full">
                            ❌ Incorrect ({res.scoreAwarded.toFixed(2)})
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <div className="text-base text-[#14213d] mb-6 leading-relaxed">
                        <MathRenderer content={q.bodyHtml} />
                      </div>

                      {/* User Answer vs Official Correct Answer Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                        <div
                          className={`p-4 rounded-xl border ${
                            !res.isAttempted
                              ? 'bg-gray-50 border-gray-200 text-gray-600'
                              : res.isCorrect
                              ? 'bg-emerald-100/50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-100/50 border-rose-300 text-rose-950'
                          }`}
                        >
                          <span className="font-extrabold block mb-1 uppercase tracking-wider text-[10px]">
                            Your Selected Answer:
                          </span>
                          <span className="font-bold text-sm">{res.userAnsText}</span>
                        </div>

                        <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-950">
                          <span className="font-extrabold block mb-1 uppercase tracking-wider text-[10px] text-emerald-800">
                            Official Correct Answer:
                          </span>
                          <span className="font-bold text-sm text-emerald-900">{res.correctAnsText}</span>
                        </div>
                      </div>

                      {/* Step-by-Step KaTeX Explanation */}
                      {q.solutionHtml && (
                        <div className="bg-[#f8fafc] border border-[#dce3ec] p-5 rounded-2xl text-xs">
                          <strong className="block text-xs font-extrabold text-[#0f766e] uppercase tracking-wider mb-2">
                            💡 Step-by-Step Mathematical Explanation:
                          </strong>
                          <div className="text-[#14213d] leading-relaxed">
                            <MathRenderer content={q.solutionHtml} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active CBT Examination Engine */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="md:col-span-2 bg-white border border-[#dce3ec] rounded-3xl p-7 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#dce3ec] mb-4">
                <span className="bg-[#e7f4f0] text-[#0f766e] font-extrabold text-xs px-3 py-1 rounded-md">
                  {currentQ.qtype}
                </span>
                <span className="text-xs text-[#526079] font-bold">
                  Question {currentIdx + 1} of {questions.length} · Correct: +{currentQ.marksPos} | Incorrect: {currentQ.marksNeg}
                </span>
              </div>

              {/* Question Body with KaTeX */}
              <div className="text-base text-[#14213d] mb-6 leading-relaxed">
                <MathRenderer content={currentQ.bodyHtml} stripSolutions={true} />
              </div>

              {/* Options or NAT Input */}
              {currentQ.qtype === 'NAT' || !currentQ.options ? (
                <div className="mb-6">
                  <label className="block text-xs text-[#526079] mb-2 font-bold">
                    Enter numerical value:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={natAnswers[currentIdx] || ''}
                    onChange={(e) => handleNatChange(e.target.value)}
                    placeholder="e.g. 20"
                    className="border border-[#dce3ec] rounded-xl px-4 py-3 text-base w-64 focus:outline-none focus:border-[#0f766e] bg-gray-50/50 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {currentQ.options.map((optHtml, optIdx) => {
                    const isChecked =
                      currentQ.qtype === 'MCQ'
                        ? mcqAnswers[currentIdx] === optIdx
                        : (msqAnswers[currentIdx] || []).includes(optIdx);

                    return (
                      <label
                        key={optIdx}
                        onClick={() =>
                          currentQ.qtype === 'MCQ' ? handleMcqSelect(optIdx) : handleMsqToggle(optIdx)
                        }
                        className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-[#0f766e] bg-[#e7f4f0] shadow-xs'
                            : 'border-[#dce3ec] hover:border-gray-300'
                        }`}
                      >
                        <input
                          type={currentQ.qtype === 'MCQ' ? 'radio' : 'checkbox'}
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-[#0f766e] w-4 h-4"
                        />
                        <div className="text-sm text-[#14213d]">
                          <MathRenderer content={optHtml} />
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Controls Toolbar */}
            <div className="pt-4 border-t border-[#dce3ec] flex flex-wrap justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={clearResponse}
                  className="bg-white border border-[#dce3ec] text-[#526079] text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-50"
                >
                  Clear Response
                </button>
                <button
                  onClick={toggleFlag}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
                    flagged[currentIdx]
                      ? 'bg-[#6d28d9] text-white border-[#6d28d9]'
                      : 'bg-white border-[#dce3ec] text-[#526079] hover:bg-gray-50'
                  }`}
                >
                  {flagged[currentIdx] ? '★ Marked for Review' : '☆ Mark for Review'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="px-3.5 py-2 rounded-xl border border-[#dce3ec] text-xs font-bold text-[#526079] disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs"
                >
                  {currentIdx === questions.length - 1 ? 'First Question' : 'Next →'}
                </button>
              </div>
            </div>
          </div>

          {/* Side Palette & Timer */}
          <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="mb-6">
                <span className="text-xs text-[#526079] block mb-1 font-bold uppercase tracking-wider">Time Remaining</span>
                <div className="text-3xl font-mono font-bold text-[#14213d] bg-gray-50 p-3 rounded-2xl border border-[#dce3ec] text-center">
                  {formatTimer(secondsLeft)}
                </div>
              </div>

              <hr className="border-[#dce3ec] mb-4" />

              <h3 className="font-bold text-sm text-[#14213d] mb-3">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2 mb-6 max-h-60 overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const isCur = idx === currentIdx;
                  const isAns = isAnswered(idx);
                  const isFlg = flagged[idx];

                  let btnBg = 'bg-white text-[#14213d] border-[#dce3ec]';
                  if (isFlg) btnBg = 'bg-[#6d28d9] text-white border-[#6d28d9]';
                  else if (isAns) btnBg = 'bg-[#0f766e] text-white border-[#0f766e]';

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 rounded-xl text-xs font-bold border transition-all ${btnBg} ${
                        isCur ? 'ring-2 ring-offset-2 ring-[#0f766e]' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-[#526079] space-y-1.5 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#0f766e]"></span> Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#6d28d9]"></span> Marked for Review
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-white border border-[#dce3ec]"></span> Unanswered
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleSubmitTest}
                className="w-full bg-[#14213d] hover:bg-[#0f766e] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Submit & View Scorecard</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ExamEnginePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Suspense fallback={<div className="p-8 text-center text-xs">Loading exam engine...</div>}>
        <ExamEngineContent />
      </Suspense>
      <Footer />
    </div>
  );
}
