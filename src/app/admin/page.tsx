'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { hasRolePermission, UserRole } from '@/lib/rbac';
import Footer from '@/components/Footer';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Lock,
  Plus,
  BookOpen,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Search,
  CheckCircle2,
  X,
  Layers,
  Settings,
} from 'lucide-react';

interface DraftRelease {
  title: string;
  branch: string;
  passImpact: string;
  bundlePrice: string;
  status: string;
}

type AdminTab = 'OVERVIEW' | 'CONTENT' | 'SERIES' | 'USERS' | 'ORDERS' | 'ANALYTICS';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const currentRole: UserRole = userProfile?.role || 'LEARNER';
  const isAuthorized = hasRolePermission(currentRole, 'EDITOR');

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState('CS');
  const [price, setPrice] = useState('299');

  const [dbStats, setDbStats] = useState({ totalPapers: 0, totalQuestions: 0, loading: true });

  const [releases, setReleases] = useState<DraftRelease[]>([
    {
      title: 'Database Normalization & Indexing Practice',
      branch: 'CS',
      passImpact: 'Included in Branch Pass',
      bundlePrice: '₹299',
      status: 'Published',
    },
    {
      title: 'Machine Learning & Probability Mock #04',
      branch: 'DA',
      passImpact: 'Included in Branch Pass',
      bundlePrice: '₹349',
      status: 'Scheduled',
    },
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

  const navItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'OVERVIEW', label: 'Console Overview', icon: BarChart3 },
    { id: 'CONTENT', label: 'Content Pipeline', icon: Layers },
    { id: 'SERIES', label: 'Test Series', icon: BookOpen },
    { id: 'USERS', label: 'Learner Management', icon: Users },
    { id: 'ORDERS', label: 'Order History', icon: CreditCard },
    { id: 'ANALYTICS', label: 'Platform Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* RBAC Access Guard */}
        {!isAuthorized ? (
          <Card className="max-w-xl mx-auto text-center py-12 border-amber-300 bg-amber-50/50">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-amber-950 mb-2">Management Console Restricted</h2>
            <p className="text-xs text-amber-800 mb-4 leading-relaxed">
              Administrative permissions required. Your current account role is <strong className="uppercase font-bold">{currentRole}</strong>.
            </p>
            <div className="bg-amber-100/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
              🔒 Role assignment is strictly managed by system administrators. Contact your project administrator to request EDITOR or ADMIN access.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <Card padding="sm" className="sticky top-20">
                <div className="px-3 py-2 border-b border-slate-100 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0f766e]" />
                  <span className="font-black text-sm text-[#14213d]">Admin Console</span>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                          isActive
                            ? 'bg-[#14213d] text-white shadow-xs'
                            : 'text-[#526079] hover:bg-slate-50 hover:text-[#14213d]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#8be0ce]' : 'text-[#526079]'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            {/* Main Console View */}
            <div className="lg:col-span-9 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <span className="text-[#0f766e] text-xs font-extrabold uppercase tracking-widest block mb-0.5">
                    Operations Dashboard
                  </span>
                  <h1 className="text-2xl font-black text-[#14213d]">Content Pipeline & Metrics</h1>
                </div>

                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Schedule New Test
                </Button>
              </div>

              {/* Top Stats Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Verified Papers"
                  value={dbStats.loading ? '...' : dbStats.totalPapers}
                  subtext="Indexed in DB"
                />
                <StatCard
                  label="Total Questions"
                  value={dbStats.loading ? '...' : dbStats.totalQuestions}
                  subtext="MCQ · MSQ · NAT"
                />
                <StatCard label="Active Passes" value="1,420" subtext="Enrolled Candidates" />
                <StatCard label="Platform Revenue" value="₹1.84L" subtext="Gross Orders" />
              </div>

              {/* Releases Table */}
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black text-[#14213d]">Draft Test Pipeline & Releases</h3>
                    <p className="text-xs text-[#526079]">Manage paper availability and branch pass access.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[#526079] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Series Title</th>
                        <th className="p-3.5">Branch</th>
                        <th className="p-3.5">Pass Impact</th>
                        <th className="p-3.5">Standalone Price</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce3ec]">
                      {releases.map((rel, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-[#14213d]">{rel.title}</td>
                          <td className="p-3.5 font-bold text-[#0f766e]">{rel.branch}</td>
                          <td className="p-3.5 text-slate-600">{rel.passImpact}</td>
                          <td className="p-3.5 font-bold">{rel.bundlePrice}</td>
                          <td className="p-3.5">
                            <Badge variant={rel.status === 'Published' ? 'emerald' : 'amber'}>
                              {rel.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Modal for Scheduling New Release */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full animate-fadeIn" padding="lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-[#14213d]">Schedule New Test Series</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDraft} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#14213d] mb-1">Test Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems Scheduling Mock #02"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-[#dce3ec] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#14213d] mb-1">Engineering Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full border border-[#dce3ec] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e] bg-white"
                  >
                    <option value="CS">Computer Science (CS)</option>
                    <option value="DA">Data Science & AI (DA)</option>
                    <option value="EE">Electrical (EE)</option>
                    <option value="EC">Electronics (EC)</option>
                    <option value="ME">Mechanical (ME)</option>
                    <option value="CE">Civil (CE)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#14213d] mb-1">Standalone Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-[#dce3ec] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="emerald" type="submit">
                    Publish Release
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
