'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MathRenderer } from '@/components/MathRenderer';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Star,
  ShieldCheck,
  Calculator,
  X,
  Check,
  BookOpen,
  HelpCircle,
  Sparkles,
  Award,
} from 'lucide-react';

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

  // Engine state flow: LOADING -> INSTRUCTIONS -> EXAM -> SUBMITTED
  const [phase, setPhase] = useState<'LOADING' | 'INSTRUCTIONS' | 'EXAM' | 'SUBMITTED'>('LOADING');
  const [loadingProgress, setLoadingProgress] = useState(15);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const [questions, setQuestions] = useState<QuestionItem[]>(fallbackQuestions);
  const [paperTitle, setPaperTitle] = useState('GATE Official CBT Practice Paper');
  const [paperBranch, setPaperBranch] = useState('CS');
  const [currentIdx, setCurrentIdx] = useState(0);

  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [msqAnswers, setMsqAnswers] = useState<Record<number, number[]>>({});
  const [natAnswers, setNatAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(10800); // Default 3 Hours (180 mins)
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [solutionFilter, setSolutionFilter] = useState<'ALL' | 'INCORRECT' | 'CORRECT' | 'UNATTEMPTED'>('ALL');

  const [submittedTab, setSubmittedTab] = useState<'RESULT' | 'SOLUTIONS'>('RESULT');
  const [showConfetti, setShowConfetti] = useState(false);

  // Built-in Scientific Calculator State
  const [virtualCalcOpen, setVirtualCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  // Is Full Length Exam or Topic Test?
  const isFullLength =
    paperTitle.toLowerCase().includes('full') ||
    paperTitle.toLowerCase().includes('mock') ||
    paperTitle.toLowerCase().includes('advance') ||
    questions.length >= 25;

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    async function loadPaperData() {
      setPhase('LOADING');
      setLoadingProgress(25);

      progressTimer = setInterval(() => {
        setLoadingProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

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
            if (data.paper.branch) setPaperBranch(data.paper.branch);

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

              const extractNum = (val: any, fallback: number = 0): number => {
                if (typeof val === 'number') return isNaN(val) ? fallback : val;
                if (typeof val === 'string') {
                  const p = parseFloat(val);
                  return isNaN(p) ? fallback : p;
                }
                if (typeof val === 'object' && val !== null) {
                  if ('integerValue' in val) return parseInt(val.integerValue, 10) || fallback;
                  if ('doubleValue' in val) return parseFloat(val.doubleValue) || fallback;
                  if ('positive' in val) return extractNum(val.positive, fallback);
                  if ('num' in val) return extractNum(val.num, fallback);
                }
                return fallback;
              };

              pos = extractNum(q.marks, 1);
              if (pos <= 0) pos = 1;

              if (q.negative_marks !== undefined && q.negative_marks !== null) {
                neg = extractNum(q.negative_marks, 0);
              } else if (typeof q.marks === 'object' && q.marks !== null && 'negative' in q.marks) {
                neg = extractNum(q.marks.negative, 0);
              } else if (q.type === 'MCQ' || q.qtype === 'MCQ') {
                neg = pos === 2 ? 0.6666667 : 0.3333333;
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
            // Full Length Mocks gets 180 mins (10800s); Topic tests get 2 mins per question
            const duration = mappedQs.length >= 25 ? 10800 : mappedQs.length * 120;
            setSecondsLeft(duration);
          }
        }
      } catch (err) {
        console.error('Failed loading paper questions:', err);
      } finally {
        clearInterval(progressTimer);
        setLoadingProgress(100);
        setTimeout(() => {
          setPhase('INSTRUCTIONS');
        }, 400);
      }
    }
    loadPaperData();
    return () => clearInterval(progressTimer);
  }, [paperId]);

  // Exam Countdown Timer (Only ticks when phase === 'EXAM')
  useEffect(() => {
    if (phase !== 'EXAM' || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          executeSubmission();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, secondsLeft]);

  const currentQ = questions[currentIdx] || questions[0];

  const formatTimer = (s: number) => {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMcqSelect = (optIdx: number) => {
    if (phase !== 'EXAM') return;
    setMcqAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleMsqToggle = (optIdx: number) => {
    if (phase !== 'EXAM') return;
    const current = msqAnswers[currentIdx] || [];
    const updated = current.includes(optIdx)
      ? current.filter((x) => x !== optIdx)
      : [...current, optIdx];
    setMsqAnswers((prev) => ({ ...prev, [currentIdx]: updated }));
  };

  const handleNatChange = (val: string) => {
    if (phase !== 'EXAM') return;
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
    if (phase !== 'EXAM') return;
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
    if (phase !== 'EXAM') return;
    setFlagged((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  };

  function formatCorrectAnswer(q: QuestionItem): string {
    const ans = q.correctAnswer;
    if (ans === undefined || ans === null || ans === '') return 'N/A';
    if (q.qtype === 'MCQ') {
      if (typeof ans === 'number') {
        return `Option ${String.fromCharCode(65 + ans)}`;
      }
      if (typeof ans === 'string') {
        const match = ans.trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(match)) return `Option ${match}`;
        const num = parseInt(match, 10);
        if (!isNaN(num) && num >= 0 && num <= 3) return `Option ${String.fromCharCode(65 + num)}`;
        return `Option ${match}`;
      }
      return `Option ${ans}`;
    }
    if (q.qtype === 'MSQ') {
      if (Array.isArray(ans)) {
        return ans
          .map((idx: any) =>
            typeof idx === 'number' ? `Option ${String.fromCharCode(65 + idx)}` : `Option ${String(idx).trim().toUpperCase()}`
          )
          .join(', ');
      }
      if (typeof ans === 'string') {
        const parts = ans.split(',').map((p) => p.trim().toUpperCase());
        return parts.map((p) => (['A', 'B', 'C', 'D'].includes(p) ? `Option ${p}` : p)).join(', ');
      }
      return String(ans);
    }
    if (q.qtype === 'NAT') {
      if (typeof ans === 'object' && ans !== null) {
        if ('low' in ans && 'high' in ans) {
          if (String(ans.low) === String(ans.high)) return `${ans.low}`;
          return `${ans.low} to ${ans.high}`;
        }
      }
      return String(ans);
    }
    return String(ans);
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
          .map((x: any) => (typeof x === 'number' ? x : String(x).trim().toUpperCase().charCodeAt(0) - 65))
          .sort((a, b) => a - b);
      } else if (typeof q.correctAnswer === 'string') {
        targetArr = q.correctAnswer
          .split(',')
          .map((x: string) => {
            const val = x.trim().toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(val)) return val.charCodeAt(0) - 65;
            return parseInt(val, 10);
          })
          .filter((n) => !isNaN(n) && n >= 0)
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
        let low = NaN;
        let high = NaN;
        if (typeof q.correctAnswer === 'number') {
          low = q.correctAnswer - 0.01;
          high = q.correctAnswer + 0.01;
        } else if (typeof q.correctAnswer === 'string') {
          const trimmed = q.correctAnswer.trim();
          if (trimmed.includes('to')) {
            const parts = trimmed.split('to').map((p) => parseFloat(p.trim()));
            low = parts[0];
            high = parts[1];
          } else if (trimmed.includes(':')) {
            const parts = trimmed.split(':').map((p) => parseFloat(p.trim()));
            low = parts[0];
            high = parts[1];
          } else {
            const p = parseFloat(trimmed);
            low = p - 0.01;
            high = p + 0.01;
          }
        } else if (typeof q.correctAnswer === 'object' && q.correctAnswer !== null) {
          if ('low' in q.correctAnswer && 'high' in q.correctAnswer) {
            low = parseFloat(q.correctAnswer.low);
            high = parseFloat(q.correctAnswer.high);
          }
        }

        if (!isNaN(low) && !isNaN(high) && val >= low && val <= high) {
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

  const executeSubmission = async () => {
    setConfirmModalOpen(false);
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
    setPhase('SUBMITTED');
    setSubmittedTab('RESULT');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);

    // Save attempt record to backend & Firestore
    try {
      const answersPayload: Record<string, any> = {};
      questions.forEach((q, idx) => {
        if (q.qtype === 'MCQ' && mcqAnswers[idx] !== undefined) answersPayload[idx + 1] = mcqAnswers[idx];
        if (q.qtype === 'MSQ' && (msqAnswers[idx] || []).length > 0) answersPayload[idx + 1] = msqAnswers[idx];
        if (q.qtype === 'NAT' && natAnswers[idx]) answersPayload[idx + 1] = natAnswers[idx];
      });

      const attemptPayload = {
        id: `att_${Date.now()}`,
        uid: user ? user.uid : 'aspirant_learner_101',
        paper_id: paperId || '001_Advance_Level_Test-1_Full_Syllabus_GATE_2025_CS',
        paper_title: paperTitle,
        score: summary.netScore,
        max_score: summary.maxMarks,
        accuracy: summary.accuracy,
        answers: answersPayload,
        time_taken_seconds: timeSpentSeconds,
        createdAt: new Date().toISOString(),
      };

      // Save locally to localStorage
      try {
        const rawLocal = localStorage.getItem('gate_local_attempts');
        const localList = rawLocal ? JSON.parse(rawLocal) : [];
        localList.unshift(attemptPayload);
        localStorage.setItem('gate_local_attempts', JSON.stringify(localList));
        window.dispatchEvent(new Event('gate_attempts_changed'));
      } catch (e) {}

      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptPayload),
      });
    } catch (err) {
      console.error('Failed to save test attempt record:', err);
    }
  };

  const handleRestart = () => {
    setPhase('INSTRUCTIONS');
    setDeclarationChecked(false);
    setEvaluation(null);
    setMcqAnswers({});
    setMsqAnswers({});
    setNatAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    setSecondsLeft(questions.length >= 25 ? 10800 : questions.length * 120);
    setTimeSpentSeconds(0);
  };

  // Virtual Calculator Handlers
  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
    } else if (val === '=') {
      try {
        // Safe evaluation of simple math expressions
        const sanitized = calcInput.replace(/[^0-9+\-*/().]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`"use strict"; return (${sanitized})`)();
        setCalcInput(String(res));
      } catch (e) {
        setCalcInput('Error');
      }
    } else if (val === 'sqrt') {
      try {
        const num = parseFloat(calcInput);
        setCalcInput(String(Math.sqrt(num)));
      } catch (e) {
        setCalcInput('Error');
      }
    } else if (val === 'sq') {
      try {
        const num = parseFloat(calcInput);
        setCalcInput(String(num * num));
      } catch (e) {
        setCalcInput('Error');
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  };

  const filteredResults = evaluation
    ? evaluation.itemResults.filter((res) => {
        if (solutionFilter === 'INCORRECT') return res.isAttempted && !res.isCorrect;
        if (solutionFilter === 'CORRECT') return res.isAttempted && res.isCorrect;
        if (solutionFilter === 'UNATTEMPTED') return !res.isAttempted;
        return true;
      })
    : [];

  const attemptedCountTotal = questions.filter((_, idx) => isAnswered(idx)).length;
  const flaggedCountTotal = questions.filter((_, idx) => flagged[idx]).length;

  return (
    <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
      {/* ----------------------------------------------------
          1. LOADING & PREPARING TEST PROGRESS SCREEN
         ---------------------------------------------------- */}
      {phase === 'LOADING' && (
        <div className="min-h-[70vh] flex items-center justify-center">
          <Card className="max-w-xl w-full p-8 text-center shadow-xl border-[#dce3ec] bg-white animate-fadeIn">
            <div className="w-16 h-16 bg-[#0f766e]/10 text-[#0f766e] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <h2 className="text-2xl font-black text-[#14213d] mb-2">
              Preparing Test For You
            </h2>
            <p className="text-xs text-[#526079] mb-8">
              Initializing question paper, KaTeX math formulas, and GATE CBT exam environment...
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-6 border border-[#dce3ec]">
              <div
                className="bg-gradient-to-r from-[#0f766e] to-[#2563eb] h-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-[#526079] px-1 mb-6">
              <span>Loading dataset & media...</span>
              <span className="text-[#0f766e]">{loadingProgress}%</span>
            </div>

            <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-[#dce3ec] text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Candidate Credentials</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fetched {questions.length} Exam Questions & Options</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
                <span>Configuring GATE CBT Timer & Palette...</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------
          2. GATE EXAM PRE-TEST INSTRUCTIONS SCREEN
         ---------------------------------------------------- */}
      {phase === 'INSTRUCTIONS' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-[#14213d] text-white p-6 rounded-2xl shadow-lg border border-white/10 flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="text-[#8be0ce] text-xs font-extrabold uppercase tracking-widest block mb-1">
                {isFullLength ? 'Official IIT GATE CBT Pre-Exam Portal' : 'GATE Topic Practice Test Portal'}
              </span>
              <h1 className="text-2xl font-black">{paperTitle}</h1>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/15">
              <span>Branch Code: </span>
              <strong className="text-[#8be0ce] uppercase">{paperBranch}</strong>
            </div>
          </div>

          <Card className="p-8 bg-white border-[#dce3ec] shadow-md">
            {isFullLength ? (
              /* Official IIT GATE CBT Exam Instructions (Full Length) */
              <div className="space-y-6 text-sm text-[#14213d] leading-relaxed">
                <div className="border-b border-[#dce3ec] pb-4">
                  <h2 className="text-lg font-black text-[#14213d] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#0f766e]" />
                    Please read the following instructions carefully:
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-[#dce3ec] text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Total Time Allowed:</span>
                    <strong className="text-[#14213d] text-base">180 Minutes (3 Hours)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Total Questions:</span>
                    <strong className="text-[#14213d] text-base">{questions.length} Questions</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Virtual Calculator:</span>
                    <strong className="text-emerald-700 text-base">Enabled On Header Toolbar</strong>
                  </div>
                </div>

                {/* Section A: General Exam Rules */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[#14213d] uppercase tracking-wider text-xs text-[#0f766e]">
                    1. General Instructions & Session Timer:
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-[#526079]">
                    <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.</li>
                    <li>When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination manually.</li>
                  </ul>
                </div>

                {/* Section B: Palette Status Legend */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-[#14213d] uppercase tracking-wider text-xs text-[#0f766e]">
                    2. Question Palette Symbols & Status Guide:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#dce3ec] flex items-center justify-center font-bold text-slate-600">1</div>
                      <span>You have not visited the question yet.</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">2</div>
                      <span>You have visited but NOT answered the question.</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <div className="w-8 h-8 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold">3</div>
                      <span>You have ANSWERED the question.</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">4</div>
                      <span>Marked for Review (NOT evaluated unless answered).</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold relative">
                        5
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-0 right-0 border border-white"></span>
                      </div>
                      <span>Answered & Marked for Review (Will be evaluated).</span>
                    </div>
                  </div>
                </div>

                {/* Section C: Marking Scheme */}
                <div className="space-y-2">
                  <h3 className="font-extrabold uppercase tracking-wider text-xs text-[#0f766e]">
                    3. GATE Question Types & Marking Scheme:
                  </h3>
                  <div className="space-y-2 text-xs text-[#526079]">
                    <div className="p-3 bg-slate-50 rounded-xl border border-[#dce3ec]">
                      <strong className="text-[#14213d] block mb-0.5">MCQ (Multiple Choice Questions):</strong>
                      Contains 4 options with 1 correct option. 1-mark questions deduct <strong>1/3 mark (-0.33)</strong> for wrong answers; 2-mark questions deduct <strong>2/3 mark (-0.66)</strong>.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-[#dce3ec]">
                      <strong className="text-[#14213d] block mb-0.5">MSQ (Multiple Select Questions):</strong>
                      Contains 1 or more correct options. <strong>No negative marking</strong> and <strong>No partial credit</strong>.
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-[#dce3ec]">
                      <strong className="text-[#14213d] block mb-0.5">NAT (Numerical Answer Type):</strong>
                      Enter numerical response using the virtual numeric keypad. <strong>No negative marking</strong>.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Topic / Subject Practice Test Instructions */
              <div className="space-y-6 text-sm text-[#14213d] leading-relaxed">
                <div className="border-b border-[#dce3ec] pb-4">
                  <h2 className="text-lg font-black text-[#14213d] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#0f766e]" />
                    General Topic Practice Test Instructions:
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-[#dce3ec] text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Test Format:</span>
                    <strong className="text-[#14213d] text-base">Topic Wise Practice Test</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Total Questions:</span>
                    <strong className="text-[#14213d] text-base">{questions.length} Questions</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Recommended Time:</span>
                    <strong className="text-[#0f766e] text-base">{questions.length * 2} Minutes</strong>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-[#526079]">
                  <p>• This topic test is curated to test your subject fundamentals, mathematical speed, and concept application in <strong>{paperTitle}</strong>.</p>
                  <p>• Make sure to attempt all questions carefully. Standard GATE positive and negative marking applies.</p>
                  <p>• Use the built-in <strong>Virtual Scientific Calculator</strong> on the header toolbar for solving NAT numerical questions.</p>
                  <p>• Click <strong>Submit Exam</strong> when you are ready to view your score and step-by-step mathematical solutions.</p>
                </div>
              </div>
            )}

            {/* Candidate Declaration & Start Button Container */}
            <div className="mt-8 pt-6 border-t border-[#dce3ec] space-y-6">
              <label className="flex items-start gap-3.5 p-4 rounded-xl border border-amber-200 bg-amber-50/40 cursor-pointer hover:bg-amber-50 transition-all">
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="accent-[#0f766e] w-5 h-5 mt-0.5"
                />
                <span className="text-xs text-[#14213d] leading-relaxed font-semibold">
                  I have read and understood all the instructions. All computer hardware allotted to me is in proper working condition. I declare that I am not in possession of any prohibited material and agree to abide by the GATE CBT examination guidelines.
                </span>
              </label>

              <div className="flex justify-between items-center pt-2">
                <Link href="/catalog">
                  <Button variant="secondary" size="md">
                    Back to Test Series
                  </Button>
                </Link>

                <Button
                  variant="emerald"
                  size="lg"
                  disabled={!declarationChecked}
                  onClick={() => setPhase('EXAM')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="px-8 font-black text-sm"
                >
                  {isFullLength ? 'I AM READY TO BEGIN' : 'START TOPIC PRACTICE TEST'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------
          3. ACTIVE CBT EXAMINATION UI (LIVE TEST)
         ---------------------------------------------------- */}
      {phase === 'EXAM' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Exam Toolbar / Header */}
          <div className="bg-[#14213d] text-white rounded-2xl px-6 py-4 flex flex-wrap justify-between items-center gap-4 shadow-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0f766e] rounded-xl flex items-center justify-center font-black text-lg text-white">
                G
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-snug">{paperTitle}</h1>
                <span className="text-xs text-gray-300">Candidate: <strong className="text-[#8be0ce]">{user?.displayName || user?.email || 'GATE Aspirant'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Scientific Calculator Popup Trigger */}
              <button
                onClick={() => setVirtualCalcOpen(!virtualCalcOpen)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-white/15"
              >
                <Calculator className="w-4 h-4 text-[#8be0ce]" />
                <span>Scientific Calculator</span>
              </button>

              {/* Countdown Timer Display Box */}
              <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-white/15 flex items-center gap-2 text-amber-400 font-mono font-black text-xl">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Question & Answer Selection Area */}
            <div className="lg:col-span-8">
              <Card padding="lg" className="h-full flex flex-col justify-between border-[#dce3ec] shadow-sm bg-white">
                <div>
                  {/* Question Header Status */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#dce3ec] mb-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="navy" className="text-xs px-3 py-1 font-extrabold">Question {currentIdx + 1}</Badge>
                      <Badge variant="emerald" className="text-xs px-2.5 py-1">{currentQ.qtype}</Badge>
                    </div>
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      Marks: <span className="text-emerald-700">+{currentQ.marksPos}.00</span> | Penalty: <span className="text-rose-600">{currentQ.marksNeg}</span>
                    </span>
                  </div>

                  {/* Question Content Body with KaTeX & Inline Image Support */}
                  <div className="text-base text-[#14213d] mb-8 leading-relaxed font-normal bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <MathRenderer content={currentQ.bodyHtml} stripSolutions={true} />
                  </div>

                  {/* Answer Inputs (MCQ / MSQ / NAT) */}
                  {currentQ.qtype === 'NAT' || !currentQ.options ? (
                    <div className="mb-8 p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                      <label className="block text-xs text-[#14213d] mb-2 font-bold uppercase tracking-wider">
                        Enter Numerical Response (Use keyboard or on-screen calculator):
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={natAnswers[currentIdx] || ''}
                        onChange={(e) => handleNatChange(e.target.value)}
                        placeholder="e.g. 20.5"
                        className="border border-[#dce3ec] rounded-xl px-4 py-3 text-lg font-bold w-64 focus:outline-none focus:border-[#0f766e] bg-white text-[#14213d] shadow-2xs font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 mb-8">
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
                            className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'border-[#0f766e] bg-[#e7f4f0] shadow-xs ring-1 ring-[#0f766e]'
                                : 'border-[#dce3ec] bg-white hover:border-slate-300 hover:bg-slate-50/80'
                            }`}
                          >
                            <input
                              type={currentQ.qtype === 'MCQ' ? 'radio' : 'checkbox'}
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-[#0f766e] w-4 h-4 mt-1"
                            />
                            <div className="flex items-center gap-2 font-bold text-xs text-[#0f766e] uppercase tracking-wider min-w-[70px] mt-0.5">
                              Option {String.fromCharCode(65 + optIdx)}:
                            </div>
                            <div className="text-sm text-[#14213d] flex-1">
                              <MathRenderer content={optHtml} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Control Bar */}
                <div className="pt-6 border-t border-[#dce3ec] flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={clearResponse}>
                      Clear Response
                    </Button>
                    <Button
                      variant={flagged[currentIdx] ? 'purple' : ('secondary' as any)}
                      size="sm"
                      onClick={toggleFlag}
                      leftIcon={<Star className="w-3.5 h-3.5" />}
                    >
                      {flagged[currentIdx] ? 'Marked for Review' : 'Mark for Review'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {currentIdx === questions.length - 1 ? 'First Question' : 'Save & Next'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar Question Palette */}
            <div className="lg:col-span-4">
              <Card padding="md" className="h-full flex flex-col justify-between border-[#dce3ec] bg-white shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#dce3ec]">
                    <span className="font-black text-sm text-[#14213d]">Question Palette</span>
                    <span className="text-xs text-slate-500 font-bold">{questions.length} Total</span>
                  </div>

                  {/* Question Grid Buttons */}
                  <div className="grid grid-cols-5 gap-2 mb-6 max-h-72 overflow-y-auto p-1">
                    {questions.map((q, idx) => {
                      const isCur = idx === currentIdx;
                      const isAns = isAnswered(idx);
                      const isFlg = flagged[idx];

                      let btnBg = 'bg-white text-[#14213d] border-[#dce3ec] hover:bg-slate-100';
                      if (isFlg && isAns) btnBg = 'bg-purple-700 text-white border-purple-700 ring-2 ring-emerald-400';
                      else if (isFlg) btnBg = 'bg-purple-600 text-white border-purple-600';
                      else if (isAns) btnBg = 'bg-[#0f766e] text-white border-[#0f766e]';
                      else btnBg = 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100';

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentIdx(idx)}
                          className={`h-9 rounded-xl text-xs font-black border transition-all ${btnBg} ${
                            isCur ? 'ring-2 ring-offset-2 ring-[#14213d] scale-105' : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Palette Legends */}
                  <div className="text-[11px] text-[#526079] space-y-2 mb-6 border-t border-slate-100 pt-4 font-medium">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-[#0f766e]"></span>
                        <span>Answered</span>
                      </div>
                      <span className="font-bold text-[#14213d]">{attemptedCountTotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-purple-600"></span>
                        <span>Marked for Review</span>
                      </div>
                      <span className="font-bold text-[#14213d]">{flaggedCountTotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-amber-500"></span>
                        <span>Not Answered</span>
                      </div>
                      <span className="font-bold text-[#14213d]">{questions.length - attemptedCountTotal}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-black text-sm"
                    onClick={() => setConfirmModalOpen(true)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Submit Exam & View Scorecard
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          4. POST-TEST EVALUATION & SCORECARD DASHBOARD
         ---------------------------------------------------- */}
      {phase === 'SUBMITTED' && evaluation && (
        <div className="space-y-6 animate-fadeIn relative">
          {/* Confetti Celebration Particles */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 1.5;
                const duration = 2.5 + Math.random() * 2;
                const size = 8 + Math.random() * 8;
                const colors = ['#0f766e', '#2563eb', '#ec4899', '#eab308', '#a855f7', '#10b981', '#f97316'];
                const color = colors[i % colors.length];

                return (
                  <div
                    key={i}
                    className="absolute rounded-sm animate-confettiFall"
                    style={{
                      left: `${left}%`,
                      top: `-20px`,
                      width: `${size}px`,
                      height: `${size * 1.4}px`,
                      backgroundColor: color,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Celebration Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 px-6 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="font-black text-base">Test Submitted Successfully!</h3>
                <p className="text-xs text-emerald-100">Your performance has been evaluated against GATE official CBT scoring rules.</p>
              </div>
            </div>
            <Badge variant="emerald" className="bg-white/20 text-white border-white/30 text-xs px-3 py-1 font-extrabold">
              Scored: {evaluation.netScore} / {evaluation.maxMarks}
            </Badge>
          </div>

          {/* Top Post-Test Navigation Tabs */}
          <div className="flex border-b border-[#dce3ec] dark:border-slate-800 gap-2">
            <button
              onClick={() => setSubmittedTab('RESULT')}
              className={`px-6 py-3.5 font-extrabold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                submittedTab === 'RESULT'
                  ? 'border-[#0f766e] text-[#0f766e] dark:text-[#2dd4bf] bg-white dark:bg-[#111a2e] rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>📊 Performance Scorecard & Result</span>
            </button>

            <button
              onClick={() => setSubmittedTab('SOLUTIONS')}
              className={`px-6 py-3.5 font-extrabold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                submittedTab === 'SOLUTIONS'
                  ? 'border-[#0f766e] text-[#0f766e] dark:text-[#2dd4bf] bg-white dark:bg-[#111a2e] rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>💡 Step-by-Step Solutions & Answer Key ({evaluation.totalQuestions})</span>
            </button>
          </div>

          {/* TAB 1: RESULT & SCORECARD ONLY */}
          {submittedTab === 'RESULT' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Main Scorecard Summary Banner */}
              <div className="bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white rounded-3xl p-8 shadow-xl border border-white/10">
                <div className="flex flex-wrap justify-between items-center gap-6 mb-8">
                  <div>
                    <Badge variant="emerald" className="mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                      GATE CBT Score Evaluation
                    </Badge>
                    <h2 className="text-3xl font-black">{paperTitle}</h2>
                    <p className="text-xs text-gray-300 mt-1">
                      Candidate: <strong className="text-white">{user?.displayName || user?.email || 'GATE Aspirant'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button variant="emerald" size="sm" onClick={handleRestart} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
                      Re-attempt Test
                    </Button>
                    <div className="text-right bg-white/10 p-5 rounded-2xl border border-white/15 backdrop-blur-md">
                      <span className="text-xs text-gray-300 block uppercase tracking-wider font-bold mb-0.5">Net Score</span>
                      <div className="text-4xl font-black text-[#8be0ce]">
                        {evaluation.netScore} <span className="text-base text-gray-300 font-normal">/ {evaluation.maxMarks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Stat Widgets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-gray-400 block mb-1 font-bold">Accuracy Rate</span>
                    <div className="text-2xl font-black text-emerald-400">{evaluation.accuracy}%</div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-gray-400 block mb-1 font-bold">Attempted Count</span>
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

              {/* Action Banner to Switch to Solutions Tab */}
              <Card className="p-8 text-center bg-white dark:bg-[#111a2e] border-[#dce3ec] shadow-md">
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0f766e]/10 text-[#0f766e] flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-[#14213d] dark:text-white">Ready to review detailed solutions?</h3>
                  <p className="text-xs text-[#526079] dark:text-slate-400">
                    Explore step-by-step mathematical explanations, KaTeX formulas, official correct answers, and option breakdown for all {evaluation.totalQuestions} questions.
                  </p>
                  <Button
                    variant="emerald"
                    size="lg"
                    onClick={() => setSubmittedTab('SOLUTIONS')}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    className="px-8 font-black"
                  >
                    View All Solutions & Answer Key
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: DETAILED SOLUTIONS & ANSWER KEY ONLY */}
          {submittedTab === 'SOLUTIONS' && (
            <Card className="bg-white border-[#dce3ec] p-6 shadow-sm">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-[#dce3ec] pb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#14213d]">Detailed Solutions & Mathematical Explanations</h3>
                  <p className="text-xs text-[#526079] mt-0.5">
                    Review step-by-step KaTeX solutions, official correct answers, and your selected options.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {(['ALL', 'INCORRECT', 'CORRECT', 'UNATTEMPTED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSolutionFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                        solutionFilter === filter
                          ? 'bg-[#14213d] text-white shadow-xs'
                          : 'bg-slate-50 text-[#526079] border border-[#dce3ec] hover:bg-slate-100'
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
                <div className="text-center py-12 text-slate-500 text-xs">
                  No questions found under <strong>{solutionFilter}</strong> filter tab.
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
                          <Badge variant="navy">Q{res.qnum}</Badge>
                          <Badge variant="emerald">{res.qtype}</Badge>
                        </div>

                        {/* Result Status Badge */}
                        {!res.isAttempted ? (
                          <Badge variant="slate">⚪ Unattempted (0.00)</Badge>
                        ) : res.isCorrect ? (
                          <Badge variant="emerald">✅ Correct (+{res.scoreAwarded.toFixed(2)})</Badge>
                        ) : (
                          <Badge variant="rose">❌ Incorrect ({res.scoreAwarded.toFixed(2)})</Badge>
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
                              ? 'bg-slate-50 border-slate-200 text-slate-600'
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
                        <div className="bg-slate-50 border border-[#dce3ec] p-5 rounded-2xl text-xs">
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
          </Card>
        )}
      </div>
    )}

      {/* Confirmation Dialog before Final Submission */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full animate-fadeIn bg-white border-[#dce3ec]" padding="lg">
            <h3 className="text-xl font-black text-[#14213d] mb-2">Submit your exam?</h3>
            <p className="text-xs text-[#526079] mb-6">
              Please review your question attempt summary before confirming final submission.
            </p>

            <div className="bg-slate-50 border border-[#dce3ec] p-4 rounded-xl mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#526079]">Total Questions:</span>
                <span className="font-bold text-[#14213d]">{questions.length}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Attempted:</span>
                <span className="font-black">{attemptedCountTotal}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Unattempted:</span>
                <span className="font-bold">{questions.length - attemptedCountTotal}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Marked for Review:</span>
                <span className="font-bold">{flaggedCountTotal}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>
                Continue Exam
              </Button>
              <Button variant="emerald" onClick={executeSubmission}>
                Confirm Submit
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Built-in Scientific Calculator Modal Popup */}
      {virtualCalcOpen && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#14213d] text-white p-4 rounded-2xl shadow-2xl border border-white/20 w-80 animate-fadeIn">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8be0ce]">
              <Calculator className="w-4 h-4" />
              <span>Scientific Calculator</span>
            </div>
            <button
              onClick={() => setVirtualCalcOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Display screen */}
          <div className="bg-slate-900 px-3 py-2.5 rounded-xl border border-white/10 mb-3 text-right font-mono font-bold text-xl overflow-x-auto min-h-[44px] text-[#8be0ce]">
            {calcInput || '0'}
          </div>

          {/* Buttons Keypad */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold font-mono">
            {['C', '(', ')', '/'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcClick(btn)}
                className="p-2 bg-rose-900/40 hover:bg-rose-800/60 rounded-lg text-rose-300 border border-rose-800/40"
              >
                {btn}
              </button>
            ))}
            {['7', '8', '9', '*'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcClick(btn)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white border border-white/10"
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', '-'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcClick(btn)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white border border-white/10"
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcClick(btn)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white border border-white/10"
              >
                {btn}
              </button>
            ))}
            {['0', '.', 'sqrt', '='].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcClick(btn)}
                className={`p-2 rounded-lg border ${
                  btn === '='
                    ? 'bg-[#0f766e] text-white border-[#0f766e] font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function ExamSkeleton() {
  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="bg-[#14213d] text-white p-4 rounded-2xl mb-6 flex justify-between items-center animate-pulse h-16">
        <div className="w-48 h-6 bg-slate-700 rounded"></div>
        <div className="w-32 h-6 bg-slate-700 rounded"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-3xl p-6 h-96 animate-pulse"></div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-3xl p-6 h-96 animate-pulse"></div>
      </div>
    </main>
  );
}

export default function ExamEnginePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col transition-colors duration-200">
      <Suspense fallback={<ExamSkeleton />}>
        <ExamEngineContent />
      </Suspense>
      <Footer />
    </div>
  );
}
