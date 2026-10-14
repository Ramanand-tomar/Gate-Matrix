'use client';

import React from 'react';
import {
  X,
  Lock,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OFFICIAL_PRODUCT_CATALOG } from '@/lib/commerce/entitlements';
import { User } from 'firebase/auth';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchCode: string;
  user: User | null;
  orders?: any[];
  onSuccess?: (newOrder: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  branchCode,
  user,
}) => {
  if (!isOpen) return null;

  const upperBranch = (branchCode || 'CS').toUpperCase();
  const productId = `${upperBranch.toLowerCase()}_pass`;
  const productInfo = OFFICIAL_PRODUCT_CATALOG[productId] || {
    title: `${upperBranch} Branch Pass`,
    priceINR: 500,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5 text-center">
          {/* Lock / Access Icon */}
          <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="amber" className="font-mono text-xs">
                ACCESS RESTRICTED
              </Badge>
              <Badge variant="cyan" className="font-mono text-xs">
                {upperBranch} BRANCH
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              You Don&apos;t Have Access
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              You don&apos;t have any access to attempt this test series paper. This content requires an authorized <strong className="text-amber-300 font-bold">{upperBranch} Branch Pass</strong> or institutional enrollment.
            </p>
          </div>

          {/* Access Status Summary Card */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/90 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Target Series:</span>
              <span className="font-bold text-white">{productInfo.title}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Access Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                Locked / Not Granted
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Current Account:</span>
              <span className="font-mono text-[11px] text-slate-200 truncate max-w-[180px]">
                {user?.email || 'Guest (Not Signed In)'}
              </span>
            </div>
          </div>

          {/* Institutional / Admin notice */}
          <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-left text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="leading-relaxed">
              If your college or coaching institute has enrolled you, please sign in with your registered account or contact your administrator to grant access to this test paper.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-950/40"
              onClick={onClose}
            >
              Understood
            </Button>
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
