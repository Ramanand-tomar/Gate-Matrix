import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#dce3ec] bg-white py-8 px-6 text-center text-xs text-[#526079]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-extrabold text-[#14213d]">GATEPrep Studio</span> © 2026 · Official GATE CBT Exam Engine & Test Analytics Platform
        </div>
        <div className="flex gap-6 font-medium text-[#0f766e]">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/refund" className="hover:underline">
            Refund & Cancellation Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
