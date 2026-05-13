import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'auth/login': { maxRequests: 5, windowMinutes: 15 },
  'auth/register': { maxRequests: 3, windowMinutes: 60 },
  'auth/reset-password': { maxRequests: 3, windowMinutes: 60 },
  'tenant/access': { maxRequests: 10, windowMinutes: 5 },
  'payment/create': { maxRequests: 3, windowMinutes: 15 },
  'admin/promote': { maxRequests: 2, windowMinutes: 60 },
  'admin/tenant-access': { maxRequests: 5, windowMinutes: 10 },
  'get-mapbox-token': { maxRequests: 500, windowMinutes: 5 }, // Very generous for token fetching
  'geocode-address': { maxRequests: 100, windowMinutes: 5 }, // Generous for geocoding
  'default': { maxRequests: 20, windowMinutes: 5 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { endpoint, identifier } = await req.json()
    
    if (!endpoint || !identifier) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get rate limit config for this endpoint
    const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS.default
    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes)

    console.log(`Checking rate limit for ${endpoint} with identifier ${identifier}`)

    // Clean up old records first
    await supabaseClient
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString())

    // Check current rate limit
    const { data: existingLimit } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single()

    if (existingLimit) {
      if (existingLimit.request_count >= config.maxRequests) {
        console.log(`Rate limit exceeded for ${endpoint}`)
        
        // Log security event
        await supabaseClient
          .from('audit_log')
          .insert({
            table_name: 'rate_limits',
            action: 'RATE_LIMIT_EXCEEDED',
            user_id: null,
            details: {
              endpoint,
              identifier,
              request_count: existingLimit.request_count,
              max_requests: config.maxRequests,
              window_minutes: config.windowMinutes,
              timestamp: new Date().toISOString()
            }
          })

        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            retryAfter: config.windowMinutes * 60,
            details: {
              maxRequests: config.maxRequests,
              windowMinutes: config.windowMinutes
            }
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(config.windowMinutes * 60)
            } 
          }
        )
      }

      // Update existing record
      await supabaseClient
        .from('rate_limits')
        .update({
          request_count: existingLimit.request_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLimit.id)

      console.log(`Rate limit updated: ${existingLimit.request_count + 1}/${config.maxRequests}`)
    } else {
      // Create new rate limit record
      await supabaseClient
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: new Date().toISOString()
        })

      console.log(`New rate limit record created: 1/${config.maxRequests}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        remaining: config.maxRequests - (existingLimit?.request_count || 0) - 1,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000).toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Rate limiter error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})