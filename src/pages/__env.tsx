import React from 'react'
import { env } from '@/lib/env'

export default function EnvDebug() {
  let host = 'invalid'
  try { host = new URL(env.VITE_SUPABASE_URL).host } catch {}
  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify({
        environment: env.VITE_ENVIRONMENT || 'unknown',
        supabase_host: host
      }, null, 2)}</pre>
    </div>
  )
}


