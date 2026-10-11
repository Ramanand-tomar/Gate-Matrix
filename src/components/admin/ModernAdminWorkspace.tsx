'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { MathRenderer } from '@/components/MathRenderer';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
  Send,
  Sparkles,
  Command,
  Sun,
  Moon,
  Copy,
  Check,
  UserCheck,
  FileText,
  DollarSign,
  Activity,
  Layers,
  Key,
  LogOut,
  FolderPlus,
  HelpCircle,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const ADMIN_SECRET = 'GATE_MATRIX_SECURE_ADMIN_2026';
const ADMIN_API_HEADERS = {
  'Content-Type': 'application/json',
  'x-admin-secret': ADMIN_SECRET,
};

export type AdminTab = 'OVERVIEW' | 'ACCESS' | 'PAPERS' | 'ORDERS' | 'SETTINGS';

export const BRANCH_META: Record<
  string,
  { name: string; lightBadge: string; darkBadge: string; accentBorder: string }
> = {
  CS: {
    name: 'Computer Science & IT',
    lightBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accentBorder: 'border-emerald-500',
  },
  EC: {
    name: 'Electronics & Communication',
    lightBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    darkBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    accentBorder: 'border-purple-500',
  },
  DA: {
    name: 'Data Science & AI',
    lightBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    darkBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    accentBorder: 'border-cyan-500',
  },
  EE: {
    name: 'Electrical Engineering',
    lightBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    darkBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    accentBorder: 'border-amber-500',
  },
  ME: {
    name: 'Mechanical Engineering',
    lightBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    darkBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    accentBorder: 'border-blue-500',
  },
  CE: {
    name: 'Civil Engineering',
    lightBadge: 'bg-orange-50 text-orange-700 border-orange-200',
    darkBadge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    accentBorder: 'border-orange-500',
  },
};

const ALL_BRANCH_CODES = ['CS', 'EC', 'DA', 'EE', 'ME', 'CE'];

export const COACHING_INSTITUTES = [
  'MADE EASY',
  'ACE Academy',
  'GO Classes',
  'GATE Wallah',
  'Unacademy',
  'Official GATE (IIT)',
  'GATE Matrix Core',
];

export default function ModernAdminWorkspace() {
  const { user, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState<AdminTab>('ACCESS');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Global Data State
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalNotice, setGlobalNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- ACCESS STUDIO STATE ---
  const [grantEmail, setGrantEmail] = useState('');
  const [grantBranch, setGrantBranch] = useState('CS');
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // --- PAPERS CMS STATE ---
  const [paperSearchQuery, setPaperSearchQuery] = useState('');
  const [paperBranchFilter, setPaperBranchFilter] = useState('ALL');
  const [paperInstituteFilter, setPaperInstituteFilter] = useState('ALL');
  const [isCreatePaperOpen, setIsCreatePaperOpen] = useState(false);
  const [createPaperForm, setCreatePaperForm] = useState({
    title: '',
    branch: 'CS',
    duration: 180,
    totalMarks: 100,
    category: 'FULL_LENGTH' as 'FULL_LENGTH' | 'TOPIC_WISE' | 'PYQ',
    institute: 'MADE EASY',
  });
  const [creatingPaper, setCreatingPaper] = useState(false);

  // Question Bank Builder Sub-Modal
  const [activePaperForQuestions, setActivePaperForQuestions] = useState<any | null>(null);
  const [newQuestionForm, setNewQuestionForm] = useState({
    question_html: '',
    type: 'MCQ' as 'MCQ' | 'MSQ' | 'NAT',
    marks: 1,
    negative_marks: 0.33,
    correct_answer: 'A',
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // --- ORDERS STATE ---
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Copied feedback helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-authenticate if logged-in user is ADMIN
  useEffect(() => {
    if (userProfile?.role === 'ADMIN') {
      setIsAuthenticated(true);
    }
  }, [userProfile]);

  // Global Keyboard Shortcuts (Ctrl+K for command bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setIsCreatePaperOpen(false);
        setActivePaperForQuestions(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all admin data on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch real registered users and orders directly from Firestore
      let realUsers: any[] = [];
      let realOrders: any[] = [];

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        realUsers = usersSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              email: data.email || (data.displayName ? `${data.displayName.toLowerCase().replace(/\s+/g, '')}@candidate.app` : `candidate_${d.id.slice(0, 6)}@app.com`),
              displayName: data.displayName || (data.email ? data.email.split('@')[0] : `Candidate ${d.id.slice(0, 6)}`),
              role: data.role || 'LEARNER',
              activePasses: data.activePasses || [],
              createdAt: data.createdAt || data.lastLoginAt || new Date().toISOString(),
              ...data,
            };
          })
          // Only exclude the specific mock demo profiles
          .filter((u: any) => {
            const email = (u.email || '').toLowerCase();
            return (
              !email.includes('aarav.sharma@') &&
              !email.includes('priya.verma@') &&
              !email.includes('vikram.singh@') &&
              !email.includes('ananya.sen@') &&
              !email.includes('rajesh.kumar@')
            );
          });
      } catch (fsErr) {
        console.warn('Direct Firestore users fetch fallback:', fsErr);
      }

      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        realOrders = ordersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (fsErr) {
        console.warn('Direct Firestore orders fetch fallback:', fsErr);
      }

      const [usersRes, ordersRes, papersRes] = await Promise.all([
        fetch('/api/admin/users', { headers: ADMIN_API_HEADERS }),
        fetch('/api/admin/orders', { headers: ADMIN_API_HEADERS }),
        fetch('/api/admin/papers', { headers: ADMIN_API_HEADERS }),
      ]);

      if (realUsers.length > 0) {
        // Build user map prioritizing live Firestore documents
        const userMap = new Map<string, any>();
        realUsers.forEach((u) => userMap.set(u.email ? u.email.toLowerCase() : u.uid, u));

        if (usersRes.ok) {
          const u = await usersRes.json();
          if (u.success && Array.isArray(u.users)) {
            u.users.forEach((user: any) => {
              const key = user.email ? user.email.toLowerCase() : user.uid;
              if (!userMap.has(key)) {
                userMap.set(key, user);
              }
            });
          }
        }
        setUsers(Array.from(userMap.values()));
      } else if (usersRes.ok) {
        const u = await usersRes.json();
        if (u.success && u.users) setUsers(u.users);
      }

      if (realOrders.length > 0) {
        const orderMap = new Map<string, any>();
        realOrders.forEach((o) => orderMap.set(o.order_id || o.id, o));
        if (ordersRes.ok) {
          const o = await ordersRes.json();
          if (o.success && Array.isArray(o.orders)) {
            o.orders.forEach((ord: any) => {
              const key = ord.order_id || ord.id;
              if (!orderMap.has(key)) orderMap.set(key, ord);
            });
          }
        }
        setOrders(Array.from(orderMap.values()));
      } else if (ordersRes.ok) {
        const o = await ordersRes.json();
        if (o.success && o.orders) setOrders(o.orders);
      }

      if (papersRes.ok) {
        const p = await papersRes.json();
        if (p.success && p.papers) setPapers(p.papers);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auth Submit
  const handleKeyAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput.trim() === ADMIN_SECRET || userProfile?.role === 'ADMIN') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Key. Please provide authorized credentials.');
    }
  };

  // --- GRANT PASS BY EMAIL ACTION ---
  const handleGrantAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidateEmail = grantEmail.trim().toLowerCase();
    if (!candidateEmail) {
      setGlobalNotice({ type: 'error', text: 'Please provide a valid candidate email.' });
      return;
    }

    setGrantSubmitting(true);
    setGlobalNotice(null);
    try {
      // 1. Directly update Firestore so candidate gets immediate access in real-time
      let targetUid = '';
      try {
        const existingInState = users.find(
          (u) => u.email && u.email.toLowerCase() === candidateEmail
        );
        targetUid = existingInState?.uid || '';

        if (!targetUid) {
          const qSnap = await getDocs(
            query(collection(db, 'users'), where('email', '==', candidateEmail))
          );
          if (!qSnap.empty) {
            targetUid = qSnap.docs[0].id;
          }
        }

        if (targetUid) {
          const userRef = doc(db, 'users', targetUid);
          await setDoc(
            userRef,
            {
              activePasses: arrayUnion(grantBranch),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } else {
          // Pre-provision user document
          const cleanUid = `user_${candidateEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          targetUid = cleanUid;
          const userRef = doc(db, 'users', cleanUid);
          await setDoc(
            userRef,
            {
              uid: cleanUid,
              email: candidateEmail,
              displayName: candidateEmail.split('@')[0],
              role: 'LEARNER',
              status: 'ACTIVE',
              activePasses: [grantBranch],
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }

        // Create an official order document in Firestore
        const orderId = `ord_admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await setDoc(doc(db, 'orders', orderId), {
          order_id: orderId,
          id: orderId,
          uid: targetUid,
          userId: targetUid,
          email: candidateEmail,
          branch_code: grantBranch,
          product_id: `${grantBranch.toLowerCase()}_pass`,
          product_title: `GATE ${grantBranch} All-Access Branch Pass (Admin Granted)`,
          amount: 500,
          currency: 'INR',
          razorpay_payment_id: `admin_manual_${Date.now()}`,
          status: 'GRANTED',
          paymentStatus: 'PAID',
          created_at: new Date().toISOString(),
        });
      } catch (fsErr) {
        console.warn('Direct Firestore grant write warning:', fsErr);
      }

      // 2. Call admin backend route to update memory and local storage cache
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: ADMIN_API_HEADERS,
        body: JSON.stringify({
          email: candidateEmail,
          uid: targetUid || undefined,
          branch: grantBranch,
          action: 'GRANT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalNotice({
          type: 'success',
          text: `Success: GATE ${grantBranch} test access granted to ${candidateEmail}!`,
        });
        setGrantEmail('');
        await fetchAllData();
      } else {
        setGlobalNotice({ type: 'error', text: data.error || 'Failed to grant access.' });
      }
    } catch (err: any) {
      setGlobalNotice({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setGrantSubmitting(false);
    }
  };

  // --- REVOKE PASS ACTION ---
  const handleRevokePass = async (email: string, branch: string) => {
    if (!confirm(`Revoke GATE ${branch} access for ${email}?`)) return;
    const cleanEmail = email.trim().toLowerCase();

    try {
      try {
        const existingInState = users.find(
          (u) => u.email && u.email.toLowerCase() === cleanEmail
        );
        let targetUid = existingInState?.uid;
        if (!targetUid) {
          const qSnap = await getDocs(
            query(collection(db, 'users'), where('email', '==', cleanEmail))
          );
          if (!qSnap.empty) targetUid = qSnap.docs[0].id;
        }

        if (targetUid) {
          const userRef = doc(db, 'users', targetUid);
          await updateDoc(userRef, {
            activePasses: arrayRemove(branch),
          });
        }
      } catch (fsErr) {
        console.warn('Direct Firestore revoke error:', fsErr);
      }

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: ADMIN_API_HEADERS,
        body: JSON.stringify({ email: cleanEmail, branch, action: 'REVOKE' }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalNotice({ type: 'success', text: `Revoked GATE ${branch} access from ${cleanEmail}.` });
        await fetchAllData();
      } else {
        alert(data.error || 'Failed to revoke.');
      }
    } catch (err) {
      alert('Network failure while revoking access.');
    }
  };

  // --- CREATE TEST PAPER ACTION ---
  const handleCreatePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPaper(true);
    try {
      const res = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: ADMIN_API_HEADERS,
        body: JSON.stringify(createPaperForm),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalNotice({ type: 'success', text: `Created test paper: "${createPaperForm.title}"` });
        setIsCreatePaperOpen(false);
        setCreatePaperForm({
          title: '',
          branch: 'CS',
          duration: 180,
          totalMarks: 100,
          category: 'FULL_LENGTH',
          institute: 'MADE EASY',
        });
        fetchAllData();
      } else {
        alert(data.error || 'Could not create paper.');
      }
    } catch (err) {
      alert('Network error while creating paper.');
    } finally {
      setCreatingPaper(false);
    }
  };

  // --- DELETE TEST PAPER ACTION ---
  const handleDeletePaper = async (paperId: string, title: string) => {
    if (!confirm(`Permanently delete paper: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/papers?paper_id=${paperId}`, {
        method: 'DELETE',
        headers: ADMIN_API_HEADERS,
      });
      const data = await res.json();
      if (data.success) {
        setGlobalNotice({ type: 'success', text: `Deleted paper "${title}".` });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to delete paper.');
      }
    } catch (err) {
      alert('Network error while deleting paper.');
    }
  };

  // --- APPEND QUESTION TO PAPER ---
  const handleAddQuestionToPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaperForQuestions) return;
    setSavingQuestion(true);
    try {
      const existingQs = activePaperForQuestions.questions || [];
      const newQuestionPayload = {
        question_id: `q_${Date.now()}_${Math.random().toString(36).substring(6)}`,
        question_number: existingQs.length + 1,
        type: newQuestionForm.type,
        section: 'Technical Core',
        marks: Number(newQuestionForm.marks),
        negative_marks: Number(newQuestionForm.negative_marks),
        question_html: newQuestionForm.question_html,
        correct_answer: newQuestionForm.correct_answer,
      };

      const updatedQuestions = [...existingQs, newQuestionPayload];

      const res = await fetch('/api/admin/papers', {
        method: 'PATCH',
        headers: ADMIN_API_HEADERS,
        body: JSON.stringify({
          paper_id: activePaperForQuestions.paper_id,
          questions: updatedQuestions,
          total_questions: updatedQuestions.length,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActivePaperForQuestions((prev: any) => ({
          ...prev,
          questions: updatedQuestions,
          total_questions: updatedQuestions.length,
        }));
        setNewQuestionForm({
          question_html: '',
          type: 'MCQ',
          marks: 1,
          negative_marks: 0.33,
          correct_answer: 'A',
        });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to add question');
      }
    } catch (err) {
      alert('Network error adding question');
    } finally {
      setSavingQuestion(false);
    }
  };

  // --- STATS COMPUTATION ---
  const stats = useMemo(() => {
    const totalUsersCount = users.length;
    const activePassHolders = users.filter((u) => u.activePasses && u.activePasses.length > 0).length;
    const totalPapersCount = papers.length;
    const totalPaidOrders = orders.filter((o) => o.status === 'GRANTED' || o.status === 'CAPTURED');
    const totalRevenue = totalPaidOrders.reduce((sum, o) => sum + (o.amount || 500), 0);

    const streamCounts: Record<string, number> = { CS: 0, EC: 0, DA: 0, EE: 0, ME: 0, CE: 0 };
    users.forEach((u) => {
      u.activePasses?.forEach((b: string) => {
        if (streamCounts[b] !== undefined) streamCounts[b]++;
      });
    });

    return {
      totalUsersCount,
      activePassHolders,
      totalPapersCount,
      totalRevenue,
      streamCounts,
    };
  }, [users, orders, papers]);

  // --- FILTERED DATA SETS ---
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !userSearchQuery ||
        (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (u.displayName && u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (u.uid && u.uid.toLowerCase().includes(userSearchQuery.toLowerCase()));

      const matchesBranch =
        branchFilter === 'ALL' ||
        (u.activePasses && u.activePasses.includes(branchFilter));

      return matchesSearch && matchesBranch;
    });
  }, [users, userSearchQuery, branchFilter]);

  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchesSearch =
        !paperSearchQuery ||
        (p.title && p.title.toLowerCase().includes(paperSearchQuery.toLowerCase())) ||
        (p.paper_id && p.paper_id.toLowerCase().includes(paperSearchQuery.toLowerCase()));

      const matchesBranch =
        paperBranchFilter === 'ALL' || p.branch === paperBranchFilter;

      const matchesInstitute =
        paperInstituteFilter === 'ALL' ||
        (p.institute && p.institute.toLowerCase() === paperInstituteFilter.toLowerCase());

      return matchesSearch && matchesBranch && matchesInstitute;
    });
  }, [papers, paperSearchQuery, paperBranchFilter, paperInstituteFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !orderSearchQuery ||
        (o.order_id && o.order_id.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
        (o.email && o.email.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
        (o.uid && o.uid.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
        (o.product_title && o.product_title.toLowerCase().includes(orderSearchQuery.toLowerCase()));

      const matchesStatus =
        orderStatusFilter === 'ALL' || o.status === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // --- AUTH GUARD VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070b14] flex items-center justify-center p-4 text-slate-800 dark:text-slate-100">
        <Card className="max-w-md w-full p-8 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#0f766e]/10 text-[#0f766e] dark:text-[#2dd4bf] rounded-2xl flex items-center justify-center mx-auto border border-[#0f766e]/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-[#14213d] dark:text-white tracking-tight">
              GATE Matrix Admin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protected Administrator Workspace. Provide master access secret or authenticate with an authorized account.
            </p>
          </div>

          <form onSubmit={handleKeyAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Master Administrator Secret
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Enter secret key..."
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0f766e]"
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="w-full font-black text-xs shadow-lg shadow-emerald-950/20"
            >
              Unlock Admin Console
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link href="/" className="text-xs text-[#0f766e] dark:text-[#2dd4bf] hover:underline font-bold">
              ← Return to GATE Matrix Home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070b14] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row overflow-x-hidden font-sans">
      {/* =========================================================
          1. COLLAPSIBLE MODERN SIDEBAR
         ========================================================= */}
      <aside
        className={`bg-white dark:bg-[#0d1322] border-r border-[#dce3ec] dark:border-slate-800/80 flex flex-col transition-all duration-300 z-30 shrink-0 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#dce3ec] dark:border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#14213d] dark:bg-[#0f766e] text-white flex items-center justify-center font-black text-base shrink-0 shadow-md">
              GM
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="text-xs font-black tracking-wider text-[#14213d] dark:text-white uppercase flex items-center gap-1.5">
                  <span>GATE MATRIX</span>
                  <span className="px-1.5 py-0.2 bg-[#0f766e]/20 text-[#0f766e] dark:text-[#2dd4bf] text-[9px] rounded font-mono">
                    ADMIN
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Platform Management</div>
              </div>
            )}
          </Link>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Modules */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {[
            { id: 'ACCESS' as AdminTab, label: 'Candidate Access', icon: Users, badge: users.length },
            { id: 'PAPERS' as AdminTab, label: 'Test Papers CMS', icon: BookOpen, badge: papers.length },
            { id: 'ORDERS' as AdminTab, label: 'Orders & Payments', icon: CreditCard, badge: orders.length },
            { id: 'OVERVIEW' as AdminTab, label: 'Analytics Overview', icon: LayoutDashboard },
            { id: 'SETTINGS' as AdminTab, label: 'System & Security', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all text-left ${
                  isActive
                    ? 'bg-[#e7f4f0] dark:bg-[#102a3a] text-[#0f766e] dark:text-[#2dd4bf] shadow-xs'
                    : 'text-[#526079] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#14213d] dark:hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0f766e] dark:text-[#2dd4bf]' : ''}`} />
                {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#0f766e]/20 text-[#0f766e] dark:text-[#2dd4bf]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#dce3ec] dark:border-slate-800/80 space-y-2">
          {!sidebarCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="text-[11px] truncate">
                <span className="font-bold text-slate-900 dark:text-white block truncate">
                  {user?.email || 'Admin Master'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-extrabold">
                  SECURE API ONLINE
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
              title="Return to Main Website"
            >
              <ExternalLink className="w-4 h-4" />
              {!sidebarCollapsed && <span>View Site</span>}
            </Link>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Lock Admin Workspace"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
          2. MAIN WORKSPACE CONTAINER
         ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-md border-b border-[#dce3ec] dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest text-[#0f766e] dark:text-[#2dd4bf] uppercase font-mono">
              GATE MATRIX / {activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Command Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              <Command className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Actions</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                Ctrl K
              </kbd>
            </button>

            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAllData}
              disabled={loading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </header>

        {/* Global Notice Toast */}
        {globalNotice && (
          <div className="p-4 mx-4 sm:mx-8 mt-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animate-fade-in border shadow-sm transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{globalNotice.text}</span>
            </div>
            <button onClick={() => setGlobalNotice(null)} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* =========================================================
              VIEW 1: CANDIDATE ACCESS STUDIO (PRIMARY FOCUS)
             ========================================================= */}
          {activeTab === 'ACCESS' && (
            <div className="space-y-8 animate-fade-in">
              {/* Hero Action: Grant Branch Access by Email */}
              <div className="bg-gradient-to-r from-[#14213d] to-[#0f766e] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Instant Entitlement Provisioning</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Grant Test Series Access to Candidate
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
                    Enter any student&apos;s registered email address and choose their branch. Entitlements link automatically even if they haven&apos;t signed in with Google yet.
                  </p>

                  <form onSubmit={handleGrantAccessSubmit} className="pt-2 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          placeholder="Candidate email address (e.g. aspirant@gmail.com)..."
                          value={grantEmail}
                          onChange={(e) => setGrantEmail(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-transparent rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-lg font-medium"
                          required
                        />
                      </div>

                      <select
                        value={grantBranch}
                        onChange={(e) => setGrantBranch(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-transparent rounded-2xl px-4 py-3 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none shadow-lg sm:w-56 cursor-pointer"
                      >
                        <option value="CS">GATE CS (Computer Science)</option>
                        <option value="EC">GATE EC (Electronics)</option>
                        <option value="DA">GATE DA (Data Science & AI)</option>
                        <option value="EE">GATE EE (Electrical)</option>
                        <option value="ME">GATE ME (Mechanical)</option>
                        <option value="CE">GATE CE (Civil)</option>
                        <option value="ALL">⭐ ALL 6 BRANCHES</option>
                      </select>

                      <Button
                        type="submit"
                        variant="emerald"
                        size="lg"
                        isLoading={grantSubmitting}
                        className="font-black text-xs sm:text-sm px-6 py-3 shadow-lg shadow-emerald-950/40 rounded-2xl bg-emerald-500 hover:bg-emerald-600"
                        leftIcon={<Check className="w-4 h-4" />}
                      >
                        {grantSubmitting ? 'Granting...' : `Unlock GATE ${grantBranch}`}
                      </Button>
                    </div>

                    {/* Quick Branch Pill Selector */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                      <span className="text-white/80 font-bold text-[11px]">Quick Branch:</span>
                      {ALL_BRANCH_CODES.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setGrantBranch(b)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                            grantBranch === b
                              ? 'bg-white text-[#14213d] shadow-sm'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setGrantBranch('ALL')}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                          grantBranch === 'ALL'
                            ? 'bg-amber-300 text-slate-900 shadow-sm'
                            : 'bg-white/10 hover:bg-white/20 text-amber-200'
                        }`}
                      >
                        ⭐ ALL
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Candidate Roster Table */}
              <Card className="p-6 bg-white dark:bg-[#0d1322] border-[#dce3ec] dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#0f766e] dark:text-[#2dd4bf]" />
                      <span>Candidate Entitlements Directory</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-mono">
                        {filteredUsers.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      View all registered learners, active branch passes, and modify entitlements.
                    </p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search candidate email or name..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0f766e]"
                      />
                    </div>

                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">All Branches</option>
                      {ALL_BRANCH_CODES.map((b) => (
                        <option key={b} value={b}>
                          GATE {b} Only
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    No candidates found matching query &apos;{userSearchQuery}&apos;.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Candidate Email & Info</th>
                          <th className="p-3.5">Active Passes</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Joined Date</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredUsers.map((u) => (
                          <tr
                            key={u.uid}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#14213d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {u.displayName ? u.displayName[0] : (u.email ? u.email[0].toUpperCase() : 'U')}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{u.displayName || 'Candidate'}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                    <span>{u.email || u.uid}</span>
                                    {u.email && (
                                      <button
                                        onClick={() => handleCopyText(u.email, u.uid)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition"
                                        title="Copy Email"
                                      >
                                        {copiedId === u.uid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              {u.activePasses && u.activePasses.length > 0 ? (
                                <div className="flex gap-1.5 flex-wrap">
                                  {u.activePasses.map((b: string) => {
                                    const meta = BRANCH_META[b];
                                    return (
                                      <span
                                        key={b}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] font-extrabold border ${
                                          meta?.darkBadge || 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                                        }`}
                                      >
                                        GATE {b}
                                        <button
                                          type="button"
                                          onClick={() => handleRevokePass(u.email || u.uid, b)}
                                          className="text-rose-400 hover:text-rose-300 ml-0.5 hover:scale-125 transition"
                                          title={`Revoke ${b} access`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-mono">No Active Pass</span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <Badge variant={u.role === 'ADMIN' ? 'rose' : u.role === 'EDITOR' ? 'purple' : 'cyan'}>
                                {u.role || 'LEARNER'}
                              </Badge>
                            </td>

                            <td className="p-3.5 text-slate-500 text-[11px] font-mono">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setGrantEmail(u.email || '');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 bg-[#0f766e]/10 text-[#0f766e] dark:text-[#2dd4bf] hover:bg-[#0f766e] hover:text-white rounded-lg font-extrabold text-[11px] transition"
                              >
                                + Grant Pass
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* =========================================================
              VIEW 2: TEST PAPERS & QUESTION CMS
             ========================================================= */}
          {activeTab === 'PAPERS' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Test Paper & Question Studio
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create mock tests, author CBT question banks, and review live KaTeX mathematical formulations.
                  </p>
                </div>

                <Button
                  variant="emerald"
                  size="md"
                  onClick={() => setIsCreatePaperOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="font-bold shadow-md shadow-emerald-950/20"
                >
                  Create New Test Paper
                </Button>
              </div>

              {/* Papers Grid */}
              <Card className="p-6 bg-white dark:bg-[#0d1322] border-[#dce3ec] dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Branch Filter:
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {['ALL', ...ALL_BRANCH_CODES].map((b) => (
                          <button
                            key={b}
                            onClick={() => setPaperBranchFilter(b)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                              paperBranchFilter === b
                                ? 'bg-[#0f766e] text-white border-[#0f766e]'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {b === 'ALL' ? 'All' : `GATE ${b}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Institute:
                      </span>
                      <select
                        value={paperInstituteFilter}
                        onChange={(e) => setPaperInstituteFilter(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="ALL">All Institutes</option>
                        {COACHING_INSTITUTES.map((inst) => (
                          <option key={inst} value={inst}>
                            {inst}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search paper title..."
                      value={paperSearchQuery}
                      onChange={(e) => setPaperSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {filteredPapers.map((p) => (
                    <div
                      key={p.paper_id}
                      className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-[#0f766e] transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold border ${
                                BRANCH_META[p.branch]?.darkBadge || 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              GATE {p.branch}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-[#14213d] text-white">
                              {p.institute || 'Coaching Test'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {p.duration_minutes || 180} mins
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2">
                          {p.title}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>{p.total_questions || p.questions?.length || 0} Questions</span>
                          <span>•</span>
                          <span>{p.total_marks || 100} Marks</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActivePaperForQuestions(p)}
                          leftIcon={<Edit className="w-3.5 h-3.5 text-[#0f766e]" />}
                          className="text-xs font-bold"
                        >
                          Questions Bank ({p.questions?.length || 0})
                        </Button>

                        <button
                          onClick={() => handleDeletePaper(p.paper_id, p.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================
              VIEW 3: ORDERS & FINANCIAL LEDGER
             ========================================================= */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Financial Transactions & Order Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit trail of all candidate test series purchases and Telegram order reconciliations.
                </p>
              </div>

              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Gross Volume
                  </span>
                  <div className="text-2xl font-black text-emerald-500 font-mono">
                    ₹{stats.totalRevenue.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400">Total fulfilled orders</span>
                </Card>

                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Orders Fulfilled
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {orders.filter((o) => o.status === 'GRANTED' || o.status === 'CAPTURED').length}
                  </div>
                  <span className="text-[11px] text-slate-400">Paid branch access passes</span>
                </Card>

                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Top Demand Stream
                  </span>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    GATE CS
                  </div>
                  <span className="text-[11px] text-slate-400">Computer Science leading</span>
                </Card>
              </div>

              {/* Orders Data Table */}
              <Card className="p-6 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search order ID or email..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="GRANTED">Granted / Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Order Ref</th>
                        <th className="p-3">Candidate / Email</th>
                        <th className="p-3">Package / Product</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.order_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-[#0f766e] dark:text-[#2dd4bf]">
                            {ord.order_id}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {ord.email || ord.uid}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                            {ord.product_title}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">
                            ₹{ord.amount || 500}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                ord.status === 'GRANTED' || ord.status === 'CAPTURED'
                                  ? 'emerald'
                                  : ord.status === 'REFUNDED'
                                  ? 'rose'
                                  : 'amber'
                              }
                            >
                              {ord.status || 'GRANTED'}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================
              VIEW 4: ANALYTICS OVERVIEW
             ========================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Executive Operations Overview
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Key platform metrics, active candidate distribution, and branch performance indicators.
                </p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Learners</span>
                    <Users className="w-5 h-5 text-[#0f766e]" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                    {stats.totalUsersCount}
                  </div>
                  <span className="text-[11px] text-emerald-500 font-bold mt-1 block">Registered accounts</span>
                </Card>

                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Holders</span>
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                    {stats.activePassHolders}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Active 365-day access</span>
                </Card>

                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mock Papers</span>
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
                    {stats.totalPapersCount}
                  </div>
                  <span className="text-[11px] text-purple-400 font-bold mt-1 block">Available in question bank</span>
                </Card>

                <Card className="p-5 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Volume</span>
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-500 mt-2 font-mono">
                    ₹{stats.totalRevenue.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Fulfilled transactions</span>
                </Card>
              </div>

              {/* Branch Pass Distribution Card */}
              <Card className="p-6 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0f766e]" />
                  <span>Branch Access Distribution</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                  {ALL_BRANCH_CODES.map((b) => {
                    const count = stats.streamCounts[b] || 0;
                    const meta = BRANCH_META[b];
                    return (
                      <div
                        key={b}
                        className={`p-4 rounded-2xl border ${meta?.accentBorder || 'border-slate-700'} bg-slate-50 dark:bg-slate-800/40 space-y-1 text-center`}
                      >
                        <span className="text-xs font-mono font-black text-slate-400 uppercase block">
                          GATE {b}
                        </span>
                        <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                          {count}
                        </div>
                        <span className="text-[10px] text-slate-400 block">Passes Active</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================
              VIEW 5: SYSTEM SETTINGS & SECURITY
             ========================================================= */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  System Settings & Authorization Guard
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify environment configurations, encryption parameters, and administrator access levels.
                </p>
              </div>

              <Card className="p-6 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Security & Access Verification</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Active Authentication Method:</span>
                    <Badge variant="emerald">MASTER SECRET KEY GUARD (ACTIVE)</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Administrator Session:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">{user?.email || 'Master Secret Mode'}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="font-bold text-slate-700 dark:text-slate-300">REST API Authorization Header:</span>
                    <span className="font-mono text-emerald-500 font-bold">x-admin-secret: [VALIDATED]</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Telegram Purchase Link:</span>
                    <a
                      href="https://t.me/+917746877268"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#229ED9] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>https://t.me/+917746877268 (+91 77468 77268)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          MODAL 1: CREATE TEST PAPER
         ========================================================= */}
      {isCreatePaperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#0f766e]" />
                <span>Create New Test Paper</span>
              </h3>
              <button onClick={() => setIsCreatePaperOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaperSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Paper Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. GATE CS 2026 Full-Length Grand Mock 01"
                  value={createPaperForm.title}
                  onChange={(e) => setCreatePaperForm({ ...createPaperForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institute / Coaching Class <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createPaperForm.institute}
                  onChange={(e) => setCreatePaperForm({ ...createPaperForm, institute: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                >
                  {COACHING_INSTITUTES.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Branch</label>
                  <select
                    value={createPaperForm.branch}
                    onChange={(e) => setCreatePaperForm({ ...createPaperForm, branch: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  >
                    {ALL_BRANCH_CODES.map((b) => (
                      <option key={b} value={b}>
                        GATE {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category Format</label>
                  <select
                    value={createPaperForm.category}
                    onChange={(e) => setCreatePaperForm({ ...createPaperForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="FULL_LENGTH">Full-Length Mock</option>
                    <option value="TOPIC_WISE">Topic-Wise Test</option>
                    <option value="PYQ">Previous Year Paper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={createPaperForm.duration}
                    onChange={(e) => setCreatePaperForm({ ...createPaperForm, duration: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={createPaperForm.totalMarks}
                    onChange={(e) => setCreatePaperForm({ ...createPaperForm, totalMarks: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreatePaperOpen(false)}>
                  Cancel
                </Button>
                <Button variant="emerald" size="sm" type="submit" isLoading={creatingPaper} className="font-bold">
                  Create Paper Record
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* =========================================================
          MODAL 2: QUESTION BANK BUILDER WITH KATEX MATH PREVIEW
         ========================================================= */}
      {activePaperForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#0d1322] z-10">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0f766e]/20 text-[#0f766e] dark:text-[#2dd4bf] font-extrabold uppercase">
                  GATE {activePaperForQuestions.branch}
                </span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white mt-1">
                  Question Bank: {activePaperForQuestions.title}
                </h3>
              </div>

              <button onClick={() => setActivePaperForQuestions(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Append Question Form */}
            <form onSubmit={handleAddQuestionToPaper} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs font-black text-slate-900 dark:text-white block uppercase tracking-wider">
                + Append Question to Paper
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Question HTML / KaTeX Text (Supports $...$ or $$...$$ formulas)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Find the determinant of matrix $A$ where $A = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$..."
                  value={newQuestionForm.question_html}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_html: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                  required
                />
              </div>

              {/* Real-time Math Preview */}
              {newQuestionForm.question_html && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    KaTeX Math Live Preview:
                  </span>
                  <MathRenderer content={newQuestionForm.question_html} className="text-xs text-slate-800 dark:text-slate-100" />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={newQuestionForm.type}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, type: e.target.value as any })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold"
                  >
                    <option value="MCQ">MCQ (Single Choice)</option>
                    <option value="MSQ">MSQ (Multiple Select)</option>
                    <option value="NAT">NAT (Numerical)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newQuestionForm.marks}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, marks: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newQuestionForm.negative_marks}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, negative_marks: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correct Answer</label>
                  <input
                    type="text"
                    placeholder="e.g. A or 42"
                    value={newQuestionForm.correct_answer}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correct_answer: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="emerald"
                  size="sm"
                  isLoading={savingQuestion}
                  className="font-bold text-xs"
                >
                  + Add Question to Bank
                </Button>
              </div>
            </form>

            {/* Existing Questions List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Existing Questions ({activePaperForQuestions.questions?.length || 0})
              </h4>

              {(!activePaperForQuestions.questions || activePaperForQuestions.questions.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  No questions in this paper yet. Use the form above to add questions.
                </div>
              ) : (
                <div className="space-y-2">
                  {activePaperForQuestions.questions.map((q: any, idx: number) => (
                    <div
                      key={q.question_id || idx}
                      className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#0f766e] dark:text-[#2dd4bf]">
                          Question #{idx + 1} ({q.type}) • +{q.marks} / -{q.negative_marks}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          Ans: {q.correct_answer || 'N/A'}
                        </span>
                      </div>
                      <MathRenderer content={q.question_html || 'No content'} className="text-slate-800 dark:text-slate-200" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================
          MODAL 3: QUICK COMMAND PALETTE (CTRL + K)
         ========================================================= */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <Card className="max-w-lg w-full bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-0">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Command className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to module..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <button onClick={() => setCommandPaletteOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 space-y-1 max-h-64 overflow-y-auto text-xs">
              {[
                { label: 'Grant Candidate Access by Email', tab: 'ACCESS' as AdminTab, icon: Users },
                { label: 'Create New Mock Test Paper', action: () => setIsCreatePaperOpen(true), icon: BookOpen },
                { label: 'View Financial Ledger & Orders', tab: 'ORDERS' as AdminTab, icon: CreditCard },
                { label: 'Executive Operations Overview', tab: 'OVERVIEW' as AdminTab, icon: LayoutDashboard },
                { label: 'Security & Secret Configurations', tab: 'SETTINGS' as AdminTab, icon: Settings },
                { label: 'Toggle Light / Dark Mode', action: toggleTheme, icon: Sun },
              ].map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (cmd.tab) setActiveTab(cmd.tab);
                      if (cmd.action) cmd.action();
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-left hover:bg-[#e7f4f0] dark:hover:bg-[#102a3a] text-slate-700 dark:text-slate-200 hover:text-[#0f766e] dark:hover:text-[#2dd4bf] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span className="font-bold">{cmd.label}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
