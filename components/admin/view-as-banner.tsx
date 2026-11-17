'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { Eye, ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ViewAsSession {
  target_id: string;
  target_name: string;
  target_role: string;
  started_at: string;
  actor_id: string;
  actor_name: string;
}

export function ViewAsBanner() {
  const router = useRouter();
  const [session, setSession] = useState<ViewAsSession | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if view-as cookie is set
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/view-as');
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.session) {
            setSession(data.session);
          } else {
            setSession(null);
          }
        }
      } catch {
        // Silently catch network errors
      }
    };

    checkSession();
    // Poll every 5 seconds to stay reactive if opened across tabs
    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExit = async () => {
    setIsExiting(true);
    try {
      const res = await fetch('/api/admin/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STOP' }),
      });
      if (res.ok) {
        setSession(null);
        router.push('/command/users');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to exit View-As mode:', err);
    } finally {
      setIsExiting(false);
    }
  };

  if (!session) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[100] w-full bg-amber-500 text-neutral-950 px-4 py-2.5 shadow-md flex items-center justify-between font-sans transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-neutral-950 text-amber-400 rounded-md">
          <Eye className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm">
          <span className="font-semibold">Viewing as {session.target_name}</span>
          <span className="text-neutral-900 ml-1.5 font-normal">
            (read-only). All mutations and write actions are strictly disabled.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExit}
          disabled={isExiting}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-xs font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-950"
        >
          {isExiting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Exiting...
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </>
          )}
        </button>
      </div>
    </div>
  );
}
