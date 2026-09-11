'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NexisLogo from '@/components/common/NexisLogo';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login';
      }
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <NexisLogo size="lg" />
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
          <Loader2 className="animate-spin text-blue-600" size={16} />
          <span>Connecting to NEXIS Enterprise Operating Cloud...</span>
        </div>
      </div>
    </div>
  );
}
