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
    
    // Try Mapbox geocoding first, fallback to Nominatim if it fails
    let geocodingResult = null;
    let geocodingSource = 'unknown';

    // Attempt Mapbox geocoding
    try {
      console.log('🗺️ Attempting Mapbox geocoding...');
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&country=${country}&limit=1`
      
      const mapboxResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'Leily-PropertyApp/1.0'
        }
      });

      if (mapboxResponse.ok) {
        const mapboxData = await mapboxResponse.json();
        if (mapboxData.features && mapboxData.features.length > 0) {
          console.log('✅ Mapbox geocoding successful');
          geocodingResult = {
            coordinates: mapboxData.features[0].center,
            place_name: mapboxData.features[0].place_name
          };
          geocodingSource = 'mapbox';
        }
      } else if (mapboxResponse.status === 403) {
        console.log('⚠️ Mapbox geocoding forbidden (403) - token may not have geocoding permissions');
      } else {
        console.log(`⚠️ Mapbox geocoding failed with status ${mapboxResponse.status}`);
      }
    } catch (error) {
      console.log('⚠️ Mapbox geocoding failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback to Nominatim if Mapbox failed
    if (!geocodingResult) {
      try {
        console.log('🌍 Falling back to Nominatim geocoding...');
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=${country.toLowerCase()}&limit=1&addressdetails=1`;
        
        const nominatimResponse = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'Leily-PropertyApp/1.0',
            'Accept': 'application/json'
          }
        });

        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          if (nominatimData && nominatimData.length > 0) {
            const result = nominatimData[0];
            console.log('✅ Nominatim geocoding successful');
            geocodingResult = {
              coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
              place_name: result.display_name
            };
            geocodingSource = 'nominatim';
          }
        } else {
          console.log(`⚠️ Nominatim geocoding failed with status ${nominatimResponse.status}`);
        }
      } catch (error) {
        console.log('⚠️ Nominatim geocoding failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // If both services failed
    if (!geocodingResult) {
      console.log(`❌ All geocoding services failed for: ${fullAddress}`);
      return new Response(
        JSON.stringify({ 
          error: 'All geocoding services failed',
          address: fullAddress,
          attempted_services: ['mapbox', 'nominatim']
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const [lng, lat] = geocodingResult.coordinates;
    console.log(`✅ Successfully geocoded ${fullAddress} to [${lng}, ${lat}] using ${geocodingSource}`);
    
    return new Response(
      JSON.stringify({ 
        coordinates: [lng, lat],
        place_name: geocodingResult.place_name,
        address: fullAddress,
        source: geocodingSource,
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