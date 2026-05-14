// Supabase client — falls back to local in-memory client when no URL is configured.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { localData } from '@/shared/integrations/local/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const isLocal = !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY;

// When Supabase is not configured, use the local in-memory client.
// It exposes the same .from() / .auth / .functions / .storage / .channel API
// so all existing code keeps working without changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = isLocal
  ? localData
  : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
