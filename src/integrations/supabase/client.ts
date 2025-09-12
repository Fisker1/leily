// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment configuration - will be set based on deployment environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wdwjmapvuibsqiifslno.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkd2ptYXB2dWlic3FpaWZzbG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODU3ODksImV4cCI6MjA3MzI2MTc4OX0.WbEjzF_D8D1g3-i8NA5UIPl-D1ny2W8ZjD2sEp260Cs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});