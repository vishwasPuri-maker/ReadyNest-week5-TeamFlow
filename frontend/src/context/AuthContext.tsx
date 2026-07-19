'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken } from '@/lib/api';
import type { Organization, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore the session via the refresh cookie.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        const me = await api.get('/auth/me');
        setUser(me.data.data.user);
        setOrganization(me.data.data.organization);
      } catch {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function applySession(payload: { user: User; organization: Organization; accessToken: string }) {
    setAccessToken(payload.accessToken);
    setUser(payload.user);
    setOrganization(payload.organization);
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await applySession(data.data);
  };

  const register = async (input: RegisterInput) => {
    const { data } = await api.post('/auth/register', input);
    await applySession(data.data);
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    const me = await api.get('/auth/me');
    setUser(me.data.data.user);
    setOrganization(me.data.data.organization);
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
