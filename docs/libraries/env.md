# Environment Helpers (`src/lib/env.ts`)

Purpose: Strongly-typed, validated environment configuration for client-only usage.

## Public API

- `env`: parsed and validated env vars (throws on invalid)
- `ENV_CONFIG`: derived configuration
- `isDevelopment(): boolean`
- `isStaging(): boolean`
- `isProduction(): boolean`
- `getCurrentEnvironment(): 'development' | 'staging' | 'production'`

## Usage

```ts
import { ENV_CONFIG, isProduction, getCurrentEnvironment } from '@/lib/env';

if (isProduction()) {
  // production-only logic
}

console.log(ENV_CONFIG.supabase.url);
console.log(getCurrentEnvironment());
```

## Validation Schema

Required variables:
- `VITE_SUPABASE_URL` (URL)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (string)
- `VITE_SUPABASE_PROJECT_ID` (string)

Optional:
- `VITE_ENVIRONMENT` ('development' | 'staging' | 'production')
- `VITE_APP_URL`, `VITE_ENABLE_ANALYTICS`, `VITE_DEBUG`, `VITE_LOG_LEVEL`