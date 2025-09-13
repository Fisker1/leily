// Environment configuration for staging/production deployment
console.log('🔧 Environment Debug Info:');
console.log('VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_PROJECT_ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);

export const ENV_CONFIG = {
  // Current environment detection
  isDevelopment: import.meta.env.MODE === 'development',
  isStaging: import.meta.env.VITE_ENVIRONMENT === 'staging',
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production',
  
  // Supabase configuration (environment-aware)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || (
      import.meta.env.VITE_ENVIRONMENT === 'staging' 
        ? "https://wdwjmapvuibsqiifslno.supabase.co"
        : import.meta.env.VITE_ENVIRONMENT === 'production'
        ? "https://rkhzyzuttsvsjcgzrokt.supabase.co"
        : "http://localhost:54321" // Local development
    ),
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (
      import.meta.env.VITE_ENVIRONMENT === 'staging'
        ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkd2ptYXB2dWlic3FpaWZzbG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODU3ODksImV4cCI6MjA3MzI2MTc4OX0.WbEjzF_D8D1g3-i8NA5UIPl-D1ny2W8ZjD2sEp260Cs"
        : import.meta.env.VITE_ENVIRONMENT === 'production'
        ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJraHp5enV0dHN2c2pjZ3pyb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjM5NDMsImV4cCI6MjA3MTE5OTk0M30.CU5UT8k9b8AIW_WF2a5dHc3X8sV5ugXF5QmAhVMGwoc"
        : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJraHp5enV0dHN2c2pjZ3pyb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjM5NDMsImV4cCI6MjA3MTE5OTk0M30.CU5UT8k9b8AIW_WF2a5dHc3X8sV5ugXF5QmAhVMGwoc" // Fallback to prod for development
    ),
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || (
      import.meta.env.VITE_ENVIRONMENT === 'staging' 
        ? "wdwjmapvuibsqiifslno"
        : import.meta.env.VITE_ENVIRONMENT === 'production'
        ? "rkhzyzuttsvsjcgzrokt"
        : "rkhzyzuttsvsjcgzrokt" // Fallback to prod for development
    )
  },
  
  // App URLs (environment-aware)
  app: {
    baseUrl: import.meta.env.VITE_APP_URL || (
      import.meta.env.VITE_ENVIRONMENT === 'staging' 
        ? "https://staging.leily.no"
        : import.meta.env.VITE_ENVIRONMENT === 'production'
        ? "https://www.leily.no"
        : window.location.origin
    ),
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