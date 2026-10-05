'use client';

import React from 'react';
import { sanitizeHtml } from '@/lib/sanitizer';

interface MathRendererProps {
  content: string;
  className?: string;
  stripSolutions?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  stripSolutions = false,
}) => {
  const cleanHtml = sanitizeHtml(content, { stripSolutions, renderMath: true });

  return (
    <div
      className={`prose max-w-none math-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};
