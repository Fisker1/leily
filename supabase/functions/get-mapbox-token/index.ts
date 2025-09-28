import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MAPBOX_PUBLIC_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!MAPBOX_PUBLIC_TOKEN) {
      console.error('MAPBOX_PUBLIC_TOKEN is not configured in Supabase secrets')
      throw new Error('MAPBOX_PUBLIC_TOKEN is not set')
    }

    // Validate token format (should start with pk. for public tokens)
    if (!MAPBOX_PUBLIC_TOKEN.startsWith('pk.')) {
      console.error('CRITICAL: Invalid Mapbox token format. Public tokens should start with pk.')
      console.error('Token prefix received:', MAPBOX_PUBLIC_TOKEN.substring(0, 10))
      console.error('Expected format: pk.ey... (Mapbox public token)')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Mapbox token format. Use a public token starting with pk.',
          received_prefix: MAPBOX_PUBLIC_TOKEN.substring(0, 10),
          expected_format: 'pk.ey...',
          timestamp: new Date().toISOString(),
          documentation: 'https://docs.mapbox.com/help/glossary/access-token/'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Additional validation: check token length (Mapbox public tokens are typically longer)
    if (MAPBOX_PUBLIC_TOKEN.length < 80) {
      console.error('CRITICAL: Mapbox token appears too short. Expected length > 80 chars, got:', MAPBOX_PUBLIC_TOKEN.length)
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token appears invalid - too short',
          token_length: MAPBOX_PUBLIC_TOKEN.length,
          expected_minimum: 80,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('✅ Successfully returning valid Mapbox token')
    console.log('Token prefix:', MAPBOX_PUBLIC_TOKEN.substring(0, 20) + '...')
    console.log('Token length:', MAPBOX_PUBLIC_TOKEN.length)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        token: MAPBOX_PUBLIC_TOKEN,
        timestamp: new Date().toISOString(),
        tokenPrefix: MAPBOX_PUBLIC_TOKEN.substring(0, 20) + '...',
        tokenLength: MAPBOX_PUBLIC_TOKEN.length,
        validation: 'PASSED'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Mapbox token error:', error instanceof Error ? error.message : 'Unknown error')
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        suggestion: 'Check your Mapbox token configuration in the dashboard'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})