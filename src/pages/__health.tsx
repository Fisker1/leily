import React from 'react'
import { CURRENT_ENV } from '@/lib/env'

export default function Health() {
  const info = {
    status: 'ok',
    environment: CURRENT_ENV,
    ts: new Date().toISOString(),
  }
  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
