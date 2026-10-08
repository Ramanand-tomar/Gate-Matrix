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
  UserCheck,
  UserX,
  ShieldAlert,
  Edit,
  Key,
  Trash2,
  FilePlus,
  HelpCircle,
  Eye,
  Check,
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

interface UserRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  activePasses?: string[];
  createdAt: string;
  lastLoginAt: string;
}

interface UserMetrics {
  totalUsers: number;
  learnersCount: number;
  instructorsCount: number;
  editorsCount: number;
  adminsCount: number;
  activePassHoldersCount: number;
  suspendedCount: number;
  users: UserRecord[];
}

interface QuestionRecord {
  question_id: string;
  question_number: number;
  type: 'MCQ' | 'MSQ' | 'NAT';
  section: string;
  marks: number;
  negative_marks: number;
  question_html: string;
  options?: any;
  correct_answer?: any;
  solution_html?: string;
}

interface PaperRecord {
  paper_id: string;
  title: string;
  branch: string;
  provider: string;
  series: string;
  total_questions: number;
  questions?: QuestionRecord[];
  created_at?: string;
  updated_at?: string;
}

interface PaperMetrics {
  totalPapers: number;
  totalQuestionsCount: number;
  branchCounts: Record<string, number>;
  papers: PaperRecord[];
}

type AdminTab = 'CONTENT' | 'USERS' | 'ORDERS' | 'OVERVIEW' | 'SERIES' | 'ANALYTICS';

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

  const [activeTab, setActiveTab] = useState<AdminTab>('CONTENT');

  // Sales Data State (Phase 1)
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);

  // User Roster State (Phase 2)
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);

  // Paper CMS State (Phase 3)
  const [papersLoading, setPapersLoading] = useState(true);
  const [papersError, setPapersError] = useState<string | null>(null);
  const [paperMetrics, setPaperMetrics] = useState<PaperMetrics | null>(null);

  // Phase 1 Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderBranchFilter, setOrderBranchFilter] = useState<string>('ALL');

  // Phase 2 Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [userPassFilter, setUserPassFilter] = useState<string>('ALL');

  // Phase 3 Filters
  const [paperSearch, setPaperSearch] = useState('');
  const [paperBranchFilter, setPaperBranchFilter] = useState<string>('ALL');

  // Grant Pass Modal State (Phase 1)
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantBranch, setGrantBranch] = useState('CS');
  const [grantNotes, setGrantNotes] = useState('');
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);
  const [grantErrorMsg, setGrantErrorMsg] = useState<string | null>(null);

  // Manage User Modal State (Phase 2)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('LEARNER');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editPasses, setEditPasses] = useState<string[]>([]);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // Create Paper Modal State (Phase 3)
  const [isCreatePaperModalOpen, setIsCreatePaperModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBranch, setNewBranch] = useState('CS');
  const [newSeries, setNewSeries] = useState('Official 2026 Mock Series');
  const [newProvider, setNewProvider] = useState('GATE Matrix CMS');
  const [newTotalQ, setNewTotalQ] = useState(15);
  const [createPaperSubmitting, setCreatePaperSubmitting] = useState(false);
  const [createPaperSuccessMsg, setCreatePaperSuccessMsg] = useState<string | null>(null);
  const [createPaperError, setCreatePaperError] = useState<string | null>(null);

  // Edit Paper & Question Bank Modal State (Phase 3)
  const [isEditPaperModalOpen, setIsEditPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PaperRecord | null>(null);
  const [editPaperTitle, setEditPaperTitle] = useState('');
  const [editPaperBranch, setEditPaperBranch] = useState('CS');
  const [editPaperSeries, setEditPaperSeries] = useState('');
  const [editPaperProvider, setEditPaperProvider] = useState('');
  const [editQuestionsList, setEditQuestionsList] = useState<QuestionRecord[]>([]);
  const [editPaperSubmitting, setEditPaperSubmitting] = useState(false);
  const [editPaperSuccessMsg, setEditPaperSuccessMsg] = useState<string | null>(null);
  const [editPaperError, setEditPaperError] = useState<string | null>(null);

  // New Question Form state inside Edit Paper Modal
  const [newQHtml, setNewQHtml] = useState('');
  const [newQType, setNewQType] = useState<'MCQ' | 'MSQ' | 'NAT'>('MCQ');
  const [newQMarks, setNewQMarks] = useState(2);
  const [newQNegMarks, setNewQNegMarks] = useState(0.66);
  const [newQAns, setNewQAns] = useState('Option A');

  const fetchSalesData = async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load sales metrics');
      setSalesMetrics(data);
    } catch (err: any) {
      setSalesError(err.message || 'Network error loading sales data');
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchUsersData = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load candidate roster');
      setUserMetrics(data);
    } catch (err: any) {
      setUsersError(err.message || 'Network error loading candidate roster');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPapersData = async () => {
    setPapersLoading(true);
    setPapersError(null);
    try {
      const res = await fetch('/api/admin/papers');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load test paper CMS records');
      setPaperMetrics(data);
    } catch (err: any) {
      setPapersError(err.message || 'Network error loading paper CMS records');
    } finally {
      setPapersLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchSalesData();
      fetchUsersData();
      fetchPapersData();
    }
  }, [isAuthorized]);

  const handleGrantPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId.trim()) return setGrantErrorMsg('Candidate User ID is required.');
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to grant pass');

      setGrantSuccessMsg(`Successfully granted 365-day ${grantBranch} Branch Pass to UID: ${grantUserId}`);
      setGrantUserId('');
      setGrantNotes('');
      fetchSalesData();
      fetchUsersData();
      setTimeout(() => {
        setIsGrantModalOpen(false);
        setGrantSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setGrantErrorMsg(err.message || 'An error occurred while granting pass.');
    } finally {
      setGrantSubmitting(false);
    }
  };

  const handleOpenUserModal = (user: UserRecord) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status || 'ACTIVE');
    setEditPasses(user.activePasses || []);
    setUserSuccessMsg(null);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleTogglePass = (branchCode: string) => {
    if (editPasses.includes(branchCode)) {
      setEditPasses(editPasses.filter((b) => b !== branchCode));
    } else {
      setEditPasses([...editPasses, branchCode]);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUserSubmitting(true);
    setUserSuccessMsg(null);
    setUserModalError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: selectedUser.uid,
          role: editRole,
          status: editStatus,
          activePasses: editPasses,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update user profile');

      setUserSuccessMsg(`Successfully updated candidate ${selectedUser.displayName || selectedUser.uid}`);
      fetchUsersData();
      setTimeout(() => {
        setIsUserModalOpen(false);
        setUserSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setUserModalError(err.message || 'An error occurred while updating profile.');
    } finally {
      setUserSubmitting(false);
    }
  };

  // Phase 3 Create Paper Handler
  const handleCreatePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return setCreatePaperError('Paper title is required.');
    setCreatePaperSubmitting(true);
    setCreatePaperError(null);
    setCreatePaperSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          branch: newBranch,
          series: newSeries.trim(),
          provider: newProvider.trim(),
          total_questions: newTotalQ,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create test paper');

      setCreatePaperSuccessMsg(`Created paper "${newTitle}" (${newBranch})`);
      setNewTitle('');
      fetchPapersData();
      setTimeout(() => {
        setIsCreatePaperModalOpen(false);
        setCreatePaperSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setCreatePaperError(err.message || 'Error creating test paper.');
    } finally {
      setCreatePaperSubmitting(false);
    }
  };

  // Phase 3 Open Edit Paper & Questions Modal
  const handleOpenEditPaperModal = async (paper: PaperRecord) => {
    setEditingPaper(paper);
    setEditPaperTitle(paper.title);
    setEditPaperBranch(paper.branch);
    setEditPaperSeries(paper.series || 'Official 2026 Series');
    setEditPaperProvider(paper.provider || 'GATE Matrix CMS');
    setEditPaperSuccessMsg(null);
    setEditPaperError(null);
    setIsEditPaperModalOpen(true);

    try {
      const res = await fetch(`/api/admin/papers?paper_id=${paper.paper_id}`);
      const data = await res.json();
      if (data.success && data.paper) {
        setEditQuestionsList(data.paper.questions || []);
      }
    } catch (err) {
      setEditQuestionsList(paper.questions || []);
    }
  };

  const handleAddQuestionToPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQHtml.trim()) return;

    const newQObj: QuestionRecord = {
      question_id: `${editingPaper?.paper_id || 'paper'}_q${editQuestionsList.length + 1}`,
      question_number: editQuestionsList.length + 1,
      type: newQType,
      section: 'Technical Core',
      marks: Number(newQMarks),
      negative_marks: Number(newQNegMarks),
      question_html: `<p>${newQHtml.trim()}</p>`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: newQAns.trim(),
      solution_html: `<p>Step by step solution explanation for question #${editQuestionsList.length + 1}.</p>`,
    };

    setEditQuestionsList([...editQuestionsList, newQObj]);
    setNewQHtml('');
  };

  const handleSavePaperChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaper) return;
    setEditPaperSubmitting(true);
    setEditPaperError(null);
    setEditPaperSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/papers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: editingPaper.paper_id,
          updates: {
            title: editPaperTitle,
            branch: editPaperBranch,
            series: editPaperSeries,
            provider: editPaperProvider,
            questions: editQuestionsList,
            total_questions: editQuestionsList.length,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update test paper');

      setEditPaperSuccessMsg(`Successfully updated test paper "${editPaperTitle}"`);
      fetchPapersData();
      setTimeout(() => {
        setIsEditPaperModalOpen(false);
        setEditPaperSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setEditPaperError(err.message || 'Error updating paper.');
    } fontally {
      setEditPaperSubmitting(false);
    }
  };

  // Phase 3 Delete Paper Handler
  const handleDeletePaper = async (paperId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete test paper "${title}" (${paperId})?`)) return;

    try {
      const res = await fetch(`/api/admin/papers?paper_id=${paperId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete test paper');
      fetchPapersData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete test paper');
    }
  };

  const navItems: { id: AdminTab; label: string; icon: any; badge?: string }[] = [
    { id: 'CONTENT', label: 'Phase 3: CMS & Test Papers', icon: BookOpen, badge: 'Phase 3' },
    { id: 'USERS', label: 'Phase 2: Learners & Roster', icon: Users, badge: 'Phase 2' },
    { id: 'ORDERS', label: 'Phase 1: Sales & Revenue', icon: CreditCard, badge: 'Phase 1' },
    { id: 'OVERVIEW', label: 'Console Overview', icon: BarChart3 },
    { id: 'ANALYTICS', label: 'Platform Traffic', icon: TrendingUp },
  ];

  // Phase 1 Filtered Orders
  const filteredOrders = (salesMetrics?.orders || []).filter((ord) => {
    const matchesSearch =
      orderSearch.trim() === '' ||
      ord.userId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      ord.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (ord.razorpayPaymentId && ord.razorpayPaymentId.toLowerCase().includes(orderSearch.toLowerCase()));

    const matchesStatus = orderStatusFilter === 'ALL' || ord.status === orderStatusFilter;
    const matchesBranch = orderBranchFilter === 'ALL' || ord.branch === orderBranchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Phase 2 Filtered Users
  const filteredUsers = (userMetrics?.users || []).filter((usr) => {
    const query = userSearch.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      usr.uid.toLowerCase().includes(query) ||
      (usr.displayName && usr.displayName.toLowerCase().includes(query)) ||
      (usr.email && usr.email.toLowerCase().includes(query));

    const matchesRole = userRoleFilter === 'ALL' || usr.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'ALL' || (usr.status || 'ACTIVE') === userStatusFilter;

    let matchesPass = true;
    if (userPassFilter !== 'ALL') {
      if (userPassFilter === 'NO_PASS') {
        matchesPass = !usr.activePasses || usr.activePasses.length === 0;
      } else {
        matchesPass = !!(usr.activePasses && usr.activePasses.includes(userPassFilter));
      }
    }

    return matchesSearch && matchesRole && matchesStatus && matchesPass;
  });

  // Phase 3 Filtered Papers
  const filteredPapers = (paperMetrics?.papers || []).filter((p) => {
    const query = paperSearch.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      p.paper_id.toLowerCase().includes(query) ||
      p.title.toLowerCase().includes(query) ||
      (p.series && p.series.toLowerCase().includes(query)) ||
      (p.provider && p.provider.toLowerCase().includes(query));

    const matchesBranch = paperBranchFilter === 'ALL' || p.branch === paperBranchFilter;

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col text-slate-800 dark:text-slate-100">
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Strict Security RBAC Guard */}
        {!isAuthorized ? (
          <Card className="max-w-xl mx-auto text-center py-12 border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-2xl flex items-center justify-center font-bold mx-auto mb-4 shadow-sm border border-rose-200 dark:border-rose-900/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
              Management Console Locked
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed max-w-md mx-auto">
              Administrator security protection is active. Your account role is <strong className="uppercase font-bold text-amber-700 dark:text-amber-400">{currentRole}</strong>. Only verified staff accounts (EDITOR or ADMIN) are permitted.
            </p>
            <div className="bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 font-medium mb-6">
              🔒 Security Guard Enforced: All API calls, content tools, sales tracking, and candidate rosters require authenticated administrator credentials.
            </div>
            <div className="flex justify-center gap-3">
              <Link href="/">
                <Button variant="secondary" size="sm">
                  Return to Homepage
                </Button>
              </Link>
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
                    <span className="font-black text-sm text-[#14213d] dark:text-slate-100">Admin Security</span>
                  </div>
                  <Badge variant="emerald" className="text-[10px] uppercase font-bold">
                    v3.0 Secure
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
                      GATE Matrix Protected Console
                    </span>
                    <Badge variant={activeTab === 'CONTENT' ? 'emerald' : activeTab === 'USERS' ? 'cyan' : 'purple'}>
                      {activeTab === 'CONTENT' ? 'Phase 3 Live' : activeTab === 'USERS' ? 'Phase 2 Live' : 'Phase 1 Live'}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-black text-[#14213d] dark:text-slate-100">
                    {activeTab === 'CONTENT' && 'CMS, Test Papers & Question Bank Management'}
                    {activeTab === 'USERS' && 'Learner Roster, Roles & Candidate Access'}
                    {activeTab === 'ORDERS' && 'Sales, Revenue & Branch Pass Management'}
                    {activeTab === 'OVERVIEW' && 'Console Master Overview'}
                    {activeTab === 'ANALYTICS' && 'Platform Analytics & Traffic Insights'}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      fetchSalesData();
                      fetchUsersData();
                      fetchPapersData();
                    }}
                    disabled={salesLoading || usersLoading || papersLoading}
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${salesLoading || usersLoading || papersLoading ? 'animate-spin' : ''}`} />}
                  >
                    Sync
                  </Button>
                  {activeTab === 'CONTENT' && (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => setIsCreatePaperModalOpen(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Draft Test Paper
                    </Button>
                  )}
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

              {/* PHASE 3: CMS & TEST PAPER PIPELINE VIEW */}
              {activeTab === 'CONTENT' && (
                <>
                  {papersError && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{papersError}</span>
                    </div>
                  )}

                  {/* Top CMS Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                      label="Indexed Test Papers"
                      value={papersLoading ? '...' : paperMetrics?.totalPapers || 0}
                      subtext="Across 6 GATE Disciplines"
                    />
                    <StatCard
                      label="Question Bank Size"
                      value={papersLoading ? '...' : (paperMetrics?.totalQuestionsCount || 0).toLocaleString('en-IN')}
                      subtext="MCQ · MSQ · NAT Questions"
                    />
                    <StatCard
                      label="CS Branch Papers"
                      value={papersLoading ? '...' : paperMetrics?.branchCounts?.CS || 0}
                      subtext="Computer Science Series"
                    />
                    <StatCard
                      label="DA & AI Papers"
                      value={papersLoading ? '...' : paperMetrics?.branchCounts?.DA || 0}
                      subtext="Data Science Series"
                    />
                  </div>

                  {/* Paper Directory Table */}
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#0f766e] dark:text-[#8be0ce]" />
                          Test Series & Question Bank Roster
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Draft test papers, edit question HTML/answers, or manage discipline tags.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative min-w-[200px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search Title / Paper ID..."
                            value={paperSearch}
                            onChange={(e) => setPaperSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>

                        {/* Branch Filter */}
                        <select
                          value={paperBranchFilter}
                          onChange={(e) => setPaperBranchFilter(e.target.value)}
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
                            <th className="p-3.5">Paper ID</th>
                            <th className="p-3.5">Test Paper Title</th>
                            <th className="p-3.5">Branch</th>
                            <th className="p-3.5">Questions</th>
                            <th className="p-3.5">Series / Provider</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {papersLoading ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                Loading paper CMS dataset...
                              </td>
                            </tr>
                          ) : filteredPapers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                                No test papers match your search query or branch filter.
                              </td>
                            </tr>
                          ) : (
                            filteredPapers.map((p) => (
                              <tr key={p.paper_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                  {p.paper_id}
                                </td>
                                <td className="p-3.5 font-bold text-[#14213d] dark:text-slate-200 max-w-xs truncate">
                                  {p.title}
                                </td>
                                <td className="p-3.5">
                                  <span className="font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0f766e] dark:text-[#8be0ce]">
                                    {p.branch}
                                  </span>
                                </td>
                                <td className="p-3.5 font-black text-slate-900 dark:text-white">
                                  {p.total_questions} Questions
                                </td>
                                <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                                  {p.series || 'Official Series'} · {p.provider || 'GATEPrep'}
                                </td>
                                <td className="p-3.5 text-right space-x-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleOpenEditPaperModal(p)}
                                    leftIcon={<Edit className="w-3.5 h-3.5 text-[#0f766e] dark:text-[#8be0ce]" />}
                                  >
                                    Edit CMS
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePaper(p.paper_id, p.title)}
                                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
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

              {/* PHASE 2: LEARNER & USER ROSTER VIEW */}
              {activeTab === 'USERS' && (
                <>
                  {usersError && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{usersError}</span>
                    </div>
                  )}

                  {/* Candidate Roster Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                      label="Enrolled Learners"
                      value={usersLoading ? '...' : userMetrics?.learnersCount || 0}
                      subtext="Candidate Accounts"
                    />
                    <StatCard
                      label="Active Pass Holders"
                      value={usersLoading ? '...' : userMetrics?.activePassHoldersCount || 0}
                      subtext="1+ Branch Pass"
                    />
                    <StatCard
                      label="Staff & Creators"
                      value={
                        usersLoading
                          ? '...'
                          : (userMetrics?.instructorsCount || 0) + (userMetrics?.editorsCount || 0) + (userMetrics?.adminsCount || 0)
                      }
                      subtext="Instructors, Editors, Admins"
                    />
                    <StatCard
                      label="Suspended Accounts"
                      value={usersLoading ? '...' : userMetrics?.suspendedCount || 0}
                      subtext="Access Locked"
                    />
                  </div>

                  {/* Learner Roster & Filtering Table */}
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0f766e] dark:text-[#8be0ce]" />
                          Candidate Roster & Access Directory
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Search candidates, assign roles, toggle suspension, or edit active branch passes.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search Name / Email / UID..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>

                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0f766e]"
                        >
                          <option value="ALL">All Roles</option>
                          <option value="LEARNER">LEARNER</option>
                          <option value="INSTRUCTOR">INSTRUCTOR</option>
                          <option value="EDITOR">EDITOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        <select
                          value={userStatusFilter}
                          onChange={(e) => setUserStatusFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0f766e]"
                        >
                          <option value="ALL">All Account Statuses</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                          <tr>
                            <th className="p-3.5">Candidate User</th>
                            <th className="p-3.5">UID</th>
                            <th className="p-3.5">Role</th>
                            <th className="p-3.5">Branch Passes</th>
                            <th className="p-3.5">Account Status</th>
                            <th className="p-3.5">Joined</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {usersLoading ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400">
                                Loading candidate directory...
                              </td>
                            </tr>
                          ) : filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                                No candidate records match your search query or filters.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((usr) => (
                              <tr key={usr.uid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0f766e] to-[#14213d] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                      {(usr.displayName || usr.email || usr.uid).substring(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-900 dark:text-slate-100">
                                        {usr.displayName || 'GATE Candidate'}
                                      </h4>
                                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                        {usr.email || 'No email associated'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                                  {usr.uid}
                                </td>
                                <td className="p-3.5">
                                  <Badge
                                    variant={
                                      usr.role === 'ADMIN'
                                        ? 'rose'
                                        : usr.role === 'EDITOR'
                                        ? 'purple'
                                        : usr.role === 'INSTRUCTOR'
                                        ? 'amber'
                                        : 'cyan'
                                    }
                                  >
                                    {usr.role}
                                  </Badge>
                                </td>
                                <td className="p-3.5">
                                  <div className="flex flex-wrap gap-1">
                                    {usr.activePasses && usr.activePasses.length > 0 ? (
                                      usr.activePasses.map((p) => (
                                        <span
                                          key={p}
                                          className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-[#0f766e] dark:text-[#8be0ce]"
                                        >
                                          {p}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">None</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  {usr.status === 'SUSPENDED' ? (
                                    <Badge variant="rose" className="flex items-center gap-1 w-max">
                                      <UserX className="w-3 h-3" />
                                      SUSPENDED
                                    </Badge>
                                  ) : (
                                    <Badge variant="emerald" className="flex items-center gap-1 w-max">
                                      <UserCheck className="w-3 h-3" />
                                      ACTIVE
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                                  {usr.createdAt
                                    ? new Date(usr.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Recent'}
                                </td>
                                <td className="p-3.5 text-right">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleOpenUserModal(usr)}
                                    leftIcon={<Edit className="w-3.5 h-3.5 text-[#0f766e] dark:text-[#8be0ce]" />}
                                  >
                                    Manage
                                  </Button>
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

              {/* PHASE 1: SALES & ORDERS VIEW */}
              {activeTab === 'ORDERS' && (
                <>
                  {salesError && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{salesError}</span>
                    </div>
                  )}

                  {/* Top Financial Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                      label="Gross Revenue"
                      value={salesLoading ? '...' : `₹${(salesMetrics?.totalGrossRevenue || 0).toLocaleString('en-IN')}`}
                      subtext="From Paid Pass Sales"
                    />
                    <StatCard
                      label="Paid Pass Orders"
                      value={salesLoading ? '...' : salesMetrics?.paidOrdersCount || 0}
                      subtext="₹500 / Branch Pass"
                    />
                    <StatCard
                      label="Granted Passes"
                      value={salesLoading ? '...' : salesMetrics?.grantedOrdersCount || 0}
                      subtext="Manual Admin Grants"
                    />
                    <StatCard
                      label="Total Transactions"
                      value={salesLoading ? '...' : salesMetrics?.totalOrders || 0}
                      subtext="All Recorded Orders"
                    />
                  </div>

                  {/* Orders Roster & Filtering Table */}
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100">Live Orders & Passes Log</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Search candidate UIDs, payment IDs, or filter by branch/status.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search UID / Order ID..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>

                        <select
                          value={orderStatusFilter}
                          onChange={(e) => setOrderStatusFilter(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0f766e]"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="PAID">PAID</option>
                          <option value="GRANTED">GRANTED (Admin)</option>
                          <option value="CREATED">PENDING (Created)</option>
                          <option value="FAILED">FAILED</option>
                        </select>
                      </div>
                    </div>

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
                          {salesLoading ? (
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
                                        ? 'rose'
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

              {(activeTab === 'OVERVIEW' || activeTab === 'ANALYTICS') && (
                <Card className="text-center py-12 border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                  <BarChart3 className="w-12 h-12 text-[#0f766e] dark:text-[#8be0ce] mx-auto mb-3" />
                  <h3 className="text-xl font-black text-[#14213d] dark:text-slate-100 mb-2">System Performance Overview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    All core systems online and protected. Paper CMS, candidate rosters, and sales tracking are fully operational.
                  </p>
                  <Button variant="emerald" onClick={() => setActiveTab('CONTENT')}>
                    View Phase 3 Paper CMS
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Modal Phase 3: Create / Draft New Test Paper */}
        {isCreatePaperModalOpen && (
          <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full animate-fadeIn border-slate-200 dark:border-slate-800 dark:bg-slate-900" padding="lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0f766e] dark:text-[#8be0ce] flex items-center justify-center font-bold">
                    <FilePlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#14213d] dark:text-slate-100">Draft New Test Paper</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Add paper to dataset & question CMS.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreatePaperModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createPaperError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
                  {createPaperError}
                </div>
              )}

              {createPaperSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{createPaperSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreatePaperSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paper Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems & Memory Management Mock #03"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Engineering Discipline</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  >
                    {Object.keys(STREAM_NAMES).map((b) => (
                      <option key={b} value={b}>
                        {b} - {STREAM_NAMES[b]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Series Name</label>
                    <input
                      type="text"
                      value={newSeries}
                      onChange={(e) => setNewSeries(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Questions</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newTotalQ}
                      onChange={(e) => setNewTotalQ(Number(e.target.value))}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setIsCreatePaperModalOpen(false)}
                    disabled={createPaperSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button variant="emerald" type="submit" disabled={createPaperSubmitting}>
                    {createPaperSubmitting ? 'Creating Paper...' : 'Create Test Paper'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal Phase 3: Edit Paper & Question Bank CMS */}
        {isEditPaperModalOpen && editingPaper && (
          <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="max-w-2xl w-full animate-fadeIn border-slate-200 dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col" padding="lg">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#14213d] dark:text-slate-100">
                    Edit Paper CMS & Question Bank
                  </h3>
                  <p className="text-xs font-mono text-[#0f766e] dark:text-[#8be0ce]">{editingPaper.paper_id}</p>
                </div>
                <button
                  onClick={() => setIsEditPaperModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editPaperError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
                  {editPaperError}
                </div>
              )}

              {editPaperSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editPaperSuccessMsg}</span>
                </div>
              )}

              <div className="overflow-y-auto flex-1 space-y-6 pr-1 text-xs">
                {/* Paper Details Form */}
                <form onSubmit={handleSavePaperChangesSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paper Title</label>
                      <input
                        type="text"
                        required
                        value={editPaperTitle}
                        onChange={(e) => setEditPaperTitle(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                      <select
                        value={editPaperBranch}
                        onChange={(e) => setEditPaperBranch(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                      >
                        {Object.keys(STREAM_NAMES).map((b) => (
                          <option key={b} value={b}>
                            {b} - {STREAM_NAMES[b]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Question Bank Roster */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-black text-[#14213d] dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-[#0f766e] dark:text-[#8be0ce]" />
                        Questions in this Paper ({editQuestionsList.length})
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {editQuestionsList.map((q, idx) => (
                        <div
                          key={q.question_id || idx}
                          className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-[#0f766e] dark:text-[#8be0ce]">
                                Q{idx + 1}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {q.type}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {q.marks} Marks ({q.negative_marks} Neg)
                              </span>
                            </div>
                            <div
                              className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: q.question_html }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Ans: {String(q.correct_answer || 'Option A')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New Question Section */}
                  <div className="bg-slate-100/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <h5 className="font-black text-slate-800 dark:text-slate-200 text-xs">Add New Question to Paper</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newQType}
                        onChange={(e) => setNewQType(e.target.value as any)}
                        className="p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-bold"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="MSQ">MSQ</option>
                        <option value="NAT">NAT</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Marks"
                        value={newQMarks}
                        onChange={(e) => setNewQMarks(Number(e.target.value))}
                        className="p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Correct Ans (Option A)"
                        value={newQAns}
                        onChange={(e) => setNewQAns(e.target.value)}
                        className="p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-bold text-emerald-600"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Enter question text or HTML..."
                      value={newQHtml}
                      onChange={(e) => setNewQHtml(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                    />
                    <Button variant="secondary" size="sm" type="button" onClick={handleAddQuestionToPaper}>
                      + Append Question to Paper
                    </Button>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="secondary" onClick={() => setIsEditPaperModalOpen(false)} disabled={editPaperSubmitting}>
                      Cancel
                    </Button>
                    <Button variant="emerald" type="submit" disabled={editPaperSubmitting}>
                      {editPaperSubmitting ? 'Saving Changes...' : 'Save Paper & Questions'}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Phase 1: Grant Branch Pass */}
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

        {/* Modal Phase 2: Manage Candidate Role, Status & Passes */}
        {isUserModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-[#14213d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full animate-fadeIn border-slate-200 dark:border-slate-800 dark:bg-slate-900" padding="lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0f766e] to-[#14213d] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {(selectedUser.displayName || selectedUser.email || selectedUser.uid).substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#14213d] dark:text-slate-100">
                      {selectedUser.displayName || 'Candidate Settings'}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{selectedUser.uid}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {userModalError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
                  {userModalError}
                </div>
              )}

              {userSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{userSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateUserSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System Permission Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e] font-bold"
                  >
                    <option value="LEARNER">LEARNER (Standard candidate)</option>
                    <option value="INSTRUCTOR">INSTRUCTOR (Content contributor)</option>
                    <option value="EDITOR">EDITOR (Console moderator)</option>
                    <option value="ADMIN">ADMIN (Full management access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Lock & Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0f766e] font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Full candidate access)</option>
                    <option value="SUSPENDED">SUSPENDED (Access locked)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Entitled Branch Passes (365-Day Access)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(STREAM_NAMES).map((bCode) => {
                      const isChecked = editPasses.includes(bCode);
                      return (
                        <button
                          key={bCode}
                          type="button"
                          onClick={() => handleTogglePass(bCode)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border font-bold text-xs transition-all ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-[#0f766e] dark:text-[#8be0ce]'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <span>{bCode}</span>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button variant="secondary" onClick={() => setIsUserModalOpen(false)} disabled={userSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="emerald" type="submit" disabled={userSubmitting}>
                    {userSubmitting ? 'Saving Changes...' : 'Save Candidate Settings'}
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
