// Environment configuration - simplified and centralized
import { CURRENT_ENV, SUPABASE_CONFIG, APP_CONFIG, FEATURES } from '@/lib/env';

export interface EnvironmentConfig {
  name: string;
  supabase: {
    url: string;
    anonKey: string;
    projectId: string;
  };
  app: {
    baseUrl: string;
    domain: string;
    comingSoon: boolean;
  };
  features: {
    analytics: boolean;
    debug: boolean;
  };
}

// Single source of truth
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const baseUrl = APP_CONFIG.baseUrl;
  const domain = typeof window !== 'undefined' ? window.location.host : new URL(baseUrl || 'http://localhost').host;
  
  return {
    name: CURRENT_ENV,
    supabase: SUPABASE_CONFIG,
    app: {
      baseUrl,
      domain,
      comingSoon: APP_CONFIG.comingSoon
    },
    features: FEATURES
  };
};