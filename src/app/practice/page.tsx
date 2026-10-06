'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { isPaperFree, hasUserBranchAccess } from '@/lib/commerce/entitlements';
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
} from 'lucide-react';

import { matchesSubjectTopic, getPaperCategory, TestCategoryFilter } from '@/lib/catalog/filters';

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
        const [paperRes, orderRes, attemptRes] = await Promise.all([
          fetch(`/api/papers?branch=${selectedBranch}`),
          fetch(`/api/orders?uid=${uid}`),
          fetch(`/api/attempts?uid=${uid}`),
        ]);

        const paperData = await paperRes.json();
        const orderData = await orderRes.json();
        const attemptData = await attemptRes.json();

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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#0f766e] text-xs font-extrabold uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Subject-Wise Practice Arena</span>
          </div>
          <h1 className="text-3xl font-black text-[#14213d] tracking-tight">
            GATE Subject & Topic Wise Practice
          </h1>
          <p className="text-xs text-[#526079] mt-1 max-w-2xl">
            Filter practice questions and test papers by subject. Free sample tests available or unlock all subjects with your Branch Pass.
          </p>
        </div>

        {/* Branch Selection Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {branches.map((b) => (
            <button
              key={b.code}
              onClick={() => setSelectedBranch(b.code)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                selectedBranch === b.code
                  ? 'bg-[#14213d] text-white shadow-md'
                  : 'bg-white text-[#526079] border border-[#dce3ec] hover:bg-slate-50 hover:text-[#14213d]'
              }`}
            >
              {b.code} — {b.name}
            </button>
          ))}
        </div>

        {/* Test Format Category Filter Bar */}
        <div className="mb-6 bg-white border border-[#dce3ec] p-2.5 rounded-2xl flex flex-wrap gap-2 items-center shadow-2xs">
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-black text-[#14213d] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#0f766e]" />
            <span>Test Format:</span>
          </div>
          {[
            { id: 'ALL', label: 'All Test Formats' },
            { id: 'FULL_LENGTH', label: '🏆 Full-Length Mocks' },
            { id: 'TOPIC_WISE', label: '📚 Topic & Subject-Wise Tests' },
            { id: 'PYQ', label: '📜 Previous Year Papers (PYQ)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as TestCategoryFilter)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#0f766e] text-white shadow-xs'
                  : 'bg-slate-50 text-[#526079] border border-[#dce3ec] hover:bg-slate-100 hover:text-[#14213d]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Subject Filter Pills */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#526079] mb-3">
            <Layers className="w-4 h-4 text-[#0f766e]" />
            <span>Select Subject to Practice:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all ${
                  selectedSubject === sub
                    ? 'bg-[#14213d] text-white shadow-2xs'
                    : 'bg-white text-[#526079] border border-[#dce3ec] hover:bg-slate-50 hover:text-[#14213d]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#dce3ec] p-4 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search topic or question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#dce3ec] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#0f766e] text-[#14213d]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#526079]">
            <Filter className="w-4 h-4 text-[#0f766e]" />
            <span className="font-bold">
              Showing {totalFilteredItems > 0 ? startIdx + 1 : 0}–{Math.min(startIdx + pageSize, totalFilteredItems)} of {totalFilteredItems} practice papers for {selectedBranch} ({selectedSubject})
            </span>
          </div>
        </div>

        {/* Practice Papers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-[#dce3ec] rounded-2xl p-6 h-48 animate-pulse"></div>
            ))}
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="bg-white border border-[#dce3ec] rounded-2xl p-12 text-center text-slate-500 text-xs">
            No practice papers matching <strong>{selectedSubject}</strong> in branch <strong>{selectedBranch}</strong>.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paginatedPapers.map((paper, idx) => {
                const free = isPaperFree(paper, idx);
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
                  <Card key={paper.id} hoverEffect className="flex flex-col justify-between">
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
                            Free Test
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
                      <h3 className="text-base font-bold text-[#14213d] mb-2 line-clamp-2" title={paper.title}>
                        {paper.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-[#526079] mb-6 font-medium">
                        <span className="font-bold text-[#0f766e]">{paper.total_questions} Questions</span>
                        <span>•</span>
                        <span>MCQ · MSQ · NAT</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#dce3ec] flex justify-between items-center">
                      {canAttempt ? (
                        <>
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
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
                          <span className="text-xs font-bold text-slate-500">Branch Pass Required</span>
                          <Link href={`/catalog?branch=${selectedBranch}`}>
                            <Button variant="primary" size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />}>
                              Get Pass
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Interactive Pagination Bar */}
            {totalFilteredItems > 0 && (
              <div className="mt-10 bg-white border border-[#dce3ec] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xs text-xs">
                <div className="text-[#526079] font-medium">
                  Showing <strong className="text-[#14213d]">{startIdx + 1}–{Math.min(startIdx + pageSize, totalFilteredItems)}</strong> of{' '}
                  <strong className="text-[#14213d]">{totalFilteredItems}</strong> practice papers
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold">
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
                            ? 'bg-[#14213d] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[#14213d] font-black">
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
      <Footer />
    </div>
  );
}
