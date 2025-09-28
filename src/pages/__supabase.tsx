import React from 'react'
import { env } from '@/lib/env'

export default function SupabaseInfo() {
  let host = 'invalid'
  try { 
    const url = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
    host = new URL(url).host;
  } catch (error) { 
    console.warn('Invalid Supabase URL:', error);
  }
  const info = {
    environment: env.VITE_ENVIRONMENT || 'unknown',
    supabase: {
      url: env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
      anonKeyPresent: Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY && env.VITE_SUPABASE_PUBLISHABLE_KEY.length > 5),
      host,
      projectId: env.VITE_SUPABASE_PROJECT_ID || 'placeholder-id',
    },
  }
  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
