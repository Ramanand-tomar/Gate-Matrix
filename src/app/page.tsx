'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer } from '@/components/MathRenderer';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
  Compass,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Calculator,
  Clock,
  Layers,
  ChevronDown,
  BarChart3,
  Star,
  Users,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';

interface PaperDoc {
  id: string;
  paper_id: string;
  title: string;
  branch: string;
  total_questions: number;
}

export default function Home() {
  const [featuredPapers, setFeaturedPapers] = useState<PaperDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'MCQ' | 'MSQ' | 'NAT'>('MCQ');
  const [activeBranch, setActiveBranch] = useState<string>('CS');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [simulatedTime, setSimulatedTime] = useState<number>(6840); // 1h 54m

  // Timer simulation tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTime((prev) => (prev > 0 ? prev - 1 : 10800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/papers?branch=CS');
        const data = await res.json();
        if (data.success && data.papers) {
          setFeaturedPapers(data.papers.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch homepage featured papers:', err);
      }
    }
    fetchFeatured();
  }, []);

  const branches = [
    {
      code: 'CS',
      name: 'Computer Science & IT',
      papers: '467 Mocks & Subject Tests',
      questions: '9,340+ Questions',
      topics: ['Data Structures', 'DBMS', 'Operating Systems', 'Algorithms', 'Compiler Design', 'Computer Networks'],
      desc: 'Comprehensive CBT series covering discrete math, theory of computation, algorithms, operating systems, and system design.',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      code: 'DA',
      name: 'Data Science & Artificial Intelligence',
      papers: '77 Dedicated Test Papers',
      questions: '1,540+ Questions',
      topics: ['Machine Learning', 'Linear Algebra', 'Probability & Stats', 'Python Data Structures', 'AI Search'],
      desc: 'Official GATE DA syllabus mock series with high-yield probability models, matrix calculus, and ML algorithms.',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      code: 'EE',
      name: 'Electrical Engineering',
      papers: '238 Full & Subject Mocks',
      questions: '4,760+ Questions',
      topics: ['Power Systems', 'Control Systems', 'Circuit Theory', 'Electrical Machines', 'Signals & Systems'],
      desc: 'Rigorous numerical practice for power electronics, signal processing, electromagnetic fields, and control loops.',
      color: 'from-amber-600 to-orange-700',
    },
    {
      code: 'EC',
      name: 'Electronics & Communication',
      papers: '98 Full & Topic Papers',
      questions: '1,960+ Questions',
      topics: ['Analog Circuits', 'Digital Electronics', 'Communications', 'Electromagnetics', 'Semiconductors'],
      desc: 'Master signals, semiconductor physics, microwave engineering, and digital system design with exact CBT keypads.',
      color: 'from-[#6d28d9] to-purple-800',
    },
    {
      code: 'ME',
      name: 'Mechanical Engineering',
      papers: '97 Full & Subject Tests',
      questions: '1,940+ Questions',
      topics: ['Thermodynamics', 'Fluid Mechanics', 'Engineering Mechanics', 'Manufacturing', 'Machine Design'],
      desc: 'In-depth thermal sciences, fluid dynamics, stress analysis, and industrial engineering CBT problem sets.',
      color: 'from-cyan-600 to-blue-800',
    },
    {
      code: 'CE',
      name: 'Civil Engineering',
      papers: '84 Full & Subject Tests',
      questions: '1,680+ Questions',
      topics: ['Structural Engineering', 'Geotechnical', 'Environmental', 'Transportation', 'Hydraulics'],
      desc: 'Complete coverage of soil mechanics, structural analysis, concrete design, hydrology, and surveying.',
      color: 'from-rose-600 to-pink-800',
    },
  ];

  const cbtPreviewContent = {
    MCQ: {
      type: 'Multiple Choice Question (MCQ)',
      marks: '+2.0 / -0.66 Negative Marking',
      question: 'Let $A$ be a $3 \\times 3$ matrix with real entries such that $\\det(A) = 5$. What is the value of $\\det(2A^{-1})$?',
      options: [
        'A) $\\frac{8}{5}$',
        'B) $\\frac{2}{5}$',
        'C) $4$',
        'D) $\\frac{5}{8}$',
      ],
      correct: 'A) $\\frac{8}{5}$',
      explanation: 'Since $A$ is $3 \\times 3$, $\\det(c A) = c^3 \\det(A)$. Thus $\\det(2A^{-1}) = 2^3 \\det(A^{-1}) = 8 \\times \\frac{1}{\\det(A)} = \\frac{8}{5}$.',
    },
    MSQ: {
      type: 'Multiple Select Question (MSQ)',
      marks: '+2.0 Marks (No Negative Marking)',
      question: 'Which of the following statement(s) is/are TRUE for any context-free language $L$?',
      options: [
        'A) $L$ can be recognized by a non-deterministic pushdown automaton (NPDA).',
        'B) The complement of $L$ is guaranteed to be context-free.',
        'C) $L$ satisfies the Pumping Lemma for Context-Free Languages.',
        'D) Every regular language is also a context-free language.',
      ],
      correct: 'A, C, and D',
      explanation: 'CFLs are closed under NPDA acceptance (A) and satisfy the CFL Pumping Lemma (C). Regular languages are a strict subset of CFLs (D). CFLs are NOT closed under complementation in general (B is false).',
    },
    NAT: {
      type: 'Numerical Answer Type (NAT)',
      marks: '+2.0 Marks (Exact Keypad Input, No Negative)',
      question: 'Consider a hash table with 10 slots using linear probing. If keys 42, 23, 34, 52 are inserted into an empty table with hash function $h(k) = k \\bmod 10$, what is the final index of key 52?',
      options: [],
      correct: '5',
      explanation: '$h(42) = 2$, $h(23) = 3$, $h(34) = 4$. Key 52 yields $h(52) = 2$ (collision!). Linear probing checks slot 3 (occupied), slot 4 (occupied), slot 5 (empty). Key 52 is placed at slot 5.',
    },
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'DISCOVER',
      subtitle: 'Target Stream & Test Series',
      desc: 'Filter 1,000+ authentic GATE papers by engineering discipline, subject domain, or full-length CBT mock.',
      icon: Compass,
    },
    {
      step: '02',
      title: 'PRACTICE',
      subtitle: 'Official IIT CBT Engine',
      desc: 'Experience real exam conditions with official NAT scientific keypads, live timers, MSQ multi-select, and palette status.',
      icon: Target,
    },
    {
      step: '03',
      title: 'ANALYZE',
      subtitle: 'Diagnostic Weak-Area Engine',
      desc: 'Uncover weak subject nodes, negative marking leaks, and detailed KaTeX mathematical solution explanations.',
      icon: Brain,
    },
    {
      step: '04',
      title: 'MASTER',
      subtitle: 'Targeted Score Elevation',
      desc: 'Execute topic-focused repeat drills to eliminate accuracy bottlenecks and secure top All India Ranks.',
      icon: TrendingUp,
    },
  ];

  const testimonials = [
    {
      name: 'Rohan Sharma',
      rank: 'AIR 12 — GATE CS',
      score: 'Score: 89.4 / 100',
      college: 'IIT Bombay Admitted',
      comment: 'GATE Matrix’s exact replica of the IIT CBT keypad and instant topic accuracy diagnostics made the real exam feel like just another practice session.',
    },
    {
      name: 'Ananya Verma',
      rank: 'AIR 04 — GATE DA',
      score: 'Score: 92.1 / 100',
      college: 'IISc Bangalore Admitted',
      comment: 'The KaTeX mathematical step-by-step solutions and Data Science mock quality are unmatched. It completely eliminated my NAT keypad input errors.',
    },
    {
      name: 'Priya Sundaram',
      rank: 'AIR 28 — GATE EE',
      score: 'Score: 84.6 / 100',
      college: 'IIT Madras Admitted',
      comment: 'Tracking my negative marking impact per topic helped me raise my accuracy from 64% to 88% in just 6 weeks of dedicated practice.',
    },
  ];

  const faqs = [
    {
      q: 'What makes GATE Matrix test series unique for GATE aspirants?',
      a: 'GATE Matrix provides 100% authentic Computer Based Test (CBT) interface simulation matching official IIT standards (TCS iON pattern). It features real-time section timers, scientific NAT keypads, MSQ multi-select scoring rules, and deep diagnostic accuracy heatmaps.',
    },
    {
      q: 'How does the GATE Branch Pass work?',
      a: 'The Branch Pass grants 365-day unlimited access to all published and upcoming full-length mocks, subject tests, and topic drills for your chosen stream (CS, DA, EE, EC, ME, or CE).',
    },
    {
      q: 'Are detailed solutions provided for Numerical Answer Type (NAT) questions?',
      a: 'Yes! Every question comes with step-by-step mathematical explanations rendered with high-precision KaTeX equations, complete with formula derivations and keypad entry guidelines.',
    },
    {
      q: 'Can I track my weak topics and negative marking penalties over time?',
      a: 'Absolutely. The Performance Analytics Dashboard breaks down every test attempt into topic-level accuracy, average time spent per question, and marks lost due to incorrect MCQ guesses.',
    },
    {
      q: 'Can I attempt tests on mobile devices?',
      a: 'Yes, GATE Matrix is fully responsive across desktop, tablet, and mobile browsers, allowing you to practice questions anytime, anywhere.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-[#0f172a] dark:text-[#f8fafc] transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1128] via-[#14213d] to-[#0f172a] text-white py-16 md:py-24 px-4 sm:px-6">
        {/* Glow & Backdrop Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0f766e]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2.5 bg-[#0f766e]/25 text-[#8be0ce] border border-[#0f766e]/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-4 h-4 text-[#8be0ce] animate-pulse" />
              <span>Realistic GATE CBT Practice Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Master the GATE Exam <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#8be0ce] via-[#38bdf8] to-white bg-clip-text text-transparent">
                With Precision CBT Practice.
              </span>
            </h1>

            <p className="text-gray-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              Practice 1,000+ realistic GATE test papers with official NAT keypads, timed CBT interfaces, step-by-step KaTeX solutions, and AI-driven diagnostic accuracy analytics.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/catalog">
                <Button variant="emerald" size="lg" className="shadow-lg shadow-[#0f766e]/30 font-black" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Explore Test Series
                </Button>
              </Link>
              <Link href="/exam">
                <Button variant="outline" size="lg" className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-extrabold shadow-sm" rightIcon={<Play className="w-4 h-4 text-[#8be0ce]" />}>
                  Take Free CBT Mock Test
                </Button>
              </Link>
            </div>

            {/* Quick Feature Badges */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8be0ce]" />
                <span>MCQ, MSQ & NAT Keypad</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8be0ce]" />
                <span>Topic Diagnostic Analytics</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-[#8be0ce]" />
                <span>Step-by-Step KaTeX Math</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive CBT Interface Preview Simulator */}
          <div className="lg:col-span-5">
            <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
              {/* CBT Header Simulation Bar */}
              <div className="bg-[#14213d] border border-white/10 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <div>
                    <span className="font-extrabold text-white block">GATE 2027 Mock Simulator</span>
                    <span className="text-[10px] text-gray-400">CS & DA Stream Full Test #04</span>
                  </div>
                </div>
                <div className="bg-slate-900/90 border border-[#0f766e]/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[#8be0ce] font-mono font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(simulatedTime)}</span>
                </div>
              </div>

              {/* Tab Switcher for Question Types */}
              <div className="flex gap-2 p-1 bg-slate-900/60 rounded-xl text-xs font-bold">
                {(['MCQ', 'MSQ', 'NAT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg transition-all text-center ${
                      activeTab === tab
                        ? 'bg-[#0f766e] text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab} Preview
                  </button>
                ))}
              </div>

              {/* Simulated Question Card */}
              <div className="bg-[#14213d]/90 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="bg-[#0f766e]/30 text-[#8be0ce] border border-[#0f766e]/50 px-2.5 py-0.5 rounded-md font-bold">
                    {cbtPreviewContent[activeTab].type}
                  </span>
                  <span className="text-gray-400 font-medium">{cbtPreviewContent[activeTab].marks}</span>
                </div>

                <div className="text-xs text-white font-medium leading-relaxed pt-1 border-t border-white/10 [&_*]:text-white">
                  <MathRenderer content={cbtPreviewContent[activeTab].question} />
                </div>

                {/* Option / Input Preview */}
                {activeTab !== 'NAT' ? (
                  <div className="space-y-2 pt-2">
                    {cbtPreviewContent[activeTab].options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          idx === 0
                            ? 'bg-[#0f766e]/20 border-[#0f766e] text-[#8be0ce] font-bold [&_*]:text-[#8be0ce]'
                            : 'bg-slate-900/40 border-white/10 text-slate-200 [&_*]:text-slate-200'
                        }`}
                      >
                        <MathRenderer content={opt} />
                        {idx === 0 && <CheckCircle2 className="w-4 h-4 text-[#8be0ce]" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-200 font-bold">Virtual Keypad Input:</span>
                      <div className="bg-slate-900 border border-[#0f766e] px-4 py-1.5 rounded-xl font-mono text-sm text-[#8be0ce] font-black tracking-wider">
                        5
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 max-w-[200px] text-[10px] font-bold text-slate-200">
                      {['7', '8', '9', 'C', '4', '5', '6', '←', '1', '2', '3', '.', '0', '-', 'Bk', 'OK'].map((k, i) => (
                        <div key={i} className="bg-white/10 hover:bg-[#0f766e] p-1.5 rounded text-center cursor-pointer">
                          {k}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation Reveal */}
                <div className="pt-3 border-t border-white/10 text-[11px] text-slate-200 bg-slate-900/80 p-3 rounded-xl [&_*]:text-slate-200">
                  <span className="text-[#8be0ce] font-extrabold block mb-1">KaTeX Solution Explanation:</span>
                  <MathRenderer content={cbtPreviewContent[activeTab].explanation} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATFORM CREDIBILITY STATS BAR */}
      <section className="bg-white dark:bg-[#111a2e] border-y border-[#dce3ec] dark:border-slate-800 py-8 px-4 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="p-3">
            <div className="text-3xl font-black text-[#14213d] dark:text-white tracking-tight">1,061+</div>
            <div className="text-xs text-[#526079] dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1">Verified Test Papers</div>
          </div>
          <div className="p-3">
            <div className="text-3xl font-black text-[#14213d] dark:text-white tracking-tight">21,000+</div>
            <div className="text-xs text-[#526079] dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1">GATE CBT Questions</div>
          </div>
          <div className="p-3">
            <div className="text-3xl font-black text-[#0f766e] dark:text-[#2dd4bf] tracking-tight">6 Streams</div>
            <div className="text-xs text-[#526079] dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1">Engineering Disciplines</div>
          </div>
          <div className="p-3">
            <div className="text-3xl font-black text-[#14213d] dark:text-white tracking-tight">100%</div>
            <div className="text-xs text-[#526079] dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1">Realistic GATE CBT Interface</div>
          </div>
          <div className="col-span-2 md:col-span-1 p-3">
            <div className="text-3xl font-black text-[#0f766e] dark:text-[#2dd4bf] tracking-tight">Instant</div>
            <div className="text-xs text-[#526079] dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1">Diagnostic Weak-Area AI</div>
          </div>
        </div>
      </section>

      {/* 3. ENGINEERING STREAMS GRID (BRANCH SELECTOR HUB) */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest block mb-2">
              Engineering Disciplines
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213d] dark:text-white tracking-tight">
              Select Your GATE 2027 Branch
            </h2>
          </div>
          <Link href="/catalog" className="text-xs font-extrabold text-[#0f766e] dark:text-[#2dd4bf] hover:underline flex items-center gap-1.5">
            <span>Explore All 1,060+ Test Series</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
            <Card
              key={b.code}
              hoverEffect
              className="flex flex-col justify-between group border-[#dce3ec] dark:border-slate-800 bg-white dark:bg-[#111a2e] p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="emerald" size="md" className="font-extrabold">
                    GATE {b.code}
                  </Badge>
                  <span className="text-xs text-[#0f766e] dark:text-[#2dd4bf] font-extrabold bg-[#e7f4f0] dark:bg-slate-800 px-3 py-1 rounded-full">
                    {b.papers}
                  </span>
                </div>

                <h3 className="font-black text-[#14213d] dark:text-white text-xl mb-2 group-hover:text-[#0f766e] dark:group-hover:text-[#2dd4bf] transition-colors">
                  {b.name}
                </h3>
                <p className="text-xs text-[#526079] dark:text-slate-400 leading-relaxed mb-6">
                  {b.desc}
                </p>

                {/* Key Subject Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {b.topics.map((t, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link href={`/catalog?branch=${b.code}`}>
                  <Button variant="outline" size="sm" className="w-full justify-between font-extrabold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    <span>Access GATE {b.code} Series</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. OFFICIAL IIT GATE CBT SIMULATOR SPOTLIGHT */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[#8be0ce] text-xs font-extrabold uppercase tracking-widest block">
              100% Exam Fidelity
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Engineered for Realistic GATE CBT Exam Practice.
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Don’t let virtual calculator mistakes or unknown exam UI layouts ruin your years of preparation. GATE Matrix provides exact CBT interface behavior matching TCS iON standards.
            </p>

            <div className="space-y-4 text-xs font-medium">
              {[
                {
                  icon: Calculator,
                  title: 'On-Screen Scientific & NAT Keypad',
                  desc: 'Exact numerical answer input controls prevent floating-point rounding errors on exam day.',
                },
                {
                  icon: Clock,
                  title: 'Real-Time Countdown & Section Locking',
                  desc: 'Auto-submits your test, tracks time spent per question, and enforces sectional navigation rules.',
                },
                {
                  icon: Layers,
                  title: 'MCQ, MSQ & Negative Marking Engine',
                  desc: 'Strict adherence to 1/3 and 2/3 negative marking for MCQs, with zero penalty on MSQ & NAT questions.',
                },
                {
                  icon: Target,
                  title: 'TCS iON Color-Coded Question Palette',
                  desc: 'Track Answered, Not Answered, Marked for Review, and Answered & Marked for Review statuses.',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-[#0f766e] text-white flex items-center justify-center shrink-0 font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-gray-400 leading-relaxed text-xs">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Feature Visual Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#14213d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-xs font-extrabold text-[#8be0ce] uppercase tracking-wider">
                  CBT Palette Navigation Status
                </span>
                <span className="text-xs text-gray-400 font-mono">Question 34 of 65</span>
              </div>

              {/* Simulated Palette Grid */}
              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 font-mono text-xs font-bold text-center">
                {Array.from({ length: 30 }).map((_, i) => {
                  const num = i + 1;
                  let colorClass = 'bg-slate-800 text-gray-300 border-gray-700';
                  if ([1, 2, 4, 5, 8, 9, 12, 15, 18, 20, 22].includes(num)) {
                    colorClass = 'bg-emerald-600 text-white border-emerald-500'; // Answered
                  } else if ([3, 7, 11, 19].includes(num)) {
                    colorClass = 'bg-rose-600 text-white border-rose-500'; // Not Answered
                  } else if ([6, 14, 25].includes(num)) {
                    colorClass = 'bg-purple-600 text-white border-purple-500 rounded-full'; // Marked for Review
                  } else if (num === 10) {
                    colorClass = 'bg-amber-500 text-slate-950 font-black ring-2 ring-white'; // Current
                  }
                  return (
                    <div key={num} className={`p-2 rounded-lg border shadow-sm ${colorClass}`}>
                      {num}
                    </div>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-bold pt-2 border-t border-white/10 text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span>
                  <span>Answered (11)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-rose-600"></span>
                  <span>Not Answered (4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                  <span>Marked for Review (3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-gray-600"></span>
                  <span>Not Visited (12)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIAGNOSTIC PERFORMANCE ANALYTICS */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest block">
              AI Diagnostic Analytics
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14213d] dark:text-white tracking-tight leading-tight">
              Identify Weak Topics & Stop Losing Marks to Negative Penalties.
            </h2>
            <p className="text-xs sm:text-sm text-[#526079] dark:text-slate-300 leading-relaxed">
              Every attempt is analyzed in real time. GATE Matrix breaks down your score into subject accuracy, speed per question, NAT precision, and avoidable negative marking penalties.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Subject & Topic-level Accuracy Heatmap',
                'Time-per-Question Speed & Guessing Indicator',
                'Negative Marking Penalty Leakage Breakdown',
                'Step-by-step KaTeX mathematical explanations for all options',
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-extrabold text-[#14213d] dark:text-white">
                  <div className="w-6 h-6 rounded-full bg-[#e7f4f0] dark:bg-slate-800 text-[#0f766e] dark:text-[#2dd4bf] flex items-center justify-center font-black text-xs shrink-0">
                    ✓
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link href="/performance">
                <Button variant="emerald" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Diagnostic Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Analytics Demo Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0f766e] dark:text-[#2dd4bf]" />
                  <span className="font-black text-[#14213d] dark:text-white text-sm">
                    Topic Accuracy Diagnostics
                  </span>
                </div>
                <Badge variant="emerald">Target: 80%+</Badge>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Data Structures & Algorithms', val: 88, status: 'Strong', color: 'bg-emerald-500' },
                  { name: 'Database Management Systems', val: 82, status: 'Strong', color: 'bg-emerald-500' },
                  { name: 'Machine Learning & AI (DA)', val: 91, status: 'Mastered', color: 'bg-teal-500' },
                  { name: 'Operating Systems & Concurrency', val: 72, status: 'Moderate', color: 'bg-amber-500' },
                  { name: 'Computer Networks (TCP/IP)', val: 58, status: 'Weak Area', color: 'bg-rose-500' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#14213d] dark:text-white">{item.name}</span>
                      <span className="text-[#0f766e] dark:text-[#2dd4bf] font-mono">{item.val}% ({item.status})</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className={`${item.color} h-2.5 rounded-full`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED TEST SERIES */}
      {featuredPapers.length > 0 && (
        <section className="py-20 px-4 sm:px-6 bg-white dark:bg-[#111a2e] border-y border-[#dce3ec] dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest block mb-2">
                  Popular GATE Practice Series
                </span>
                <h2 className="text-3xl font-black text-[#14213d] dark:text-white">
                  Featured Full-Length Mock Series
                </h2>
              </div>
              <Link href="/catalog" className="text-xs font-bold text-[#0f766e] dark:text-[#2dd4bf] hover:underline">
                View All Test Series →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPapers.map((p) => (
                <Card key={p.id} hoverEffect className="flex flex-col justify-between border-[#dce3ec] dark:border-slate-800">
                  <div>
                    <Badge variant="emerald" className="mb-3">
                      GATE {p.branch} Stream
                    </Badge>
                    <h3 className="text-lg font-bold text-[#14213d] dark:text-white mb-2">{p.title}</h3>
                    <p className="text-xs text-[#526079] dark:text-slate-400 mb-4">
                      Official CBT Pattern Mock Series with KaTeX Solutions.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0f766e] dark:text-[#2dd4bf]">
                      {p.total_questions} CBT Questions
                    </span>
                    <Link href={`/exam?paperId=${p.paper_id}`}>
                      <Button variant="emerald" size="sm">
                        Attempt Test →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. PREPARATION CYCLE WORKFLOW */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest block">
            Systematic Learning Path
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#14213d] dark:text-white tracking-tight">
            How GATE Matrix Elevates Your Rank
          </h2>
          <p className="text-xs sm:text-sm text-[#526079] dark:text-slate-400">
            A 4-step data-driven workflow designed to convert weak concepts into top exam scores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((ws, i) => {
            const Icon = ws.icon;
            return (
              <Card key={i} className="relative overflow-hidden border-[#dce3ec] dark:border-slate-800 bg-white dark:bg-[#111a2e] p-6 rounded-3xl">
                <span className="text-5xl font-black text-slate-100 dark:text-slate-800 absolute top-3 right-4 select-none">
                  {ws.step}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-[#e7f4f0] dark:bg-slate-800 text-[#0f766e] dark:text-[#2dd4bf] flex items-center justify-center font-bold mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-extrabold text-[#0f766e] dark:text-[#2dd4bf] uppercase tracking-wider block mb-1">
                  {ws.title}
                </span>
                <h3 className="text-base font-bold text-[#14213d] dark:text-white mb-2">{ws.subtitle}</h3>
                <p className="text-xs text-[#526079] dark:text-slate-400 leading-relaxed">{ws.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 8. TOP RANKER TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[#8be0ce] text-xs font-extrabold uppercase tracking-widest block">
              Proven Results
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Trusted by Top GATE Rankers
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm">
              Hear from aspirants who achieved top All India Ranks using GATE Matrix.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-[#14213d] border border-white/15 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 italic leading-relaxed">
                    “{t.comment}”
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-extrabold text-white text-sm">{t.name}</h4>
                  <div className="text-xs text-[#8be0ce] font-bold">{t.rank}</div>
                  <div className="text-[11px] text-gray-400">{t.college}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest block">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-[#14213d] dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-[#14213d] dark:text-white text-sm flex justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-[#0f766e] dark:text-[#2dd4bf] shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#526079] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-[#526079] dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. FINAL CTA BANNER */}
      <section className="bg-gradient-to-r from-[#0a1128] via-[#14213d] to-[#0f766e] text-white py-16 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <Badge variant="emerald" className="uppercase tracking-widest font-extrabold text-[10px]">
            GATE 2027 Preparation Pass
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Elevate Your All India GATE Rank?
          </h2>
          <p className="text-gray-200 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Join thousands of engineering aspirants practicing on official IIT CBT mock papers with step-by-step KaTeX mathematical solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/catalog">
              <Button variant="emerald" size="lg" className="shadow-xl font-black" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Started with Branch Pass
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

