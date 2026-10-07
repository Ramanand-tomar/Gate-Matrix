'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar, EmptyState } from '@/components/ui/EmptyState';
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Play,
  Zap,
} from 'lucide-react';
import { fastFetchJson } from '@/lib/fastFetch';

interface AttemptRecord {
  id?: string;
  paper_id: string;
  paper_title: string;
  score: number;
  max_score: number;
  accuracy: number;
  time_taken_seconds: number;
  createdAt?: string;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRealAttempts() {
      setLoading(true);
      try {
        const uid = user ? user.uid : 'aspirant_learner_101';
        const data = await fastFetchJson(`/api/attempts?uid=${uid}`);

        let apiAttempts: AttemptRecord[] = data.success && data.attempts ? data.attempts : [];

        // Also merge client-side localStorage attempts
        let localAttempts: AttemptRecord[] = [];
        try {
          const raw = localStorage.getItem('gate_local_attempts');
          if (raw) localAttempts = JSON.parse(raw);
        } catch (e) {}

        // Combine & deduplicate by paper_id & score or ID
        const combinedMap = new Map<string, AttemptRecord>();
        [...apiAttempts, ...localAttempts].forEach((att) => {
          const key = att.id || `${att.paper_id}_${att.score}_${att.createdAt || ''}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, att);
          }
        });

        const sorted = Array.from(combinedMap.values()).sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        if (isMounted) {
          setAttempts(sorted);
        }
      } catch (err) {
        console.error('Failed to load real performance metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRealAttempts();

    const handleAttemptsChanged = () => loadRealAttempts();
    window.addEventListener('gate_attempts_changed', handleAttemptsChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('gate_attempts_changed', handleAttemptsChanged);
    };
  }, [user]);

  function safeNum(val: any, fallback: number = 0): number {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    if (typeof val === 'string') {
      const p = parseFloat(val);
      return isNaN(p) ? fallback : p;
    }
    if (typeof val === 'object' && val !== null) {
      if ('integerValue' in val) return parseInt(val.integerValue, 10) || fallback;
      if ('doubleValue' in val) return parseFloat(val.doubleValue) || fallback;
      if ('stringValue' in val) return parseFloat(val.stringValue) || fallback;
      if ('num' in val) return safeNum(val.num, fallback);
      if ('value' in val) return safeNum(val.value, fallback);
    }
    return fallback;
  }

  function safeStr(val: any, fallback: string = ''): string {
    if (typeof val === 'string') {
      if (val.includes('[object Object]')) {
        const clean = val.replace(/\[object Object\]/g, '').trim();
        return clean.length > 0 ? clean : fallback;
      }
      return val;
    }
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object' && val !== null) {
      if ('stringValue' in val) return String(val.stringValue);
    }
    return fallback;
  }

  // REAL COMPUTATIONS (Zero dummy data & zero NaN / [object Object])
  const totalAttempts = attempts.length;
  const avgAccuracy =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + safeNum(curr.accuracy, 0), 0) / totalAttempts)
      : 0;

  const maxPossibleOverall =
    totalAttempts > 0
      ? Math.max(...attempts.map((a) => safeNum(a.max_score, 65)))
      : 65;

  const highestScore =
    totalAttempts > 0
      ? Math.max(...attempts.map((a) => safeNum(a.score, 0)))
      : 0;

  const totalTimeMinutes = Math.round(
    attempts.reduce((acc, curr) => acc + safeNum(curr.time_taken_seconds, 0), 0) / 60
  );

  // Group real performance by paper / stream
  const realSubjectBreakdown = attempts.map((a) => {
    const rawTitle = safeStr(a.paper_title, safeStr(a.paper_id, 'GATE Mock Test'));
    const title = rawTitle || 'GATE Mock Test';
    const accuracy = Math.round(safeNum(a.accuracy, 0));
    const score = safeNum(a.score, 0);
    const max_score = safeNum(a.max_score, 65);
    const paper_id = safeStr(a.paper_id, '001_Advance_Level_Test-1_Full_Syllabus_GATE_2025_CS');

    let status = 'Moderate Accuracy';
    if (accuracy >= 85) status = 'Strong Domain';
    else if (accuracy >= 70) status = 'Good Progress';
    else if (accuracy >= 50) status = 'Moderate Accuracy';
    else status = 'Needs Focus';

    return {
      title,
      paper_id,
      score,
      max_score: max_score > 0 ? max_score : 65,
      accuracy,
      status,
      timeMins: Math.round(safeNum(a.time_taken_seconds, 0) / 60),
    };
  });

  // Extract REAL weak topics (Accuracy < 70%)
  const realWeakTopics = realSubjectBreakdown.filter((item) => item.accuracy < 70);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-[#14213d] dark:text-gray-100 flex flex-col transition-colors">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Header */}
        <div className="mb-8 bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Real Diagnostic Performance Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-[#14213d] dark:text-white tracking-tight">
            GATE Performance & Weak Area Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#526079] dark:text-slate-400 mt-1 max-w-3xl">
            Real-time score evaluation derived strictly from your submitted GATE CBT mock tests and practice sessions. Zero static or mock data.
          </p>
        </div>

        {/* Top Metric Cards Grid - 100% REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Overall Accuracy"
            value={`${avgAccuracy}%`}
            subtext={totalAttempts > 0 ? `Based on ${totalAttempts} test(s)` : 'No tests submitted yet'}
            icon={<Target className="w-5 h-5" />}
            trend={totalAttempts > 0 ? { value: `${avgAccuracy}%`, isPositive: avgAccuracy >= 60 } : undefined}
          />
          <StatCard
            label="Highest Score Achieved"
            value={highestScore}
            subtext={`Out of ${maxPossibleOverall} max marks`}
            icon={<Award className="w-5 h-5" />}
          />
          <StatCard
            label="Tests Attempted"
            value={totalAttempts}
            subtext="Official CBT Mocks"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Practice Duration"
            value={`${totalTimeMinutes}m`}
            subtext="Active CBT exam time"
            icon={<Clock className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-6 h-48 animate-pulse"></div>
            ))}
          </div>
        ) : totalAttempts === 0 ? (
          /* Empty State when zero real test attempts exist */
          <Card className="bg-white dark:bg-[#111a2e] border-[#dce3ec] dark:border-slate-800 p-12 text-center shadow-sm mb-8">
            <EmptyState
              icon={<TrendingUp className="w-14 h-14 text-[#0f766e] dark:text-[#2dd4bf]" />}
              title="No CBT Exam Attempts Yet"
              description="Start and submit your first GATE CBT mock test or topic practice test to generate real diagnostic accuracy breakdown, scorecards, and weak topic recommendations."
              actionLabel="Take a GATE Mock Test Now"
              actionHref="/exam"
            />
          </Card>
        ) : (
          <div className="space-y-8 mb-8">
            {/* Section 1: Attempted Tests History & Real Results */}
            <Card className="bg-white dark:bg-[#111a2e] border-[#dce3ec] dark:border-slate-800 p-6 shadow-xs">
              <div className="flex justify-between items-center mb-6 border-b border-[#dce3ec] dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#14213d] dark:text-white">
                    📋 Attempted Tests & Real Results Log ({totalAttempts})
                  </h3>
                  <p className="text-xs text-[#526079] dark:text-slate-400 mt-0.5">
                    Detailed record of your completed test sessions and real scores.
                  </p>
                </div>
                <Badge variant="emerald">Real-Time Evaluated</Badge>
              </div>

              <div className="space-y-4">
                {attempts.map((att, idx) => {
                  const titleStr = safeStr(att.paper_title, safeStr(att.paper_id, 'GATE Mock Test')) || 'GATE Mock Test';
                  const paperIdStr = safeStr(att.paper_id, '001_Advance_Level_Test-1_Full_Syllabus_GATE_2025_CS');
                  const scoreNum = safeNum(att.score, 0);
                  const maxScoreNum = safeNum(att.max_score, 65) || 65;
                  const accuracyNum = safeNum(att.accuracy, 0);
                  const timeMins = Math.round(safeNum(att.time_taken_seconds, 0) / 60);

                  return (
                    <div
                      key={att.id || idx}
                      className="border border-[#dce3ec] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-[#0f766e]"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="emerald">Attempt #{totalAttempts - idx}</Badge>
                          <span className="text-xs text-[#526079] dark:text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {timeMins} mins taken
                          </span>
                          {att.createdAt && (
                            <span className="text-[11px] text-slate-400">
                              • {new Date(att.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-extrabold text-[#14213d] dark:text-white">
                          {titleStr}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-[#526079] dark:text-slate-400 uppercase font-bold block">
                            Net Score
                          </span>
                          <div className="text-xl font-black text-[#0f766e] dark:text-[#2dd4bf]">
                            {scoreNum} <span className="text-xs text-slate-400 font-normal">/ {maxScoreNum}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#526079] dark:text-slate-400 uppercase font-bold block">
                            Accuracy
                          </span>
                          <Badge
                            variant={accuracyNum >= 75 ? 'emerald' : accuracyNum >= 50 ? 'amber' : 'rose'}
                            size="md"
                          >
                            {accuracyNum}%
                          </Badge>
                        </div>

                        <Link href={`/exam?paperId=${paperIdStr}`}>
                          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                            View Scorecard & Solutions
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Section 2: Real Subject Breakdown & Weak Area Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Real Subject & Paper Accuracy Breakdown */}
              <div className="lg:col-span-8">
                <Card className="bg-white dark:bg-[#111a2e] border-[#dce3ec] dark:border-slate-800 p-6 shadow-xs h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-black text-[#14213d] dark:text-white">
                          Real Test & Subject Accuracy Breakdown
                        </h3>
                        <p className="text-xs text-[#526079] dark:text-slate-400 mt-0.5">
                          Calculated directly from your test attempt scorecards
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {realSubjectBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-xl"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-extrabold text-xs text-[#14213d] dark:text-white line-clamp-1">
                              {item.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-[#0f766e] dark:text-[#2dd4bf]">
                                {item.score} / {item.max_score} ({item.accuracy}%)
                              </span>
                              <Badge
                                variant={
                                  item.accuracy >= 80
                                    ? 'emerald'
                                    : item.accuracy >= 65
                                    ? 'cyan'
                                    : item.accuracy >= 45
                                    ? 'amber'
                                    : 'rose'
                                }
                                size="sm"
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                          <ProgressBar
                            progress={item.accuracy}
                            color={item.accuracy >= 70 ? 'emerald' : item.accuracy >= 45 ? 'amber' : 'rose'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#dce3ec] dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-[#526079] dark:text-slate-400">
                      Average Practice Accuracy: <strong className="text-[#0f766e] dark:text-[#2dd4bf]">{avgAccuracy}%</strong>
                    </span>
                    <Link href="/catalog">
                      <Button variant="outline" size="sm" rightIcon={<BookOpen className="w-3.5 h-3.5" />}>
                        Take Another Test
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Real Weak Areas Panel */}
              <div className="lg:col-span-4">
                <Card className="bg-white dark:bg-[#111a2e] border-[#dce3ec] dark:border-slate-800 p-6 shadow-xs h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="text-base font-extrabold text-[#14213d] dark:text-white">
                        Real Weak Topics Requiring Focus
                      </h3>
                    </div>
                    <p className="text-xs text-[#526079] dark:text-slate-400 mb-6">
                      Tests where your score dropped below 70% accuracy threshold.
                    </p>

                    {realWeakTopics.length === 0 ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                        <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                          Excellent Performance!
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                          All your attempted test scorecards are above 70% accuracy. Keep maintaining high precision!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {realWeakTopics.map((wt, idx) => (
                          <div
                            key={idx}
                            className="border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 p-4 rounded-xl"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-xs text-rose-950 dark:text-rose-200 line-clamp-1">
                                {wt.title}
                              </span>
                              <span className="font-black text-xs text-rose-700 dark:text-rose-400">
                                {wt.accuracy}%
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-800 dark:text-rose-300 mb-3">
                              Scored {wt.score} / {wt.max_score} ({wt.timeMins} mins spent). Target accuracy: 80%+.
                            </p>
                            <Link href={`/exam?paperId=${wt.paper_id}`}>
                              <Button variant="outline" size="sm" className="w-full text-xs border-rose-300 text-rose-800 dark:text-rose-300">
                                Re-attempt & Fix Weak Areas →
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommended Next Action Banner */}
                  <div className="mt-6 pt-4 border-t border-[#dce3ec] dark:border-slate-800 bg-[#e7f4f0] dark:bg-[#0f2d29] p-4 rounded-2xl text-xs">
                    <span className="font-extrabold text-[#0f766e] dark:text-[#2dd4bf] uppercase tracking-wider block mb-1">
                      💡 Dynamic Recommended Action
                    </span>
                    <p className="text-[#14213d] dark:text-gray-100 font-bold mb-3">
                      {realWeakTopics.length > 0
                        ? `Focus on reviewing solutions for ${realWeakTopics[0].title.split(' ')[0]} to boost your net score.`
                        : 'Practice full-length CBT mocks under timed conditions to refine speed and negative marking control.'}
                    </p>
                    <Link href="/practice">
                      <Button variant="emerald" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Start Topic Practice
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
