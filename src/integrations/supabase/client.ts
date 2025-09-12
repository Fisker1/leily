// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment configuration - will be set based on deployment environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rkhzyzuttsvsjcgzrokt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJraHp5enV0dHN2c2pjZ3pyb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjM5NDMsImV4cCI6MjA3MTE5OTk0M30.CU5UT8k9b8AIW_WF2a5dHc3X8sV5ugXF5QmAhVMGwoc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});