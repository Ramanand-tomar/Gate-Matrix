'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ExternalLink, Info } from 'lucide-react';

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
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6695476160016882';
  const isPlaceholder = !adsenseClientId || adsenseClientId.includes('XXXX');

  // Detect localhost/development environment on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isLocal =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.endsWith('.local');
      setIsLocalhost(isLocal);
    }
  }, []);

  // Request AdSense Ad only on public live domains (not localhost)
  useEffect(() => {
    if (typeof window === 'undefined' || isPlaceholder || isLocalhost) return;

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      // Gracefully ignore duplicate push errors in SPA navigation
    }

    // Monitor if AdSense marks this ad slot as unfilled
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-ad-status'
        ) {
          const status = adRef.current?.getAttribute('data-ad-status');
          if (status === 'unfilled') {
            setIsUnfilled(true);
          }
        }
      });
    });

    if (adRef.current) {
      observer.observe(adRef.current, { attributes: true });
    }

    return () => observer.disconnect();
  }, [isPlaceholder, isLocalhost]);

  // 1. In-Feed Native Card format (Test catalogs and practice grids)
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

        {isLocalhost || isPlaceholder || isUnfilled ? (
          <div className="flex-1 flex flex-col items-center justify-center my-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-[#14213d] dark:text-slate-200">
              Supporting 100% Free GATE Preparation
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Google AdSense sponsor spot funding all GATE tests and analytics freely for students.
            </p>
            {isLocalhost && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 font-mono">
                AdSense Preview (Localhost)
              </span>
            )}
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

  // 2. Standard Horizontal / Responsive Banner
  return (
    <div
      className={`my-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 p-3.5 text-center shadow-xs transition-all ${className}`}
    >
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1">
          Google AdSense
        </span>
      </div>

      {isLocalhost ? (
        /* Localhost / Development Preview Mode */
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-5 border border-dashed border-emerald-500/40 rounded-xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Google AdSense Slot Ready ({format})
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                Client: <strong className="font-mono text-slate-700 dark:text-slate-300">{adsenseClientId}</strong> · Slot: <strong className="font-mono text-slate-700 dark:text-slate-300">{slot}</strong>
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right shrink-0 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold block">✓ Localhost Simulation</span>
            <span>Live ads serve on deployed domain</span>
          </div>
        </div>
      ) : isPlaceholder ? (
        /* Placeholder Mode when no client ID */
        <div className="w-full flex flex-col items-center justify-center py-5 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Google AdSense Banner ({format})
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Placeholder active. Live ads will render when <code className="font-mono text-emerald-600 dark:text-emerald-400">NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> is configured.
          </p>
        </div>
      ) : isUnfilled ? (
        /* Fallback when AdSense returns unfilled (awaiting domain review) */
        <div className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30">
          <span>Sponsored Educational Space · Free GATE 2027 Test Series for All Aspirants</span>
        </div>
      ) : (
        /* Live Google AdSense Tag */
        <ins
          ref={adRef}
          className="adsbygoogle block w-full min-h-[90px] bg-transparent"
          style={{ display: 'block', minHeight: '90px' }}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}
