'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title = 'Success') => addToast('success', msg, title),
    error: (msg, title = 'Error') => addToast('error', msg, title),
    info: (msg, title = 'Information') => addToast('info', msg, title)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : t.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-950'
                : 'bg-blue-50 border-blue-300 text-blue-950'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>

            <div className="flex-1 text-xs">
              {t.title && <p className="font-bold text-[13px]">{t.title}</p>}
              <p className="mt-0.5 leading-relaxed font-medium opacity-90">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-700 p-0.5 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      success: (m) => console.log('Toast success:', m),
      error: (m) => console.error('Toast error:', m),
      info: (m) => console.log('Toast info:', m)
    };
  }
  return context;
}
