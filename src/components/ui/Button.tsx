'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-extrabold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm';

    const sizeStyles = {
      sm: 'px-3.5 py-1.5 text-xs gap-1.5 min-h-[32px]',
      md: 'px-4 py-2.5 text-xs gap-2 min-h-[40px]',
      lg: 'px-6 py-3.5 text-sm gap-2.5 min-h-[48px]',
    };

    const variantStyles = {
      primary:
        'bg-[#14213d] dark:bg-[#1e293b] hover:bg-[#1d2d50] dark:hover:bg-[#334155] text-white dark:text-slate-100 border border-transparent dark:border-slate-700 shadow-md',
      secondary:
        'bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-[#334155] text-[#14213d] dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:ring-slate-300',
      emerald:
        'bg-[#0f766e] dark:bg-[#0d9488] hover:bg-[#115e59] dark:hover:bg-[#0f766e] text-white focus:ring-[#0f766e] border border-transparent shadow-md',
      outline:
        'bg-transparent hover:bg-[#e7f4f0] dark:hover:bg-slate-800 text-[#0f766e] dark:text-[#2dd4bf] border border-[#0f766e] dark:border-[#2dd4bf] focus:ring-[#0f766e]',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-slate-300 shadow-none',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 border border-transparent shadow-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
