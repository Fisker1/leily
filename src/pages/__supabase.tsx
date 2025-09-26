import React from 'react'
import { env } from '@/lib/env'

export default function SupabaseInfo() {
  let host = 'invalid'
  try { 
    host = new URL(env.VITE_SUPABASE_URL).host 
  } catch {
    // Host remains 'invalid' if URL parsing fails
  }
  const info = {
    environment: env.VITE_ENVIRONMENT || 'unknown',
    supabase: {
      url: env.VITE_SUPABASE_URL,
      anonKeyPresent: Boolean(env.VITE_SUPABASE_ANON_KEY && env.VITE_SUPABASE_ANON_KEY.length > 5),
      host,
      projectId: env.VITE_SUPABASE_PROJECT_ID,
    },
  }
  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
