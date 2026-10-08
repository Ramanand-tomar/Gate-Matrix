'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FolderCheck,
  BookOpen,
  Clock,
  Play,
  Award,
  CheckCircle2,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  Sparkles,
  Trash2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { hasUserBranchAccess } from '@/lib/commerce/entitlements';
import { CheckoutModal } from '@/components/commerce/CheckoutModal';
import { getSavedTestIds, isTestSaved, toggleSaveTest } from '@/lib/savedTests';
import { fastFetchJson } from '@/lib/fastFetch';

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

export default function LibraryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SERIES' | 'PASSES' | 'SAVED' | 'COMPLETED'>('SERIES');

  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [savedTestIds, setSavedTestIds] = useState<string[]>([]);
  const [checkoutBranch, setCheckoutBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Load local saved test IDs
    setSavedTestIds(getSavedTestIds());

    const handleSavedChange = () => {
      setSavedTestIds(getSavedTestIds());
    };
    window.addEventListener('gate_saved_tests_changed', handleSavedChange);
    return () => window.removeEventListener('gate_saved_tests_changed', handleSavedChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const uid = user ? user.uid : 'aspirant_learner_101';

        const [paperData, attemptData, orderData] = await Promise.all([
          fastFetchJson('/api/papers'),
          fastFetchJson(`/api/attempts?uid=${uid}`),
          fastFetchJson(`/api/orders?uid=${uid}`),
        ]);

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
        console.error('Failed to load library data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const attemptedPaperIds = new Set(attempts.map((a) => a.paper_id));

  const handleToggleSave = (paperId: string) => {
    toggleSaveTest(paperId);
    setSavedTestIds(getSavedTestIds());
  };

  // Filtered active papers
  const filteredPapers = papers.filter((p) => {
    const matchesBranch = selectedBranch === 'ALL' || p.branch.toUpperCase() === selectedBranch.toUpperCase();
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paper_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // Saved papers filter
  const savedPapers = papers.filter((p) => savedTestIds.includes(p.paper_id));

  // Passes list (If 0 orders, show active complimentary student pass)
  const effectiveOrders = orders.length > 0 ? orders : [
    {
      order_id: 'pass_free_access_2026',
      product_title: 'GATE All-India Practice & Mock Test Pass 2026',
      amount: 0,
      currency: 'INR',
      status: 'ACTIVE',
      razorpay_payment_id: 'COMPLIMENTARY_STUDENT_GRANT',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-[#14213d] dark:text-gray-100 flex flex-col transition-colors">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Header Banner */}
        <div className="mb-8 bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest mb-2">
            <FolderCheck className="w-4 h-4" />
            <span>Learner Library & Drive</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#14213d] dark:text-white tracking-tight">
            My Enrolled Content, Passes & Saved Tests
          </h1>
          <p className="text-xs sm:text-sm text-[#526079] dark:text-slate-400 mt-1 max-w-3xl">
            Access your active GATE test series, purchased passes, bookmarked questions, completed CBT scorecards, and custom revision lists in one place.
          </p>
        </div>

        {/* Tab Selection Navigation Bar */}
        <div className="flex border-b border-[#dce3ec] dark:border-slate-800 mb-8 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('SERIES')}
            className={`pb-3.5 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'SERIES'
                ? 'border-[#0f766e] text-[#0f766e] dark:text-[#2dd4bf]'
                : 'border-transparent text-[#526079] dark:text-slate-400 hover:text-[#14213d] dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Active Test Series ({papers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PASSES')}
            className={`pb-3.5 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'PASSES'
                ? 'border-[#0f766e] text-[#0f766e] dark:text-[#2dd4bf]'
                : 'border-transparent text-[#526079] dark:text-slate-400 hover:text-[#14213d] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Purchased Passes ({effectiveOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SAVED')}
            className={`pb-3.5 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'SAVED'
                ? 'border-[#0f766e] text-[#0f766e] dark:text-[#2dd4bf]'
                : 'border-transparent text-[#526079] dark:text-slate-400 hover:text-[#14213d] dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
            <span>Saved Tests ({savedPapers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`pb-3.5 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'border-[#0f766e] text-[#0f766e] dark:text-[#2dd4bf]'
                : 'border-transparent text-[#526079] dark:text-slate-400 hover:text-[#14213d] dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Tests ({attempts.length})</span>
          </button>
        </div>

        {/* ----------------------------------------------------
            TAB 1: ACTIVE TEST SERIES
           ---------------------------------------------------- */}
        {activeTab === 'SERIES' && (
          <div className="space-y-6">
            {/* Filter and Search controls */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 p-4 rounded-2xl">
              {/* Branch Filter Pills */}
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'CS', 'DA', 'EE', 'EC', 'ME', 'CE'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBranch(b)}
                    className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                      selectedBranch === b
                        ? 'bg-[#14213d] text-white dark:bg-[#0f766e] shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#526079] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {b === 'ALL' ? 'All Streams' : b}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search test series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-[#dce3ec] dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-[#111a2e] border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-6 h-48 animate-pulse"></div>
                ))}
              </div>
            ) : filteredPapers.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="No Test Series Found"
                description="Explore our official GATE test series catalog to enroll in papers matching your engineering stream."
                actionLabel="Explore Test Series Catalogue"
                actionHref="/catalog"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPapers.map((paper) => {
                  const isDone = attemptedPaperIds.has(paper.paper_id);
                  const isSaved = savedTestIds.includes(paper.paper_id);

                  return (
                    <Card key={paper.id} hoverEffect className="flex flex-col justify-between relative bg-white dark:bg-[#111a2e] border-[#dce3ec] dark:border-slate-800">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="emerald">{paper.branch || 'GATE'}</Badge>
                            {isDone ? (
                              <Badge variant="slate">Attempted</Badge>
                            ) : (
                              <Badge variant="purple">Ready to Attempt</Badge>
                            )}
                          </div>

                          {/* Bookmark Button */}
                          <button
                            onClick={() => handleToggleSave(paper.paper_id)}
                            title={isSaved ? 'Remove from Saved' : 'Save Test'}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isSaved
                                ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-400'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                            }`}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-[#14213d] dark:text-white mb-2 line-clamp-2" title={paper.title}>
                          {paper.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-[#526079] dark:text-slate-400 mb-6">
                          <span className="font-bold text-[#0f766e] dark:text-[#2dd4bf]">{paper.total_questions} Questions</span>
                          <span>•</span>
                          <span>365 Days Access</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#dce3ec] dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[11px] text-[#526079] dark:text-slate-400 font-medium">IIT CBT Pattern</span>
                        <Link href={`/exam?paperId=${paper.paper_id}`}>
                          <Button variant="emerald" size="sm" rightIcon={<Play className="w-3.5 h-3.5" />}>
                            {isDone ? 'Re-attempt' : 'Start Test'}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 2: PURCHASED & BRANCH TEST SERIES PASSES
           ---------------------------------------------------- */}
        {activeTab === 'PASSES' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#526079] dark:text-slate-400">
                Manage your GATE Branch Test Series Passes. Unlocking a pass grants 365-day access to all 1,000+ mock tests & practice questions for that branch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { code: 'CS', name: 'Computer Science & IT' },
                { code: 'DA', name: 'Data Science & Artificial Intelligence' },
                { code: 'EE', name: 'Electrical Engineering' },
                { code: 'EC', name: 'Electronics & Communication' },
                { code: 'ME', name: 'Mechanical Engineering' },
                { code: 'CE', name: 'Civil Engineering' },
              ].map((branch) => {
                const isOwned = hasUserBranchAccess(effectiveOrders, branch.code);
                return (
                  <Card
                    key={branch.code}
                    className={`flex flex-col justify-between p-6 transition-all ${
                      isOwned
                        ? 'bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white border-emerald-500/40 shadow-lg'
                        : 'bg-white dark:bg-slate-900 border-[#dce3ec] dark:border-slate-800 text-[#14213d] dark:text-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant={isOwned ? 'emerald' : 'cyan'} className="font-mono text-xs">
                          GATE {branch.code}
                        </Badge>
                        {isOwned ? (
                          <Badge variant="emerald" size="sm">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            ACTIVE PASS
                          </Badge>
                        ) : (
                          <Badge variant="amber" size="sm">
                            <Lock className="w-3 h-3 inline mr-1" />
                            LOCKED
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-black mb-1">{branch.name}</h3>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                        {isOwned
                          ? 'Full 365-Day Access Unlocked for All Mock & Topic Tests.'
                          : 'Unlock 1,000+ test papers, CBT simulator & KaTeX solutions.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-sm font-black text-emerald-400">
                        {isOwned ? 'ACTIVE' : '₹500'}
                      </span>
                      {isOwned ? (
                        <Link href={`/catalog?branch=${branch.code}`}>
                          <Button variant="emerald" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                            Browse Tests
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => setCheckoutBranch(branch.code)}
                          leftIcon={<Lock className="w-3.5 h-3.5" />}
                        >
                          Unlock Pass
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 3: SAVED / BOOKMARKED TESTS
           ---------------------------------------------------- */}
        {activeTab === 'SAVED' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#526079] dark:text-slate-400">
                Bookmarked test papers saved to your personal library for quick revision.
              </p>
            </div>

            {savedPapers.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="w-12 h-12 text-amber-500" />}
                title="No Saved Tests Yet"
                description="Bookmark test series or topic tests from the active library or catalog to save them for revision anytime."
                actionLabel="Explore Test Series Catalog"
                actionHref="/catalog"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedPapers.map((paper) => {
                  const isDone = attemptedPaperIds.has(paper.paper_id);

                  return (
                    <Card key={paper.id} hoverEffect className="flex flex-col justify-between bg-white dark:bg-[#111a2e] border-amber-200 dark:border-amber-900/50 shadow-xs">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="emerald">{paper.branch || 'GATE'}</Badge>
                          <button
                            onClick={() => handleToggleSave(paper.paper_id)}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-[#14213d] dark:text-white mb-2 line-clamp-2">
                          {paper.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-[#526079] dark:text-slate-400 mb-6">
                          <span className="font-bold text-[#0f766e] dark:text-[#2dd4bf]">{paper.total_questions} Questions</span>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">
                            <BookmarkCheck className="w-3.5 h-3.5" /> Bookmarked
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#dce3ec] dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[11px] text-[#526079] dark:text-slate-400 font-medium">Saved to Drive</span>
                        <Link href={`/exam?paperId=${paper.paper_id}`}>
                          <Button variant="emerald" size="sm" rightIcon={<Play className="w-3.5 h-3.5" />}>
                            {isDone ? 'Re-attempt' : 'Start Test'}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 4: COMPLETED TESTS
           ---------------------------------------------------- */}
        {activeTab === 'COMPLETED' && (
          <div>
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading completed attempts...</div>
            ) : attempts.length === 0 ? (
              <EmptyState
                icon={<Award className="w-12 h-12" />}
                title="No Completed Test Attempts"
                description="You haven't submitted any mock test yet. Take a test now to view detailed scorecards and topic accuracy."
                actionLabel="Take a Mock Test"
                actionHref="/exam"
              />
            ) : (
              <div className="space-y-4">
                {attempts.map((att, idx) => (
                  <Card key={idx} hoverEffect className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111a2e] border-[#dce3ec] dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="emerald">Scored</Badge>
                        <span className="text-xs text-[#526079] dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          {Math.round((att.time_taken_seconds || 0) / 60)} mins taken
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#14213d] dark:text-white">{att.paper_title || 'GATE CBT Test'}</h3>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-[#526079] dark:text-slate-400 uppercase font-bold block">Score</span>
                        <div className="text-lg font-black text-[#0f766e] dark:text-[#2dd4bf]">
                          {att.score} <span className="text-xs text-gray-400 font-normal">/ {att.max_score}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#526079] dark:text-slate-400 uppercase font-bold block">Accuracy</span>
                        <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{att.accuracy}%</div>
                      </div>

                      <Link href={`/exam?paperId=${att.paper_id}`}>
                        <Button variant="primary" size="sm">
                          Review Scorecard →
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {checkoutBranch && (
        <CheckoutModal
          isOpen={Boolean(checkoutBranch)}
          onClose={() => setCheckoutBranch(null)}
          branchCode={checkoutBranch}
          user={user}
          orders={effectiveOrders}
          onSuccess={(newOrd) => {
            setOrders((prev) => [...prev, newOrd]);
            setCheckoutBranch(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
