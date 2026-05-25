import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Сессия хранится в localStorage — только на этом устройстве/браузере
    persistSession: true,
    // Не подхватывать сессию из URL (защита от replay email-ссылок)
    detectSessionInUrl: false,
    // Тихое обновление токена пока пользователь активен
    autoRefreshToken: true,
    // PKCE — безопаснее чем implicit flow
    flowType: 'pkce',
    // Хранилище явно указываем как localStorage (дефолт, но явно = понятно)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Ключ хранилища уникален для этого приложения
    storageKey: 'hiversity-auth',
  },
});

// ── Типы БД ──────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
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

export interface PaymentCard {
  id: string;
  user_id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  description: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  type: 'rup' | 'calendar';
  prompt: string | null;
  status: 'completed' | 'processing' | 'failed';
  file_size: number;
  created_at: string;
}