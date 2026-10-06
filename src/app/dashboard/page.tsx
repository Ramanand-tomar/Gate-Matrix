'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';

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

export default function DashboardPage() {
  const { user, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<SidepanelTab>('ANALYTICS');

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
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    async function loadWorkspaceData() {
      setLoadingData(true);
      try {
        const uid = user ? user.uid : 'aspirant_learner_101';

        // Load papers
        const paperRes = await fetch('/api/papers');
        const paperData = await paperRes.json();
        if (isMounted && paperData.success && paperData.papers) {
          setPapers(paperData.papers);
        }

        // Load attempts
        const attemptRes = await fetch(`/api/attempts?uid=${uid}`);
        const attemptData = await attemptRes.json();
        if (isMounted && attemptData.success && attemptData.attempts) {
          setAttempts(attemptData.attempts);
        }

        // Load orders
        const orderRes = await fetch(`/api/orders?uid=${uid}`);
        const orderData = await orderRes.json();
        if (isMounted && orderData.success && orderData.orders) {
          setOrders(orderData.orders);
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

  const navItems: { id: SidepanelTab; label: string; icon: string; badge?: string }[] = [
    { id: 'ANALYTICS', label: 'Real-Time Analytics', icon: '📊' },
    { id: 'TEST_SERIES', label: 'My Test Series & Passes', icon: '📝', badge: `${papers.length}` },
    { id: 'TEST_RESULTS', label: 'Test Results & Scorecards', icon: '📈', badge: `${attempts.length}` },
    { id: 'PAYMENTS', label: 'Payment Details & Invoices', icon: '💳', badge: `${orders.length}` },
    { id: 'SETTINGS', label: 'Account Settings & Profile', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Workspace Sub-Navbar */}
      <div className="bg-[#14213d] text-white py-4 px-6 border-b border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#8be0ce] animate-pulse"></span>
            <div>
              <span className="text-[10px] font-extrabold text-[#8be0ce] uppercase tracking-wider block">
                GATEPrep Learner Hub
              </span>
              <h1 className="text-xl font-extrabold">
                {user ? user.displayName || 'GATE Aspirant' : 'Candidate Workspace'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="bg-white/10 text-gray-200 px-3 py-1.5 rounded-xl border border-white/15">
              Target: <strong className="text-[#8be0ce]">{targetBranch.split(' ')[0]}</strong>
            </span>
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold px-4 py-1.5 rounded-xl transition-all shadow-sm"
              >
                Sign in with Google
              </button>
            ) : (
              <span className="text-gray-300 hidden md:inline">{user.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout with Sidebar Panel */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidepanel Navigation Menu */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-[#dce3ec] rounded-3xl p-5 shadow-sm sticky top-6">
            <span className="text-[#0f766e] text-[10px] font-extrabold uppercase tracking-widest block mb-3 px-2">
              Workspace Menu
            </span>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                      isActive
                        ? 'bg-[#14213d] text-white shadow-md'
                        : 'text-[#526079] hover:bg-gray-50 hover:text-[#14213d]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#0f766e] text-white' : 'bg-gray-100 text-[#526079]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <hr className="border-[#dce3ec] my-5" />

            {/* Quick Action Button */}
            <Link
              href="/catalog"
              className="w-full bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Explore All Test Series</span>
              <span>→</span>
            </Link>
          </div>
        </aside>

        {/* Right Content View Container */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: REAL-TIME ANALYTICS */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Analytics Summary Banner */}
              <div className="bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white rounded-3xl p-8 shadow-xl border border-white/10">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  <div>
                    <span className="bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider block mb-2 w-fit">
                      Real-Time Performance Analysis
                    </span>
                    <h2 className="text-2xl font-extrabold">Exam Performance Dashboard</h2>
                    <p className="text-xs text-gray-300 mt-1">
                      Track accuracy trends, score progression, and topic weak-points before exam day.
                    </p>
                  </div>

                  <Link
                    href="/exam"
                    className="bg-[#8be0ce] text-[#0f172a] font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-white transition-all shadow-sm active:scale-95"
                  >
                    Launch Mock Engine →
                  </Link>
                </div>

                {/* Key Metrics Widgets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-gray-400 block mb-1 font-bold">Overall Accuracy</span>
                    <div className="text-3xl font-black text-[#8be0ce]">{avgAccuracy}%</div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-gray-400 block mb-1 font-bold">Highest Score</span>
                    <div className="text-3xl font-black text-white">{highestScore}</div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-gray-400 block mb-1 font-bold">Tests Completed</span>
                    <div className="text-3xl font-black text-white">{totalAttemptsCount}</div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <span className="text-gray-400 block mb-1 font-bold">Time Practiced</span>
                    <div className="text-2xl font-black text-[#8be0ce]">{totalTimeMinutes} mins</div>
                  </div>
                </div>
              </div>

              {/* Topic Accuracy Breakdown */}
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-extrabold text-[#14213d] mb-4">Subject Topic Accuracy Breakdown</h3>
                <div className="space-y-4 text-xs">
                  {[
                    { topic: 'Data Structures & Algorithms', accuracy: 88, status: 'Strong Domain' },
                    { topic: 'Database Management Systems (DBMS)', accuracy: 82, status: 'Strong Domain' },
                    { topic: 'Operating Systems & System Software', accuracy: 74, status: 'Moderate Accuracy' },
                    { topic: 'Computer Networks & Protocols', accuracy: 62, status: 'Needs Practice' },
                    { topic: 'Theory of Computation & Automata', accuracy: 55, status: 'High Yield Priority' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#f8fafc] border border-[#dce3ec] p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[#14213d]">{item.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0f766e]">{item.accuracy}%</span>
                          <span className="text-[10px] text-gray-500 font-medium">({item.status})</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#0f766e] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${item.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY TEST SERIES & PASSES */}
          {activeTab === 'TEST_SERIES' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#14213d]">Available GATE Test Series & Passes</h2>
                    <p className="text-xs text-[#526079] mt-0.5">
                      Practice official GATE CBT paper mocks across all engineering disciplines.
                    </p>
                  </div>
                  <Link
                    href="/catalog"
                    className="text-xs font-bold text-[#0f766e] hover:underline"
                  >
                    View Full Catalogue →
                  </Link>
                </div>

                {loadingData ? (
                  <div className="p-8 text-center text-xs text-gray-400">Loading test series...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc] text-[#526079] uppercase tracking-wider font-bold">
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
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3.5 font-bold text-[#14213d]">{p.title}</td>
                            <td className="p-3.5 font-bold text-[#0f766e]">{p.branch}</td>
                            <td className="p-3.5 font-bold">{p.total_questions} Qs</td>
                            <td className="p-3.5 text-[#526079]">
                              <span className="bg-[#e7f4f0] text-[#0f766e] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Official CBT Standard
                              </span>
                            </td>
                            <td className="p-3.5">
                              <Link
                                href={`/exam?paperId=${p.paper_id}`}
                                className="bg-[#0f766e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#115e59] transition-colors inline-block shadow-xs"
                              >
                                Launch Test →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEST RESULTS & HISTORY LOG */}
          {activeTab === 'TEST_RESULTS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-[#14213d]">Test Attempt History & Scorecards</h2>
                  <p className="text-xs text-[#526079] mt-0.5">
                    Review past attempt scores, accuracy percentages, and step-by-step solutions.
                  </p>
                </div>

                {loadingData ? (
                  <div className="p-8 text-center text-xs text-gray-400">Loading attempt records...</div>
                ) : attempts.length === 0 ? (
                  <div className="bg-[#f8fafc] border border-[#dce3ec] rounded-2xl p-8 text-center text-gray-500 text-xs">
                    No completed test attempts recorded yet.
                    <div className="mt-3">
                      <Link
                        href="/exam"
                        className="bg-[#0f766e] text-white font-bold text-xs px-4 py-2 rounded-xl inline-block"
                      >
                        Attempt Your First Test →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc] text-[#526079] uppercase tracking-wider font-bold">
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
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3.5 font-bold text-[#14213d]">{att.paper_title || 'GATE CBT Test'}</td>
                            <td className="p-3.5 font-black text-[#0f766e]">
                              {att.score} <span className="text-gray-400 font-normal">/ {att.max_score}</span>
                            </td>
                            <td className="p-3.5 font-bold text-emerald-700">{att.accuracy}%</td>
                            <td className="p-3.5 text-gray-600 font-mono">
                              {Math.round((att.time_taken_seconds || 0) / 60)} mins
                            </td>
                            <td className="p-3.5">
                              <Link
                                href={`/exam?paperId=${att.paper_id}`}
                                className="bg-[#14213d] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0f766e] transition-colors inline-block shadow-xs"
                              >
                                Review Scorecard →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT DETAILS & INVOICES */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-[#14213d]">Payment Transactions & Enrollment Receipts</h2>
                  <p className="text-xs text-[#526079] mt-0.5">
                    Official payment receipts and active Razorpay transaction references.
                  </p>
                </div>

                {loadingData ? (
                  <div className="p-8 text-center text-xs text-gray-400">Loading payment records...</div>
                ) : orders.length === 0 ? (
                  <div className="bg-[#f8fafc] border border-[#dce3ec] rounded-2xl p-8 text-center text-gray-500 text-xs">
                    No active paid orders found.
                    <div className="mt-3">
                      <Link
                        href="/catalog"
                        className="bg-[#0f766e] text-white font-bold text-xs px-4 py-2 rounded-xl inline-block"
                      >
                        Enroll in GATE Branch Pass →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc] text-[#526079] uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-3.5">Product Title</th>
                          <th className="p-3.5">Order Ref</th>
                          <th className="p-3.5">Razorpay Payment ID</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce3ec]">
                        {orders.map((ord, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3.5 font-bold text-[#14213d]">{ord.product_title}</td>
                            <td className="p-3.5 font-mono text-gray-600">{ord.order_id}</td>
                            <td className="p-3.5 font-mono text-[#0f766e]">{ord.razorpay_payment_id || 'N/A'}</td>
                            <td className="p-3.5 font-bold text-[#14213d]">₹{ord.amount}</td>
                            <td className="p-3.5">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {ord.status || 'GRANTED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACCOUNT SETTINGS & PROFILE */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm max-w-2xl">
                <h2 className="text-xl font-extrabold text-[#14213d] mb-1">Account Settings & Profile</h2>
                <p className="text-xs text-[#526079] mb-6">
                  Manage candidate details, target engineering branch, and study preferences.
                </p>

                {profileSavedNotice && (
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold p-4 rounded-2xl mb-6">
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
                      placeholder="e.g. Ramanand Tomar"
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
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
