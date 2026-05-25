'use client';

import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  banner_url: string | null;          // ← new: profile background image
  pref_language: 'russian' | 'kazakh' | 'english';
  pref_template: 'standard' | 'university' | 'college' | 'simple';
  notifications: boolean;
  subscription_status: 'free' | 'pro' | 'cancelled';
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  daily_limit: number;
  created_at: string;
  updated_at: string;
}

type UserMetadata = {
  full_name?: string;
  avatar_url?: string;
  banner_url?: string;                // ← new
  pref_language?: 'russian' | 'kazakh' | 'english';
  pref_template?: 'standard' | 'university' | 'college' | 'simple';
  notifications?: boolean;
  subscription_status?: 'free' | 'pro' | 'cancelled';
  subscription_started_at?: string;
  subscription_expires_at?: string;
  daily_limit?: number;
  updated_at?: string;
};

function profileFromUser(user: User): Profile {
  const meta = (user.user_metadata ?? {}) as UserMetadata;
  return {
    id:                      user.id,
    email:                   user.email ?? '',
    full_name:               meta.full_name ?? '',
    avatar_url:              meta.avatar_url ?? null,
    banner_url:              meta.banner_url ?? null,    // ← new
    pref_language:           meta.pref_language ?? 'russian',
    pref_template:           meta.pref_template ?? 'standard',
    notifications:           meta.notifications ?? false,
    subscription_status:     meta.subscription_status ?? 'free',
    subscription_started_at: meta.subscription_started_at ?? null,
    subscription_expires_at: meta.subscription_expires_at ?? null,
    daily_limit:             meta.daily_limit ?? 10,
    created_at:              user.created_at ?? new Date().toISOString(),
    updated_at:              meta.updated_at ?? new Date().toISOString(),
  };
}

export const GUEST_PROFILE: Profile = {
  id: 'guest', email: '', full_name: '', avatar_url: null, banner_url: null,
  pref_language: 'russian', pref_template: 'standard', notifications: false,
  subscription_status: 'free', subscription_started_at: null, subscription_expires_at: null,
  daily_limit: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  profile: Profile;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string }) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Maximum allowed file size for avatars and banners: 500 KB */
const MAX_AVATAR_SIZE = 500 * 1024;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(GUEST_PROFILE);
  const [loading, setLoading] = useState(true);

  const mountedRef         = useRef(true);
  const loadingResolvedRef = useRef(false);

  const resolveLoading = useCallback(() => {
    if (!loadingResolvedRef.current && mountedRef.current) {
      loadingResolvedRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current         = true;
    loadingResolvedRef.current = false;
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;

        const currentUser = session?.user ?? null;

        if (event === 'INITIAL_SESSION') {
          if (currentUser) {
            setUser(currentUser);
            setProfile(profileFromUser(currentUser));
          } else {
            setUser(null);
            setProfile(GUEST_PROFILE);
          }
          resolveLoading();
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (currentUser) {
            setUser(currentUser);
            setProfile(profileFromUser(currentUser));
          }
          resolveLoading();
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(GUEST_PROFILE);
          resolveLoading();
          return;
        }

        if (event === 'USER_UPDATED') {
          if (currentUser) {
            setUser(currentUser);
            setProfile(profileFromUser(currentUser));
          }
          return;
        }
      }
    );

    const safetyTimer = setTimeout(() => {
      if (!loadingResolvedRef.current) {
        console.warn('[useAuth] INITIAL_SESSION timeout — treating as signed out');
        setUser(null);
        setProfile(GUEST_PROFILE);
        resolveLoading();
      }
    }, 5_000);

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [resolveLoading]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      toast.success('Аккаунт создан! Проверьте почту для подтверждения.');
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return {
          error: error.message.toLowerCase().includes('invalid')
            ? 'Неверный email или пароль'
            : error.message,
        };
      }
      toast.success('Вход выполнен');
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const signOut = useCallback(async () => {
    setUser(null);
    setProfile(GUEST_PROFILE);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('[useAuth] signOut error:', e);
    }
    toast.success('Вы вышли из аккаунта');
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  }, []);

  const handleIdle = useCallback(async () => {
    toast('Вы были автоматически выведены из аккаунта из-за неактивности', { icon: '⏱️' });
    await signOut();
  }, [signOut]);

  useIdleTimeout(handleIdle, 10 * 60 * 1000, !!user);

  const updateProfile = async (data: { full_name?: string }) => {
    if (!user) return { error: 'Не авторизован' };
    try {
      const { data: updated, error } = await supabase.auth.updateUser({
        data: { full_name: data.full_name },
      });
      if (error) return { error: error.message };
      if (updated.user) setProfile(profileFromUser(updated.user));
      toast.success('Профиль обновлён');
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      toast.success('Пароль изменён');
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'Не авторизован' };

    // ── Enforce 500 KB limit ──
    if (file.size > MAX_AVATAR_SIZE) {
      return { error: 'Размер аватара не должен превышать 500 КБ' };
    }

    try {
      const ext      = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadErr) return { error: uploadErr.message };

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { data: updated, error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (metaErr) return { error: metaErr.message };
      if (updated.user) setProfile(profileFromUser(updated.user));
      toast.success('Аватар обновлён');
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signOut,
      updateProfile, updatePassword, uploadAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}