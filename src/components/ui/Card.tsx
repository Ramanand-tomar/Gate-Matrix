'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  padding = 'md',
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white border border-[#dce3ec] rounded-2xl shadow-sm ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'white' | 'dark' | 'emerald';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  variant = 'white',
  className = '',
}) => {
  if (variant === 'dark') {
    return (
      <div className={`bg-[#14213d] text-white border border-white/10 rounded-2xl p-5 shadow-sm ${className}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    );
  }

  if (variant === 'emerald') {
    return (
      <div className={`bg-[#0f766e] text-white rounded-2xl p-5 shadow-sm ${className}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{label}</span>
          {icon && <div className="text-emerald-100">{icon}</div>}
        </div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        {subtext && <p className="text-xs text-emerald-100 mt-1">{subtext}</p>}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#dce3ec] rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-[#526079] uppercase tracking-wider">{label}</span>
        {icon && <div className="text-[#0f766e]">{icon}</div>}
      </div>
      <div className="text-3xl font-black text-[#14213d] tracking-tight">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span
            className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {trend.value}
          </span>
        )}
        {subtext && <span className="text-xs text-[#526079] font-medium">{subtext}</span>}
      </div>
    </div>
  );
};
