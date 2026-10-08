'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { hasRolePermission, UserRole } from '@/lib/rbac';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Plus,
  BookOpen,
  Users,
  CreditCard,
  BarChart3,
  Search,
  CheckCircle2,
  X,
  RefreshCw,
  IndianRupee,
  UserPlus,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  Edit,
  Trash2,
  FileQuestion,
  Eye,
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

type AdminTab = 'CONTENT' | 'USERS' | 'ORDERS' | 'OVERVIEW' | 'ANALYTICS';

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

const ADMIN_API_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-secret': 'GATE_MATRIX_SECURE_ADMIN_2026',
};

function AdminRoomContent() {
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
      const res = await fetch('/api/admin/orders', { headers: ADMIN_API_HEADERS });
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
      const res = await fetch('/api/admin/users', { headers: ADMIN_API_HEADERS });
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
      const res = await fetch('/api/admin/papers', { headers: ADMIN_API_HEADERS });
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
        headers: ADMIN_API_HEADERS,
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
        headers: ADMIN_API_HEADERS,
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

  const handleCreatePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return setCreatePaperError('Paper title is required.');
    setCreatePaperSubmitting(true);
    setCreatePaperError(null);
    setCreatePaperSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: ADMIN_API_HEADERS,
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
      const res = await fetch(`/api/admin/papers?paper_id=${paper.paper_id}`, { headers: ADMIN_API_HEADERS });
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
        headers: ADMIN_API_HEADERS,
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
    } finally {
      setEditPaperSubmitting(false);
    }
  };

  const handleDeletePaper = async (paperId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete test paper "${title}" (${paperId})?`)) return;

    try {
      const res = await fetch(`/api/admin/papers?paper_id=${paperId}`, {
        method: 'DELETE',
        headers: ADMIN_API_HEADERS,
      });
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
        {/* Strict Security RBAC Guard: Display 404 Route Not Found for non-staff */}
        {!isAuthorized ? (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center font-bold mx-auto mb-6 shadow-xs border border-slate-200 dark:border-slate-700">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
              404
            </h1>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              Page Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
              The page you are looking for does not exist, has been removed, or is temporarily unavailable.
            </p>
            <div className="flex justify-center">
              <Link href="/">
                <Button variant="primary" size="sm" className="bg-[#0f766e] hover:bg-[#115e59] text-white font-bold px-6 py-2.5 rounded-xl shadow-sm">
                  Go Back Home
                </Button>
              </Link>
            </div>
          </div>
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

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search papers by title/ID..."
                            value={paperSearch}
                            onChange={(e) => setPaperSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>

                        <select
                          value={paperBranchFilter}
                          onChange={(e) => setPaperBranchFilter(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                        >
                          <option value="ALL">All Branches</option>
                          <option value="CS">Computer Science (CS)</option>
                          <option value="DA">Data Science (DA)</option>
                          <option value="EE">Electrical (EE)</option>
                          <option value="EC">Electronics (EC)</option>
                          <option value="ME">Mechanical (ME)</option>
                          <option value="CE">Civil (CE)</option>
                        </select>
                      </div>
                    </div>

                    {papersLoading ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex justify-center items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0f766e]" /> Loading paper CMS records...
                      </div>
                    ) : filteredPapers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No test papers found matching search criteria.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                              <th className="py-3 px-3">Paper ID / Title</th>
                              <th className="py-3 px-3">Branch</th>
                              <th className="py-3 px-3">Series & Provider</th>
                              <th className="py-3 px-3 text-center">Questions</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredPapers.map((paper) => {
                              const bColors = STREAM_COLORS[paper.branch] || STREAM_COLORS.CS;
                              return (
                                <tr key={paper.paper_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="py-3.5 px-3">
                                    <div className="font-extrabold text-[#14213d] dark:text-slate-100">{paper.title}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{paper.paper_id}</div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${bColors.bg} ${bColors.text}`}>
                                      {paper.branch}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">{paper.series || 'GATE Official Series'}</div>
                                    <div className="text-[10px] text-slate-400">{paper.provider || 'GATE Matrix CMS'}</div>
                                  </td>
                                  <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                    {paper.total_questions} Qs
                                  </td>
                                  <td className="py-3.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Link href={`/exam/${paper.paper_id}`} target="_blank">
                                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-[#0f766e] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Preview Test">
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      </Link>
                                      <button
                                        onClick={() => handleOpenEditPaperModal(paper)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                        title="Edit Questions & CMS"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePaper(paper.paper_id, paper.title)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                        title="Delete Paper"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* PHASE 2: LEARNERS & ROSTER VIEW */}
              {activeTab === 'USERS' && (
                <>
                  {usersError && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{usersError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Total User Profiles" value={usersLoading ? '...' : userMetrics?.totalUsers || 0} subtext="Registered Aspirants" />
                    <StatCard label="Active Pass Holders" value={usersLoading ? '...' : userMetrics?.activePassHoldersCount || 0} subtext="₹500 Branch Pass Access" />
                    <StatCard label="Learners & Instructors" value={usersLoading ? '...' : (userMetrics?.learnersCount || 0) + (userMetrics?.instructorsCount || 0)} subtext="Active Platform Users" />
                    <StatCard label="Suspended Accounts" value={usersLoading ? '...' : userMetrics?.suspendedCount || 0} subtext="Access Locked" />
                  </div>

                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0f766e] dark:text-[#8be0ce]" />
                          Platform User Roster
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Manage user roles, grant branch passes, or update access status.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search by name/email/UID..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>

                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                        >
                          <option value="ALL">All Roles</option>
                          <option value="LEARNER">Learner</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="EDITOR">Editor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    </div>

                    {usersLoading ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex justify-center items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0f766e]" /> Loading user roster...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No user profiles found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                              <th className="py-3 px-3">User / Email</th>
                              <th className="py-3 px-3">Role</th>
                              <th className="py-3 px-3">Active Branch Passes</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredUsers.map((usr) => (
                              <tr key={usr.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3.5 px-3">
                                  <div className="font-extrabold text-[#14213d] dark:text-slate-100">{usr.displayName || 'GATE Aspirant'}</div>
                                  <div className="text-[10px] text-slate-400">{usr.email || usr.uid}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    usr.role === 'ADMIN'
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                      : usr.role === 'EDITOR'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                                      : usr.role === 'INSTRUCTOR'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}>
                                    {usr.role}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3">
                                  {usr.activePasses && usr.activePasses.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {usr.activePasses.map((b) => (
                                        <span key={b} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                          {b} Pass
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">No active pass</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    usr.status === 'SUSPENDED'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  }`}>
                                    {usr.status || 'ACTIVE'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                  <button
                                    onClick={() => handleOpenUserModal(usr)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                    title="Edit User Profile"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* PHASE 1: SALES & REVENUE VIEW */}
              {activeTab === 'ORDERS' && (
                <>
                  {salesError && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-semibold">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{salesError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Total Gross Revenue" value={salesLoading ? '...' : `₹${(salesMetrics?.totalGrossRevenue || 0).toLocaleString('en-IN')}`} subtext="₹500 Branch Passes" />
                    <StatCard label="Paid Orders" value={salesLoading ? '...' : salesMetrics?.paidOrdersCount || 0} subtext="Razorpay Completed" />
                    <StatCard label="Admin Granted Passes" value={salesLoading ? '...' : salesMetrics?.grantedOrdersCount || 0} subtext="Manual Pass Conversions" />
                    <StatCard label="Total Orders" value={salesLoading ? '...' : salesMetrics?.totalOrders || 0} subtext="Lifetime Transactions" />
                  </div>

                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-black text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#0f766e] dark:text-[#8be0ce]" />
                          Sales & Order Transactions
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Track Razorpay payments and manage branch pass access.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search orders..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                          />
                        </div>
                      </div>
                    </div>

                    {salesLoading ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex justify-center items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0f766e]" /> Loading sales records...
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No order records found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                              <th className="py-3 px-3">Order ID / User</th>
                              <th className="py-3 px-3">Branch</th>
                              <th className="py-3 px-3">Amount</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3.5 px-3">
                                  <div className="font-extrabold text-[#14213d] dark:text-slate-100">{ord.id}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{ord.userId}</div>
                                </td>
                                <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">{ord.branch}</td>
                                <td className="py-3.5 px-3 font-extrabold text-[#0f766e] dark:text-[#8be0ce]">₹{ord.amount}</td>
                                <td className="py-3.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    ord.status === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : ord.status === 'GRANTED'
                                      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* OVERVIEW TAB */}
              {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-black text-[#14213d] dark:text-slate-100 mb-2">Phase 1: Sales</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Total Revenue: ₹{(salesMetrics?.totalGrossRevenue || 0).toLocaleString('en-IN')}</p>
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('ORDERS')}>Manage Sales</Button>
                  </Card>
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-black text-[#14213d] dark:text-slate-100 mb-2">Phase 2: Roster</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Total Users: {userMetrics?.totalUsers || 0}</p>
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('USERS')}>Manage Roster</Button>
                  </Card>
                  <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="font-black text-[#14213d] dark:text-slate-100 mb-2">Phase 3: CMS</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Total Papers: {paperMetrics?.totalPapers || 0}</p>
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('CONTENT')}>Manage CMS</Button>
                  </Card>
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'ANALYTICS' && (
                <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-center py-12">
                  <TrendingUp className="w-10 h-10 text-[#0f766e] mx-auto mb-3" />
                  <h3 className="text-lg font-black text-[#14213d] dark:text-slate-100">Traffic & Performance Analytics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Real-time platform traffic telemetry and exam completion tracking metrics are active.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Grant Pass Modal (Phase 1) */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-black text-base text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0f766e]" /> Grant Branch Pass (₹500)
              </h3>
              <button onClick={() => setIsGrantModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGrantPassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Candidate User ID / Email</label>
                <input
                  type="text"
                  placeholder="e.g. aspirant_learner_101 or user email"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target GATE Branch</label>
                <select
                  value={grantBranch}
                  onChange={(e) => setGrantBranch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="CS">Computer Science (CS)</option>
                  <option value="DA">Data Science & AI (DA)</option>
                  <option value="EE">Electrical (EE)</option>
                  <option value="EC">Electronics (EC)</option>
                  <option value="ME">Mechanical (ME)</option>
                  <option value="CE">Civil (CE)</option>
                </select>
              </div>
              {grantErrorMsg && <p className="text-xs text-rose-600 font-bold">{grantErrorMsg}</p>}
              {grantSuccessMsg && <p className="text-xs text-emerald-600 font-bold">{grantSuccessMsg}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsGrantModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="emerald" size="sm" disabled={grantSubmitting}>
                  {grantSubmitting ? 'Granting...' : 'Grant 365-Day Pass'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal (Phase 2) */}
      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-black text-base text-[#14213d] dark:text-slate-100">
                Manage User Profile
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">User ID</label>
                <input type="text" value={selectedUser.uid} readOnly className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">User Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none">
                  <option value="LEARNER">LEARNER</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Access Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED (Locked)</option>
                </select>
              </div>
              {userModalError && <p className="text-xs text-rose-600 font-bold">{userModalError}</p>}
              {userSuccessMsg && <p className="text-xs text-emerald-600 font-bold">{userSuccessMsg}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="emerald" size="sm" disabled={userSubmitting}>
                  {userSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Draft New Paper Modal (Phase 3) */}
      {isCreatePaperModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-black text-base text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0f766e]" /> Draft New Test Paper
              </h3>
              <button onClick={() => setIsCreatePaperModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePaperSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Paper Title</label>
                <input
                  type="text"
                  placeholder="e.g. GATE CS 2026 Full Length Mock #05"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#0f766e]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">GATE Branch</label>
                <select
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="CS">Computer Science (CS)</option>
                  <option value="DA">Data Science & AI (DA)</option>
                  <option value="EE">Electrical (EE)</option>
                  <option value="EC">Electronics (EC)</option>
                  <option value="ME">Mechanical (ME)</option>
                  <option value="CE">Civil (CE)</option>
                </select>
              </div>
              {createPaperError && <p className="text-xs text-rose-600 font-bold">{createPaperError}</p>}
              {createPaperSuccessMsg && <p className="text-xs text-emerald-600 font-bold">{createPaperSuccessMsg}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreatePaperModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="emerald" size="sm" disabled={createPaperSubmitting}>
                  {createPaperSubmitting ? 'Creating...' : 'Create Paper'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Paper CMS Modal (Phase 3) */}
      {isEditPaperModalOpen && editingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-black text-base text-[#14213d] dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#0f766e]" /> Edit Paper & Question Bank: {editingPaper.title}
              </h3>
              <button onClick={() => setIsEditPaperModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaperChangesSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Paper Title</label>
                  <input
                    type="text"
                    value={editPaperTitle}
                    onChange={(e) => setEditPaperTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                  <select
                    value={editPaperBranch}
                    onChange={(e) => setEditPaperBranch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="CS">Computer Science (CS)</option>
                    <option value="DA">Data Science & AI (DA)</option>
                    <option value="EE">Electrical (EE)</option>
                    <option value="EC">Electronics (EC)</option>
                    <option value="ME">Mechanical (ME)</option>
                    <option value="CE">Civil (CE)</option>
                  </select>
                </div>
              </div>

              {/* Add Question Sub-Section */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 mb-2">Question Bank ({editQuestionsList.length} Questions)</h4>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 mb-4">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Append New Question</div>
                  <input
                    type="text"
                    placeholder="Enter question text or HTML snippet..."
                    value={newQHtml}
                    onChange={(e) => setNewQHtml(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select
                      value={newQType}
                      onChange={(e) => setNewQType(e.target.value as any)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="MSQ">MSQ</option>
                      <option value="NAT">NAT</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Correct answer (e.g. Option A or 42)"
                      value={newQAns}
                      onChange={(e) => setNewQAns(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuestionToPaper}
                      className="bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-bold px-3 py-1 rounded-lg"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>
              </div>

              {editPaperError && <p className="text-xs text-rose-600 font-bold">{editPaperError}</p>}
              {editPaperSuccessMsg && <p className="text-xs text-emerald-600 font-bold">{editPaperSuccessMsg}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditPaperModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="emerald" size="sm" disabled={editPaperSubmitting}>
                  {editPaperSubmitting ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AdminRoomPage() {
  return <AdminRoomContent />;
}
