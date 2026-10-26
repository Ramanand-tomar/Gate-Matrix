'use client';

import React from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';
import { cleanOptionContent } from '@/lib/sanitizer';

interface QuestionPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperTitle: string;
  questions: Array<{
    qnum: number;
    qtype: string;
    marksPos: number;
    marksNeg: string;
    bodyHtml: string;
    options?: string[];
  }>;
}

export const QuestionPaperModal: React.FC<QuestionPaperModalProps> = ({
  isOpen,
  onClose,
  paperTitle,
  questions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] text-[#14213d] dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#38bdf8]" />
            <div>
              <h2 className="text-base font-black leading-tight">{paperTitle}</h2>
              <span className="text-xs text-slate-300">Complete Question Paper View ({questions.length} Questions)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Question Paper"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Questions Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
          {questions.map((q, idx) => (
            <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-extrabold text-[#0f766e] dark:text-[#2dd4bf] text-sm">
                  Q.{idx + 1} [{q.qtype}]
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Marks: +{q.marksPos} | Penalty: {q.marksNeg}
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm text-slate-800 dark:text-slate-200 mb-4 leading-relaxed font-normal">
                <MathRenderer content={q.bodyHtml} stripSolutions={true} />
              </div>

              {/* Options if MCQ / MSQ */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start gap-2"
                    >
                      <span className="font-bold text-[#0f766e] dark:text-[#2dd4bf] shrink-0">
                        ({String.fromCharCode(65 + optIdx)})
                      </span>
                      <div className="text-slate-700 dark:text-slate-300">
                        <MathRenderer content={cleanOptionContent(opt)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            Close View & Return to Test
          </button>
        </div>
      </div>
    </div>
  );
};
