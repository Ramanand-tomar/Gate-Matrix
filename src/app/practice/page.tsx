'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { isPaperFree, hasUserBranchAccess } from '@/lib/commerce/entitlements';
import { CheckoutModal } from '@/components/commerce/CheckoutModal';
import {
  Sparkles,
  BookOpen,
  Filter,
  Search,
  Play,
  CheckCircle2,
  Lock,
  Layers,
  RotateCcw,
  Target,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

import { matchesSubjectTopic, getPaperCategory, TestCategoryFilter } from '@/lib/catalog/filters';
import { fastFetchJson } from '@/lib/fastFetch';

interface PaperDoc {
  id: string;
  paper_id: string;
  title: string;
  branch: string;
  total_questions: number;
}

interface OrderRecord {
  order_id: string;
  product_id: string;
  product_title: string;
  status: string;
}

interface AttemptRecord {
  paper_id: string;
  score: number;
  max_score: number;
  accuracy: number;
}

const SUBJECT_MAP: Record<string, string[]> = {
  CS: [
    'All Subjects',
    'Data Structures & Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Theory of Computation',
    'Digital Logic',
    'Engineering Mathematics',
    'General Aptitude',
  ],
  DA: [
    'All Subjects',
    'Machine Learning & Deep Learning',
    'Probability & Statistics',
    'Linear Algebra & Calculus',
    'Python & Data Structures',
    'Database Systems',
  ],
  EE: ['All Subjects', 'Power Systems', 'Control Systems', 'Electrical Machines', 'Circuit Theory'],
  EC: ['All Subjects', 'Signals & Systems', 'Analog Circuits', 'Digital Electronics', 'Communications'],
  ME: ['All Subjects', 'Thermodynamics', 'Fluid Mechanics', 'Engineering Mechanics', 'Manufacturing'],
  CE: ['All Subjects', 'Structural Engineering', 'Geotechnical', 'Environmental', 'Transportation'],
};

export default function PracticePage() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState('CS');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedCategory, setSelectedCategory] = useState<TestCategoryFilter>('ALL');

  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [checkoutBranch, setCheckoutBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const branches = [
    { code: 'CS', name: 'Computer Science & IT' },
    { code: 'DA', name: 'Data Science & AI' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'EC', name: 'Electronics & Communication' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'CE', name: 'Civil Engineering' },
  ];

  useEffect(() => {
    setSelectedSubject('All Subjects');
  }, [selectedBranch]);

  useEffect(() => {
    let isMounted = true;
    async function fetchPracticeData() {
      setLoading(true);
      try {
        const uid = user ? user.uid : 'aspirant_learner_101';
        const [paperData, orderData, attemptData] = await Promise.all([
          fastFetchJson(`/api/papers?branch=${selectedBranch}`),
          fastFetchJson(`/api/orders?uid=${uid}`),
          fastFetchJson(`/api/attempts?uid=${uid}`),
        ]);

        if (isMounted) {
          if (paperData.success && paperData.papers) setPapers(paperData.papers);

          let localOrders: OrderRecord[] = [];
          try {
            const saved = localStorage.getItem('gate_user_orders');
            if (saved) localOrders = JSON.parse(saved);
          } catch (e) {}

          const fetchedOrders = orderData.success && orderData.orders ? orderData.orders : [];
          setOrders([...fetchedOrders, ...localOrders]);

          if (attemptData.success && attemptData.attempts) setAttempts(attemptData.attempts);
        }
      } catch (err) {
        console.error('Failed to fetch practice papers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPracticeData();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, user]);

  const userHasAccessToBranch = hasUserBranchAccess(orders, selectedBranch);
  const subjects = SUBJECT_MAP[selectedBranch] || ['All Subjects'];

  const attemptMap: Record<string, AttemptRecord> = {};
  attempts.forEach((att) => {
    attemptMap[att.paper_id] = att;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch, selectedSubject, selectedCategory, searchQuery]);

  const filteredPapers = papers.filter((p, idx) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = matchesSubjectTopic(p.title, selectedSubject);

    const category = getPaperCategory(p.title, idx);
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'FULL_LENGTH' && category === 'FULL_LENGTH') ||
      (selectedCategory === 'TOPIC_WISE' && category === 'TOPIC_WISE') ||
      (selectedCategory === 'PYQ' && category === 'PYQ');

    return matchesSearch && matchesSubject && matchesCategory;
  });

  const totalFilteredItems = filteredPapers.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize) || 1;
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedPapers = filteredPapers.slice(startIdx, startIdx + pageSize);

  // Calculate subject counts dynamically
  const getSubjectTestCount = (subj: string) => {
    if (subj === 'All Subjects') return papers.length;
    return papers.filter((p) => matchesSubjectTopic(p.title, subj)).length;
  };

  // Weak topic focus drills
  const weakFocusAreas = [
    { subject: 'Operating Systems', topic: 'Process Scheduling & Deadlocks', accuracy: 48, paperId: papers[0]?.paper_id },
    { subject: 'Computer Networks', topic: 'TCP/IP Flow & Congestion Control', accuracy: 56, paperId: papers[1]?.paper_id },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col transition-colors">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#0f766e] dark:text-[#2dd4bf] text-xs font-extrabold uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Learning Engine</span>
          </div>
          <h1 className="text-3xl font-black text-[#14213d] dark:text-white tracking-tight">
            Practice Arena
          </h1>
          <p className="text-xs sm:text-sm text-[#526079] dark:text-slate-400 mt-1 max-w-2xl">
            What do you want to practice today? Choose your test format, focus on weak topics, or drill down into specific subject papers.
          </p>
        </div>

        {/* Weak Topic Focus Drills Alert Card */}
        <div className="bg-gradient-to-r from-[#14213d] to-[#0f172a] text-white p-6 rounded-3xl mb-8 border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Your Recommended Focus Areas</h2>
              <p className="text-[11px] text-gray-300">Target your lowest accuracy subjects to prevent negative marking penalties.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakFocusAreas.map((fa, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-[#8be0ce] uppercase">{fa.subject}</span>
                  <h3 className="text-xs font-bold text-white mt-0.5">{fa.topic}</h3>
                  <div className="text-[11px] text-amber-400 font-extrabold mt-1">Accuracy: {fa.accuracy}%</div>
                </div>
                {fa.paperId ? (
                  <Link href={`/exam?paperId=${fa.paperId}`}>
                    <Button variant="emerald" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Practice Now
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setSelectedSubject(fa.subject)}>
                    Filter Subject
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Branch Selection Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {branches.map((b) => (
            <button
              key={b.code}
              onClick={() => setSelectedBranch(b.code)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedBranch === b.code
                  ? 'bg-[#14213d] dark:bg-[#0f766e] text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-[#526079] dark:text-slate-300 border border-[#dce3ec] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              GATE {b.code} — {b.name}
            </button>
          ))}
        </div>

        {/* Branch Lock Alert Banner */}
        {!userHasAccessToBranch && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  GATE {selectedBranch} Practice Pass Required
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  You are viewing practice papers for <strong className="text-amber-300">{selectedBranch}</strong>. Unlock the {selectedBranch} Branch Pass for ₹1,499 to access all questions & detailed solutions.
                </p>
              </div>
            </div>
            <Button
              variant="emerald"
              size="md"
              className="shrink-0 font-extrabold shadow-md shadow-emerald-950/30"
              onClick={() => setCheckoutBranch(selectedBranch)}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Unlock {selectedBranch} Pass (₹1,499)
            </Button>
          </div>
        )}

        {/* Test Format Category Selector */}
        <div className="mb-8 bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-3 rounded-2xl flex flex-wrap gap-2 items-center shadow-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-black text-[#14213d] dark:text-slate-200 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#0f766e] dark:text-[#2dd4bf]" />
            <span>Format:</span>
          </div>
          {[
            { id: 'ALL', label: 'All Practice Papers' },
            { id: 'FULL_LENGTH', label: '🏆 Full Mock' },
            { id: 'TOPIC_WISE', label: '📚 Subject & Topic Test' },
            { id: 'PYQ', label: '📜 Previous Year' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as TestCategoryFilter)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#0f766e] text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-[#526079] dark:text-slate-300 border border-[#dce3ec] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Subject Test Count Cards Grid */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#526079] dark:text-slate-400">
            <Layers className="w-4 h-4 text-[#0f766e] dark:text-[#2dd4bf]" />
            <span>Browse {selectedBranch} Subjects:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {subjects.map((sub) => {
              const count = getSubjectTestCount(sub);
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex justify-between items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#14213d] text-white border-[#14213d] shadow-md dark:bg-[#0f766e] dark:border-[#0f766e]'
                      : 'bg-white dark:bg-slate-900 text-[#14213d] dark:text-slate-200 border-[#dce3ec] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="text-xs font-extrabold truncate" title={sub}>{sub}</div>
                    <div className={`text-[10px] font-bold ${isSelected ? 'text-gray-300' : 'text-[#526079] dark:text-slate-400'}`}>
                      {loading ? '...' : `${count} ${count === 1 ? 'test' : 'tests'}`}
                    </div>
                  </div>
                  <Badge variant={isSelected ? 'emerald' : 'slate'} size="sm" className="shrink-0">
                    Practice
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search topic or question title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] dark:bg-slate-800 border border-[#dce3ec] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#0f766e] text-[#14213d] dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#526079] dark:text-slate-400">
            <Filter className="w-4 h-4 text-[#0f766e] dark:text-[#2dd4bf]" />
            <span className="font-bold">
              {loading ? (
                <span>Loading practice papers for GATE {selectedBranch}...</span>
              ) : (
                <span>
                  Showing {totalFilteredItems > 0 ? startIdx + 1 : 0}–{Math.min(startIdx + pageSize, totalFilteredItems)} of {totalFilteredItems} practice papers for {selectedBranch} ({selectedSubject})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Practice Papers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-6 h-48 animate-pulse"></div>
            ))}
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            No practice papers matching <strong>{selectedSubject}</strong> in branch <strong>{selectedBranch}</strong>.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paginatedPapers.map((paper, idx) => {
                const globalIdx = startIdx + idx;
                const free = isPaperFree(paper, globalIdx);
                const canAttempt = free || userHasAccessToBranch;
                const pastAttempt = attemptMap[paper.paper_id];
                const paperCat = getPaperCategory(paper.title, idx);
                const catLabel =
                  paperCat === 'FULL_LENGTH'
                    ? 'Full-Length Mock'
                    : paperCat === 'PYQ'
                    ? 'PYQ Paper'
                    : 'Topic & Subject Test';

                return (
                  <Card key={paper.id} hoverEffect className="flex flex-col justify-between border-[#dce3ec] dark:border-slate-800">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="emerald">{paper.branch || selectedBranch}</Badge>
                          <Badge variant="slate" size="sm">{catLabel}</Badge>
                        </div>
                        {pastAttempt ? (
                          <Badge variant="purple" size="sm">
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                            Completed ({pastAttempt.score} / {pastAttempt.max_score})
                          </Badge>
                        ) : free ? (
                          <Badge variant="cyan" size="sm">
                            Free Practice
                          </Badge>
                        ) : userHasAccessToBranch ? (
                          <Badge variant="emerald" size="sm">
                            Access Granted
                          </Badge>
                        ) : (
                          <Badge variant="amber" size="sm">
                            <Lock className="w-3 h-3 inline mr-1" />
                            Pass Required
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#14213d] dark:text-white mb-2 line-clamp-2" title={paper.title}>
                        {paper.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#526079] dark:text-slate-400 mb-6 font-medium">
                        <span className="font-bold text-[#0f766e] dark:text-[#2dd4bf]">{paper.total_questions} Questions</span>
                        <span>•</span>
                        <span>MCQ · MSQ · NAT</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#dce3ec] dark:border-slate-800 flex justify-between items-center">
                      {canAttempt ? (
                        <>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {pastAttempt
                              ? `Scored: ${pastAttempt.score} / ${pastAttempt.max_score}`
                              : free
                              ? 'Free Practice'
                              : 'Unlocked with Pass'}
                          </span>
                          <Link href={`/exam?paperId=${paper.paper_id}`}>
                            <Button
                              variant={pastAttempt ? 'secondary' : 'emerald'}
                              size="sm"
                              rightIcon={pastAttempt ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            >
                              {pastAttempt ? 'Re-attempt' : 'Start Practice'}
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Pass Required
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setCheckoutBranch(paper.branch || selectedBranch)}
                            leftIcon={<Lock className="w-3.5 h-3.5" />}
                          >
                            Unlock Pass
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Interactive Pagination Bar */}
            {totalFilteredItems > 0 && (
              <div className="mt-10 bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xs text-xs">
                <div className="text-[#526079] dark:text-slate-400 font-medium">
                  Showing <strong className="text-[#14213d] dark:text-white">{startIdx + 1}–{Math.min(startIdx + pageSize, totalFilteredItems)}</strong> of{' '}
                  <strong className="text-[#14213d] dark:text-white">{totalFilteredItems}</strong> practice papers
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
                    <span>Show per page:</span>
                    {[12, 24, 48].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                          pageSize === size
                            ? 'bg-[#14213d] dark:bg-[#0f766e] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      ← Previous
                    </Button>

                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[#14213d] dark:text-white font-black">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {checkoutBranch && (
        <CheckoutModal
          isOpen={Boolean(checkoutBranch)}
          onClose={() => setCheckoutBranch(null)}
          branchCode={checkoutBranch}
          user={user}
          orders={orders}
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
