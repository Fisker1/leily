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
    console.log('Fetching property data for:', { address, postalCode });
    
    // First, try to get precise address match using Kartverket's address API
    const addressLookup = await getAddressFromKartverket(address, postalCode);
    
    if (addressLookup && addressLookup.success) {
      // Get additional property details using matrikkel API
      const propertyDetails = await getPropertyDetailsFromMatrikkel(addressLookup.data);
      
      return {
        success: true,
        data: {
          ...addressLookup.data,
          ...propertyDetails.data,
          municipality: addressLookup.data.municipality,
          county: addressLookup.data.county,
          coordinates: addressLookup.data.coordinates,
        }
      };
    }
    
    // Fallback to basic search
    return await basicKartverketSearch(address, postalCode);
    
  } catch (error) {
    console.error('Kartverket API error:', error);
    return { success: false, error: error.message };
  }
}

async function getAddressFromKartverket(address: string, postalCode?: string) {
  try {
    const searchQuery = postalCode ? `${address}, ${postalCode}` : address;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Use updated Kartverket Adresseregister API
    const apiUrl = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodedQuery}&fuzzy=false&asciiKompatibel=true&utkoordsys=4326&treffPerSide=1`;
    
    console.log('Kartverket Address API request:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'LeiyApp/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('Address API error:', response.status, response.statusText);
      return { success: false, error: 'Failed to fetch address data' };
    }

    const data = await response.json();
    console.log('Address API response:', data);

    if (data && data.adresser && data.adresser.length > 0) {
      const addressData = data.adresser[0];
      
      return {
        success: true,
        data: {
          propertyId: addressData.matrikkeladresse?.matrikkelId,
          municipality: addressData.kommunenavn,
          county: addressData.fylkesnavn,
          postalCode: addressData.postnummer,
          postalPlace: addressData.poststed,
          coordinates: {
            lat: addressData.representasjonspunkt?.lat,
            lng: addressData.representasjonspunkt?.lon
          },
          fullAddress: addressData.adressetekst,
          buildingId: addressData.bygningsnummer
        }
      };
    }

    return { success: false, error: 'No address found' };
    
  } catch (error) {
    console.error('Address lookup error:', error);
    return { success: false, error: error.message };
  }
}

async function getPropertyDetailsFromMatrikkel(addressData: any) {
  try {
    if (!addressData.propertyId) {
      return { success: false, error: 'No property ID available' };
    }
    
    // Use Kartverket's Matrikkelen API for detailed property information
    const matrikkelUrl = `https://ws.geonorge.no/matrikkelenhet/v1/matrikkelenhet/${addressData.propertyId}`;
    
    console.log('Matrikkel API request:', matrikkelUrl);
    
    const response = await fetch(matrikkelUrl, {
      headers: {
        'User-Agent': 'LeiyApp/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('Matrikkel API error:', response.status);
      return { success: false, error: 'Failed to fetch property details' };
    }

    const propertyData = await response.json();
    console.log('Property details response:', propertyData);

    return {
      success: true,
      data: {
        area: propertyData.teigAreal,
        propertyType: propertyData.grunnkrets?.navn,
        cadastralNumber: propertyData.matrikkelNummer,
        propertyUse: propertyData.bruksareal
      }
    };
    
  } catch (error) {
    console.error('Property details error:', error);
    return { success: false, error: error.message };
  }
}

async function basicKartverketSearch(address: string, postalCode?: string) {
  try {
    // Fallback to old search method with improved URL
    const searchQuery = postalCode ? `${address}, ${postalCode}` : address;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    const geocodeUrl = `https://ws.geonorge.no/SKWS3Index/ssr/sok?navn=${encodedQuery}&epsgKode=4326&kategori=matrikkelenhet&antPerSide=1`;
    
    console.log('Basic Kartverket search:', geocodeUrl);
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'LeiyApp/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, error: 'Basic search failed' };
    }

    const data = await response.json();
    
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

    return { success: false, error: 'No property data found in basic search' };
    
  } catch (error) {
    console.error('Basic search error:', error);
    return { success: false, error: error.message };
  }
}

function calculateEstimatedValue(propertyData: any, postalCode?: string): number {
  try {
    console.log('Calculating property value with data:', propertyData);
    
    // Updated 2024/2025 Norwegian housing market data (NOK per sqm)
    const regionalPrices: { [key: string]: number } = {
      // Oslo detailed areas
      '0': 95000,   // Oslo centrum (increased from 80k)
      '1': 85000,   // Oslo west  
      '2': 75000,   // Oslo east
      '3': 70000,   // Oslo north/south
      
      // Major cities (updated prices)
      '40': 55000,  // Stavanger/Sandnes
      '41': 50000,  // Haugesund
      '50': 60000,  // Bergen (increased due to market growth)
      '51': 45000,  // Bergen surroundings
      '60': 42000,  // Ålesund
      '70': 50000,  // Trondheim (increased)
      '71': 40000,  // Trondheim area
      '80': 38000,  // Bodø
      '90': 45000,  // Tromsø (increased due to scarcity)
      
      // Additional areas
      '15': 60000,  // Asker/Bærum
      '16': 55000,  // Romerike
      '17': 50000,  // Follo
      '30': 48000,  // Drammen
      '35': 45000,  // Halden/Sarpsborg
      '47': 42000,  // Kristiansand
    };

    // Default base price for smaller towns/rural areas
    let pricePerSqm = 38000; // Increased from 35k
    
    if (postalCode) {
      // Try exact postal code first (for very specific areas)
      if (regionalPrices[postalCode.substring(0, 2)]) {
        pricePerSqm = regionalPrices[postalCode.substring(0, 2)];
      } else if (regionalPrices[postalCode.substring(0, 1)]) {
        pricePerSqm = regionalPrices[postalCode.substring(0, 1)];
      }
    }

    // Determine property area (priority order: building area > plot area > default)
    let estimatedArea = 85; // Updated average apartment size in Norway
    
    if (propertyData.propertyUse && propertyData.propertyUse > 30) {
      estimatedArea = propertyData.propertyUse; // Building area
    } else if (propertyData.area && propertyData.area < 2000 && propertyData.area > 30) {
      estimatedArea = propertyData.area; // Use area if reasonable size for dwelling
    }

    // Property type adjustments (more nuanced)
    let typeMultiplier = 1.0;
    const propertyType = propertyData.propertyType?.toLowerCase() || '';
    
    if (propertyType.includes('enebolig') || propertyType.includes('villa')) {
      typeMultiplier = 1.15; // Premium for houses
      estimatedArea = Math.max(estimatedArea, 120); // Min area for houses
    } else if (propertyType.includes('rekkehus') || propertyType.includes('tomannsbolig')) {
      typeMultiplier = 1.08;
      estimatedArea = Math.max(estimatedArea, 100);
    } else if (propertyType.includes('leilighet')) {
      typeMultiplier = 1.0; // Base price for apartments
    } else if (propertyType.includes('hytte') || propertyType.includes('fritid')) {
      typeMultiplier = 0.6; // Cabins are cheaper per sqm
      pricePerSqm *= 0.7;
    }

    // Location-specific adjustments
    const municipality = propertyData.municipality?.toLowerCase() || '';
    if (municipality.includes('oslo')) {
      typeMultiplier *= 1.05; // Oslo premium
    } else if (municipality.includes('bergen') || municipality.includes('stavanger')) {
      typeMultiplier *= 1.02; // Other major city premium
    }

    // Calculate final estimated value
    const baseValue = pricePerSqm * estimatedArea * typeMultiplier;
    
    // Add some market variance (±5%)
    const marketVariance = 0.95 + (Math.random() * 0.1);
    const estimatedValue = Math.round(baseValue * marketVariance);
    
    console.log('Value calculation details:', {
      pricePerSqm,
      estimatedArea,
      typeMultiplier,
      baseValue,
      marketVariance,
      estimatedValue,
      propertyType: propertyData.propertyType,
      municipality: propertyData.municipality
    });

    return estimatedValue;

  } catch (error) {
    console.error('Value calculation error:', error);
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
