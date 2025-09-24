// Centralized, strict environment configuration. Avoids hardcoded fallbacks that can
// silently connect to the wrong Supabase project in different deploy environments.

type DeploymentEnv = 'development' | 'staging' | 'production';

function readRequiredEnv(variableName: string): string {
  const value = (import.meta as any).env?.[variableName];
  if (!value || String(value).trim() === '') {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
  return value as string;
}

const currentEnv: DeploymentEnv = ((): DeploymentEnv => {
  const explicit = (import.meta as any).env?.VITE_ENVIRONMENT as string | undefined;
  if (explicit === 'staging' || explicit === 'production' || explicit === 'development') {
    return explicit;
  }
  return (import.meta as any).env?.DEV ? 'development' : 'production';
})();

export const ENV_CONFIG = {
  isDevelopment: currentEnv === 'development',
  isStaging: currentEnv === 'staging',
  isProduction: currentEnv === 'production',

  supabase: {
    url: readRequiredEnv('VITE_SUPABASE_URL'),
    anonKey: readRequiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
    projectId: readRequiredEnv('VITE_SUPABASE_PROJECT_ID')
  },

  app: {
    baseUrl: (import.meta as any).env?.VITE_APP_URL || window.location.origin,
    redirectUrl: `${(import.meta as any).env?.VITE_APP_URL || window.location.origin}/`,
  },

  settings: {
    enableAnalytics: (import.meta as any).env?.VITE_ENABLE_ANALYTICS === 'true',
    debugMode: (import.meta as any).env?.VITE_DEBUG === 'true' || (import.meta as any).env?.MODE === 'development',
    logLevel: (import.meta as any).env?.VITE_LOG_LEVEL || ((import.meta as any).env?.MODE === 'development' ? 'debug' : 'error')
  }
};

export const isStaging = () => ENV_CONFIG.isStaging;
export const isProduction = () => ENV_CONFIG.isProduction;
export const isDevelopment = () => ENV_CONFIG.isDevelopment;

export const getCurrentEnvironment = (): DeploymentEnv => {
  if (ENV_CONFIG.isProduction) return 'production';
  if (ENV_CONFIG.isStaging) return 'staging';
  return 'development';
};