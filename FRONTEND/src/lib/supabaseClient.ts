import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

if (!isSupabaseConfigured) {
  console.warn('Supabase URL or Key is missing or invalid in environment variables.');
}

const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

/**
 * Dynamic Storage Provider:
 * When "Remember Me" is enabled, session tokens are stored in persistent localStorage.
 * When "Remember Me" is disabled (false), tokens are isolated to sessionStorage,
 * ensuring automatic expiration when the browser window or session closes.
 */
const dynamicAuthStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    const shouldRemember = localStorage.getItem('washflow_remember_me') !== 'false';
    if (!shouldRemember) {
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal) return sessionVal;
    }
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    const shouldRemember = localStorage.getItem('washflow_remember_me') !== 'false';
    if (shouldRemember) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: dynamicAuthStorage,
  }
});

