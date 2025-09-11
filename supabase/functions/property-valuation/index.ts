import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyValuationRequest {
  address: string;
  postalCode?: string;
  city?: string;
  propertyId?: string;
}

interface PropertyValuationResponse {
  estimatedValue?: number;
  confidence?: 'low' | 'medium' | 'high';
  source: 'kartverket' | 'estimated';
  address: string;
  propertyData?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, postalCode, city, propertyId }: PropertyValuationRequest = await req.json();
    
    console.log('Property valuation request:', { address, postalCode, city, propertyId });

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Try to get property data from Kartverket's APIs
    const propertyData = await getKartverketPropertyData(address, postalCode);
    
    let valuation: PropertyValuationResponse = {
      source: 'estimated',
      address: address,
      confidence: 'low'
    };

    if (propertyData && propertyData.success) {
      // If we have Kartverket data, we can make a more educated estimate
      valuation = {
        ...valuation,
        source: 'kartverket',
        propertyData: propertyData.data,
        confidence: 'medium'
      };

      // Basic estimation logic based on area, type, and location
      const estimatedValue = calculateEstimatedValue(propertyData.data, postalCode);
      if (estimatedValue > 0) {
        valuation.estimatedValue = estimatedValue;
        valuation.confidence = 'medium';
      }
    } else {
      // Fallback to basic regional estimation
      const regionalEstimate = getRegionalEstimate(postalCode, city);
      if (regionalEstimate > 0) {
        valuation.estimatedValue = regionalEstimate;
        valuation.confidence = 'low';
      }
    }

    console.log('Property valuation result:', valuation);

    return new Response(
      JSON.stringify(valuation),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Property valuation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get property valuation',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

async function getKartverketPropertyData(address: string, postalCode?: string) {
  try {
    // Use Kartverket's geocoding API to get property information
    const searchQuery = postalCode ? `${address}, ${postalCode}` : address;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Kartverket's Geocoding API (open and free)
    const geocodeUrl = `https://ws.geonorge.no/SKWS3Index/ssr/sok?navn=${encodedQuery}&epsgKode=4326&kategori=matrikkelenhet&antPerSide=1`;
    
    console.log('Kartverket API request:', geocodeUrl);
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'LeiyApp/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('Kartverket API error:', response.status, response.statusText);
      return { success: false, error: 'Failed to fetch from Kartverket' };
    }

    const data = await response.json();
    console.log('Kartverket API response:', data);

    if (data && data.stedsnavn && data.stedsnavn.length > 0) {
      const property = data.stedsnavn[0];
      return {
        success: true,
        data: {
          propertyId: property.matrikkelNummer,
          municipality: property.kommunenavn,
          county: property.fylkesnavn,
          coordinates: {
            lat: property.nord,
            lng: property.aust
          },
          area: property.areal,
          propertyType: property.objektType
        }
      };
    }

    return { success: false, error: 'No property data found' };

  } catch (error) {
    console.error('Kartverket API error:', error);
    return { success: false, error: error.message };
  }
}

function calculateEstimatedValue(propertyData: any, postalCode?: string): number {
  try {
    // Basic estimation logic based on Norwegian housing market data (2024)
    const baseValues: { [key: string]: number } = {
      // Oslo area
      '0': 80000, // Oslo centrum
      '1': 75000, // Oslo west
      '2': 65000, // Oslo east
      '3': 60000, // Oslo north
      
      // Other major cities
      '40': 45000, // Stavanger
      '50': 50000, // Bergen  
      '70': 40000, // Trondheim
      '90': 35000, // Tromsø
    };

    let pricePerSqm = 35000; // Default for Norway
    
    if (postalCode) {
      const prefix = postalCode.substring(0, 1);
      if (baseValues[prefix]) {
        pricePerSqm = baseValues[prefix];
      }
    }

    // Assume average apartment size if no area data
    const estimatedArea = propertyData.area || 80; // 80 sqm average
    
    // Add some variance based on property type
    if (propertyData.propertyType === 'Enebolig') {
      pricePerSqm *= 1.1; // Single family homes typically higher per sqm
    }

    const estimatedValue = Math.round(pricePerSqm * estimatedArea);
    
    console.log('Estimated value calculation:', {
      pricePerSqm,
      estimatedArea,
      estimatedValue,
      propertyType: propertyData.propertyType
    });

    return estimatedValue;

  } catch (error) {
    console.error('Error calculating estimated value:', error);
    return 0;
  }
}

function getRegionalEstimate(postalCode?: string, city?: string): number {
  // Very basic regional estimates for Norwegian housing market
  const regionalPrices: { [key: string]: number } = {
    'oslo': 4500000,
    'bergen': 3500000,
    'stavanger': 3200000,
    'trondheim': 2800000,
    'kristiansand': 2500000,
    'tromsø': 2200000,
    'drammen': 2800000,
    'fredrikstad': 2300000,
    'sandnes': 3000000,
    'ålesund': 2400000
  };

  if (city) {
    const cityKey = city.toLowerCase().replace(/å/g, 'å').replace(/ø/g, 'ø').replace(/æ/g, 'æ');
    if (regionalPrices[cityKey]) {
      return regionalPrices[cityKey];
    }
  }

  if (postalCode) {
    const prefix = postalCode.substring(0, 1);
    switch (prefix) {
      case '0': case '1': case '2': case '3': // Oslo area
        return 4500000;
      case '4': // Stavanger area
        return 3200000;
      case '5': // Bergen area  
        return 3500000;
      case '7': // Trondheim area
        return 2800000;
      case '9': // Tromsø area
        return 2200000;
      default:
        return 2000000; // Default for other areas
    }
  }

  return 2000000; // National average estimate
}
