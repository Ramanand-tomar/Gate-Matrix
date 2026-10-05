'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newToast: ToastMessage = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-2xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-emerald-900 border-emerald-700 text-white'
                : toast.type === 'error'
                ? 'bg-rose-900 border-rose-700 text-white'
                : toast.type === 'warning'
                ? 'bg-amber-900 border-amber-700 text-white'
                : 'bg-[#14213d] border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-base font-bold">
                {toast.type === 'success'
                  ? '✓'
                  : toast.type === 'error'
                  ? '✕'
                  : toast.type === 'warning'
                  ? '⚠️'
                  : 'ℹ️'}
              </span>
              <div>
                <h4 className="text-xs font-bold leading-snug">{toast.title}</h4>
                {toast.message && <p className="text-[11px] opacity-80 mt-0.5 leading-normal">{toast.message}</p>}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white text-xs font-bold ml-3"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
