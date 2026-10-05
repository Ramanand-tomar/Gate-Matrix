'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface PaperDoc {
  id: string;
  paper_id: string;
  title: string;
  branch: string;
  total_questions: number;
}

export default function DashboardPage() {
  const { user, signInWithGoogle } = useAuth();
  const [papers, setPapers] = useState<PaperDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSamplePapers() {
      try {
        const res = await fetch('/api/papers');
        const data = await res.json();
        if (data.success && data.papers) {
          setPapers(data.papers.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard papers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSamplePapers();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1">
        {/* Welcome Banner */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-1">
              Personal Study Workspace
            </span>
            <h1 className="text-3xl font-extrabold text-[#14213d] tracking-tight">
              Welcome back, {user ? user.displayName || 'GATE Aspirant' : 'GATE Aspirant'}!
            </h1>
            <p className="text-[#526079] text-sm mt-0.5">
              {user ? `Logged in as ${user.email}` : 'Sign in with Google to save test progress & track accuracy.'}
            </p>
          </div>
          {!user && (
            <button
              onClick={signInWithGoogle}
              className="bg-[#14213d] hover:bg-[#1d2d50] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {/* Hero Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-gradient-to-br from-[#14213d] to-[#0f172a] text-white p-8 rounded-3xl relative overflow-hidden shadow-lg border border-white/10">
            <span className="text-[#8be0ce] text-xs font-extrabold uppercase tracking-wider block mb-2">
              Recommended GATE CBT Practice
            </span>
            <h2 className="text-2xl font-extrabold mb-3 leading-snug">
              Authentic GATE Mock Tests.<br />Instant Scoring & Topic Analytics.
            </h2>
            <p className="text-gray-300 text-sm mb-6 max-w-md leading-relaxed">
              Practice under timed exam conditions matching official IIT GATE exam standards. Identify weak areas before exam day.
            </p>
            <div className="flex gap-4 text-xs text-gray-300 mb-6 flex-wrap font-medium">
              <span>{papers.length > 0 ? `${papers.length} Tests Ready` : 'Multiple Test Series'}</span>
              <span>•</span>
              <span>Timed Mode & Practice Mode</span>
              <span>•</span>
              <span className="text-[#8be0ce]">KaTeX Math Solutions</span>
            </div>
            <Link
              href={papers.length > 0 ? `/exam?paperId=${papers[0].paper_id}` : '/exam'}
              className="inline-block bg-[#8be0ce] text-[#0f172a] font-extrabold text-sm px-6 py-3 rounded-xl hover:bg-white transition-all shadow-md active:scale-95"
            >
              Launch CBT Exam Engine →
            </Link>
          </div>

          {/* Target Practice Focus Column */}
          <div className="bg-white border border-[#dce3ec] p-6 rounded-3xl flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-[#14213d] text-base">Recommended Practice</h3>
                <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  High Yield
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="pb-3 border-b border-[#dce3ec]">
                  <strong className="text-xs text-[#14213d] block mb-1">01. Practice Full Length Mocks</strong>
                  <p className="text-[#526079] mb-2">65 Questions · 100 Marks · 180 Minutes</p>
                  <Link href="/catalog" className="text-xs text-[#0f766e] font-bold hover:underline">
                    Browse Catalogue →
                  </Link>
                </div>

                <div>
                  <strong className="text-xs text-[#14213d] block mb-1">02. Review Subject Accuracy</strong>
                  <p className="text-[#526079]">Track performance across engineering topics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available GATE Mocks */}
        <div className="bg-white border border-[#dce3ec] rounded-3xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#14213d]">Available GATE Test Series</h2>
            <Link href="/catalog" className="text-xs text-[#0f766e] font-bold hover:underline">
              View All Tests →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading available tests...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#526079] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5">Test Title</th>
                    <th className="p-3.5">Branch</th>
                    <th className="p-3.5">Questions</th>
                    <th className="p-3.5">Exam Pattern</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce3ec]">
                  {papers.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-[#14213d]">{p.title}</td>
                      <td className="p-3.5 font-bold text-[#0f766e]">{p.branch}</td>
                      <td className="p-3.5 font-bold">{p.total_questions} Qs</td>
                      <td className="p-3.5 text-[#526079]">
                        <span className="bg-[#e7f4f0] text-[#0f766e] text-[10px] font-bold px-2 py-0.5 rounded-md">
                          CBT Standard
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Link
                          href={`/exam?paperId=${p.paper_id}`}
                          className="bg-[#0f766e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#115e59] transition-colors inline-block shadow-xs"
                        >
                          Start Test →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[#dce3ec] bg-white py-6 text-center text-xs text-[#526079]">
        GATEPrep Studio © 2026 · Learner Workspace
      </footer>
    </div>
  );
}
