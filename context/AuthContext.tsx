'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

const STORAGE_KEY = 'wedding_rsvp_session';

interface Session {
  token: string;
  role: 'admin' | 'couple';
  couple?: {
    id: string;
    [key: string]: any;
  };
}

interface AuthContextValue {
  session: Session | null;
  token: string | null;
  role: 'admin' | 'couple' | null;
  coupleId: string | null;
  isAdmin: boolean;
  isCouple: boolean;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      // Set cookie for middleware
      document.cookie = `${STORAGE_KEY}=${JSON.stringify(session)}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    } else {
      localStorage.removeItem(STORAGE_KEY);
      // Remove cookie
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }, [session]);

  const value = useMemo(() => {
    const token = session?.token || null;
    const role = session?.role || null;
    const coupleId = session?.couple?.id || null;
    return {
      session,
      token,
      role,
      coupleId,
      isAdmin: role === 'admin',
      isCouple: role === 'couple',
      setSession,
      logout: () => setSession(null)
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
