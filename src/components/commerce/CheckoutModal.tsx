'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OFFICIAL_PRODUCT_CATALOG, getUserPurchasedBranches } from '@/lib/commerce/entitlements';
import { User } from 'firebase/auth';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchCode: string;
  user: User | null;
  orders: any[];
  onSuccess: (newOrder: any) => void;
}

export const TELEGRAM_BUY_URL = 'https://web.telegram.org/a/#1623488785';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  branchCode,
  user,
  orders,
  onSuccess,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const upperBranch = (branchCode || 'CS').toUpperCase();
  const productId = `${upperBranch.toLowerCase()}_pass`;
  const productInfo = OFFICIAL_PRODUCT_CATALOG[productId] || {
    title: `${upperBranch} Branch Pass`,
    priceINR: 500,
  };

  const ownedBranches = getUserPurchasedBranches(orders);

  // Message template for Telegram (without Firebase UID)
  const messageTemplate = `Hi, I want to buy the GATE ${upperBranch} Test Papers on GATE Matrix.

📋 Package: ${productInfo.title} (365-Day All-Access Pass)
💰 Price: ₹${productInfo.priceINR}
👤 Student Name: ${user?.displayName || 'GATE Aspirant'}
📧 Registered Email: ${user?.email || '[My Email Address]'}

Please share the payment UPI / QR code so I can complete payment and activate my test series access. Thank you!`;

  const handleCopyTemplate = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(messageTemplate);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = messageTemplate;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy template:', err);
    }
  };

  const handleOpenTelegram = () => {
    window.open(TELEGRAM_BUY_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAndOpen = async () => {
    await handleCopyTemplate();
    window.open(TELEGRAM_BUY_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#229ED9]/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#229ED9]/20 border border-[#229ED9]/40 text-[#38bdf8] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 fill-current text-[#229ED9]" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.75-.56 2.94-1.28 4.91-2.12 5.9-2.53 2.81-1.17 3.39-1.37 3.77-1.38.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan" className="font-mono text-xs">
                  {upperBranch} BRANCH TEST SERIES
                </Badge>
                <Badge variant="emerald" className="text-xs">
                  DIRECT ENROLLMENT
                </Badge>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {productInfo.title}
              </h3>
            </div>
          </div>

          {/* Pricing & Inclusions Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
                Full Year Test Package
              </span>
              <span className="text-2xl font-black text-emerald-400">
                ₹{productInfo.priceINR} <span className="text-xs font-normal text-slate-400">/ 365-Day Access</span>
              </span>
            </div>

            <ul className="text-xs space-y-2 text-slate-300 font-medium border-t border-slate-800 pt-3">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full access to 1,000+ {upperBranch} GATE Test Papers & Mock Series</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real CBT Exam Simulator replicating official TCS iON format</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Detailed step-by-step KaTeX solutions & diagnostic performance</span>
              </li>
            </ul>
          </div>

          {/* User Account Info Notice */}
          {!user && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong>Tip:</strong> Log in with Google first so your account email is automatically filled in your Telegram message for instant pass activation.
              </div>
            </div>
          )}

          {/* Message Template Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#229ED9]" />
                Message Template to Send on Telegram:
              </span>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="text-xs font-bold text-[#38bdf8] hover:text-white flex items-center gap-1 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Template</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed select-all relative group">
              {messageTemplate}
            </div>
            <p className="text-[11px] text-slate-400">
              Copy this message and send it to our Telegram chat to receive payment instructions & immediate pass activation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-black text-sm bg-[#229ED9] hover:bg-[#1d8bc0] text-white shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2"
              onClick={handleCopyAndOpen}
            >
              <Send className="w-4 h-4" />
              <span>Copy Template & Message on Telegram</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Button>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs font-bold"
                onClick={handleCopyTemplate}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Template Copied!' : 'Copy Template Only'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 text-xs font-bold"
                onClick={handleOpenTelegram}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Open Telegram Directly
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Direct Seller: Official GATE Matrix Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   PRESERVED RAZORPAY PAYMENT GATEWAY CODE (KEPT AS REQUESTED)
   Existing checkout invocation logic preserved for future reactivation if needed:
   ========================================================================= */

/**
 * Preserved helper to dynamically load the Razorpay checkout.js script.
 */
export const loadRazorpayScriptPreserved = (): Promise<boolean> => {
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

/**
 * Preserved full Razorpay execution logic with backend order creation and signature verification.
 */
export async function executeRazorpayCheckoutPreserved({
  branchCode,
  user,
  onSuccess,
  setPurchasing,
}: {
  branchCode: string;
  user: User | null;
  onSuccess: (newOrder: any) => void;
  setPurchasing: (val: boolean) => void;
}) {
  setPurchasing(true);
  try {
    const upperBranch = (branchCode || 'CS').toUpperCase();
    const productId = `${upperBranch.toLowerCase()}_pass`;
    const uid = user ? user.uid : 'aspirant_learner_101';

    const createRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        product_id: productId,
        product_title: `${upperBranch} All-Access Branch Pass`,
      }),
    });

    const createData = await createRes.json();
    if (!createData.success || !createData.order) {
      alert('Order creation issue: ' + (createData.error || 'Failed to initialize order'));
      setPurchasing(false);
      return;
    }

    const pendingOrder = createData.order;
    const razorpayKeyId = createData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const isScriptLoaded = await loadRazorpayScriptPreserved();

    if (isScriptLoaded && typeof window !== 'undefined' && (window as any).Razorpay) {
      const options: any = {
        key: razorpayKeyId,
        amount: pendingOrder.amount * 100,
        currency: pendingOrder.currency || 'INR',
        name: 'GATE Matrix',
        description: `${upperBranch} All-Access Test Series Pass`,
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
              const grantedOrd = {
                order_id: pendingOrder.order_id,
                product_id: productId,
                product_title: `${upperBranch} All-Access Branch Pass`,
                branch_code: upperBranch,
                status: 'GRANTED',
              };

              try {
                const saved = localStorage.getItem('gate_user_orders');
                const existing = saved ? JSON.parse(saved) : [];
                localStorage.setItem('gate_user_orders', JSON.stringify([...existing, grantedOrd]));
              } catch (e) {}

              onSuccess(grantedOrd);
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
        theme: { color: '#0f766e' },
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
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Checkout process encountered a connection issue.');
  } finally {
    setPurchasing(false);
  }
}
