'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calculator,
  FileText,
  HelpCircle,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  User,
  ShieldCheck,
  Trash2,
  Delete,
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';
import { cleanOptionContent } from '@/lib/sanitizer';
import { ScientificCalculator } from './ScientificCalculator';
import { QuestionPaperModal } from './QuestionPaperModal';

export interface QuestionData {
  qnum: number;
  qtype: 'MCQ' | 'MSQ' | 'NAT';
  marksPos: number;
  marksNeg: string;
  bodyHtml: string;
  options?: string[];
  correctAnswer?: any;
  solutionHtml?: string;
  section?: string;
}

interface RealExamTerminalProps {
  paperTitle: string;
  paperBranch: string;
  questions: QuestionData[];
  user: any;
  secondsLeft: number;
  mcqAnswers: Record<number, number>;
  msqAnswers: Record<number, number[]>;
  natAnswers: Record<number, string>;
  flagged: Record<number, boolean>;
  onSelectMcq: (optIdx: number) => void;
  onToggleMsq: (optIdx: number) => void;
  onChangeNat: (val: string) => void;
  onClearResponse: () => void;
  onToggleFlag: () => void;
  onSubmitExam: () => void;
}

export const RealExamTerminal: React.FC<RealExamTerminalProps> = ({
  paperTitle,
  paperBranch,
  questions,
  user,
  secondsLeft,
  mcqAnswers,
  msqAnswers,
  natAnswers,
  flagged,
  onSelectMcq,
  onToggleMsq,
  onChangeNat,
  onClearResponse,
  onToggleFlag,
  onSubmitExam,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [activeSection, setActiveSection] = useState<'ALL' | 'GA' | 'CORE'>('ALL');

  // Modals & Tools
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-cheat distraction toast
  const [kioskWarning, setKioskWarning] = useState<string | null>(null);

  // Track visited questions whenever index changes
  useEffect(() => {
    setVisited((prev) => ({ ...prev, [currentIdx]: true }));
  }, [currentIdx]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Window blur / Tab switch warning (Real Exam Hall simulation)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setKioskWarning('Exam Warning: Tab switching is monitored and logged in the actual exam hall.');
        setTimeout(() => setKioskWarning(null), 6000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIdx] || {
    qnum: 1,
    qtype: 'MCQ',
    marksPos: 1,
    marksNeg: '0.33',
    bodyHtml: '<p>Loading Question...</p>',
    options: [],
  };

  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    if (q.qtype === 'MCQ') return mcqAnswers[idx] !== undefined;
    if (q.qtype === 'MSQ') return (msqAnswers[idx] || []).length > 0;
    if (q.qtype === 'NAT') return natAnswers[idx] !== undefined && natAnswers[idx].trim() !== '';
    return false;
  };

  // Status for each question
  const getQuestionStatus = (idx: number) => {
    const ans = isAnswered(idx);
    const flg = flagged[idx];
    const vis = visited[idx];

    if (flg && ans) return 'ANS_AND_MARKED'; // Violet with green dot (Will be evaluated)
    if (flg) return 'MARKED'; // Violet circle
    if (ans) return 'ANSWERED'; // Green shield
    if (vis) return 'NOT_ANSWERED'; // Red shield
    return 'NOT_VISITED'; // Gray square
  };

  // Counters for the 5 official TCS iON categories
  const counts = questions.reduce(
    (acc, _, idx) => {
      const st = getQuestionStatus(idx);
      acc[st] += 1;
      return acc;
    },
    {
      ANSWERED: 0,
      NOT_ANSWERED: 0,
      NOT_VISITED: 0,
      MARKED: 0,
      ANS_AND_MARKED: 0,
    }
  );

  // Sections separation: Q1-10 are GA, Q11-65 are Subject in GATE
  const gaQuestions = questions.slice(0, 10);
  const coreQuestions = questions.slice(10);

  const displayedQuestions =
    activeSection === 'GA'
      ? questions.map((q, i) => ({ q, i })).filter(({ i }) => i < 10)
      : activeSection === 'CORE'
      ? questions.map((q, i) => ({ q, i })).filter(({ i }) => i >= 10)
      : questions.map((q, i) => ({ q, i }));

  // Virtual Keypad for NAT
  const handleVirtualKey = (key: string) => {
    const current = natAnswers[currentIdx] || '';
    if (key === 'BACKSPACE') {
      onChangeNat(current.slice(0, -1));
    } else if (key === 'CLEAR') {
      onChangeNat('');
    } else if (key === '-' && current.includes('-')) {
      // Don't duplicate minus
    } else if (key === '.' && current.includes('.')) {
      // Don't duplicate dot
    } else {
      onChangeNat(current + key);
    }
  };

  const handleSaveAndNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    onToggleFlag();
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#e4edf5] dark:bg-[#070d19] flex flex-col h-screen w-screen overflow-hidden select-none font-sans text-xs">
      {/* =========================================================================
          1. TOP APP BAR: OFFICIAL TCS iON EXAM HEADER
         ========================================================================= */}
      <header className="bg-gradient-to-r from-[#173250] via-[#1e3a5f] to-[#173250] text-white px-4 py-2 flex items-center justify-between border-b-2 border-[#38bdf8]/30 shadow-md shrink-0">
        {/* Left: Exam Brand & Stream */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0f766e] text-white font-black flex items-center justify-center text-sm shadow-inner border border-teal-300/30">
            IIT
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-wide text-white">
              GATE 2026 Examination (Computer Based Test)
            </h1>
            <span className="text-[11px] text-[#93c5fd] font-medium block">
              Paper: <strong className="text-white">{paperTitle}</strong> · Stream: <strong className="text-amber-300">{paperBranch}</strong>
            </span>
          </div>
        </div>

        {/* Center / Right: Live Clock, Candidate Profile, Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Scientific Calculator Trigger */}
          <button
            onClick={() => setIsCalcOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold transition-all shadow-sm cursor-pointer border border-sky-400/40"
            title="Open TCS iON Scientific Calculator"
          >
            <Calculator className="w-3.5 h-3.5 text-sky-200" />
            <span className="hidden md:inline">Calculator</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer border border-white/15"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen Exam Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isFullscreen ? 'Exit Fullscreen' : 'Exam Kiosk'}</span>
          </button>

          {/* Real-time Exam Clock (TCS iON Digital Format) */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#020617] border border-amber-400/40 text-amber-400 font-mono font-black text-sm sm:text-base shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="tracking-wider">Time Left : {formatTimer(secondsLeft)}</span>
          </div>

          {/* Candidate Profile Box */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/20">
            <div className="w-9 h-9 rounded-md bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Candidate" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-300" />
              )}
            </div>
            <div className="text-left text-[11px] leading-tight">
              <span className="font-bold text-white block truncate max-w-[120px]">
                {user?.displayName || user?.email?.split('@')[0] || 'GATE Candidate'}
              </span>
              <span className="text-slate-300 font-mono text-[10px]">
                ID: GATE26-{paperBranch}-7842
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Warning banner if candidate switched tabs */}
      {kioskWarning && (
        <div className="bg-amber-500 text-slate-950 font-black px-4 py-1 text-center text-xs flex items-center justify-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{kioskWarning}</span>
        </div>
      )}

      {/* =========================================================================
          2. SECTION TABS BAR (TCS iON Standard: General Aptitude & Core Engineering)
         ========================================================================= */}
      <div className="bg-[#cbdceb] dark:bg-[#0f172a] border-b border-[#b0c8dc] dark:border-slate-800 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mr-2 hidden sm:inline">
            Sections:
          </span>

          <button
            onClick={() => {
              setActiveSection('ALL');
            }}
            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'ALL'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white'
            }`}
          >
            All Questions ({questions.length})
          </button>

          {gaQuestions.length > 0 && (
            <button
              onClick={() => {
                setActiveSection('GA');
                setCurrentIdx(0);
              }}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'GA'
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white'
              }`}
            >
              General Aptitude (GA) (1–10)
            </button>
          )}

          {coreQuestions.length > 0 && (
            <button
              onClick={() => {
                setActiveSection('CORE');
                setCurrentIdx(10);
              }}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'CORE'
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white'
              }`}
            >
              {paperBranch} Engineering (11–{questions.length})
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
          <span>Question Type: <strong className="text-slate-900 dark:text-white font-mono">{currentQ.qtype}</strong></span>
          <span>·</span>
          <span>View In: <strong className="text-[#0f766e] dark:text-[#2dd4bf]">English</strong></span>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN EXAM WORKING CANVAS (Left: Question | Right: Palette)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: QUESTION CONTENT & INPUT (75% on desktop) */}
        <main className="flex-1 flex flex-col bg-white dark:bg-[#0c1424] border-r border-[#b0c8dc] dark:border-slate-800 overflow-hidden">
          {/* Question Subheader Strip */}
          <div className="bg-[#f1f6fa] dark:bg-[#111c33] px-6 py-2.5 border-b border-[#d4e2ee] dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-[#1e3a5f] dark:text-[#38bdf8]">
                Question No. {currentIdx + 1}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                {currentQ.qtype}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                Mark(s) for correct answer: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">+{currentQ.marksPos}</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 dark:text-slate-300">
                Negative mark: <strong className="text-rose-600 dark:text-rose-400 font-mono">{currentQ.marksNeg}</strong>
              </span>
            </div>
          </div>

          {/* Scrollable Question Body & Interactive Answer Canvas */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Question Text with KaTeX formulas and images */}
            <div className="text-sm md:text-base text-slate-900 dark:text-slate-100 leading-relaxed font-normal bg-[#fbfcfd] dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <MathRenderer content={currentQ.bodyHtml} stripSolutions={true} />
            </div>

            {/* Answer Options Area */}
            {currentQ.qtype === 'NAT' || !currentQ.options || currentQ.options.length === 0 ? (
              /* NAT (Numerical Answer Type) Keypad Interface */
              <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl space-y-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Enter Your Numerical Value (Use On-Screen Keypad or Physical Keys):
                </label>

                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={natAnswers[currentIdx] || ''}
                    onChange={(e) => onChangeNat(e.target.value)}
                    placeholder="Enter number..."
                    className="w-48 px-4 py-2.5 text-xl font-bold font-mono rounded-lg border-2 border-[#1e3a5f] dark:border-[#38bdf8] bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none text-center shadow-inner"
                  />
                  <button
                    onClick={() => onChangeNat('')}
                    className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-300 transition-colors cursor-pointer"
                  >
                    Clear Value
                  </button>
                </div>

                {/* On-Screen Virtual NAT Keypad (Exact TCS iON CBT Standard) */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Official Virtual Numeric Keypad:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 w-64 font-mono font-bold text-sm">
                    {['7', '8', '9', 'BACKSPACE'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleVirtualKey(k)}
                        className={`p-2.5 rounded border transition-all cursor-pointer ${
                          k === 'BACKSPACE'
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 text-xs font-sans'
                            : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {k === 'BACKSPACE' ? '⌫' : k}
                      </button>
                    ))}
                    {['4', '5', '6', 'CLEAR'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleVirtualKey(k)}
                        className={`p-2.5 rounded border transition-all cursor-pointer ${
                          k === 'CLEAR'
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300 text-xs font-sans'
                            : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {k === 'CLEAR' ? 'Clear' : k}
                      </button>
                    ))}
                    {['1', '2', '3', '-'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleVirtualKey(k)}
                        className="p-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        {k}
                      </button>
                    ))}
                    {['0', '.', '+'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleVirtualKey(k)}
                        className={`p-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded border border-slate-300 dark:border-slate-700 transition-all cursor-pointer ${
                          k === '0' ? 'col-span-2' : ''
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* MCQ & MSQ Options Layout */
              <div className="space-y-3 max-w-3xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {currentQ.qtype === 'MSQ' ? 'Select all correct option(s):' : 'Select one option:'}
                </span>

                {currentQ.options.map((optHtml, optIdx) => {
                  const isChecked =
                    currentQ.qtype === 'MCQ'
                      ? mcqAnswers[currentIdx] === optIdx
                      : (msqAnswers[currentIdx] || []).includes(optIdx);

                  return (
                    <label
                      key={optIdx}
                      onClick={() =>
                        currentQ.qtype === 'MCQ' ? onSelectMcq(optIdx) : onToggleMsq(optIdx)
                      }
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#0f766e] bg-[#e7f4f0] dark:bg-teal-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type={currentQ.qtype === 'MCQ' ? 'radio' : 'checkbox'}
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-[#0f766e] w-4 h-4 mt-1 shrink-0"
                      />
                      <div className="flex items-center gap-1 font-bold text-xs text-[#0f766e] dark:text-[#2dd4bf] uppercase tracking-wider shrink-0 mt-0.5">
                        ({String.fromCharCode(65 + optIdx)})
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-200 flex-1 leading-relaxed">
                        <MathRenderer content={cleanOptionContent(optHtml)} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Fixed Action Button Strip (TCS iON Standard: Mark for Review, Clear, Save & Next) */}
          <footer className="bg-[#f1f6fa] dark:bg-[#111c33] border-t border-[#d4e2ee] dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left side actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-4 py-2 rounded-lg bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Mark for Review & Next</span>
              </button>

              <button
                type="button"
                onClick={onClearResponse}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                Clear Response
              </button>
            </div>

            {/* Right side navigation & save */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-6 py-2 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Save & Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </footer>
        </main>

        {/* RIGHT COLUMN: PALETTE & CANDIDATE DETAILS (25% on desktop) */}
        <aside className="w-80 md:w-96 bg-[#eef4f9] dark:bg-[#0c1424] flex flex-col shrink-0 overflow-hidden">
          {/* Candidate Profile Widget at top of palette */}
          <div className="bg-white dark:bg-[#111c33] p-4 border-b border-[#d4e2ee] dark:border-slate-800 flex items-center gap-3 shrink-0">
            <div className="w-12 h-14 bg-slate-200 dark:bg-slate-800 rounded border-2 border-slate-400 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Candidate" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="font-extrabold text-slate-900 dark:text-white block text-sm truncate max-w-[170px]">
                {user?.displayName || user?.email?.split('@')[0] || 'GATE Candidate'}
              </span>
              <span className="text-slate-500 text-[11px] block mt-0.5">
                Roll No: <strong>GATE26-{paperBranch}-7842</strong>
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                SYSTEM VERIFIED
              </span>
            </div>
          </div>

          {/* Official 5-Status TCS iON Legend Counters */}
          <div className="p-3 bg-white dark:bg-[#111c33] border-b border-[#d4e2ee] dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-xs bg-[#16a34a] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                {counts.ANSWERED}
              </span>
              <span>Answered</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-xs bg-[#dc2626] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                {counts.NOT_ANSWERED}
              </span>
              <span>Not Answered</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-xs bg-[#94a3b8] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                {counts.NOT_VISITED}
              </span>
              <span>Not Visited</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                {counts.MARKED}
              </span>
              <span>Marked for Review</span>
            </div>

            <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-mono text-[10px] font-bold relative">
                {counts.ANS_AND_MARKED}
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border border-white"></span>
              </span>
              <span className="text-[10px] leading-tight text-slate-500">
                Ans & Marked (Will be evaluated)
              </span>
            </div>
          </div>

          {/* Palette Questions Number Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
              Choose a Question:
            </span>

            <div className="grid grid-cols-5 gap-2 font-mono font-bold text-xs">
              {displayedQuestions.map(({ q, i }) => {
                const status = getQuestionStatus(i);
                const isCur = i === currentIdx;

                let tileStyle = 'bg-[#cbd5e1] text-slate-800 border-slate-300'; // NOT_VISITED default
                if (status === 'ANSWERED') {
                  tileStyle = 'bg-[#16a34a] text-white border-[#15803d]';
                } else if (status === 'NOT_ANSWERED') {
                  tileStyle = 'bg-[#dc2626] text-white border-[#b91c1c]';
                } else if (status === 'MARKED') {
                  tileStyle = 'bg-[#7c3aed] text-white border-[#6d28d9] rounded-full';
                } else if (status === 'ANS_AND_MARKED') {
                  tileStyle = 'bg-[#7c3aed] text-white border-[#6d28d9] rounded-full ring-2 ring-emerald-400';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    className={`h-9 flex items-center justify-center rounded border transition-all cursor-pointer shadow-xs ${tileStyle} ${
                      isCur ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 z-10' : ''
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Palette Actions: Question Paper, Instructions, Submit Exam */}
          <div className="p-4 bg-white dark:bg-[#111c33] border-t border-[#d4e2ee] dark:border-slate-800 space-y-2 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaperModalOpen(true)}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#0f766e]" />
                <span>Question Paper</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInstructionsOpen(true)}
                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0f766e]" />
                <span>Instructions</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsConfirmSubmitOpen(true)}
              className="w-full py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs rounded-lg shadow-md transition-all uppercase tracking-wider cursor-pointer"
            >
              Submit Exam
            </button>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          4. MODALS & AUXILIARY CONTROLS
         ========================================================================= */}

      {/* 1. Official TCS iON Scientific Calculator */}
      <ScientificCalculator isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />

      {/* 2. Full Question Paper View Modal */}
      <QuestionPaperModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
        paperTitle={paperTitle}
        questions={questions}
      />

      {/* 3. Instructions Modal */}
      {isInstructionsOpen && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-black border-b pb-2 flex items-center gap-2 text-[#1e3a5f] dark:text-[#38bdf8]">
              <HelpCircle className="w-5 h-5 text-[#0f766e]" />
              Official Examination Instructions:
            </h3>
            <ul className="text-xs space-y-2 list-disc pl-5 leading-relaxed text-slate-700 dark:text-slate-300">
              <li>Total duration of examination is 180 minutes (3 hours) for full mock tests.</li>
              <li>The clock will be set at the server. The countdown timer at the top right displays time left.</li>
              <li><strong>MCQ (Multiple Choice Questions):</strong> Negative marking of 1/3 for 1-mark and 2/3 for 2-mark questions.</li>
              <li><strong>MSQ (Multiple Select Questions):</strong> One or more correct options. No negative marking, no partial credit.</li>
              <li><strong>NAT (Numerical Answer Type):</strong> Answer is a signed number. Enter using the virtual keypad. No negative marking.</li>
              <li>Questions marked for review that are also answered will be evaluated by the scoring system.</li>
            </ul>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInstructionsOpen(false)}
                className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold text-xs rounded-xl"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Final Submission Confirmation Modal (TCS iON Summary Table) */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-black text-[#1e3a5f] dark:text-[#38bdf8]">
              Exam Submission Summary
            </h3>
            <p className="text-xs text-slate-500">
              Please review your question attempts across sections before final submission:
            </p>

            <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-2.5">Status Category</th>
                  <th className="p-2.5 text-right">No. of Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-2.5 font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Answered
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    {counts.ANSWERED}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-rose-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Not Answered
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-sm text-rose-700 dark:text-rose-400">
                    {counts.NOT_ANSWERED}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-purple-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Marked for Review
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-sm text-purple-700 dark:text-purple-400">
                    {counts.MARKED}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-indigo-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Ans & Marked for Review
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-sm text-indigo-700 dark:text-indigo-400">
                    {counts.ANS_AND_MARKED}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Not Visited
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-sm">
                    {counts.NOT_VISITED}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
              ⚠️ Are you sure you want to submit? Once submitted, you cannot re-attempt or change your responses for this session.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Return to Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmSubmitOpen(false);
                  onSubmitExam();
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
