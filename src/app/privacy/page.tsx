import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-1">
        <Link href="/" className="text-xs font-bold text-[#0f766e] hover:underline mb-6 inline-block">
          ← Back to GATEPrep Studio
        </Link>
        <h1 className="text-3xl font-extrabold text-[#14213d] mb-2">Privacy Policy</h1>
        <p className="text-xs text-gray-500 mb-8">Last Updated: October 5, 2026</p>

        <div className="bg-white border border-[#dce3ec] rounded-3xl p-8 space-y-6 text-xs text-[#526079] leading-relaxed shadow-xs">
          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">1. Information We Collect</h2>
            <p>
              GATEPrep Studio collects account information (name, email address, profile picture) provided via Google OAuth during sign-in, as well as test attempt responses, time-taken metrics, and transactional purchase logs required to deliver personalized learning analytics and manage active subscription grants.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">2. How We Use Information</h2>
            <p>
              Your data is strictly utilized to render CBT exam interfaces, calculate topic-level mastery analytics, process server-priced Razorpay course transactions, and enforce role-based authorization. We do not sell or rent personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">3. Advertising & Google AdSense</h2>
            <p className="mb-2">
              We use Google AdSense to serve advertisements across our platform. All test series, mock exams, and practice questions are provided completely free to students supported by advertisement revenue.
            </p>
            <p className="mb-2">
              Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to our website or other websites on the Internet. Google&apos;s use of advertising cookies (such as DoubleClick DART cookies) enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.
            </p>
            <p>
              Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#0f766e] underline font-bold">Google Ads Settings</a> or by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-[#0f766e] underline font-bold">aboutads.info</a>.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">4. Data Security & Storage</h2>
            <p>
              All learner attempt history, bookmarks, and authentication profiles are secured using Cloud Firestore security rules, HTTPS encryption in transit, and server-side authorization.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#14213d] mb-2">5. Your Rights & Contact</h2>
            <p>
              You have the right to inspect your stored attempt records, export your performance analytics, or request complete account deletion at any time.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#dce3ec] bg-white py-6 px-6 text-center text-xs text-[#526079]">
        GATEPrep Studio © 2026 · Privacy Policy
      </footer>
    </div>
  );
}
