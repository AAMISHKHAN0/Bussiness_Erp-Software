'use client';

import React from 'react';

export default function NexisLogo({ size = 'md', showText = true, textLight = false, className = '' }) {
  const sizeMap = {
    sm: { box: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]', svg: 28 },
    md: { box: 'w-9 h-9', text: 'text-base', sub: 'text-[10px]', svg: 36 },
    lg: { box: 'w-12 h-12', text: 'text-xl', sub: 'text-xs', svg: 48 },
    xl: { box: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs', svg: 56 },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Precision Lettermark Icon (Pure SVG Letters NX - No raster images) */}
      <div className={`relative ${current.box} flex-shrink-0 flex items-center justify-center rounded-xl shadow-md transition-transform hover:scale-105 duration-200`}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="rounded-xl overflow-hidden"
        >
          {/* Subtle Outer Glow & Gradient Background */}
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="accentCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#64748b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background Plate */}
          <rect width="48" height="48" rx="12" fill="url(#bgGrad)" />
          <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" stroke="url(#borderGrad)" strokeWidth="1.5" fill="none" />

          {/* Precision Monogram Letters "N" and "X" */}
          {/* Letter "N" on Left */}
          <path 
            d="M11 35V13H15.5L23.5 27.5V13H27.5V35H23L15 20.5V35H11Z" 
            fill="url(#blueGlow)" 
          />

          {/* Overlapping Precision Letter "X" on Right */}
          <path 
            d="M26 13L32 23L26 35H30.5L34 27.5L37.5 35H42L36 23L41.5 13H37.2L34 19L30.5 13H26Z" 
            fill="#ffffff" 
          />

          {/* Subtle Accent Geometric Node */}
          <circle cx="34" cy="23.5" r="2" fill="url(#accentCyan)" />
        </svg>
      </div>

      {/* Brand Wordmark Typography */}
      {showText && (
        <div className="leading-none overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${current.text} ${textLight ? 'text-white' : 'text-slate-900'}`}>
              NEXIS
            </span>
            <span className="font-extrabold text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
              ERP
            </span>
          </div>
          <span className={`font-semibold tracking-wider uppercase block mt-1 ${current.sub} ${textLight ? 'text-blue-200' : 'text-slate-500'}`}>
            Enterprise Operating Cloud
          </span>
        </div>
      )}
    </div>
  );
}
