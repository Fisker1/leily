// Environment-specific configuration (now reads exclusively from env)
import { env } from '@/lib/env';

interface EnvironmentConfig {
  name: string;
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  app: {
    baseUrl: string;
    domain: string;
  };
  features: {
    analytics: boolean;
    debugging: boolean;
    errorReporting: boolean;
  };
}

// Single source of truth from env
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const baseUrl = env.VITE_APP_URL || window.location.origin
  const domain = new URL(baseUrl).host
  return {
    name: env.VITE_ENVIRONMENT || 'production',
    supabase: {
      url: env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
      anonKey: env.VITE_SUPABASE_ANON_KEY || 'placeholder-key',
      projectId: env.VITE_SUPABASE_PROJECT_ID || 'placeholder-id'
    },
    app: {
      baseUrl,
      domain
    },
    features: {
      analytics: false,
      debugging: false,
      errorReporting: true
    }
  }
}