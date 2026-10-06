'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
  AlertCircle,
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
  const [targetYear, setTargetYear] = useState('GATE 2025');
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
      : 84;
  const highestScore =
    totalAttemptsCount > 0
      ? Math.max(...attempts.map((a) => a.score || 0))
      : 48.66;
  const totalTimeMinutes = Math.round(
    attempts.reduce((acc, curr) => acc + (curr.time_taken_seconds || 0), 0) / 60
  );

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
    { id: 'ANALYTICS', label: 'Candidate Analytics', icon: TrendingUp },
    { id: 'TEST_SERIES', label: 'My Test Series & Passes', icon: BookOpen, badge: `${papers.length}` },
    { id: 'TEST_RESULTS', label: 'Test Attempt Scorecards', icon: Award, badge: `${attempts.length}` },
    { id: 'PAYMENTS', label: 'Payment Invoices', icon: CreditCard, badge: `${orders.length}` },
    { id: 'SETTINGS', label: 'Account & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Candidate Banner */}
      <div className="bg-[#14213d] text-white py-6 px-6 border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f766e] text-white flex items-center justify-center font-bold text-lg">
              {user?.displayName ? user.displayName[0] : 'G'}
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#8be0ce] uppercase tracking-wider block">
                Personal GATE Command Center
              </span>
              <h1 className="text-xl font-black">
                Good morning, {user ? user.displayName || 'GATE Aspirant' : 'Candidate Workspace'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="bg-white/10 text-gray-200 px-3 py-1.5 rounded-xl border border-white/15">
              Stream: <strong className="text-[#8be0ce]">{targetBranch.split(' ')[0]}</strong>
            </span>
            {!user ? (
              <Button variant="emerald" size="sm" onClick={signInWithGoogle}>
                Sign in with Google
              </Button>
            ) : (
              <span className="text-gray-300 hidden md:inline">{user.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Navigation Menu */}
        <aside className="lg:col-span-3 space-y-6">
          <Card padding="sm" className="sticky top-20">
            <span className="text-[#0f766e] text-[10px] font-extrabold uppercase tracking-widest block mb-3 px-2">
              Workspace Nav
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
                        ? 'bg-[#14213d] text-white shadow-sm'
                        : 'text-[#526079] hover:bg-slate-50 hover:text-[#14213d]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#8be0ce]' : 'text-[#526079]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-[#526079]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <hr className="border-[#dce3ec] my-4" />

            <Link href="/catalog">
              <Button variant="emerald" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Explore Test Series
              </Button>
            </Link>
          </Card>
        </aside>

        {/* Right Content View Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: REAL-TIME ANALYTICS */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
              {/* Continue Practice Hero Card */}
              {papers.length > 0 && (
                <Card className="bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white border-white/10">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <Badge variant="emerald" size="sm" className="mb-2">
                        Continue Practice
                      </Badge>
                      <h2 className="text-xl font-black">{papers[0].title}</h2>
                      <p className="text-xs text-gray-300 mt-1">
                        {papers[0].total_questions} Questions · IIT CBT Examination Standard
                      </p>
                    </div>
                    <Link href={`/exam?paperId=${papers[0].paper_id}`}>
                      <Button variant="emerald" size="md" rightIcon={<Play className="w-4 h-4" />}>
                        Continue Test
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {/* Performance Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Overall Accuracy" value={`${avgAccuracy}%`} subtext="Target: 80%+" />
                <StatCard label="Highest Score" value={highestScore} subtext="Out of 65" />
                <StatCard label="Tests Attempted" value={totalAttemptsCount} subtext="CBT Mocks" />
                <StatCard label="Time Practiced" value={`${totalTimeMinutes}m`} subtext="Duration" />
              </div>

              {/* Subject Accuracy Breakdown */}
              <Card>
                <h3 className="text-base font-black text-[#14213d] mb-4">Subject Topic Accuracy Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { topic: 'Data Structures & Algorithms', accuracy: 88, status: 'Strong Domain' },
                    { topic: 'Database Management Systems (DBMS)', accuracy: 82, status: 'Strong Domain' },
                    { topic: 'Operating Systems & System Software', accuracy: 74, status: 'Moderate Accuracy' },
                    { topic: 'Computer Networks & Protocols', accuracy: 62, status: 'Needs Practice' },
                    { topic: 'Theory of Computation & Automata', accuracy: 55, status: 'Priority Focus' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-[#dce3ec] p-4 rounded-xl text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[#14213d]">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#0f766e]">{item.accuracy}%</span>
                          <span className="text-[10px] text-slate-500 font-medium">({item.status})</span>
                        </div>
                      </div>
                      <ProgressBar progress={item.accuracy} color={item.accuracy >= 70 ? 'emerald' : 'amber'} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: MY TEST SERIES & PASSES */}
          {activeTab === 'TEST_SERIES' && (
            <Card>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-[#14213d]">Available GATE Test Series</h2>
                  <p className="text-xs text-[#526079]">Practice official GATE CBT paper mocks.</p>
                </div>
                <Link href="/catalog" className="text-xs font-bold text-[#0f766e] hover:underline">
                  View Full Catalogue →
                </Link>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading test series...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[#526079] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Test Paper Title</th>
                        <th className="p-3.5">Branch</th>
                        <th className="p-3.5">Questions</th>
                        <th className="p-3.5">Exam Pattern</th>
                        <th className="p-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec]">
                      {papers.slice(0, 10).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d]">{p.title}</td>
                          <td className="p-3.5 font-bold text-[#0f766e]">{p.branch}</td>
                          <td className="p-3.5 font-bold">{p.total_questions} Qs</td>
                          <td className="p-3.5 text-[#526079]">
                            <Badge variant="emerald" size="sm">
                              IIT CBT Standard
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
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#14213d]">Test Attempt History & Scorecards</h2>
                <p className="text-xs text-[#526079]">Review past attempt scores and solutions.</p>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading attempt records...</div>
              ) : attempts.length === 0 ? (
                <div className="bg-slate-50 border border-[#dce3ec] rounded-2xl p-8 text-center text-slate-500 text-xs">
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
                    <thead className="bg-slate-50 text-[#526079] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Paper Title</th>
                        <th className="p-3.5">Net Score</th>
                        <th className="p-3.5">Accuracy</th>
                        <th className="p-3.5">Time Spent</th>
                        <th className="p-3.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec]">
                      {attempts.map((att, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d]">{att.paper_title || 'GATE CBT Test'}</td>
                          <td className="p-3.5 font-black text-[#0f766e]">
                            {att.score} <span className="text-slate-400 font-normal">/ {att.max_score}</span>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-700">{att.accuracy}%</td>
                          <td className="p-3.5 font-mono text-slate-600">
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
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-black text-[#14213d]">Payment Transactions & Invoices</h2>
                <p className="text-xs text-[#526079]">Official payment receipts and Razorpay transactions.</p>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading payment records...</div>
              ) : orders.length === 0 ? (
                <div className="bg-slate-50 border border-[#dce3ec] rounded-2xl p-8 text-center text-slate-500 text-xs">
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
                    <thead className="bg-slate-50 text-[#526079] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Product Title</th>
                        <th className="p-3.5">Order Ref</th>
                        <th className="p-3.5">Payment ID</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec]">
                      {orders.map((ord, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d]">{ord.product_title}</td>
                          <td className="p-3.5 font-mono text-slate-600">{ord.order_id}</td>
                          <td className="p-3.5 font-mono text-[#0f766e]">{ord.razorpay_payment_id || 'N/A'}</td>
                          <td className="p-3.5 font-bold text-[#14213d]">₹{ord.amount}</td>
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
            <Card className="max-w-xl">
              <h2 className="text-xl font-black text-[#14213d] mb-1">Candidate Profile & Settings</h2>
              <p className="text-xs text-[#526079] mb-6">Manage candidate details and study preferences.</p>

              {profileSavedNotice && (
                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold p-3 rounded-xl mb-4">
                  ✓ Profile preferences saved successfully!
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#14213d] mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full border border-[#dce3ec] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#14213d] mb-1">Target Engineering Stream</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full border border-[#dce3ec] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e] bg-white"
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
                  <label className="block font-bold text-[#14213d] mb-1">Target Exam Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full border border-[#dce3ec] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e] bg-white"
                  >
                    <option>GATE 2025</option>
                    <option>GATE 2026</option>
                    <option>GATE 2027</option>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading learner dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
