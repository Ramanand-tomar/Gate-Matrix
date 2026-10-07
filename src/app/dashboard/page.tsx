'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LeetCodeProfileCard } from '@/components/profile/LeetCodeProfileCard';
import { ProgressBar } from '@/components/ui/EmptyState';
import {
  TrendingUp,
  BookOpen,
  Award,
  CreditCard,
  Settings,
  Target,
  Clock,
  Play,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';

interface PaperDoc {
  id: string;
  paper_id: string;
  title: string;
  branch: string;
  total_questions: number;
}

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

interface OrderRecord {
  id?: string;
  order_id: string;
  product_title: string;
  amount: number;
  currency: string;
  razorpay_payment_id?: string;
  status: string;
  createdAt?: string;
}

type SidepanelTab = 'ANALYTICS' | 'TEST_SERIES' | 'TEST_RESULTS' | 'PAYMENTS' | 'SETTINGS';

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SidepanelTab | null;

  const { user, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<SidepanelTab>(tabParam || 'ANALYTICS');

  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Settings State
  const [targetBranch, setTargetBranch] = useState('Computer Science Engineering (CS)');
  const [targetYear, setTargetYear] = useState('GATE 2027');
  const [displayName, setDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    async function loadWorkspaceData() {
      setLoadingData(true);
      try {
        const uid = user ? user.uid : 'aspirant_learner_101';

        const [paperRes, attemptRes, orderRes] = await Promise.all([
          fetch('/api/papers'),
          fetch(`/api/attempts?uid=${uid}`),
          fetch(`/api/orders?uid=${uid}`),
        ]);

        const paperData = await paperRes.json();
        const attemptData = await attemptRes.json();
        const orderData = await orderRes.json();

        if (isMounted) {
          if (paperData.success && paperData.papers) setPapers(paperData.papers);
          if (attemptData.success && attemptData.attempts) setAttempts(attemptData.attempts);

          let localOrders: OrderRecord[] = [];
          try {
            const saved = localStorage.getItem('gate_user_orders');
            if (saved) localOrders = JSON.parse(saved);
          } catch (e) {}

          const fetchedOrders = orderData.success && orderData.orders ? orderData.orders : [];
          setOrders([...fetchedOrders, ...localOrders]);
        }
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }
    loadWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Derived Analytics Computations
  const totalAttemptsCount = attempts.length;
  const avgAccuracy =
    totalAttemptsCount > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalAttemptsCount)
      : 72;
  const highestScore =
    totalAttemptsCount > 0
      ? Math.max(...attempts.map((a) => a.score || 0))
      : 58.33;
  const totalTimeHours = Math.round(
    attempts.reduce((acc, curr) => acc + (curr.time_taken_seconds || 0), 0) / 3600
  ) || 12;

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if (user) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            displayName,
            email: user.email,
          }),
        });
      }
      setProfileSavedNotice(true);
      setTimeout(() => setProfileSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed saving profile preferences:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const navItems: { id: SidepanelTab; label: string; icon: any; badge?: string }[] = [
    { id: 'ANALYTICS', label: 'Learner Command Center', icon: TrendingUp },
    { id: 'TEST_SERIES', label: 'My Test Series & Passes', icon: BookOpen, badge: `${papers.length}` },
    { id: 'TEST_RESULTS', label: 'Test Attempt History', icon: Award, badge: `${attempts.length}` },
    { id: 'PAYMENTS', label: 'Payments & Receipts', icon: CreditCard, badge: `${orders.length}` },
    { id: 'SETTINGS', label: 'Profile & Preferences', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col transition-colors">
      {/* Candidate Banner */}
      <div className="bg-gradient-to-r from-[#0a1128] via-[#14213d] to-[#0f766e] text-white py-6 px-6 border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f766e] to-teal-400 text-white flex items-center justify-center font-black text-xl shadow-md">
              {user?.displayName ? user.displayName[0] : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-[#8be0ce] uppercase tracking-wider">
                  GATE CS 2027
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-[11px] font-mono text-teal-300 font-bold">123 Days Remaining</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Good evening, {user ? user.displayName || 'GATE Aspirant' : 'Ramanand'} 👋
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="bg-white/10 text-gray-200 px-3 py-1.5 rounded-xl border border-white/15 font-semibold">
              Stream: <strong className="text-[#8be0ce]">GATE CS</strong>
            </span>
            {!user ? (
              <Button variant="emerald" size="sm" onClick={signInWithGoogle}>
                Sign in with Google
              </Button>
            ) : (
              <span className="text-gray-300 hidden md:inline font-mono">{user.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Navigation Menu */}
        <aside className="lg:col-span-3 space-y-6">
          <Card padding="sm" className="sticky top-20 border-[#dce3ec] dark:border-slate-800">
            <span className="text-[#0f766e] dark:text-[#2dd4bf] text-[10px] font-extrabold uppercase tracking-widest block mb-3 px-2">
              Student Navigation
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all text-left ${
                      isActive
                        ? 'bg-[#14213d] dark:bg-[#0f766e] text-white shadow-sm'
                        : 'text-[#526079] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#14213d] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#8be0ce]' : 'text-[#526079] dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#0f766e] dark:bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#526079] dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <hr className="border-[#dce3ec] dark:border-slate-800 my-4" />

            <Link href="/practice">
              <Button variant="emerald" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Go to Practice Arena
              </Button>
            </Link>
          </Card>
        </aside>

        {/* Right Content View Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: REAL-TIME ANALYTICS & TODAY'S ACTION */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
              {/* LEETCODE-STYLE CANDIDATE PROFILE & BRANCH MASTERY CARD */}
              <LeetCodeProfileCard
                user={user}
                papers={papers}
                attempts={attempts}
                orders={orders}
              />

              {/* 1. "WHAT SHOULD I DO TODAY?" CONTINUE PRACTICE HERO CARD */}
              <Card className="bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white border-white/10 shadow-xl p-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="space-y-1">
                    <Badge variant="emerald" size="sm" className="mb-1 font-extrabold uppercase">
                      Recommended Next Test
                    </Badge>
                    <h2 className="text-xl font-black text-white">
                      {papers.length > 0 ? papers[0].title : 'GATE CS Full Mock #08'}
                    </h2>
                    <p className="text-xs text-gray-300">
                      Not attempted · 65 Questions · 180 Mins · Realistic CBT Keypad Interface
                    </p>
                  </div>
                  <Link href={papers.length > 0 ? `/exam?paperId=${papers[0].paper_id}` : '/exam'}>
                    <Button variant="emerald" size="lg" className="shadow-lg font-black" rightIcon={<Play className="w-4 h-4" />}>
                      Continue Test
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* 2. PERFORMANCE KPIS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Accuracy Rate" value={`${avgAccuracy}%`} subtext="Target: 80%+" />
                <StatCard label="Avg Score" value={`${highestScore}`} subtext="Out of 100" />
                <StatCard label="Completed Mocks" value={totalAttemptsCount || 18} subtext="Tests Taken" />
                <StatCard label="Practice Time" value={`${totalTimeHours}h`} subtext="Total Duration" />
              </div>

              {/* 3. FOCUS AREAS & WEAK SUBJECT ALERT */}
              <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-[#14213d] dark:text-white">⚠ High Priority Focus Area</h3>
                    <p className="text-xs text-[#526079] dark:text-slate-300 mt-0.5">
                      Your accuracy in <strong>Operating Systems (Scheduling & Deadlocks)</strong> is currently at <strong>48%</strong>. Practicing 15 targeted NAT questions today will lift your score by ~4 marks.
                    </p>
                    <div className="mt-3">
                      <Link href="/practice?branch=CS">
                        <Button variant="emerald" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Practice Operating Systems Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4. SUBJECT PERFORMANCE ACCURACY BREAKDOWN */}
              <Card className="border-[#dce3ec] dark:border-slate-800">
                <h3 className="text-base font-black text-[#14213d] dark:text-white mb-4">Subject Wise Mastery Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { topic: 'Data Structures & Algorithms (DSA)', accuracy: 89, status: 'Mastered' },
                    { topic: 'Database Management Systems (DBMS)', accuracy: 82, status: 'Strong' },
                    { topic: 'Operating Systems (OS)', accuracy: 64, status: 'Focus Area' },
                    { topic: 'Computer Networks (CN)', accuracy: 56, status: 'Needs Practice' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-xl text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[#14213d] dark:text-white">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#0f766e] dark:text-[#2dd4bf]">{item.accuracy}%</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({item.status})</span>
                        </div>
                      </div>
                      <ProgressBar progress={item.accuracy} color={item.accuracy >= 75 ? 'emerald' : item.accuracy >= 60 ? 'amber' : 'amber'} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: MY TEST SERIES & PASSES */}
          {activeTab === 'TEST_SERIES' && (
            <Card className="border-[#dce3ec] dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#14213d] dark:text-white">Available GATE Test Series</h2>
                  <p className="text-xs text-[#526079] dark:text-slate-400">Practice realistic GATE CBT paper mocks.</p>
                </div>
                <Link href="/catalog" className="text-xs font-bold text-[#0f766e] dark:text-[#2dd4bf] hover:underline">
                  View Full Storefront →
                </Link>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading test series...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[#526079] dark:text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Test Paper Title</th>
                        <th className="p-3.5">Branch</th>
                        <th className="p-3.5">Questions</th>
                        <th className="p-3.5">Exam Pattern</th>
                        <th className="p-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec] dark:divide-slate-800">
                      {papers.slice(0, 10).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d] dark:text-white">{p.title}</td>
                          <td className="p-3.5 font-bold text-[#0f766e] dark:text-[#2dd4bf]">{p.branch}</td>
                          <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">{p.total_questions} Qs</td>
                          <td className="p-3.5 text-[#526079]">
                            <Badge variant="emerald" size="sm">
                              CBT Standard
                            </Badge>
                          </td>
                          <td className="p-3.5">
                            <Link href={`/exam?paperId=${p.paper_id}`}>
                              <Button variant="emerald" size="sm">
                                Launch Test
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: TEST RESULTS & SCORECARDS */}
          {activeTab === 'TEST_RESULTS' && (
            <Card className="border-[#dce3ec] dark:border-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#14213d] dark:text-white">Test Attempt History & Scorecards</h2>
                <p className="text-xs text-[#526079] dark:text-slate-400">Review past attempt scores and KaTeX solutions.</p>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading attempt records...</div>
              ) : attempts.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No completed test attempts recorded yet.
                  <div className="mt-3">
                    <Link href="/exam">
                      <Button variant="emerald" size="sm">
                        Attempt Your First Test →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[#526079] dark:text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Paper Title</th>
                        <th className="p-3.5">Net Score</th>
                        <th className="p-3.5">Accuracy</th>
                        <th className="p-3.5">Time Spent</th>
                        <th className="p-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec] dark:divide-slate-800">
                      {attempts.map((att, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d] dark:text-white">{att.paper_title || 'GATE CBT Test'}</td>
                          <td className="p-3.5 font-black text-[#0f766e] dark:text-[#2dd4bf]">
                            {att.score} <span className="text-slate-400 font-normal">/ {att.max_score}</span>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">{att.accuracy}%</td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                            {Math.round((att.time_taken_seconds || 0) / 60)} mins
                          </td>
                          <td className="p-3.5">
                            <Link href={`/exam?paperId=${att.paper_id}`}>
                              <Button variant="primary" size="sm">
                                Review Scorecard →
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: PAYMENTS & INVOICES */}
          {activeTab === 'PAYMENTS' && (
            <Card className="border-[#dce3ec] dark:border-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#14213d] dark:text-white">Payment Transactions & Receipts</h2>
                <p className="text-xs text-[#526079] dark:text-slate-400">Official payment receipts and Razorpay transactions.</p>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading payment records...</div>
              ) : orders.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No active paid orders found.
                  <div className="mt-3">
                    <Link href="/catalog">
                      <Button variant="emerald" size="sm">
                        Enroll in GATE Branch Pass →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[#526079] dark:text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Product Title</th>
                        <th className="p-3.5">Order Ref</th>
                        <th className="p-3.5">Payment ID</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec] dark:divide-slate-800">
                      {orders.map((ord, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d] dark:text-white">{ord.product_title}</td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{ord.order_id}</td>
                          <td className="p-3.5 font-mono text-[#0f766e] dark:text-[#2dd4bf]">{ord.razorpay_payment_id || 'N/A'}</td>
                          <td className="p-3.5 font-bold text-[#14213d] dark:text-white">₹{ord.amount}</td>
                          <td className="p-3.5">
                            <Badge variant="emerald">{ord.status || 'GRANTED'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 5: ACCOUNT SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <Card className="max-w-xl border-[#dce3ec] dark:border-slate-800">
              <h2 className="text-xl font-black text-[#14213d] dark:text-white mb-1">Candidate Profile & Settings</h2>
              <p className="text-xs text-[#526079] dark:text-slate-400 mb-6">Manage candidate details and study preferences.</p>

              {profileSavedNotice && (
                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold p-3 rounded-xl mb-4">
                  ✓ Profile preferences saved successfully!
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#14213d] dark:text-white mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full border border-[#dce3ec] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#14213d] dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#14213d] dark:text-white mb-1">Target Engineering Stream</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full border border-[#dce3ec] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#14213d] dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e]"
                  >
                    <option>Computer Science Engineering (CS)</option>
                    <option>Data Science & AI (DA)</option>
                    <option>Electrical Engineering (EE)</option>
                    <option>Electronics & Communication (EC)</option>
                    <option>Mechanical Engineering (ME)</option>
                    <option>Civil Engineering (CE)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#14213d] dark:text-white mb-1">Target Exam Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full border border-[#dce3ec] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#14213d] dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e]"
                  >
                    <option>GATE 2027</option>
                    <option>GATE 2028</option>
                  </select>
                </div>

                <div className="pt-4">
                  <Button variant="emerald" onClick={handleSaveProfile} isLoading={isSavingProfile}>
                    Save Profile Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col">
      <div className="bg-[#14213d] text-white py-6 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-700 animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-700 rounded animate-pulse"></div>
              <div className="w-48 h-6 bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-2xl h-64 animate-pulse"></div>
        </aside>
        <main className="lg:col-span-9 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 h-44 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-2xl h-24 animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
