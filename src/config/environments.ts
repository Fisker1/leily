// Environment-specific configuration for staging and production
import { getCurrentEnvironment } from '@/lib/env';

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

// Production environment configuration
const PRODUCTION_CONFIG: EnvironmentConfig = {
  name: 'production',
  supabase: {
    url: 'https://yyyy.supabase.co', // Will be set via environment variables
    anonKey: 'prod-anon-key', // Will be set via environment variables
    projectId: 'prod-project-id' // Will be set via environment variables
  },
  app: {
    baseUrl: 'https://www.leily.no',
    domain: 'leily.no'
  },
  features: {
    analytics: true,
    debugging: false,
    errorReporting: true
  }
};

// Staging environment configuration
const STAGING_CONFIG: EnvironmentConfig = {
  name: 'staging',
  supabase: {
    url: 'https://xxxx.supabase.co', // Will be set via environment variables
    anonKey: 'staging-anon-key', // Will be set via environment variables
    projectId: 'staging-project-id' // Will be set via environment variables
  },
  app: {
    baseUrl: 'https://staging.leily.no',
    domain: 'staging.leily.no'
  },
  features: {
    analytics: false,
    debugging: true,
    errorReporting: true
  }
};

// Development environment configuration
const DEVELOPMENT_CONFIG: EnvironmentConfig = {
  name: 'development',
  supabase: {
    url: 'https://rkhzyzuttsvsjcgzrokt.supabase.co', // Current development project
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJraHp5enV0dHN2c2pjZ3pyb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjM5NDMsImV4cCI6MjA3MTE5OTk0M30.CU5UT8k9b8AIW_WF2a5dHc3X8sV5ugXF5QmAhVMGwoc',
    projectId: 'rkhzyzuttsvsjcgzrokt'
  },
  app: {
    baseUrl: 'http://localhost:8080',
    domain: 'localhost'
  },
  features: {
    analytics: false,
    debugging: true,
    errorReporting: false
  }
};

// Get current environment configuration
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = getCurrentEnvironment();
  
  switch (environment) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'staging':
      return STAGING_CONFIG;
    default:
      return DEVELOPMENT_CONFIG;
  }
};

// Export individual configs for direct access
export { PRODUCTION_CONFIG, STAGING_CONFIG, DEVELOPMENT_CONFIG };