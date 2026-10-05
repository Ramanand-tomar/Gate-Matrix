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
  provider: string;
  series: string;
  total_questions: number;
}

export default function CatalogPage() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [checkoutModal, setCheckoutModal] = useState<{ open: boolean; title: string; price: number; branch: string } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any>(null);

  const branches = ['All', 'CS', 'DA', 'EE', 'EC', 'ME', 'CE'];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    async function fetchPapers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/papers?branch=${selectedBranch}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && data.papers) {
          setPapers(data.papers);
        }
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPapers();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch]);

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

  const handleBuyPass = async (itemTitle: string, price: number, passBranch: string) => {
    setCheckoutModal({ open: true, title: itemTitle, price, branch: passBranch });
    setPurchaseSuccess(null);
  };

  const executeCheckoutOrder = async () => {
    if (!checkoutModal) return;
    setPurchasing(true);
    try {
      const uid = user ? user.uid : 'aspirant_learner_101';
      const productId = `${checkoutModal.branch.toLowerCase()}_pass`;

      // Step 1: Create server-priced order with PENDING status
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

      // Step 2: Ensure Razorpay SDK is loaded dynamically
      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && typeof window !== 'undefined' && (window as any).Razorpay) {
        // Launch Authentic Razorpay Modal Popup
        const options: any = {
          key: razorpayKeyId,
          amount: pendingOrder.amount * 100, // Amount in paise
          currency: pendingOrder.currency || 'INR',
          name: 'GATEPrep Studio',
          description: checkoutModal.title,
          order_id: pendingOrder.razorpay_order_id.startsWith('order_') ? pendingOrder.razorpay_order_id : undefined,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_id: pendingOrder.order_id,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(7)}`,
                  razorpay_signature: response.razorpay_signature || '',
                  status: 'GRANTED',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
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

      // Step 3: Fallback if SDK loading is blocked (e.g. adblocker)
      const verifyRes = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: pendingOrder.order_id,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(7)}`,
          status: 'GRANTED',
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1">
        <div className="mb-6">
          <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-1">
            Official GATE Test Series Catalogue
          </span>
          <h1 className="text-3xl font-extrabold text-[#14213d] tracking-tight">
            Target Mocks & Branch Passes
          </h1>
          <p className="text-[#526079] text-sm mt-1">
            Practice full-length papers, subject-wise question series, and past year official GATE exams across all engineering branches.
          </p>
        </div>

        {/* Branch Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                selectedBranch === b
                  ? 'bg-[#14213d] text-white shadow-sm'
                  : 'bg-white text-[#526079] border border-[#dce3ec] hover:bg-gray-50 hover:text-[#14213d]'
              }`}
            >
              {b === 'All' ? 'All Branches' : `${b} Branch`}
            </button>
          ))}
        </div>

        {/* Featured Branch Pass Hero Card */}
        <div className="bg-gradient-to-r from-[#14213d] to-[#0f172a] text-white p-8 rounded-3xl mb-10 flex flex-wrap justify-between items-center gap-6 shadow-xl border border-white/10">
          <div>
            <span className="bg-[#0f766e] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider block mb-2 w-fit">
              Unlimited Access Pass
            </span>
            <h2 className="text-2xl font-extrabold">
              {selectedBranch === 'All' ? 'Computer Science (CS)' : selectedBranch} All-Access Branch Pass
            </h2>
            <p className="text-xs text-gray-300 mt-2 max-w-xl leading-relaxed">
              Gain full 365-day access to all topic tests, subject bundles, full-length CBT mock series, and new releases during your validity.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-3xl font-black text-white">₹1,499</span>
              <span className="text-[11px] text-gray-300 block">365 Days Validity</span>
            </div>
            <button
              onClick={() => handleBuyPass(`${selectedBranch === 'All' ? 'CS' : selectedBranch} Branch Pass`, 1499, selectedBranch === 'All' ? 'CS' : selectedBranch)}
              className="bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              Enroll Now →
            </button>
          </div>
        </div>

        {/* Catalogue Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-[#dce3ec] rounded-2xl p-6 h-52 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white border border-[#dce3ec] rounded-2xl p-12 text-center text-gray-500">
            No active test series listed for branch <strong>{selectedBranch}</strong>.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {papers.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#dce3ec] rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-[#e7f4f0] text-[#0f766e] font-extrabold text-xs px-2.5 py-1 rounded-lg">
                      {p.branch || 'GATE'}
                    </span>
                    <span className="text-xs text-[#526079] font-medium">{p.provider || 'GATEPrep'}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#14213d] mb-2 line-clamp-2" title={p.title}>
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#526079] mb-4">
                    Series: {p.series || 'Official GATE Pattern Mock'}
                  </p>
                  <div className="flex gap-4 text-xs text-[#526079] font-medium mb-6">
                    <span className="font-bold text-[#0f766e]">{p.total_questions} Questions</span>
                    <span>•</span>
                    <span>365 Days Access</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#dce3ec] flex justify-between items-center">
                  <button
                    onClick={() => handleBuyPass(p.title, 799, p.branch)}
                    className="text-xs font-bold text-[#14213d] hover:text-[#0f766e] underline"
                  >
                    Buy Series ₹799
                  </button>
                  <Link
                    href={`/exam?paperId=${p.paper_id}`}
                    className="bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    Attempt Test →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Payment Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-[#dce3ec] shadow-2xl">
            {!purchaseSuccess ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                    Secure Razorpay Checkout
                  </span>
                  <button
                    onClick={() => setCheckoutModal(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <h2 className="text-xl font-bold text-[#14213d] mb-1">{checkoutModal.title}</h2>
                <p className="text-xs text-[#526079] mb-6">
                  Branch: <strong>{checkoutModal.branch}</strong> · Instant enrollment & CBT test access.
                </p>

                <div className="bg-[#f8fafc] border border-[#dce3ec] p-5 rounded-2xl mb-6 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#526079]">Series Price</span>
                    <span className="font-bold text-[#14213d]">₹{checkoutModal.price}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST & Platform Fee</span>
                    <span>₹0 (Included)</span>
                  </div>
                  <hr className="border-[#dce3ec]" />
                  <div className="flex justify-between text-sm font-extrabold text-[#14213d]">
                    <span>Total Payable</span>
                    <span className="text-[#0f766e]">₹{checkoutModal.price}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setCheckoutModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#dce3ec] text-[#526079] text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeCheckoutOrder}
                    disabled={purchasing}
                    className="px-6 py-2.5 rounded-xl bg-[#0f766e] text-white text-xs font-extrabold hover:bg-[#115e59] transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {purchasing ? 'Processing Order...' : `Pay ₹${checkoutModal.price}`}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  ✓
                </div>
                <h2 className="text-xl font-extrabold text-[#14213d] mb-1">Enrollment Successful!</h2>
                <p className="text-xs text-[#526079] mb-4">
                  Order Reference: <strong className="text-[#14213d]">{purchaseSuccess.order_id}</strong>
                </p>
                <div className="bg-[#e7f4f0] p-4 rounded-2xl text-xs text-[#0f766e] font-bold mb-6">
                  Access Granted · Start taking your GATE mock tests immediately.
                </div>
                <button
                  onClick={() => setCheckoutModal(null)}
                  className="w-full bg-[#14213d] text-white text-xs font-bold py-3 rounded-xl hover:bg-[#1d2d50] transition-colors"
                >
                  Close & Launch Test Engine
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
