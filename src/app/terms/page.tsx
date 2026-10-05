import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-1">
        <Link href="/" className="text-xs font-bold text-[#0f766e] hover:underline mb-6 inline-block">
          ← Back to GATEPrep Studio
        </Link>
        <h1 className="text-3xl font-extrabold text-[#14213d] mb-2">Terms of Service</h1>
        <p className="text-xs text-gray-500 mb-8">Last Updated: October 5, 2026</p>

        <div className="bg-white border border-[#dce3ec] rounded-3xl p-8 space-y-6 text-xs text-[#526079] leading-relaxed shadow-xs">
          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using GATEPrep Studio, you agree to comply with these Terms of Service. If you do not agree, you must discontinue platform usage immediately.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">2. Intellectual Property & Course Content</h2>
            <p>
              All GATE test series materials, KaTeX solution explanations, questions, and topic analytics interfaces are protected by intellectual property laws. Content may not be redistributed, scraped, or resold without explicit written authorization.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">3. Subscription Grants & Access</h2>
            <p>
              Purchasing a Branch Pass (365 days) or Subject Series Bundle grants non-transferable, personal access to the designated test series during the active validity period.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">4. User Invariants & System Integrity</h2>
            <p>
              Attempting to bypass server-side scoring, tamper with attempt scores, manipulate order prices, or self-elevate role permissions will result in immediate account termination.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#dce3ec] bg-white py-6 px-6 text-center text-xs text-[#526079]">
        GATEPrep Studio © 2026 · Terms of Service
      </footer>
    </div>
  );
}
