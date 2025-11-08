'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface Settings {
  [key: string]: any;
}

interface SettingsContextValue {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: (overrides?: { coupleId?: string | null }) => Promise<void>;
  setSettings: (settings: Settings | null) => void;
  selectedCoupleId: string | null;
  setSelectedCoupleId: (id: string | null) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { token, role, coupleId, isAdmin } = useAuth();
  const [selectedCoupleId, setSelectedCoupleId] = useState<string | null>(coupleId || null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setSelectedCoupleId(coupleId || null);
    }
  }, [isAdmin, coupleId]);

  const fetchSettings = useCallback(async (overrides: { coupleId?: string | null } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const targetCoupleId = overrides.coupleId !== undefined
        ? overrides.coupleId
        : (selectedCoupleId || coupleId || null);

      const hasToken = Boolean(token);
      const url = hasToken
        ? `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings`
        : `${process.env.NEXT_PUBLIC_SERVER_LINK}/api/settings/public`;

      const params: Record<string, any> = {};
      if (targetCoupleId) {
        params.coupleId = targetCoupleId;
      }

      const config: any = {
        params
      };

      if (hasToken) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await axios.get(url, config);
      setSettings(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedCoupleId, coupleId]);

  useEffect(() => {
    if (token || selectedCoupleId || !isAdmin) {
      fetchSettings();
    }
  }, [fetchSettings, token, selectedCoupleId, isAdmin]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
        setSettings,
        selectedCoupleId,
        setSelectedCoupleId
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
