'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface GenerationLimitState {
  used: number;
  remaining: number;
  dailyLimit: number;
  isLoading: boolean;
}

const ASTANA_OFFSET_HOURS = 5; // UTC+5

/**
 * Возвращает начало текущего дня по Астане (UTC+5) и начало следующего —
 * в UTC ISO-формате для сравнения с created_at в БД.
 * Идентично логике на бэкенде в generationLimit.js → getAstanaDayRange()
 */
function getAstanaDayRange() {
  const now = new Date();
  // Смещаем «сейчас» на +5ч, чтобы получить «местное» время как UTC-поля
  const astanaNow = new Date(now.getTime() + ASTANA_OFFSET_HOURS * 60 * 60 * 1000);

  // Начало текущего дня по Астане, конвертированное обратно в UTC
  const startOfAstanaDay = new Date(Date.UTC(
    astanaNow.getUTCFullYear(),
    astanaNow.getUTCMonth(),
    astanaNow.getUTCDate(),
    0, 0, 0, 0
  ) - ASTANA_OFFSET_HOURS * 60 * 60 * 1000);

  const startOfNextAstanaDay = new Date(startOfAstanaDay.getTime() + 24 * 60 * 60 * 1000);

  return {
    start: startOfAstanaDay.toISOString(),
    end: startOfNextAstanaDay.toISOString(),
  };
}

export function useGenerationLimit() {
  const { user, loading: authLoading } = useAuth();
  const lastFetchedUserId = useRef<string | null>(null);

  const [state, setState] = useState<GenerationLimitState>({
    used: 0,
    remaining: 0,
    dailyLimit: 0,
    isLoading: true,
  });

  const fetchUsed = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { start, end } = getAstanaDayRange();

      const [profileRes, logsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('daily_limit')
          .eq('id', userId)
          .single(),
        supabase
          .from('generation_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', start)
          .lt('created_at', end),
      ]);

      const profileData = profileRes.data as { daily_limit: number } | null;
      const dailyLimit: number = profileData?.daily_limit ?? 10;
      const used = logsRes.count ?? 0;
      const remaining = Math.max(0, dailyLimit - used);

      lastFetchedUserId.current = userId;
      setState({ used, remaining, dailyLimit, isLoading: false });
    } catch (e) {
      console.warn('useGenerationLimit fetch error:', e);
      setState({ used: 0, remaining: 10, dailyLimit: 10, isLoading: false });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      lastFetchedUserId.current = null;
      setState({ used: 0, remaining: 0, dailyLimit: 0, isLoading: false });
      return;
    }

    if (lastFetchedUserId.current === user.id) return;

    fetchUsed(user.id);
  }, [user, authLoading, fetchUsed]);

  const refetch = useCallback(() => {
    if (user?.id) {
      lastFetchedUserId.current = null;
      fetchUsed(user.id);
    }
  }, [user?.id, fetchUsed]);

  const incrementOptimistic = useCallback(() => {
    setState(prev => ({
      ...prev,
      used: prev.used + 1,
      remaining: Math.max(0, prev.remaining - 1),
    }));
  }, []);

  const isLoading = authLoading || state.isLoading;
  const isReady = !authLoading && !state.isLoading;

  return {
    used: state.used,
    remaining: state.remaining,
    dailyLimit: state.dailyLimit,
    isLoading,
    isReady,
    refetch,
    incrementOptimistic,
  };
}