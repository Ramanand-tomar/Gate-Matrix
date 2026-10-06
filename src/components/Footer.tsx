'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#dce3ec] bg-white text-xs text-[#526079] pt-12 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        {/* Brand Description */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#14213d] text-white flex items-center justify-center font-black text-base">
              G
            </div>
            <span className="font-black text-base text-[#14213d] tracking-tight">
              GATE <span className="text-[#0f766e]">Matrix</span>
            </span>
          </div>
          <p className="text-xs text-[#526079] leading-relaxed max-w-sm">
            GATE Matrix (GATEPrep Studio) is a premium GATE preparation platform providing CBT-pattern mock tests, topic-level diagnostic analytics, and KaTeX mathematical solutions for Indian engineering candidates.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0f766e] bg-[#e7f4f0] px-3 py-1.5 rounded-xl w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>IIT CBT Standard Compliant</span>
          </div>
        </div>

        {/* Target Disciplines */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-extrabold text-[#14213d] uppercase tracking-wider text-[11px] mb-3">
            Target Engineering Disciplines
          </h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <Link href="/catalog?branch=CS" className="hover:text-[#0f766e] transition-colors">
                Computer Science & IT (CS)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=DA" className="hover:text-[#0f766e] transition-colors">
                Data Science & AI (DA)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=EE" className="hover:text-[#0f766e] transition-colors">
                Electrical Engineering (EE)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=EC" className="hover:text-[#0f766e] transition-colors">
                Electronics & Communication (EC)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=ME" className="hover:text-[#0f766e] transition-colors">
                Mechanical Engineering (ME)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=CE" className="hover:text-[#0f766e] transition-colors">
                Civil Engineering (CE)
              </Link>
            </li>
          </ul>
        </div>

        {/* Learner Navigation */}
        <div className="md:col-span-2 space-y-2">
          <h4 className="font-extrabold text-[#14213d] uppercase tracking-wider text-[11px] mb-3">
            Learner Tools
          </h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <Link href="/catalog" className="hover:text-[#0f766e] transition-colors">
                Test Series Catalogue
              </Link>
            </li>
            <li>
              <Link href="/practice" className="hover:text-[#0f766e] transition-colors">
                Topic Practice Hub
              </Link>
            </li>
            <li>
              <Link href="/performance" className="hover:text-[#0f766e] transition-colors">
                Performance Analytics
              </Link>
            </li>
            <li>
              <Link href="/library" className="hover:text-[#0f766e] transition-colors">
                My Library & Passes
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-[#0f766e] transition-colors">
                Candidate Workspace
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Support */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-extrabold text-[#14213d] uppercase tracking-wider text-[11px] mb-3">
            Policies & Security
          </h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <Link href="/privacy" className="hover:text-[#0f766e] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#0f766e] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/refund" className="hover:text-[#0f766e] transition-colors">
                Refund & Cancellation Policy
              </Link>
            </li>
          </ul>
          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            Payments secured by Razorpay 256-bit SSL
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#dce3ec] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px]">
        <div>
          © 2026 <strong className="text-[#14213d] font-black">GATE Matrix / GATEPrep Studio</strong>. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[#526079] font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0f766e]" /> Verified IIT Pattern
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#0f766e]" /> Real-time Analytics
          </span>
        </div>
      </div>
    </footer>
  );
}
