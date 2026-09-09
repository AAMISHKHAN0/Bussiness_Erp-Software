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
      {/* Precision Lettermark Icon (Pure SVG Letters NX - 100% Solid Colors, Zero Gradients) */}
      <div className={`relative ${current.box} flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 shadow-xs transition-transform hover:scale-105 duration-200`}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="rounded-xl overflow-hidden p-1.5"
        >
          {/* Precision Monogram Letters "N" and "X" in Pure Solid Colors */}
          {/* Letter "N" on Left in Solid Royal Blue */}
          <path 
            d="M9 37V11H14.5L24 28.5V11H29V37H23.5L14 19.5V37H9Z" 
            fill="#2563EB" 
          />

          {/* Overlapping Precision Letter "X" on Right in Pure Solid White */}
          <path 
            d="M27 11L33.5 22.5L27 37H32L35.5 28.5L39 37H44L37.5 22.5L43.5 11H38.5L35.5 18L32 11H27Z" 
            fill="#FFFFFF" 
          />

          {/* Solid Geometric Accent Dot */}
          <circle cx="35.5" cy="23.5" r="2.25" fill="#38BDF8" />
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
