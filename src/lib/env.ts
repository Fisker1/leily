// Environment configuration for staging/production deployment
export const ENV_CONFIG = {
  // Current environment detection
  isDevelopment: import.meta.env.MODE === 'development',
  isStaging: import.meta.env.VITE_ENVIRONMENT === 'staging',
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production',
  
  // Supabase configuration (environment-aware)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://rkhzyzuttsvsjcgzrokt.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJraHp5enV0dHN2c2pjZ3pyb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjM5NDMsImV4cCI6MjA3MTE5OTk0M30.CU5UT8k9b8AIW_WF2a5dHc3X8sV5ugXF5QmAhVMGwoc",
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "rkhzyzuttsvsjcgzrokt"
  },
  
  // App URLs (environment-aware)
  app: {
    baseUrl: import.meta.env.VITE_APP_URL || window.location.origin,
    redirectUrl: `${import.meta.env.VITE_APP_URL || window.location.origin}/`,
  },
  
  // Environment-specific settings
  settings: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    debugMode: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development',
    logLevel: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.MODE === 'development' ? 'debug' : 'error')
  }
};

// Helper functions for environment checks
export const isStaging = () => ENV_CONFIG.isStaging;
export const isProduction = () => ENV_CONFIG.isProduction;
export const isDevelopment = () => ENV_CONFIG.isDevelopment;

// Get current environment name
export const getCurrentEnvironment = (): 'development' | 'staging' | 'production' => {
  if (ENV_CONFIG.isProduction) return 'production';
  if (ENV_CONFIG.isStaging) return 'staging';
  return 'development';
};