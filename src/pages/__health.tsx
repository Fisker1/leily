import React from 'react'
import { env } from '@/lib/env'

export default function Health() {
  const info = {
    status: 'ok',
    environment: env.VITE_ENVIRONMENT || 'unknown',
    ts: new Date().toISOString(),
  }
  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
