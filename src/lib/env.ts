import { z } from 'zod'

// Strongly-typed, validated environment config for client-only usage
const EnvSchema = z.object({
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
  VITE_SUPABASE_PROJECT_ID: z.string().min(5),
  VITE_APP_URL: z.string().url().optional(),
  VITE_ENABLE_ANALYTICS: z.string().optional(),
  VITE_DEBUG: z.string().optional(),
  VITE_LOG_LEVEL: z.string().optional(),
})

export const env = EnvSchema.parse(import.meta.env as Record<string, string>)

type DeploymentEnv = 'development' | 'staging' | 'production'

const currentEnv: DeploymentEnv = env.VITE_ENVIRONMENT
  ? env.VITE_ENVIRONMENT
  : (import.meta.env?.DEV ? 'development' : 'production')

export const ENV_CONFIG = {
  isDevelopment: currentEnv === 'development',
  isStaging: currentEnv === 'staging',
  isProduction: currentEnv === 'production',
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    projectId: env.VITE_SUPABASE_PROJECT_ID
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