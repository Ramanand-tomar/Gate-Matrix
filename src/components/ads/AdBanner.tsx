'use client';

import React, { useEffect, useRef } from 'react';

export interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical' | 'in-feed';
  responsive?: boolean;
  className?: string;
  label?: string;
}

export default function AdBanner({
  slot = '1234567890',
  format = 'auto',
  responsive = true,
  className = '',
  label = 'Sponsored / Advertisement',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6695476160016882';
  const isPlaceholder = !adsenseClientId || adsenseClientId.includes('XXXX');

  useEffect(() => {
    if (typeof window === 'undefined' || isPlaceholder) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      // Gracefully ignore duplicate push errors in SPA navigation
    }
  }, [isPlaceholder]);

  // In-Feed Native Card format for test catalogs and practice grids
  if (format === 'in-feed') {
    return (
      <div
        className={`flex flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0d1527] dark:to-[#090d16] border border-dashed border-emerald-500/30 p-6 min-h-[240px] text-center relative overflow-hidden transition-all hover:border-emerald-500/50 ${className}`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
            Ad
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Free Access Sponsor</span>
        </div>

        {isPlaceholder ? (
          <div className="flex-1 flex flex-col items-center justify-center my-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm">
              Ad
            </div>
            <p className="text-xs font-bold text-[#14213d] dark:text-slate-200">
              Supporting Free GATE Education
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Google AdSense sponsor unit funding 100% free test papers for all aspirants.
            </p>
          </div>
        ) : (
          <ins
            ref={adRef}
            className="adsbygoogle block w-full my-auto"
            style={{ display: 'block' }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slot}
            data-ad-format="fluid"
            data-ad-layout-key="-fb+5w+4e-db+86"
          />
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>AdSense Partner</span>
          <span className="font-mono text-[10px] text-slate-400">GATE Matrix</span>
        </div>
      </div>
    );
  }

  // Standard Horizontal / Responsive Banner
  return (
    <div
      className={`my-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 p-3 text-center shadow-xs transition-all ${className}`}
    >
      <div className="w-full flex items-center justify-between px-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-600">Google Ads</span>
      </div>

      {isPlaceholder ? (
        <div className="w-full flex flex-col items-center justify-center py-5 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Google AdSense Banner ({format})
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Placeholder active. Live ads will render when <code className="font-mono text-emerald-600 dark:text-emerald-400">NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> is set.
          </p>
        </div>
      ) : (
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          style={{ display: 'block' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}
