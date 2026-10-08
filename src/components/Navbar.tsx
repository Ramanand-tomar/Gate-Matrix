'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  FolderCheck,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  CreditCard,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, signInWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home', icon: GraduationCap },
    { href: '/catalog', label: 'Test Series', icon: BookOpen },
    { href: '/practice', label: 'Practice', icon: Sparkles },
    { href: '/performance', label: 'Performance', icon: TrendingUp },
    { href: '/library', label: 'My Library', icon: FolderCheck },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#dce3ec] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* LEFT: Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <img
                src="/logo-icon.png"
                alt="GATE Matrix Logo"
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
              />
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg text-[#14213d] dark:text-white tracking-tight">
                    GATE <span className="text-[#0f766e] dark:text-[#2dd4bf]">Matrix</span>
                  </span>
                </div>
                <span className="text-[10px] text-[#526079] dark:text-slate-400 font-semibold tracking-wide hidden sm:block">
                  GATE Test Series & Performance Analytics
                </span>
              </div>
            </Link>

            {/* CENTER: Primary Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-[#e7f4f0] text-[#0f766e] shadow-2xs'
                        : 'text-[#526079] hover:bg-slate-100 hover:text-[#14213d]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#0f766e]' : 'text-[#526079]'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT: Search, Notifications, User Menu */}
          <div className="flex items-center gap-3">
            {/* Quick Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-xl text-[#526079] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#14213d] dark:hover:text-white transition-colors focus:outline-none"
              title="Search Test Series"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark / Light Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#526079] dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#526079]" />}
            </button>

            {/* Notification Bell */}
            <div className="relative hidden sm:block">
              <button
                className="p-2 rounded-xl text-[#526079] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0f766e] ring-2 ring-white dark:ring-slate-900"></span>
              </button>
            </div>

            {/* User Auth Section */}
            {loading ? (
              <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-xl"></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-[#dce3ec] hover:border-slate-300 bg-slate-50/80 hover:bg-white transition-all focus:outline-none"
                >
                  {user.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#14213d] text-white flex items-center justify-center font-bold text-xs">
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                  )}
                  <span className="hidden lg:block text-xs font-bold text-[#14213d] max-w-[100px] truncate text-left">
                    {user.displayName || 'Learner'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#526079]" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#dce3ec] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-black text-[#14213d] truncate">
                        {user.displayName || 'GATE Aspirant'}
                      </p>
                      <p className="text-[11px] text-[#526079] truncate">{user.email}</p>
                      {userProfile?.role && userProfile.role !== 'LEARNER' && (
                        <span className="inline-flex items-center gap-1 mt-1 bg-[#14213d] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                          <ShieldCheck className="w-3 h-3 text-[#8be0ce]" />
                          {userProfile.role}
                        </span>
                      )}
                    </div>

                    <div className="py-1 text-xs font-bold">
                      <Link
                        href="/library"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#14213d] hover:bg-slate-50 transition-colors"
                      >
                        <FolderCheck className="w-4 h-4 text-[#0f766e]" />
                        <span>My Library</span>
                      </Link>
                      <Link
                        href="/dashboard?tab=PAYMENTS"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#14213d] hover:bg-slate-50 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-[#0f766e]" />
                        <span>Payments & Invoices</span>
                      </Link>
                      <Link
                        href="/dashboard?tab=SETTINGS"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[#14213d] hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#0f766e]" />
                        <span>Profile & Settings</span>
                      </Link>
                      {(userProfile?.role === 'ADMIN' || userProfile?.role === 'EDITOR') && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[#14213d] hover:bg-slate-50 transition-colors border-t border-slate-100"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/catalog"
                  className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-xs font-extrabold text-[#0f766e] bg-[#e7f4f0] hover:bg-[#0f766e] hover:text-white rounded-xl transition-all"
                >
                  Explore Tests
                </Link>
                <button
                  onClick={signInWithGoogle}
                  className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#14213d] dark:text-white border border-[#dce3ec] dark:border-slate-700 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-xs active:scale-95"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#526079] hover:bg-slate-100 hover:text-[#14213d] transition-colors focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Quick Search Bar Dropdown */}
        {searchOpen && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 animate-fadeIn">
            <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search test series, branches (e.g. CS, DA, DBMS, Mock #08)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#dce3ec] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#0f766e] text-[#14213d]"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#14213d]/60 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-slideInRight">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0f766e] text-white flex items-center justify-center font-bold">
                    G
                  </div>
                  <span className="font-black text-base text-[#14213d]">GATE Matrix</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {navLinks.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all ${
                        isActive
                          ? 'bg-[#e7f4f0] text-[#0f766e]'
                          : 'text-[#526079] hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {userProfile?.role && userProfile.role !== 'LEARNER' && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold text-[#14213d] bg-slate-100"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
                    <span>Admin Management Console</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Footer Auth */}
            <div className="border-t border-slate-100 pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 rounded-full bg-[#14213d] text-white flex items-center justify-center font-bold text-sm">
                      {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#14213d]">{user.displayName || 'Learner'}</div>
                      <div className="text-[10px] text-[#526079]">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full bg-rose-50 text-rose-700 font-extrabold text-xs py-2.5 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="w-full bg-white dark:bg-slate-800 text-[#14213d] dark:text-white border border-[#dce3ec] dark:border-slate-700 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2.5 shadow-sm active:scale-95"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
