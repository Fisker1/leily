// Secure CORS configuration for Supabase Edge Functions
export const getSecureCorsHeaders = (origin?: string) => {
  // Define allowed origins based on environment
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000', 
    'https://lovable.dev',
    'https://leily.no',
    'https://leily.vercel.app',
    // Add production domains here
  ];

  // Check if origin is in allowed list
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};