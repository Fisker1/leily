import React from 'react'
import { CURRENT_ENV, SUPABASE_CONFIG } from '@/lib/env'

export default function SupabaseInfo() {
  let host = 'invalid'
  try { 
    const url = SUPABASE_CONFIG.url || 'https://placeholder.supabase.co';
    host = new URL(url).host;
  } catch (error) { 
    console.warn('Invalid Supabase URL:', error);
  }
  const info = {
    environment: CURRENT_ENV,
    supabase: {
      url: SUPABASE_CONFIG.url || 'https://placeholder.supabase.co',
      anonKeyPresent: Boolean(SUPABASE_CONFIG.anonKey && SUPABASE_CONFIG.anonKey.length > 5),
      host,
      projectId: SUPABASE_CONFIG.projectId || 'placeholder-id',
    },
  }
  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
