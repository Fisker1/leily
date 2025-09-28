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
      console.error('Address is required')
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
    console.log(`🌍 Geocoding address: ${fullAddress}`)
    
    // Make geocoding request to Mapbox with retries
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&country=${country}&limit=1`
    
    let response: Response | undefined;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        console.log(`🔄 Geocoding attempt ${attempt + 1}/${maxAttempts}`)
        response = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'Leily-PropertyApp/1.0'
          }
        })
        
        if (response.ok) {
          break;
        }
        
        if (response.status === 403) {
          console.error(`❌ Forbidden error (403) on attempt ${attempt + 1}`)
        } else {
          console.error(`❌ HTTP ${response.status} on attempt ${attempt + 1}`)
        }
        
        attempt++;
        if (attempt < maxAttempts) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (fetchError) {
        console.error(`❌ Network error on attempt ${attempt + 1}:`, fetchError)
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    if (!response || !response.ok) {
      const errorText = response ? await response.text().catch(() => 'Unknown error') : 'No response received'
      console.error(`❌ All geocoding attempts failed. Status: ${response?.status || 'unknown'}, Error: ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: 'Geocoding failed after retries',
          status: response?.status || 0,
          details: errorText,
          address: fullAddress
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response?.status || 500,
        }
      )
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      console.log(`❌ No geocoding results found for: ${fullAddress}`)
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
    
    console.log(`✅ Successfully geocoded ${fullAddress} to [${lng}, ${lat}]`)
    
    return new Response(
      JSON.stringify({ 
        coordinates: [lng, lat],
        place_name: feature.place_name,
        address: fullAddress,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Geocoding function error:', error instanceof Error ? error.message : 'Unknown error')
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})