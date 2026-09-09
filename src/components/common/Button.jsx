'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * NEXIS ERP Standard Enterprise Button
 * Ensures exact, uniform heights, paddings, border-radii, and states across all pages.
 */
export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'navy' | 'ghost' | 'danger' | 'danger-outline' | 'success' | 'outline'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  title,
  ...rest
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-lg transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
    lg: 'h-10 px-4 text-sm gap-2.5'
  };

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 17
  };

  const variantStyles = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs border border-transparent focus:ring-2 focus:ring-blue-500/20',
    secondary: 'bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-slate-400/20',
    navy: 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs border border-transparent focus:ring-2 focus:ring-slate-700/20',
    ghost: 'bg-transparent hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] border border-transparent',
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs border border-transparent focus:ring-2 focus:ring-red-500/20',
    'danger-outline': 'bg-white hover:bg-red-50 text-[#DC2626] border border-red-200 focus:ring-2 focus:ring-red-400/20',
    success: 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs border border-transparent focus:ring-2 focus:ring-emerald-500/20',
    outline: 'bg-transparent hover:bg-slate-50 text-[#0F172A] border border-[#CBD5E1]'
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentIconSize = iconSizes[size] || 15;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`${baseStyles} ${currentSize} ${currentVariant} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={currentIconSize} className="animate-spin flex-shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={currentIconSize} className="flex-shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={currentIconSize} className="flex-shrink-0" />}
        </>
      )}
    </button>
  );
}
