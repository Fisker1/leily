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
      console.error('Invalid Mapbox token format. Public tokens should start with pk. Token starts with:', MAPBOX_PUBLIC_TOKEN.substring(0, 10))
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Mapbox token format. Use a public token starting with pk.',
          received_prefix: MAPBOX_PUBLIC_TOKEN.substring(0, 10),
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Successfully returning Mapbox token')
    
    return new Response(
      JSON.stringify({ 
        token: MAPBOX_PUBLIC_TOKEN,
        timestamp: new Date().toISOString(),
        tokenPrefix: MAPBOX_PUBLIC_TOKEN.substring(0, 20) + '...'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Mapbox token error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
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