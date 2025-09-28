import { z } from 'zod'

// Strongly-typed, validated environment config for client-only usage
const EnvSchema = z.object({
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10).optional(),
  VITE_SUPABASE_PROJECT_ID: z.string().min(5).optional(),
  VITE_APP_URL: z.string().url().optional(),
  VITE_ENABLE_ANALYTICS: z.string().optional(),
  VITE_DEBUG: z.string().optional(),
  VITE_LOG_LEVEL: z.string().optional(),
})

// Safe parsing with error handling
const parseResult = EnvSchema.safeParse(import.meta.env as Record<string, string>)

let envData: any
if (!parseResult.success) {
  console.error('Environment validation failed:', parseResult.error.format())
  // Create a fallback env object with defaults
  envData = {
    VITE_ENVIRONMENT: import.meta.env?.VITE_ENVIRONMENT as 'development' | 'staging' | 'production' | undefined,
    VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL as string | undefined,
    VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined,
    VITE_SUPABASE_PROJECT_ID: import.meta.env?.VITE_SUPABASE_PROJECT_ID as string | undefined,
    VITE_APP_URL: import.meta.env?.VITE_APP_URL as string | undefined,
    VITE_ENABLE_ANALYTICS: import.meta.env?.VITE_ENABLE_ANALYTICS as string | undefined,
    VITE_DEBUG: import.meta.env?.VITE_DEBUG as string | undefined,
    VITE_LOG_LEVEL: import.meta.env?.VITE_LOG_LEVEL as string | undefined,
  }
} else {
  envData = parseResult.data
}

export const env = envData

type DeploymentEnv = 'development' | 'staging' | 'production'

const currentEnv: DeploymentEnv = env.VITE_ENVIRONMENT
  ? env.VITE_ENVIRONMENT
  : (import.meta.env?.DEV ? 'development' : 'production')

export const ENV_CONFIG = {
  isDevelopment: currentEnv === 'development',
  isStaging: currentEnv === 'staging',
  isProduction: currentEnv === 'production',
  supabase: {
    url: env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: env.VITE_SUPABASE_ANON_KEY || 'placeholder-key',
    projectId: env.VITE_SUPABASE_PROJECT_ID || 'placeholder-id'
  },
  app: {
    baseUrl: env.VITE_APP_URL || window.location.origin,
    redirectUrl: `${env.VITE_APP_URL || window.location.origin}/`,
  },
  settings: {
    enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true',
    debugMode: env.VITE_DEBUG === 'true' || import.meta.env?.MODE === 'development',
    logLevel: env.VITE_LOG_LEVEL || (import.meta.env?.MODE === 'development' ? 'debug' : 'error')
  }
}

export const isStaging = () => ENV_CONFIG.isStaging
export const isProduction = () => ENV_CONFIG.isProduction
export const isDevelopment = () => ENV_CONFIG.isDevelopment

export const getCurrentEnvironment = (): DeploymentEnv => {
  if (ENV_CONFIG.isProduction) return 'production'
  if (ENV_CONFIG.isStaging) return 'staging'
  return 'development'
}