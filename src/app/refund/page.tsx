import React from 'react';
import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-1">
        <Link href="/" className="text-xs font-bold text-[#0f766e] hover:underline mb-6 inline-block">
          ← Back to GATEPrep Studio
        </Link>
        <h1 className="text-3xl font-extrabold text-[#14213d] mb-2">Refund & Cancellation Policy</h1>
        <p className="text-xs text-gray-500 mb-8">Last Updated: October 5, 2026</p>

        <div className="bg-white border border-[#dce3ec] rounded-3xl p-8 space-y-6 text-xs text-[#526079] leading-relaxed shadow-xs">
          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">1. Refund Eligibility</h2>
            <p>
              Due to the immediate digital availability of test series papers and CBT exam tools, purchases are non-refundable once an exam paper has been attempted or content unlocked.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">2. Failed Transactions & Double Debits</h2>
            <p>
              In the event of a technical payment failure where funds were debited but entitlement was not granted, our server verification system will auto-reconcile within 24 hours. Alternatively, contact billing support at support@gateprep.studio for immediate manual resolution.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">3. Processing Time</h2>
            <p>
              Approved refunds for accidental duplicate charges will be processed back to the original Razorpay payment method within 5-7 business days.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#dce3ec] bg-white py-6 px-6 text-center text-xs text-[#526079]">
        GATEPrep Studio © 2026 · Refund & Cancellation Policy
      </footer>
    </div>
  );
}
