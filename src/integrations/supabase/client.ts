// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ENV_CONFIG } from '@/lib/env';

// Use the proper environment configuration
const SUPABASE_URL = ENV_CONFIG.supabase.url;
const SUPABASE_PUBLISHABLE_KEY = ENV_CONFIG.supabase.anonKey;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});