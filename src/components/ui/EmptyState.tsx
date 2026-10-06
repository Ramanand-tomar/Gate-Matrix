'use client';

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#dce3ec] rounded-2xl p-10 text-center max-w-lg mx-auto ${className}`}>
      {icon && <div className="flex justify-center text-4xl mb-4 text-[#0f766e]">{icon}</div>}
      <h3 className="text-lg font-extrabold text-[#14213d] mb-2">{title}</h3>
      <p className="text-xs text-[#526079] leading-relaxed mb-6 max-w-sm mx-auto">{description}</p>
      {actionLabel && (
        <div>
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="emerald">{actionLabel}</Button>
            </a>
          ) : (
            <Button variant="emerald" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export interface ProgressBarProps {
  progress: number;
  height?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'navy' | 'amber' | 'rose';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 'md',
  color = 'emerald',
  showLabel = false,
  label,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    emerald: 'bg-[#0f766e]',
    navy: 'bg-[#14213d]',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
          <span className="text-[#14213d]">{label || 'Progress'}</span>
          <span className="text-[#0f766e] font-extrabold">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 ${heightStyles[height]}`}>
        <div
          className={`${colorStyles[color]} ${heightStyles[height]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
