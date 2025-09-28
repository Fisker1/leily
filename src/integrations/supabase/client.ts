// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_CONFIG, FEATURES } from '@/lib/env';

// Validate required configuration
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  throw new Error('Missing required Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Debug logging
if (FEATURES.debug) {
  console.info('[supabase] connecting to:', new URL(SUPABASE_CONFIG.url).host);
}

export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url, 
  SUPABASE_CONFIG.anonKey, 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);