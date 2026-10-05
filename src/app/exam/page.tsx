'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MathRenderer } from '@/components/MathRenderer';
import { useAuth } from '@/context/AuthContext';

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
  const [secondsLeft, setSecondsLeft] = useState(1800);

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
              if (q.options && typeof q.options === 'object') {
                optionsArr = Object.values(q.options).map((opt: any) =>
                  typeof opt === 'string' ? opt : opt.html || String(opt)
                );
              }
              return {
                qnum: idx + 1,
                qtype: (q.type as any) || 'MCQ',
                marksPos: q.marks || 1,
                marksNeg: q.negative_marks ? `-${q.negative_marks}` : '0.00',
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
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
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

  return (
    <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-0.5">
            Official GATE Computer Based Test (CBT)
          </span>
          <h1 className="text-2xl font-black text-[#14213d]">{paperTitle}</h1>
        </div>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setMcqAnswers({});
            setMsqAnswers({});
            setNatAnswers({});
            setFlagged({});
            setSecondsLeft(questions.length * 120);
          }}
          className="text-xs text-[#0f766e] border border-[#0f766e] font-bold px-3.5 py-1.5 rounded-xl hover:bg-[#e7f4f0] transition-colors"
        >
          Restart Test
        </button>
      </div>

      {loadingDb ? (
        <div className="bg-white border border-[#dce3ec] rounded-3xl p-12 text-center text-[#526079] animate-pulse">
          Loading exam questions...
        </div>
      ) : (
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
                <MathRenderer content={currentQ.bodyHtml} stripSolutions={!isSubmitted} />
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
                    disabled={isSubmitted}
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
                          disabled={isSubmitted}
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
                  disabled={isSubmitted}
                  className="bg-white border border-[#dce3ec] text-[#526079] text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-50"
                >
                  Clear Response
                </button>
                <button
                  onClick={toggleFlag}
                  disabled={isSubmitted}
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

            {/* Post-submission Result Explanation */}
            {isSubmitted && currentQ.solutionHtml && (
              <div className="mt-6 p-5 bg-[#e7f4f0] border-l-4 border-[#0f766e] rounded-r-2xl text-xs">
                <strong className="block text-sm text-[#14213d] mb-1">Step-by-Step Solution Explanation</strong>
                <MathRenderer content={currentQ.solutionHtml} />
              </div>
            )}
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
              {!isSubmitted ? (
                <button
                  onClick={() => setIsSubmitted(true)}
                  className="w-full bg-[#14213d] hover:bg-[#0f766e] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
                >
                  Submit GATE Test
                </button>
              ) : (
                <div className="bg-[#e7f4f0] p-4 rounded-2xl text-center border border-[#0f766e]/20">
                  <span className="text-xs text-[#526079] block font-bold">Evaluation Completed</span>
                  <p className="text-xs text-[#0f766e] mt-1 font-extrabold">
                    {user ? `Score recorded for ${user.displayName || user.email}` : 'Test evaluation finished.'}
                  </p>
                </div>
              )}
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
      <footer className="border-t border-[#dce3ec] bg-white py-6 text-center text-xs text-[#526079]">
        GATEPrep Studio © 2026 · Official GATE Test Engine Interface
      </footer>
    </div>
  );
}
