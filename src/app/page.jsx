'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-2xl shadow-md">
          G
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs">
          <Loader2 className="animate-spin text-blue-600" size={16} />
          <span>Loading Global Enterprise ERP...</span>
        </div>
      </div>
    </div>
  );
}
