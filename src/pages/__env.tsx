import React from 'react'

export default function EnvDebug() {
  const viteEnv = (import.meta as any).env || {}
  const entries = Object.entries(viteEnv)
    .filter(([key]) => typeof key === 'string' && key.startsWith('VITE_'))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div style={{ padding: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>VITE environment (client-safe)</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {entries.map(([key, value]) => (
          <li key={key} style={{ marginBottom: 8 }}>
            <strong>{key}</strong>: <code>{JSON.stringify(value)}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}


