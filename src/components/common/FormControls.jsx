'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Standard Form Label
 */
export function Label({ children, required, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 ${className}`}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

/**
 * Standard Form Helper / Error Text
 */
export function FormMessage({ error, helper, className = '' }) {
  if (error) {
    return <p className={`text-[11px] text-red-600 font-medium mt-1 ${className}`}>{error}</p>;
  }
  if (helper) {
    return <p className={`text-[11px] text-slate-500 mt-1 ${className}`}>{helper}</p>;
  }
  return null;
}

/**
 * Standard Enterprise Input Field
 */
export function Input({
  label,
  error,
  helper,
  required,
  id,
  type = 'text',
  icon: Icon,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            <Icon size={15} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className={`w-full h-9 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors ${
            Icon ? 'pl-9' : 'px-3'
          } ${
            error 
              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/10' 
              : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10'
          } ${className}`}
          {...rest}
        />
      </div>
      <FormMessage error={error} helper={helper} />
    </div>
  );
}

/**
 * Standard Enterprise Select Field
 */
export function Select({
  label,
  error,
  helper,
  required,
  id,
  options = [], // [{ value, label }] or string[]
  children,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <Label htmlFor={selectId} required={required}>{label}</Label>}
      <select
        id={selectId}
        required={required}
        className={`w-full h-9 px-3 bg-white border rounded-lg text-xs text-slate-900 outline-none transition-colors cursor-pointer ${
          error 
            ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/10' 
            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10'
        } ${className}`}
        {...rest}
      >
        {children || options.map((opt, i) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const text = typeof opt === 'object' ? opt.label : opt;
          return <option key={i} value={val}>{text}</option>;
        })}
      </select>
      <FormMessage error={error} helper={helper} />
    </div>
  );
}

/**
 * Standard Enterprise Currency Input Field
 * Automatically prefixes input with PKR 'Rs.' or specified symbol.
 */
export function CurrencyInput({
  label,
  error,
  helper,
  required,
  id,
  symbol = 'Rs. ',
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const inputId = id || (label ? `cur-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-xs font-mono font-bold text-slate-500 pointer-events-none select-none">
          {symbol}
        </span>
        <input
          id={inputId}
          type="number"
          step="any"
          required={required}
          className={`w-full h-9 pl-11 pr-3 bg-white border rounded-lg text-xs font-mono font-semibold text-slate-900 placeholder-slate-400 outline-none transition-colors ${
            error 
              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/10' 
              : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10'
          } ${className}`}
          {...rest}
        />
      </div>
      <FormMessage error={error} helper={helper} />
    </div>
  );
}

/**
 * Standard Enterprise Textarea
 */
export function Textarea({
  label,
  error,
  helper,
  required,
  id,
  rows = 3,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const textareaId = id || (label ? `txt-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <Label htmlFor={textareaId} required={required}>{label}</Label>}
      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        className={`w-full p-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors ${
          error 
            ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-500/10' 
            : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10'
        } ${className}`}
        {...rest}
      />
      <FormMessage error={error} helper={helper} />
    </div>
  );
}
