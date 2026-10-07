'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { isPaperFree, hasUserBranchAccess } from '@/lib/commerce/entitlements';
import {
  BookOpen,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Award,
  Play,
  X,
  Layers,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

import { matchesSubjectTopic, getPaperCategory, TestCategoryFilter } from '@/lib/catalog/filters';
import { getSavedTestIds, toggleSaveTest } from '@/lib/savedTests';

interface PaperDoc {
  id: string;
  paper_id: string;
  title: string;
  branch: string;
  provider: string;
  series: string;
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

const SUBJECT_LIST: Record<string, string[]> = {
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

function CatalogContent() {
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');
  const searchParam = searchParams.get('search');

  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState(branchParam || 'CS');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedCategory, setSelectedCategory] = useState<TestCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParam || '');

  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [savedTestIds, setSavedTestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSavedTestIds(getSavedTestIds());
    const handleSavedChange = () => setSavedTestIds(getSavedTestIds());
    window.addEventListener('gate_saved_tests_changed', handleSavedChange);
    return () => window.removeEventListener('gate_saved_tests_changed', handleSavedChange);
  }, []);

  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    title: string;
    price: number;
    branch: string;
  } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any>(null);

  const branches = ['CS', 'DA', 'EE', 'EC', 'ME', 'CE'];

  useEffect(() => {
    if (branchParam && branches.includes(branchParam)) setSelectedBranch(branchParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [branchParam, searchParam]);

  useEffect(() => {
    setSelectedSubject('All Subjects');
  }, [selectedBranch]);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalogData() {
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
          const combinedOrders = [...fetchedOrders, ...localOrders];
          setOrders(combinedOrders);

          if (attemptData.success && attemptData.attempts) setAttempts(attemptData.attempts);
        }
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCatalogData();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, user]);

  const userHasAccessToBranch = hasUserBranchAccess(orders, selectedBranch);

  const attemptMap: Record<string, AttemptRecord> = {};
  attempts.forEach((att) => {
    attemptMap[att.paper_id] = att;
  });

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyBranchPass = (passBranch: string) => {
    setCheckoutModal({
      open: true,
      title: `${passBranch} All-Access Branch Pass`,
      price: 1499,
      branch: passBranch,
    });
    setPurchaseSuccess(null);
  };

  const executeCheckoutOrder = async () => {
    if (!checkoutModal) return;
    setPurchasing(true);
    try {
      const uid = user ? user.uid : 'aspirant_learner_101';
      const productId = `${checkoutModal.branch.toLowerCase()}_pass`;

      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          product_id: productId,
          product_title: checkoutModal.title,
        }),
      });

      const createData = await createRes.json();
      if (!createData.success || !createData.order) {
        alert('Order creation error: ' + (createData.error || 'Failed to create order'));
        setPurchasing(false);
        return;
      }

      const pendingOrder = createData.order;
      const razorpayKeyId = createData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options: any = {
          key: razorpayKeyId,
          amount: pendingOrder.amount * 100,
          currency: pendingOrder.currency || 'INR',
          name: 'GATE Matrix',
          description: checkoutModal.title,
          order_id: pendingOrder.razorpay_order_id.startsWith('order_') ? pendingOrder.razorpay_order_id : undefined,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: pendingOrder.order_id,
                  razorpay_order_id: response.razorpay_order_id || pendingOrder.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(7)}`,
                  razorpay_signature: response.razorpay_signature || '',
                  status: 'GRANTED',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                const grantedOrd: OrderRecord = {
                  order_id: pendingOrder.order_id,
                  product_id: productId,
                  product_title: checkoutModal.title,
                  status: 'GRANTED',
                };
                setOrders((prev) => [...prev, grantedOrd]);
                try {
                  const saved = localStorage.getItem('gate_user_orders');
                  const existing = saved ? JSON.parse(saved) : [];
                  localStorage.setItem('gate_user_orders', JSON.stringify([...existing, grantedOrd]));
                } catch (e) {}
                setPurchaseSuccess({ ...pendingOrder, status: 'GRANTED' });
              } else {
                alert('Payment verification issue: ' + (verifyData.error || 'Verification failed'));
              }
            } catch (err) {
              alert('Payment verification request failed.');
            } finally {
              setPurchasing(false);
            }
          },
          prefill: {
            name: user?.displayName || 'GATE Aspirant',
            email: user?.email || 'aspirant@gateprep.studio',
            contact: '9999999999',
          },
          theme: {
            color: '#0f766e',
          },
          modal: {
            ondismiss: function () {
              setPurchasing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert('Payment Failed: ' + (response.error?.description || 'Transaction cancelled'));
          setPurchasing(false);
        });

        rzp.open();
        return;
      }

      const verifyRes = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: pendingOrder.order_id,
          razorpay_order_id: pendingOrder.razorpay_order_id,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(7)}`,
          status: 'GRANTED',
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        const grantedOrd: OrderRecord = {
          order_id: pendingOrder.order_id,
          product_id: productId,
          product_title: checkoutModal.title,
          status: 'GRANTED',
        };
        setOrders((prev) => [...prev, grantedOrd]);
        try {
          const saved = localStorage.getItem('gate_user_orders');
          const existing = saved ? JSON.parse(saved) : [];
          localStorage.setItem('gate_user_orders', JSON.stringify([...existing, grantedOrd]));
        } catch (e) {}
        setPurchaseSuccess({ ...pendingOrder, status: 'GRANTED' });
      } else {
        alert('Payment verification issue: ' + verifyData.error);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Checkout process encountered a connection issue.');
    } finally {
      setPurchasing(false);
    }
  };

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

  const subjects = SUBJECT_LIST[selectedBranch] || ['All Subjects'];

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#0f766e] text-xs font-extrabold uppercase tracking-widest mb-1">
          <BookOpen className="w-4 h-4" />
          <span>GATE Test Series & Subject Practice</span>
        </div>
        <h1 className="text-3xl font-black text-[#14213d] tracking-tight">
          Explore Test Series & Subject Wise Practice
        </h1>
        <p className="text-xs text-[#526079] mt-1 max-w-2xl">
          Get unlimited 365-day access to all test series in your stream with a single one-time Branch Pass. Free sample tests available for all candidates.
        </p>
      </div>

      {/* Branch Selector Tabs & Search Bar */}
      <div className="bg-white border border-[#dce3ec] p-4 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all ${
                selectedBranch === b
                  ? 'bg-[#14213d] text-white shadow-xs'
                  : 'bg-slate-50 text-[#526079] hover:bg-slate-100 hover:text-[#14213d]'
              }`}
            >
              GATE {b}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search test or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-[#dce3ec] rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#0f766e] text-[#14213d]"
          />
        </div>
      </div>

      {/* Test Category Filter Bar (Full Length vs Topic-Wise vs PYQ) */}
      <div className="mb-6 bg-slate-100/70 border border-[#dce3ec] p-2 rounded-2xl flex flex-wrap gap-2 items-center">
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
                : 'bg-white text-[#526079] border border-[#dce3ec] hover:bg-slate-50 hover:text-[#14213d]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subject-Wise Practice Filter Pills */}
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

      {/* ONE-TIME BRANCH PASS BANNER (Hides Payment UI if User Already Purchased) */}
      {!userHasAccessToBranch ? (
        <div className="bg-gradient-to-r from-[#14213d] via-[#14213d] to-[#0f172a] text-white p-8 rounded-3xl mb-10 flex flex-wrap justify-between items-center gap-6 shadow-xl border border-white/10">
          <div>
            <Badge variant="emerald" className="mb-3">
              One-Time Payment · All-Access Pass
            </Badge>
            <h2 className="text-2xl font-black">
              GATE {selectedBranch} Full Branch Pass
            </h2>
            <p className="text-xs text-gray-300 mt-2 max-w-xl leading-relaxed">
              Pay once and get 365-day unlimited access to all full-length mocks, subject-wise tests, and future series updates for GATE {selectedBranch}. Zero per-test charges.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-3xl font-black text-white">₹1,499</span>
              <span className="text-[10px] text-gray-300 block">365 Days Full Access</span>
            </div>
            <Button
              variant="emerald"
              size="lg"
              onClick={() => handleBuyBranchPass(selectedBranch)}
            >
              Get One-Time Pass →
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-[#e7f4f0] border border-[#0f766e]/30 p-6 rounded-3xl mb-10 flex items-center justify-between gap-4 text-[#0f766e]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-[#0f766e]" />
            <div>
              <h2 className="text-lg font-black text-[#14213d]">
                GATE {selectedBranch} Branch Pass Active 🎉
              </h2>
              <p className="text-xs text-[#0f766e] font-bold mt-0.5">
                You have full 365-day access to all tests and subject series in GATE {selectedBranch}. No further payments required.
              </p>
            </div>
          </div>
          <Badge variant="emerald" size="md">
            Full Access Unlocked
          </Badge>
        </div>
      )}

      {/* Test Series Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#dce3ec] rounded-2xl p-6 h-56 animate-pulse"></div>
          ))}
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-white border border-[#dce3ec] rounded-2xl p-12 text-center text-slate-500 text-xs">
          No test papers found under <strong>{selectedSubject}</strong> in branch <strong>{selectedBranch}</strong>.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paginatedPapers.map((p, idx) => {
              const free = isPaperFree(p, idx);
              const canAttempt = free || userHasAccessToBranch;
              const pastAttempt = attemptMap[p.paper_id];
              const paperCat = getPaperCategory(p.title, idx);
              const catLabel =
                paperCat === 'FULL_LENGTH'
                  ? 'Full-Length Mock'
                  : paperCat === 'PYQ'
                  ? 'PYQ Paper'
                  : 'Topic & Subject Test';

              const isSaved = savedTestIds.includes(p.paper_id);

              return (
                <Card key={p.id} hoverEffect className="flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="emerald">{p.branch || selectedBranch}</Badge>
                        <Badge variant="slate" size="sm">{catLabel}</Badge>
                        <button
                          onClick={() => toggleSaveTest(p.paper_id)}
                          title={isSaved ? 'Remove from Saved' : 'Save Test'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-400'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-current" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
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
                    <h3 className="text-base font-extrabold text-[#14213d] mb-2 line-clamp-2" title={p.title}>
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#526079] mb-4">
                      Series: {p.series || 'Official GATE CBT Mock'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#526079] font-medium mb-6">
                      <span className="font-bold text-[#0f766e]">{p.total_questions} Questions</span>
                      <span>•</span>
                      <span>IIT CBT Standard</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#dce3ec] flex justify-between items-center gap-2">
                    {canAttempt ? (
                      <>
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {pastAttempt
                            ? `Scored: ${pastAttempt.score} / ${pastAttempt.max_score}`
                            : free
                            ? 'Free Starter Test'
                            : 'Unlocked with Pass'}
                        </span>
                        <Link href={`/exam?paperId=${p.paper_id}`}>
                          <Button
                            variant={pastAttempt ? 'secondary' : 'emerald'}
                            size="sm"
                            rightIcon={pastAttempt ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          >
                            {pastAttempt ? 'Re-attempt' : 'Attempt Test'}
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-500">Branch Pass Included</span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleBuyBranchPass(selectedBranch)}
                          leftIcon={<Lock className="w-3.5 h-3.5" />}
                        >
                          Unlock Branch Pass
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
            <div className="mt-10 bg-white border border-[#dce3ec] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xs text-xs">
              <div className="text-[#526079] font-medium">
                Showing <strong className="text-[#14213d]">{startIdx + 1}–{Math.min(startIdx + pageSize, totalFilteredItems)}</strong> of{' '}
                <strong className="text-[#14213d]">{totalFilteredItems}</strong> test papers
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

      {/* Secure Razorpay Payment Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-[#dce3ec] shadow-2xl animate-fadeIn">
            {!purchaseSuccess ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="emerald" size="sm">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                    Secure One-Time Checkout
                  </Badge>
                  <button
                    onClick={() => setCheckoutModal(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-[#14213d] mb-1">{checkoutModal.title}</h2>
                <p className="text-xs text-[#526079] mb-6">
                  Branch: <strong>{checkoutModal.branch}</strong> · 365-day access to all tests & series.
                </p>

                <div className="bg-slate-50 border border-[#dce3ec] p-5 rounded-2xl mb-6 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#526079]">One-Time Pass Price</span>
                    <span className="font-bold text-[#14213d]">₹{checkoutModal.price}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST & Platform Fee</span>
                    <span>₹0 (Included)</span>
                  </div>
                  <hr className="border-[#dce3ec]" />
                  <div className="flex justify-between text-sm font-black text-[#14213d]">
                    <span>Total Payable</span>
                    <span className="text-[#0f766e]">₹{checkoutModal.price}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setCheckoutModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="emerald"
                    onClick={executeCheckoutOrder}
                    isLoading={purchasing}
                  >
                    Pay ₹{checkoutModal.price}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-[#14213d] mb-1">Pass Activated!</h2>
                <p className="text-xs text-[#526079] mb-4">
                  Order Reference: <strong className="text-[#14213d]">{purchaseSuccess.order_id}</strong>
                </p>
                <div className="bg-[#e7f4f0] p-4 rounded-2xl text-xs text-[#0f766e] font-bold mb-6">
                  All tests in GATE {selectedBranch} are now freely accessible for 365 days.
                </div>
                <Button variant="primary" className="w-full" onClick={() => setCheckoutModal(null)}>
                  Start Attempting Tests
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function CatalogSkeleton() {
  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
      <div className="mb-8 space-y-2">
        <div className="w-48 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        <div className="w-96 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="w-full max-w-2xl h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 p-4 rounded-2xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {['CS', 'DA', 'EE', 'EC', 'ME', 'CE'].map((b) => (
            <div key={b} className="w-20 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse shrink-0"></div>
          ))}
        </div>
        <div className="w-full md:w-72 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-[#dce3ec] dark:border-slate-800 rounded-2xl p-6 h-56 animate-pulse space-y-4">
            <div className="flex justify-between">
              <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-28 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col transition-colors">
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent />
      </Suspense>
      <Footer />
    </div>
  );
}
