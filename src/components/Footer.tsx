'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#dce3ec] dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-[#526079] dark:text-slate-400 pt-12 pb-8 px-6 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
        {/* Column 1: Brand & Tagline */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-icon.png"
              alt="GATE Matrix Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-black text-base text-[#14213d] dark:text-white tracking-tight">
              GATE <span className="text-[#0f766e] dark:text-[#2dd4bf]">Matrix</span>
            </span>
          </div>
          <p className="text-xs text-[#526079] dark:text-slate-400 leading-relaxed max-w-sm font-medium">
            Prepare smarter for GATE 2027. Realistic CBT-style test series, diagnostic topic analytics, and detailed step-by-step KaTeX mathematical solutions for Indian engineering aspirants.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0f766e] dark:text-[#2dd4bf] bg-[#e7f4f0] dark:bg-teal-950/60 px-3 py-1.5 rounded-xl w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>Realistic GATE CBT Practice Engine</span>
          </div>
        </div>

        {/* Column 2: Product */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-extrabold text-[#14213d] dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
            Product
          </h4>
          <ul className="space-y-2 font-semibold text-slate-600 dark:text-slate-300">
            <li>
              <Link href="/catalog" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Test Series Catalog
              </Link>
            </li>
            <li>
              <Link href="/practice" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Practice Arena
              </Link>
            </li>
            <li>
              <Link href="/performance" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Performance Analytics
              </Link>
            </li>
            <li>
              <Link href="/library" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                My Library
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: GATE Branches */}
        <div className="md:col-span-2 space-y-2">
          <h4 className="font-extrabold text-[#14213d] dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
            GATE Branches
          </h4>
          <ul className="space-y-2 font-semibold text-slate-600 dark:text-slate-300">
            <li>
              <Link href="/catalog?branch=CS" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Computer Science (CS)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=DA" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Data Science & AI (DA)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=EE" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Electrical (EE)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=EC" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Electronics (EC)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=ME" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Mechanical (ME)
              </Link>
            </li>
            <li>
              <Link href="/catalog?branch=CE" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Civil (CE)
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Company & Legal */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-extrabold text-[#14213d] dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
            Company & Legal
          </h4>
          <ul className="space-y-2 font-semibold text-slate-600 dark:text-slate-300">
            <li>
              <Link href="/refund" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
          <div className="pt-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Payments secured by Razorpay 256-bit SSL
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#dce3ec] dark:border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px]">
        <div className="text-slate-500 dark:text-slate-400 font-medium">
          © 2026 <strong className="text-[#14213d] dark:text-white font-black">GATE Matrix</strong>. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[#526079] dark:text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0f766e] dark:text-[#2dd4bf]" /> Curated Test Series
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#0f766e] dark:text-[#2dd4bf]" /> Real-time Performance Analytics
          </span>
        </div>
      </div>
    </footer>
  );
}
