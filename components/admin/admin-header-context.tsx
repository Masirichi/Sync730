'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AdminHeaderContextType {
  includeDemo: boolean;
  setIncludeDemo: (val: boolean) => void;
  lastUpdated: string;
  triggerRefresh: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
}

const AdminHeaderContext = createContext<AdminHeaderContextType>({
  includeDemo: false,
  setIncludeDemo: () => {},
  lastUpdated: new Date().toISOString(),
  triggerRefresh: () => {},
  isRefreshing: false,
  setIsRefreshing: () => {},
});

export function AdminHeaderProvider({ children }: { children: React.ReactNode }) {
  const [includeDemo, setIncludeDemoState] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sync730_admin_include_demo');
      if (stored === 'true') {
        setIncludeDemoState(true);
      }
    }
  }, []);

  const setIncludeDemo = useCallback((val: boolean) => {
    setIncludeDemoState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sync730_admin_include_demo', val ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('sync730_admin_demo_toggle', { detail: { includeDemo: val } }));
    }
    setLastUpdated(new Date().toISOString());
  }, []);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLastUpdated(new Date().toISOString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sync730_admin_refresh_metrics'));
    }
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  return (
    <AdminHeaderContext.Provider
      value={{
        includeDemo,
        setIncludeDemo,
        lastUpdated,
        triggerRefresh,
        isRefreshing,
        setIsRefreshing,
      }}
    >
      {children}
    </AdminHeaderContext.Provider>
  );
}

export function useAdminHeader() {
  return useContext(AdminHeaderContext);
}
