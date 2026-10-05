'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, userProfile, loading, signInWithGoogle, logout } = useAuth();

  return (
    <header className="bg-white border-b border-[#dce3ec] px-4 md:px-8 py-3.5 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-extrabold flex items-center gap-2.5 text-[#14213d] hover:opacity-90 transition-opacity">
          <span className="bg-gradient-to-br from-[#0f766e] to-[#115e59] text-white rounded-xl w-10 h-10 flex items-center justify-center font-extrabold text-xl shadow-md">
            G
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-black text-lg text-[#14213d] tracking-tight">GATEPrep <span className="text-[#0f766e] font-bold">Studio</span></span>
            <span className="text-[10px] text-[#526079] font-medium tracking-wider uppercase">Exam Analytics & Test Series</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex gap-1 items-center">
          <Link
            href="/"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname === '/' ? 'bg-[#e7f4f0] text-[#0f766e]' : 'text-[#526079] hover:bg-gray-100 hover:text-[#14213d]'
            }`}
          >
            Home
          </Link>
          <Link
            href="/catalog"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname === '/catalog' ? 'bg-[#e7f4f0] text-[#0f766e]' : 'text-[#526079] hover:bg-gray-100 hover:text-[#14213d]'
            }`}
          >
            Test Series & Passes
          </Link>
          <Link
            href="/dashboard"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname === '/dashboard' ? 'bg-[#e7f4f0] text-[#0f766e]' : 'text-[#526079] hover:bg-gray-100 hover:text-[#14213d]'
            }`}
          >
            My Workspace
          </Link>
          <Link
            href="/exam"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              pathname === '/exam' ? 'bg-[#e7f4f0] text-[#0f766e]' : 'text-[#526079] hover:bg-gray-100 hover:text-[#14213d]'
            }`}
          >
            Test Engine
          </Link>
          {(userProfile?.role === 'ADMIN' || userProfile?.role === 'EDITOR') && (
            <Link
              href="/admin"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === '/admin' ? 'bg-[#14213d] text-white' : 'text-[#14213d] hover:bg-gray-100'
              }`}
            >
              Console
            </Link>
          )}
        </nav>
      </div>

      {/* Auth State & User Menu */}
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-xl"></div>
        ) : user ? (
          <div className="flex items-center gap-3 bg-gray-50 border border-[#dce3ec] p-1.5 rounded-2xl pr-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-gray-300" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#14213d] text-white flex items-center justify-center font-bold text-xs">
                {user.displayName ? user.displayName[0] : 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#14213d] max-w-[120px] truncate">
                {user.displayName || 'Learner'}
              </div>
              <div className="text-[10px] text-[#526079] max-w-[120px] truncate">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors ml-1"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="bg-[#14213d] hover:bg-[#1d2d50] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
