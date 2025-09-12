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
      const estimatedValue = calculateEstimatedValue(propertyData.data, postalCode, address);
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

function calculateEstimatedValue(propertyData: any, postalCode?: string, address?: string): number {
  try {
    console.log('Calculating property value with data:', propertyData, 'Address:', address, 'Postal code:', postalCode);
    
    // Mer detaljerte priser basert på 4-sifret postnummer for bedre oppløsning
    const detailedRegionalPrices: { [key: string]: number } = {
      // Oslo - svært detaljert
      '0101': 120000, '0102': 115000, '0103': 110000, '0104': 105000, '0105': 100000,
      '0150': 110000, '0151': 105000, '0152': 100000, '0153': 98000, '0154': 96000, '0155': 102000,
      '0160': 95000, '0161': 92000, '0162': 90000, '0163': 88000, '0164': 85000, '0165': 83000,
      '0170': 88000, '0171': 86000, '0172': 84000, '0173': 82000, '0174': 80000, '0175': 78000,
      '0180': 85000, '0181': 83000, '0182': 81000, '0183': 79000, '0184': 77000, '0185': 75000,
      '0190': 82000, '0191': 80000, '0192': 78000, '0193': 76000, '0194': 74000, '0195': 72000,
      '0250': 92000, '0251': 90000, '0252': 88000, '0253': 86000, '0254': 84000, '0255': 82000,
      '0260': 80000, '0261': 78000, '0262': 76000, '0263': 74000, '0264': 72000, '0265': 70000,
      '0270': 75000, '0271': 73000, '0272': 71000, '0273': 69000, '0274': 67000, '0275': 65000,
      '0280': 72000, '0281': 70000, '0282': 68000, '0283': 66000, '0284': 64000, '0285': 62000,
      '0290': 69000, '0291': 67000, '0292': 65000, '0293': 63000, '0294': 61000, '0295': 59000,
      
      // Bergen detaljert
      '5003': 75000, '5004': 73000, '5005': 71000, '5006': 69000, '5007': 67000,
      '5010': 65000, '5011': 63000, '5012': 61000, '5013': 59000, '5014': 57000, '5015': 55000,
      '5020': 58000, '5021': 56000, '5022': 54000, '5023': 52000, '5024': 50000, '5025': 48000,
      '5030': 53000, '5031': 51000, '5032': 49000, '5033': 47000, '5034': 45000, '5035': 43000,
      
      // Stavanger detaljert
      '4001': 68000, '4002': 66000, '4003': 64000, '4004': 62000, '4005': 60000, '4006': 58000,
      '4010': 56000, '4011': 54000, '4012': 52000, '4013': 50000, '4014': 48000, '4015': 46000,
      '4020': 49000, '4021': 47000, '4022': 45000, '4023': 43000, '4024': 41000, '4025': 39000,
      
      // Trondheim detaljert
      '7001': 58000, '7002': 56000, '7003': 54000, '7004': 52000, '7005': 50000, '7006': 48000,
      '7010': 46000, '7011': 44000, '7012': 42000, '7013': 40000, '7014': 38000, '7015': 36000,
      
      // Andre byer
      '3001': 55000, '3002': 53000, '3003': 51000, // Drammen
      '1400': 52000, '1401': 50000, '1402': 48000, // Ski/Follo
      '2000': 49000, '2001': 47000, '2002': 45000, // Lillestrøm
    };

    // Fallback til 2-sifret postnummer
    const broadRegionalPrices: { [key: string]: number } = {
      '01': 85000, '02': 75000, '03': 70000, '04': 65000, '05': 60000,
      '10': 55000, '11': 52000, '12': 50000, '13': 48000, '14': 52000, '15': 60000,
      '20': 50000, '21': 48000, '22': 46000, '23': 44000, '24': 42000, '25': 40000,
      '30': 48000, '31': 46000, '32': 44000, '33': 42000, '34': 40000, '35': 45000,
      '40': 55000, '41': 50000, '42': 48000, '43': 46000, '44': 44000, '45': 42000,
      '50': 60000, '51': 45000, '52': 43000, '53': 41000, '54': 39000, '55': 37000,
      '60': 42000, '61': 40000, '62': 38000, '63': 36000, '64': 34000, '65': 32000,
      '70': 50000, '71': 40000, '72': 38000, '73': 36000, '74': 34000, '75': 32000,
      '80': 38000, '81': 36000, '82': 34000, '83': 32000, '84': 30000, '85': 28000,
      '90': 45000, '91': 30000, '92': 28000, '93': 26000, '94': 24000, '95': 22000,
    };

    // Start med standard pris
    let pricePerSqm = 38000;
    
    if (postalCode) {
      // Prøv først 4-sifret postnummer for høy oppløsning
      if (detailedRegionalPrices[postalCode]) {
        pricePerSqm = detailedRegionalPrices[postalCode];
      } else if (broadRegionalPrices[postalCode.substring(0, 2)]) {
        pricePerSqm = broadRegionalPrices[postalCode.substring(0, 2)];
      }
    }

    // Bestem areal med bedre logikk
    let estimatedArea = 85;
    
    if (propertyData.propertyUse && propertyData.propertyUse > 30 && propertyData.propertyUse < 500) {
      estimatedArea = propertyData.propertyUse;
    } else if (propertyData.area && propertyData.area > 30 && propertyData.area < 300) {
      estimatedArea = propertyData.area;
    }

    // Avanserte justeringer basert på adresse
    let locationMultiplier = 1.0;
    let ageMultiplier = 1.0;
    let typeMultiplier = 1.0;
    
    if (address) {
      const addr = address.toLowerCase();
      
      // Prestisjegater i Oslo
      if (addr.includes('karl johans gate') || addr.includes('stortingsgata') || 
          addr.includes('drammensveien') || addr.includes('frognerveien')) {
        locationMultiplier *= 1.25;
      } else if (addr.includes('grünerløkka') || addr.includes('majorstuen') || 
                addr.includes('frogner') || addr.includes('st. hanshaugen')) {
        locationMultiplier *= 1.15;
      } else if (addr.includes('sentrum') || addr.includes('centrum') || 
                addr.includes('torget') || addr.includes('storgata')) {
        locationMultiplier *= 1.08;
      }
      
      // Byggeår estimering basert på gatenavn/område (norsk navnemønster)
      if (addr.includes('nye ') || addr.includes('modern') || addr.includes('campus')) {
        ageMultiplier = 1.1; // Nyere bygg
      } else if (addr.includes('gamle ') || addr.includes('historisk')) {
        ageMultiplier = 0.95; // Eldre bygg
      }
    }

    // Eiendomstype-justeringer
    const propertyType = propertyData.propertyType?.toLowerCase() || '';
    if (propertyType.includes('enebolig') || propertyType.includes('villa')) {
      typeMultiplier = 1.2;
      estimatedArea = Math.max(estimatedArea, 130);
    } else if (propertyType.includes('rekkehus') || propertyType.includes('tomannsbolig')) {
      typeMultiplier = 1.1;
      estimatedArea = Math.max(estimatedArea, 110);
    } else if (propertyType.includes('leilighet')) {
      typeMultiplier = 1.0;
      // Juster basert på størrelse
      if (estimatedArea < 50) typeMultiplier *= 0.9; // Små leiligheter
      else if (estimatedArea > 120) typeMultiplier *= 1.1; // Store leiligheter
    }

    // Kommunal justering
    const municipality = propertyData.municipality?.toLowerCase() || '';
    if (municipality.includes('oslo')) {
      locationMultiplier *= 1.08;
    } else if (municipality.includes('bærum') || municipality.includes('asker')) {
      locationMultiplier *= 1.12;
    } else if (municipality.includes('bergen') || municipality.includes('stavanger')) {
      locationMultiplier *= 1.04;
    }

    // Koordinat-baserte justeringer (nærhet til sentrum)
    if (propertyData.coordinates) {
      const { lat, lng } = propertyData.coordinates;
      
      // Oslo sentrum koordinater
      if (lat >= 59.9 && lat <= 59.92 && lng >= 10.7 && lng <= 10.77) {
        locationMultiplier *= 1.15; // Nær Oslo sentrum
      }
      // Bergen sentrum
      else if (lat >= 60.38 && lat <= 60.4 && lng >= 5.31 && lng <= 5.33) {
        locationMultiplier *= 1.1; // Nær Bergen sentrum
      }
    }

    // Beregn endelig verdi
    const baseValue = pricePerSqm * estimatedArea * typeMultiplier * locationMultiplier * ageMultiplier;
    
    // Mer deterministisk variasjon basert på adresse (ikke tilfeldig)
    let addressVariance = 1.0;
    if (address) {
      // Bruk hash av adresse for konsistent variasjon
      const hash = address.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      addressVariance = 0.92 + ((Math.abs(hash) % 160) / 1000); // 0.92-1.08
    }
    
    const estimatedValue = Math.round(baseValue * addressVariance);
    
    console.log('Detaljert verdiberegning:', {
      address,
      postalCode,
      pricePerSqm,
      estimatedArea,
      typeMultiplier,
      locationMultiplier,
      ageMultiplier,
      addressVariance,
      baseValue,
      estimatedValue,
      propertyType: propertyData.propertyType,
      municipality: propertyData.municipality
    });

    return Math.max(estimatedValue, 100000); // Minimum verdi

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
