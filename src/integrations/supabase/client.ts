// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';

// Handle preview environment where env vars might not be available
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

console.info('[supabase] using:', new URL(supabaseUrl).host);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});