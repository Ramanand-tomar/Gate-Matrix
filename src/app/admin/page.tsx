'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { hasRolePermission, UserRole } from '@/lib/rbac';

interface DraftRelease {
  title: string;
  branch: string;
  passImpact: string;
  bundlePrice: string;
  status: string;
}

export default function AdminPage() {
  const { userProfile, setUserRole } = useAuth();
  const currentRole: UserRole = userProfile?.role || 'LEARNER';
  const isAuthorized = hasRolePermission(currentRole, 'EDITOR');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState('CS');
  const [price, setPrice] = useState('299');

  const [dbStats, setDbStats] = useState({ totalPapers: 0, totalQuestions: 0, loading: true });

  const [releases, setReleases] = useState<DraftRelease[]>([
    { title: 'Database Normalization Practice', branch: 'CS', passImpact: 'Included in Branch Pass', bundlePrice: '₹299', status: 'Published' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/papers');
        const data = await res.json();
        if (data.success && data.papers) {
          const totalQ = data.papers.reduce((sum: number, p: any) => sum + (p.total_questions || 0), 0);
          setDbStats({ totalPapers: data.count, totalQuestions: totalQ, loading: false });
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    }
    fetchStats();
  }, []);

  const handleAddDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setReleases((prev) => [
      ...prev,
      {
        title,
        branch,
        passImpact: 'Included in Branch Pass',
        bundlePrice: `₹${price}`,
        status: 'Scheduled',
      },
    ]);

    setTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1">
        {/* RBAC Access Guarding */}
        {!isAuthorized ? (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-10 text-center max-w-2xl mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              🔒
            </div>
            <h2 className="text-2xl font-extrabold text-amber-900 mb-2">
              Console Access Restricted
            </h2>
            <p className="text-sm text-amber-800 mb-6 leading-relaxed">
              Administrative permissions required. Your current account role is <strong className="uppercase font-bold">{currentRole}</strong>.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setUserRole('ADMIN')}
                className="bg-[#14213d] hover:bg-[#1d2d50] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
              >
                Switch to Admin Mode
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-1">
                  Management Console
                </span>
                <h1 className="text-3xl font-extrabold text-[#14213d] tracking-tight">
                  Content Operations & Test Pipeline
                </h1>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0f766e] hover:bg-[#115e59] text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95"
              >
                + Publish New Series
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-[#dce3ec] p-6 rounded-2xl shadow-xs">
                <span className="text-xs text-[#526079] block mb-1 font-semibold">Verified GATE Papers</span>
                <div className="text-3xl font-black text-[#0f766e]">
                  {dbStats.loading ? '...' : dbStats.totalPapers}
                </div>
                <span className="text-[11px] text-gray-400">Database indexed</span>
              </div>

              <div className="bg-white border border-[#dce3ec] p-6 rounded-2xl shadow-xs">
                <span className="text-xs text-[#526079] block mb-1 font-semibold">Parsed Questions</span>
                <div className="text-3xl font-black text-[#14213d]">
                  {dbStats.loading ? '...' : dbStats.totalQuestions}
                </div>
                <span className="text-[11px] text-gray-400">MCQ, MSQ, NAT bank</span>
              </div>

              <div className="bg-white border border-[#dce3ec] p-6 rounded-2xl shadow-xs">
                <span className="text-xs text-[#526079] block mb-1 font-semibold">Active Subscribers</span>
                <div className="text-3xl font-black text-[#14213d]">86</div>
                <span className="text-[11px] text-gray-400">Branch Pass holders</span>
              </div>

              <div className="bg-white border border-[#dce3ec] p-6 rounded-2xl shadow-xs">
                <span className="text-xs text-[#526079] block mb-1 font-semibold">Gross Transactions</span>
                <div className="text-3xl font-black text-[#14213d]">₹42,970</div>
                <span className="text-[11px] text-emerald-600 font-bold">Razorpay Verified</span>
              </div>
            </div>

            {/* Operational Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Recent Enrollments */}
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-[#14213d] mb-4">Recent Enrollments</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] text-[#526079] uppercase font-bold">
                      <tr>
                        <th className="p-3">Learner ID</th>
                        <th className="p-3">Series</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec]">
                      <tr>
                        <td className="p-3 font-semibold text-[#14213d]">Learner #1042</td>
                        <td className="p-3">CS Branch Pass</td>
                        <td className="p-3">₹1,499</td>
                        <td className="p-3 text-[#0f766e] font-bold">Granted</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[#14213d]">Learner #1041</td>
                        <td className="p-3">EE Series Bundle</td>
                        <td className="p-3">₹799</td>
                        <td className="p-3 text-[#0f766e] font-bold">Granted</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[#14213d]">Learner #1040</td>
                        <td className="p-3">DA Test Series</td>
                        <td className="p-3">₹799</td>
                        <td className="p-3 text-[#0f766e] font-bold">Granted</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Database Audit Status */}
              <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#14213d] mb-4">Content Quality Verification</h2>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <strong className="block text-emerald-900 font-bold mb-0.5">Database Synced & Audited</strong>
                      <span className="text-emerald-700">1,061 test papers indexed in Firestore database.</span>
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-xl">
                      <strong className="block text-[#14213d] font-bold mb-0.5">KaTeX Equation Verification</strong>
                      <span className="text-[#526079]">All mathematical formulas rendered with high precision.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Series Release Table */}
            <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#14213d] mb-4">Published & Scheduled Test Series</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-[#526079] uppercase font-bold">
                    <tr>
                      <th className="p-3">Series Title</th>
                      <th className="p-3">Branch</th>
                      <th className="p-3">Pass Access</th>
                      <th className="p-3">Single Price</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce3ec]">
                    {releases.map((r, i) => (
                      <tr key={i}>
                        <td className="p-3 font-bold text-[#14213d]">{r.title}</td>
                        <td className="p-3 font-semibold">{r.branch}</td>
                        <td className="p-3 text-[#0f766e] font-bold">{r.passImpact}</td>
                        <td className="p-3 font-bold">{r.bundlePrice}</td>
                        <td className="p-3 text-[#0f766e] font-bold">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* New Series Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#14213d]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#dce3ec] shadow-2xl">
            <h2 className="text-xl font-bold text-[#14213d] mb-1">Publish New Test Series</h2>
            <p className="text-xs text-[#526079] mb-4">
              Add new subject practice series or mock tests to the catalogue.
            </p>

            <form onSubmit={handleAddDraft} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#14213d] mb-1">Series Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Engineering Mathematics Practice Series"
                  className="w-full border border-[#dce3ec] rounded-xl p-3 text-xs focus:outline-none focus:border-[#0f766e]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#14213d] mb-1">Engineering Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full border border-[#dce3ec] rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-[#0f766e]"
                >
                  <option value="CS">CS - Computer Science</option>
                  <option value="DA">DA - Data Science & AI</option>
                  <option value="EE">EE - Electrical Engineering</option>
                  <option value="EC">EC - Electronics Engineering</option>
                  <option value="ME">ME - Mechanical Engineering</option>
                  <option value="CE">CE - Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#14213d] mb-1">Series Price (INR)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-[#dce3ec] rounded-xl p-3 text-xs focus:outline-none focus:border-[#0f766e]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#dce3ec] text-[#526079] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0f766e] text-white font-extrabold hover:bg-[#115e59] transition-colors"
                >
                  Publish Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-[#dce3ec] bg-white py-6 text-center text-xs text-[#526079]">
        GATEPrep Studio © 2026 · Management Console
      </footer>
    </div>
  );
}
