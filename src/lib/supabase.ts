import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { secureSessionStorage } from './secure-session-storage';

/**
 * Supabase client. Only the PUBLISHABLE key is used: it's public by design, and Row Level
 * Security policies (supabase/migrations) are what actually protect each user's data.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isSupabaseConfigured = url.startsWith('https://') && publishableKey.length > 0;

export class ConfigurationError extends Error {
  constructor() {
    super('Tally is not connected to its backend yet. Add the Supabase URL and publishable key to .env.');
    this.name = 'ConfigurationError';
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        storage: secureSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Email links and OAuth return a one-time `code` that only this device can exchange.
        flowType: 'pkce',
      },
    })
  : null;

/** @throws ConfigurationError when the env vars are missing. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new ConfigurationError();
  return supabase;
}

// Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}
