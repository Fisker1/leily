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
    const { address, city, country = 'NO' } = await req.json()
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const MAPBOX_PUBLIC_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!MAPBOX_PUBLIC_TOKEN) {
      console.error('MAPBOX_PUBLIC_TOKEN is not configured')
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Build the full address string
    const fullAddress = city ? `${address}, ${city}` : address
    console.log(`Geocoding address: ${fullAddress}`)
    
    // Make geocoding request to Mapbox
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&country=${country}&limit=1`
    
    const response = await fetch(geocodeUrl)
    
    if (!response.ok) {
      console.error(`Geocoding failed with status ${response.status}`)
      const errorText = await response.text()
      console.error('Geocoding error response:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Geocoding failed',
          status: response.status,
          details: errorText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      )
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      console.log(`No geocoding results found for: ${fullAddress}`)
      return new Response(
        JSON.stringify({ 
          error: 'No geocoding results found',
          address: fullAddress
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const feature = data.features[0]
    const [lng, lat] = feature.center
    
    console.log(`Successfully geocoded ${fullAddress} to [${lng}, ${lat}]`)
    
    return new Response(
      JSON.stringify({ 
        coordinates: [lng, lat],
        place_name: feature.place_name,
        address: fullAddress
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Geocoding error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})