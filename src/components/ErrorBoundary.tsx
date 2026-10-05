'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[350px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please try reloading the view.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-[#14213d] hover:bg-[#1d2d50] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Reload Component
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
