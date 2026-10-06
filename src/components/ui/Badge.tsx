'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'navy' | 'amber' | 'rose' | 'slate' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    emerald: 'bg-[#e7f4f0] text-[#0f766e] border border-[#0f766e]/20',
    navy: 'bg-[#14213d] text-white',
    amber: 'bg-amber-100 text-amber-900 border border-amber-300',
    rose: 'bg-rose-100 text-rose-800 border border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
    cyan: 'bg-sky-100 text-sky-800 border border-sky-200',
  };

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-lg tracking-wide ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
