'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function AdminNotFoundPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center py-12 px-6">
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
    </div>
  );
}
