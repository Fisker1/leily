// Environment-aware Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment configuration - will be set based on deployment environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mogcagmqgaegxgssyiyv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ2NhZ21xZ2FlZ3hnc3N5aXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MDc0NDYsImV4cCI6MjA3MjQ4MzQ0Nn0.ISU-1o6sAGBptdmzhStJ9CaeIEOddNO5akeKVPcdueQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});