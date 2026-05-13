// Simplified environment configuration
export type Environment = 'development' | 'staging' | 'production';

// Get environment from VITE_ENVIRONMENT or infer from domain/mode
function getEnvironment(): Environment {
  // Check explicit environment variable first
  if (import.meta.env.VITE_ENVIRONMENT) {
    return import.meta.env.VITE_ENVIRONMENT as Environment;
  }
  
  // Infer from URL in browser
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    if (host.includes('stage') || host.includes('staging')) return 'staging';
    if (host.includes('localhost') || host.includes('127.0.0.1')) return 'development';
  }
  
  // Fallback to Vite mode
  return import.meta.env.DEV ? 'development' : 'production';
}

export const CURRENT_ENV = getEnvironment();

// Environment checks
export const isDevelopment = CURRENT_ENV === 'development';
export const isStaging = CURRENT_ENV === 'staging';
export const isProduction = CURRENT_ENV === 'production';

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || ''
};

// App configuration  
export const APP_CONFIG = {
  baseUrl: import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  comingSoon: import.meta.env.VITE_COMING_SOON === 'true'
};

// Feature flags
export const FEATURES = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debug: import.meta.env.VITE_DEBUG === 'true' || isDevelopment
};