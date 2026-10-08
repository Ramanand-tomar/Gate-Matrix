'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  RefreshCw,
  IndianRupee,
  Filter,
  UserPlus,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Building2,
  Download,
} from 'lucide-react';

interface OrderRecord {
  id: string;
  userId: string;
  branch: string;
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'GRANTED';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface SalesMetrics {
  totalGrossRevenue: number;
  paidOrdersCount: number;
  grantedOrdersCount: number;
  totalOrders: number;
  streamBreakdown: Record<string, number>;
  streamRevenue: Record<string, number>;
  orders: OrderRecord[];
}

type AdminTab = 'ORDERS' | 'OVERVIEW' | 'CONTENT' | 'SERIES' | 'USERS' | 'ANALYTICS';

const STREAM_NAMES: Record<string, string> = {
  CS: 'Computer Science',
  DA: 'Data Science & AI',
  EE: 'Electrical Engg',
  EC: 'Electronics Engg',
  ME: 'Mechanical Engg',
  CE: 'Civil Engg',
};

const STREAM_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  CS: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  DA: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-400', bar: 'bg-cyan-500' },
  EE: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-500' },
  EC: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', bar: 'bg-purple-500' },
  ME: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', bar: 'bg-blue-500' },
  CE: { bg: 'bg-[#0f766e]/10 dark:bg-[#0f766e]/20', text: 'text-[#0f766e] dark:text-[#8be0ce]', bar: 'bg-[#0f766e]' },
};

function AdminContent() {
  const { userProfile } = useAuth();
  const currentRole: UserRole = userProfile?.role || 'LEARNER';
  const isAuthorized = hasRolePermission(currentRole, 'EDITOR');

  const [activeTab, setActiveTab] = useState<AdminTab>('ORDERS');

  // Sales Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Grant Pass Modal State
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantBranch, setGrantBranch] = useState('CS');
  const [grantNotes, setGrantNotes] = useState('');
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);
  const [grantErrorMsg, setGrantErrorMsg] = useState<string | null>(null);

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load sales metrics');
      }
      setMetrics(data);
    } catch (err: any) {
      console.error('Error fetching sales metrics:', err);
      setError(err.message || 'Network error loading sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchSalesData();
    }
  }, [isAuthorized]);

  const handleGrantPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId.trim()) {
      setGrantErrorMsg('Candidate User ID is required.');
      return;
    }

    setGrantSubmitting(true);
    setGrantErrorMsg(null);
    setGrantSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: grantUserId.trim(),
          branch: grantBranch,
          notes: grantNotes.trim() || 'Granted manually via Admin Console',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to grant pass');
      }

      setGrantSuccessMsg(`Successfully granted 365-day ${grantBranch} Branch Pass to UID: ${grantUserId}`);
      setGrantUserId('');
      setGrantNotes('');
      fetchSalesData();

      setTimeout(() => {
        setIsGrantModalOpen(false);
        setGrantSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setGrantErrorMsg(err.message || 'An unexpected error occurred while granting pass.');
    } finally {
      setGrantSubmitting(false);
    }
  };

  const navItems: { id: AdminTab; label: string; icon: any; badge?: string }[] = [
    { id: 'ORDERS', label: 'Phase 1: Sales & Passes', icon: CreditCard, badge: 'Phase 1' },
    { id: 'USERS', label: 'Learners & Roster', icon: Users, badge: 'Phase 2' },
    { id: 'CONTENT', label: 'CMS & Test Papers', icon: BookOpen, badge: 'Phase 3' },
    { id: 'OVERVIEW', label: 'Console Overview', icon: BarChart3 },
    { id: 'ANALYTICS', label: 'Platform Traffic', icon: TrendingUp },
  ];

  // Filtered Orders Calculation
  const filteredOrders = (metrics?.orders || []).filter((ord) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      ord.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.razorpayPaymentId && ord.razorpayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const matchesBranch = branchFilter === 'ALL' || ord.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col text-slate-800 dark:text-slate-100">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* RBAC Access Guard */}
        {!isAuthorized ? (
          <Card className="max-w-xl mx-auto text-center py-12 border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full flex items-center justify-center font-bold mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-amber-950 dark:text-amber-200 mb-2">Management Console Restricted</h2>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 mb-4 leading-relaxed">
              Administrative permissions required. Your current account role is <strong className="uppercase font-bold">{currentRole}</strong>.
            </p>
            <div className="bg-amber-100/70 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 font-medium">
              🔒 Role assignment is strictly managed by system administrators. Contact your project administrator to request EDITOR or ADMIN access.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <Card padding="sm" className="sticky top-20 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0f766e] dark:text-[#8be0ce]" />
                    <span className="font-black text-sm text-[#14213d] dark:text-slate-100">Admin Control</span>
                  </div>
                  <Badge variant="emerald" className="text-[10px] uppercase font-bold">
                    v2.4
                  </Badge>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                          isActive
                            ? 'bg-[#14213d] text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#14213d] dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#8be0ce] dark:text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            {/* Main Content Pane */}
            <div className="lg:col-span-9 space-y-6">
              {/* Tab Header */}
              <div className="flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#0f766e] dark:text-[#8be0ce] text-xs font-black uppercase tracking-widest">
                      GATE Matrix Admin Console
                    </span>
                    <Badge variant="emerald">Phase 1 Live</Badge>
                  </div>
                  <h1 className="text-2xl font-black text-[#14213d] dark:text-slate-100">
                    {activeTab === 'ORDERS' && 'Sales, Revenue & Branch Pass Management'}
                    {activeTab === 'USERS' && 'Learner Roster & Account Administration'}
                    {activeTab === 'CONTENT' && 'CMS & Test Paper Pipeline Management'}
                    {activeTab === 'OVERVIEW' && 'Console Master Overview'}
                    {activeTab === 'ANALYTICS' && 'Platform Analytics & Traffic Insights'}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchSalesData}
                    disabled={loading}
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                  >
                    Sync
                  </Button>
                  {activeTab === 'ORDERS' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => setIsGrantModalOpen(true)}
                      leftIcon={<UserPlus className="w-4 h-4" />}
                    >
                      Grant Pass (₹500)
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Phase 1 View */}
              {activeTab === 'ORDERS' && (
                <>
                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Top Financial Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                      label="Gross Revenue"
                      value={loading ? '...' : `₹${(metrics?.totalGrossRevenue || 0).toLocaleString('en-IN')}`}
                      subtext="From Paid Pass Sales"
                    />
                    <StatCard
                      label="Paid Pass Orders"
                      value={loading ? '...' : metrics?.paidOrdersCount || 0}
                      subtext="₹500 / Branch Pass"
                    />
                    <StatCard
                      label="Granted Passes"
                      value={loading ? '...' : metrics?.grantedOrdersCount || 0}
                      subtext="Manual Admin Grants"
                    />
                    <StatCard
                      label="Total Transactions"
                      value={loading ? '...' : metrics?.totalOrders || 0}
                      subtext="All Recorded Orders"
                    />
                  </div>

                  {/* Stream Wise Sales Breakdown */}
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#0f766e] dark:text-[#8be0ce]" />
                          Stream-Wise Sales & Revenue Distribution
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Breakdown of ₹500 Branch Passes across GATE Disciplines.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.keys(STREAM_NAMES).map((branchKey) => {
                        const count = metrics?.streamBreakdown?.[branchKey] || 0;
                        const revenue = metrics?.streamRevenue?.[branchKey] || 0;
                        const colors = STREAM_COLORS[branchKey] || STREAM_COLORS.CS;
                        const maxCount = Math.max(...Object.values(metrics?.streamBreakdown || { CS: 1 }), 1);
                        const pct = Math.min(100, Math.round((count / maxCount) * 100));

                        return (
                          <div
                            key={branchKey}
                            className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 ${colors.bg} transition-all hover:scale-[1.01]`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${colors.text}`}>
                                  {branchKey}
                                </span>
                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                                  {STREAM_NAMES[branchKey]}
                                </h4>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  ₹{revenue.toLocaleString('en-IN')}
                                </span>
                                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                  {count} {count === 1 ? 'Pass' : 'Passes'}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                              <div
                                className={`h-full ${colors.bar} transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Orders Roster & Filtering Table */}
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    {/* Filter controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100">Live Orders & Passes Log</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Search candidate UIDs, payment IDs, or filter by branch/status.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative min-w-[200px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search UID / Order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>

                        {/* Status Filter */}
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0f766e]"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="PAID">PAID</option>
                          <option value="GRANTED">GRANTED (Admin)</option>
                          <option value="CREATED">PENDING (Created)</option>
                          <option value="FAILED">FAILED</option>
                        </select>

                        {/* Stream Filter */}
                        <select
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0f766e]"
                        >
                          <option value="ALL">All Branches</option>
                          {Object.keys(STREAM_NAMES).map((b) => (
                            <option key={b} value={b}>
                              {b} - {STREAM_NAMES[b]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                          <tr>
                            <th className="p-3.5">Order ID</th>
                            <th className="p-3.5">Candidate (UID)</th>
                            <th className="p-3.5">Branch Pass</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Payment ID</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {loading ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400">
                                Loading order records...
                              </td>
                            </tr>
                          ) : filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                                No orders match your active filter criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400 font-bold">
                                  {ord.id.substring(0, 16)}...
                                </td>
                                <td className="p-3.5 font-bold text-[#14213d] dark:text-slate-200">
                                  {ord.userId}
                                </td>
                                <td className="p-3.5">
                                  <span className="font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0f766e] dark:text-[#8be0ce]">
                                    {ord.branch}
                                  </span>
                                </td>
                                <td className="p-3.5 font-black text-slate-900 dark:text-white">
                                  ₹{ord.amount}
                                </td>
                                <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                  {ord.razorpayPaymentId || ord.notes || 'N/A'}
                                </td>
                                <td className="p-3.5">
                                  <Badge
                                    variant={
                                      ord.status === 'PAID'
                                        ? 'emerald'
                                        : ord.status === 'GRANTED'
                                        ? 'cyan'
                                        : ord.status === 'FAILED'
                                        ? 'red'
                                        : 'amber'
                                    }
                                  >
                                    {ord.status}
                                  </Badge>
                                </td>
                                <td className="p-3.5 text-slate-500 dark:text-slate-400">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}

              {/* Placeholder for Phase 2 & 3 */}
              {activeTab === 'USERS' && (
                <Card className="text-center py-12 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                  <Users className="w-12 h-12 text-[#0f766e] dark:text-[#8be0ce] mx-auto mb-3" />
                  <h3 className="text-xl font-black text-[#14213d] dark:text-slate-100 mb-2">Phase 2: Learner & User Roster</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Phase 2 will introduce learner search, account suspension, custom role overrides, and branch pass history for individual candidates.
                  </p>
                  <Button variant="emerald" onClick={() => setActiveTab('ORDERS')}>
                    Return to Phase 1 Sales Dashboard
                  </Button>
                </Card>
              )}

              {activeTab === 'CONTENT' && (
                <Card className="text-center py-12 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                  <BookOpen className="w-12 h-12 text-[#0f766e] dark:text-[#8be0ce] mx-auto mb-3" />
                  <h3 className="text-xl font-black text-[#14213d] dark:text-slate-100 mb-2">Phase 3: CMS & Test Paper Creator</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Phase 3 will add dynamic test paper drafting, question bank uploading, free paper flags, and custom answer key validation.
                  </p>
                  <Button variant="emerald" onClick={() => setActiveTab('ORDERS')}>
                    Return to Phase 1 Sales Dashboard
                  </Button>
                </Card>
              )}

              {(activeTab === 'OVERVIEW' || activeTab === 'ANALYTICS') && (
                <Card className="text-center py-12 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                  <BarChart3 className="w-12 h-12 text-[#0f766e] dark:text-[#8be0ce] mx-auto mb-3" />
                  <h3 className="text-xl font-black text-[#14213d] dark:text-slate-100 mb-2">System Performance Overview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    All core systems online. Revenue and pass issuance are actively tracked in real-time under Phase 1.
                  </p>
                  <Button variant="emerald" onClick={() => setActiveTab('ORDERS')}>
                    View Phase 1 Sales Dashboard
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Modal: Grant Branch Pass Manually */}
        {isGrantModalOpen && (
          <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full animate-fadeIn border-slate-200 dark:border-slate-800 dark:bg-slate-900" padding="lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0f766e] dark:text-[#8be0ce] flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#14213d] dark:text-slate-100">Grant Branch Pass</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Manual 365-day ₹500 pass issuance.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGrantModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {grantErrorMsg && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
                  {grantErrorMsg}
                </div>
              )}

              {grantSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{grantSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleGrantPassSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate User ID (UID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. firebase_uid_123 or user email"
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Engineering Stream</label>
                  <select
                    value={grantBranch}
                    onChange={(e) => setGrantBranch(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  >
                    {Object.keys(STREAM_NAMES).map((b) => (
                      <option key={b} value={b}>
                        {b} - {STREAM_NAMES[b]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admin Audit Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Granted for scholarship / testing / manual UPI"
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                  ⚡ Granting this pass immediately sets candidate entitlement for <strong>{grantBranch}</strong> for 365 days, recording status as <strong>GRANTED</strong>.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setIsGrantModalOpen(false)} disabled={grantSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="emerald" type="submit" disabled={grantSubmitting}>
                    {grantSubmitting ? 'Granting Pass...' : 'Grant 365-Day Pass'}
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

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl h-64 animate-pulse"></div>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}
