import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  current_rent?: number;
}

interface MarketData {
  averageRent: number;
  medianRent: number;
  rentRange: {
    min: number;
    max: number;
  };
  marketTrend: string;
  dataSource: string;
  lastUpdated: string;
  municipality: string;
  propertyType: string;
}

// Helper function to get municipality from postal code
function getMunicipalityFromPostalCode(postalCode: string): string {
  const postalCodeMunicipalities: { [key: string]: string } = {
    // Oslo
    '0001': 'Oslo', '0010': 'Oslo', '0015': 'Oslo', '0020': 'Oslo', '0025': 'Oslo',
    '0030': 'Oslo', '0040': 'Oslo', '0050': 'Oslo', '0080': 'Oslo', '0100': 'Oslo',
    '0150': 'Oslo', '0155': 'Oslo', '0160': 'Oslo', '0170': 'Oslo', '0180': 'Oslo',
    '0190': 'Oslo', '0200': 'Oslo', '0250': 'Oslo', '0260': 'Oslo', '0270': 'Oslo',
    '0280': 'Oslo', '0283': 'Oslo', '0301': 'Oslo', '0302': 'Oslo', '0303': 'Oslo',
    '0304': 'Oslo', '0309': 'Oslo', '0310': 'Oslo', '0311': 'Oslo', '0312': 'Oslo',
    '0313': 'Oslo', '0314': 'Oslo', '0315': 'Oslo', '0316': 'Oslo', '0317': 'Oslo',
    '0318': 'Oslo', '0319': 'Oslo', '0349': 'Oslo', '0350': 'Oslo', '0351': 'Oslo',
    '0352': 'Oslo', '0353': 'Oslo', '0354': 'Oslo', '0355': 'Oslo', '0356': 'Oslo',
    '0357': 'Oslo', '0358': 'Oslo', '0359': 'Oslo', '0360': 'Oslo', '0361': 'Oslo',
    '0362': 'Oslo', '0363': 'Oslo', '0364': 'Oslo', '0365': 'Oslo', '0366': 'Oslo',
    '0367': 'Oslo', '0368': 'Oslo', '0369': 'Oslo', '0370': 'Oslo', '0371': 'Oslo',
    '0372': 'Oslo', '0373': 'Oslo', '0374': 'Oslo', '0375': 'Oslo', '0376': 'Oslo',
    '0377': 'Oslo', '0378': 'Oslo', '0379': 'Oslo', '0380': 'Oslo', '0381': 'Oslo',
    '0382': 'Oslo', '0383': 'Oslo', '0401': 'Oslo', '0402': 'Oslo', '0403': 'Oslo',
    '0404': 'Oslo', '0405': 'Oslo', '0406': 'Oslo', '0407': 'Oslo', '0450': 'Oslo',
    '0451': 'Oslo', '0452': 'Oslo', '0453': 'Oslo', '0454': 'Oslo', '0455': 'Oslo',
    '0456': 'Oslo', '0457': 'Oslo', '0458': 'Oslo', '0459': 'Oslo', '0460': 'Oslo',
    '0461': 'Oslo', '0462': 'Oslo', '0463': 'Oslo', '0464': 'Oslo', '0465': 'Oslo',
    '0466': 'Oslo', '0467': 'Oslo', '0468': 'Oslo', '0469': 'Oslo', '0470': 'Oslo',
    '0471': 'Oslo', '0472': 'Oslo', '0473': 'Oslo', '0474': 'Oslo', '0475': 'Oslo',
    '0476': 'Oslo', '0477': 'Oslo', '0478': 'Oslo', '0479': 'Oslo', '0480': 'Oslo',
    '0481': 'Oslo', '0482': 'Oslo', '0484': 'Oslo', '0485': 'Oslo', '0486': 'Oslo',
    '0487': 'Oslo', '0488': 'Oslo', '0489': 'Oslo', '0490': 'Oslo', '0491': 'Oslo',
    '0492': 'Oslo', '0493': 'Oslo', '0494': 'Oslo', '0495': 'Oslo', '0496': 'Oslo',
    '0497': 'Oslo', '0498': 'Oslo', '0499': 'Oslo', '0550': 'Oslo', '0551': 'Oslo',
    '0552': 'Oslo', '0553': 'Oslo', '0554': 'Oslo', '0555': 'Oslo', '0556': 'Oslo',
    '0557': 'Oslo', '0558': 'Oslo', '0559': 'Oslo', '0560': 'Oslo', '0561': 'Oslo',
    '0562': 'Oslo', '0563': 'Oslo', '0564': 'Oslo', '0565': 'Oslo', '0566': 'Oslo',
    '0567': 'Oslo', '0568': 'Oslo', '0569': 'Oslo', '0570': 'Oslo', '0571': 'Oslo',
    '0572': 'Oslo', '0573': 'Oslo', '0574': 'Oslo', '0575': 'Oslo', '0576': 'Oslo',
    '0577': 'Oslo', '0578': 'Oslo', '0579': 'Oslo', '0580': 'Oslo', '0581': 'Oslo',
    '0582': 'Oslo', '0583': 'Oslo', '0584': 'Oslo', '0585': 'Oslo', '0586': 'Oslo',
    '0587': 'Oslo', '0588': 'Oslo', '0589': 'Oslo', '0590': 'Oslo', '0591': 'Oslo',
    '0592': 'Oslo', '0593': 'Oslo', '0594': 'Oslo', '0595': 'Oslo', '0596': 'Oslo',
    '0597': 'Oslo', '0598': 'Oslo', '0599': 'Oslo',
    // Bergen
    '5003': 'Bergen', '5004': 'Bergen', '5005': 'Bergen', '5006': 'Bergen', '5007': 'Bergen',
    '5008': 'Bergen', '5009': 'Bergen', '5010': 'Bergen', '5011': 'Bergen', '5012': 'Bergen',
    '5013': 'Bergen', '5014': 'Bergen', '5015': 'Bergen', '5016': 'Bergen', '5017': 'Bergen',
    '5018': 'Bergen', '5019': 'Bergen', '5020': 'Bergen', '5021': 'Bergen', '5022': 'Bergen',
    '5023': 'Bergen', '5024': 'Bergen', '5025': 'Bergen', '5026': 'Bergen', '5027': 'Bergen',
    '5028': 'Bergen', '5029': 'Bergen', '5030': 'Bergen', '5031': 'Bergen', '5032': 'Bergen',
    '5033': 'Bergen', '5034': 'Bergen', '5035': 'Bergen', '5036': 'Bergen', '5037': 'Bergen',
    '5038': 'Bergen', '5039': 'Bergen', '5040': 'Bergen', '5041': 'Bergen', '5042': 'Bergen',
    '5043': 'Bergen', '5044': 'Bergen', '5045': 'Bergen', '5046': 'Bergen', '5047': 'Bergen',
    '5048': 'Bergen', '5049': 'Bergen', '5050': 'Bergen', '5051': 'Bergen', '5052': 'Bergen',
    '5053': 'Bergen', '5054': 'Bergen', '5055': 'Bergen', '5056': 'Bergen', '5057': 'Bergen',
    '5058': 'Bergen', '5059': 'Bergen', '5060': 'Bergen', '5061': 'Bergen', '5062': 'Bergen',
    '5063': 'Bergen', '5064': 'Bergen', '5065': 'Bergen', '5066': 'Bergen', '5067': 'Bergen',
    '5068': 'Bergen', '5069': 'Bergen', '5070': 'Bergen', '5071': 'Bergen', '5072': 'Bergen',
    '5073': 'Bergen', '5074': 'Bergen', '5075': 'Bergen', '5076': 'Bergen', '5077': 'Bergen',
    '5078': 'Bergen', '5079': 'Bergen', '5080': 'Bergen', '5081': 'Bergen', '5082': 'Bergen',
    '5083': 'Bergen', '5084': 'Bergen', '5085': 'Bergen', '5086': 'Bergen', '5087': 'Bergen',
    '5088': 'Bergen', '5089': 'Bergen', '5090': 'Bergen', '5091': 'Bergen', '5092': 'Bergen',
    '5093': 'Bergen', '5094': 'Bergen', '5095': 'Bergen', '5096': 'Bergen', '5097': 'Bergen',
    '5098': 'Bergen', '5099': 'Bergen',
    // Trondheim
    '7010': 'Trondheim', '7011': 'Trondheim', '7012': 'Trondheim', '7013': 'Trondheim',
    '7014': 'Trondheim', '7015': 'Trondheim', '7016': 'Trondheim', '7017': 'Trondheim',
    '7018': 'Trondheim', '7019': 'Trondheim', '7020': 'Trondheim', '7021': 'Trondheim',
    '7022': 'Trondheim', '7023': 'Trondheim', '7024': 'Trondheim', '7025': 'Trondheim',
    '7026': 'Trondheim', '7027': 'Trondheim', '7028': 'Trondheim', '7029': 'Trondheim',
    '7030': 'Trondheim', '7031': 'Trondheim', '7032': 'Trondheim', '7033': 'Trondheim',
    '7034': 'Trondheim', '7035': 'Trondheim', '7036': 'Trondheim', '7037': 'Trondheim',
    '7038': 'Trondheim', '7039': 'Trondheim', '7040': 'Trondheim', '7041': 'Trondheim',
    '7042': 'Trondheim', '7043': 'Trondheim', '7044': 'Trondheim', '7045': 'Trondheim',
    '7046': 'Trondheim', '7047': 'Trondheim', '7048': 'Trondheim', '7049': 'Trondheim',
    '7050': 'Trondheim', '7051': 'Trondheim', '7052': 'Trondheim', '7053': 'Trondheim',
    '7054': 'Trondheim', '7055': 'Trondheim', '7056': 'Trondheim', '7057': 'Trondheim',
    '7058': 'Trondheim', '7059': 'Trondheim', '7060': 'Trondheim', '7061': 'Trondheim',
    '7062': 'Trondheim', '7063': 'Trondheim', '7064': 'Trondheim', '7065': 'Trondheim',
    '7066': 'Trondheim', '7067': 'Trondheim', '7068': 'Trondheim', '7069': 'Trondheim',
    '7070': 'Trondheim', '7071': 'Trondheim', '7072': 'Trondheim', '7073': 'Trondheim',
    '7074': 'Trondheim', '7075': 'Trondheim', '7076': 'Trondheim', '7077': 'Trondheim',
    '7078': 'Trondheim', '7079': 'Trondheim', '7080': 'Trondheim', '7081': 'Trondheim',
    '7082': 'Trondheim', '7083': 'Trondheim', '7084': 'Trondheim', '7085': 'Trondheim',
    '7086': 'Trondheim', '7087': 'Trondheim', '7088': 'Trondheim', '7089': 'Trondheim',
    '7090': 'Trondheim', '7091': 'Trondheim', '7092': 'Trondheim', '7093': 'Trondheim',
    '7094': 'Trondheim', '7095': 'Trondheim', '7096': 'Trondheim', '7097': 'Trondheim',
    '7098': 'Trondheim', '7099': 'Trondheim',
    // Stavanger
    '4001': 'Stavanger', '4002': 'Stavanger', '4003': 'Stavanger', '4004': 'Stavanger',
    '4005': 'Stavanger', '4006': 'Stavanger', '4007': 'Stavanger', '4008': 'Stavanger',
    '4009': 'Stavanger', '4010': 'Stavanger', '4011': 'Stavanger', '4012': 'Stavanger',
    '4013': 'Stavanger', '4014': 'Stavanger', '4015': 'Stavanger', '4016': 'Stavanger',
    '4017': 'Stavanger', '4018': 'Stavanger', '4019': 'Stavanger', '4020': 'Stavanger',
    '4021': 'Stavanger', '4022': 'Stavanger', '4023': 'Stavanger', '4024': 'Stavanger',
    '4025': 'Stavanger', '4026': 'Stavanger', '4027': 'Stavanger', '4028': 'Stavanger',
    '4029': 'Stavanger', '4030': 'Stavanger', '4031': 'Stavanger', '4032': 'Stavanger',
    '4033': 'Stavanger', '4034': 'Stavanger', '4035': 'Stavanger', '4036': 'Stavanger',
    '4037': 'Stavanger', '4038': 'Stavanger', '4039': 'Stavanger', '4040': 'Stavanger',
    '4041': 'Stavanger', '4042': 'Stavanger', '4043': 'Stavanger', '4044': 'Stavanger',
    '4045': 'Stavanger', '4046': 'Stavanger', '4047': 'Stavanger', '4048': 'Stavanger',
    '4049': 'Stavanger', '4050': 'Stavanger', '4051': 'Stavanger', '4052': 'Stavanger',
    '4053': 'Stavanger', '4054': 'Stavanger', '4055': 'Stavanger', '4056': 'Stavanger',
    '4057': 'Stavanger', '4058': 'Stavanger', '4059': 'Stavanger', '4060': 'Stavanger',
    '4061': 'Stavanger', '4062': 'Stavanger', '4063': 'Stavanger', '4064': 'Stavanger',
    '4065': 'Stavanger', '4066': 'Stavanger', '4067': 'Stavanger', '4068': 'Stavanger',
    '4069': 'Stavanger', '4070': 'Stavanger', '4071': 'Stavanger', '4072': 'Stavanger',
    '4073': 'Stavanger', '4074': 'Stavanger', '4075': 'Stavanger', '4076': 'Stavanger',
    '4077': 'Stavanger', '4078': 'Stavanger', '4079': 'Stavanger', '4080': 'Stavanger',
    '4081': 'Stavanger', '4082': 'Stavanger', '4083': 'Stavanger', '4084': 'Stavanger',
    '4085': 'Stavanger', '4086': 'Stavanger', '4087': 'Stavanger', '4088': 'Stavanger',
    '4089': 'Stavanger', '4090': 'Stavanger', '4091': 'Stavanger', '4092': 'Stavanger',
    '4093': 'Stavanger', '4094': 'Stavanger', '4095': 'Stavanger', '4096': 'Stavanger',
    '4097': 'Stavanger', '4098': 'Stavanger', '4099': 'Stavanger',
    // Lofoten/Nordland
    '8300': 'Svolvær', '8301': 'Svolvær', '8302': 'Svolvær', '8303': 'Svolvær',
    '8304': 'Svolvær', '8305': 'Svolvær', '8306': 'Svolvær', '8307': 'Svolvær',
    '8308': 'Svolvær', '8309': 'Svolvær', '8310': 'Svolvær', '8311': 'Svolvær',
    '8312': 'Svolvær', '8313': 'Svolvær', '8314': 'Svolvær', '8315': 'Svolvær',
    '8316': 'Svolvær', '8317': 'Svolvær', '8318': 'Svolvær', '8319': 'Svolvær',
    '8320': 'Reine', '8321': 'Reine', '8322': 'Reine', '8323': 'Reine',
    '8324': 'Reine', '8325': 'Reine', '8326': 'Reine', '8327': 'Reine',
    '8328': 'Reine', '8329': 'Reine', '8330': 'Reine', '8331': 'Reine',
    '8332': 'Reine', '8333': 'Reine', '8334': 'Reine', '8335': 'Reine',
    '8336': 'Reine', '8337': 'Reine', '8338': 'Reine', '8339': 'Reine',
    '8340': 'Leknes', '8341': 'Leknes', '8342': 'Leknes', '8343': 'Leknes',
    '8344': 'Leknes', '8345': 'Leknes', '8346': 'Leknes', '8347': 'Leknes',
    '8348': 'Leknes', '8349': 'Leknes', '8350': 'Leknes', '8351': 'Leknes',
    '8352': 'Leknes', '8353': 'Leknes', '8354': 'Leknes', '8355': 'Leknes',
    '8356': 'Leknes', '8357': 'Leknes', '8358': 'Leknes', '8359': 'Leknes',
  };

  return postalCodeMunicipalities[postalCode] || 'Ukjent kommune';
}

// Function to fetch rental data from SSB (Statistics Norway)
async function fetchSSBRentalData(municipality: string, propertyType: string, sizeSqm: number): Promise<MarketData | null> {
  try {
    console.log('📊 Fetching rental data from SSB API...');
    
    // SSB table for rental prices is 07241 - Leiepriser for boliger, etter region og boligtype
    const ssbApiUrl = 'https://data.ssb.no/api/v0/no/table/07241';
    
    // Map municipality to SSB region codes
    const municipalityToRegion: { [key: string]: string } = {
      'Oslo': '0301',
      'Bergen': '4601', 
      'Trondheim': '5001',
      'Stavanger': '1103',
      'Kristiansand': '1001',
      // Add more mappings as needed
    };
    
    const regionCode = municipalityToRegion[municipality] || '0301'; // Default to Oslo
    
    // Map property types to SSB housing types
    const propertyTypeMapping: { [key: string]: string } = {
      'Leilighet': '01',
      'Enebolig': '02', 
      'Tomannsbolig': '03',
      'Rekkehus': '04'
    };
    
    const housingType = propertyTypeMapping[propertyType] || '01'; // Default to apartment
    
    const requestBody = {
      "query": [
        {
          "code": "Region",
          "selection": {
            "filter": "item",
            "values": [regionCode]
          }
        },
        {
          "code": "Boligtype",
          "selection": {
            "filter": "item", 
            "values": [housingType]
          }
        },
        {
          "code": "ContentsCode",
          "selection": {
            "filter": "item",
            "values": ["LeieKrPerMnd"]
          }
        }
      ],
      "response": {
        "format": "json-stat2"
      }
    };
    
    console.log('🔍 SSB API request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(ssbApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📈 SSB API response:', JSON.stringify(data, null, 2));
      
      if (data.value && data.value.length > 0) {
        // Get the most recent value
        const latestRent = data.value[data.value.length - 1];
        
        if (latestRent && typeof latestRent === 'number') {
          console.log('✅ Successfully fetched SSB rental data:', latestRent);
          
          // Adjust for property size (SSB gives average rent, we adjust for size)
          const avgSize = 70; // Average apartment size in Norway
          const sizeAdjustedRent = Math.round((latestRent * sizeSqm) / avgSize);
          
          return {
            averageRent: sizeAdjustedRent,
            medianRent: Math.round(sizeAdjustedRent * 0.95),
            rentRange: {
              min: Math.round(sizeAdjustedRent * 0.85),
              max: Math.round(sizeAdjustedRent * 1.15)
            },
            marketTrend: "stabil",
            dataSource: `SSB (Statistisk sentralbyrå) - Tabell 07241`,
            lastUpdated: new Date().toISOString(),
            municipality,
            propertyType
          };
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ SSB API error:', response.status, response.statusText, errorText);
    }
  } catch (error) {
    console.log('❌ SSB API request failed:', error);
  }
  
  return null;
}

// Function to calculate market data with multiple fallbacks
async function calculateMarketData(request: AnalysisRequest): Promise<MarketData> {
  console.log('Calculating market data for:', request);

  const municipality = request.postal_code ? getMunicipalityFromPostalCode(request.postal_code) : (request.city || 'Ukjent');
  const propertyType = request.property_type || 'Leilighet';
  
  // Try SSB API first for official Norwegian rental statistics
  try {
    const ssbData = await fetchSSBRentalData(municipality, propertyType, request.size_sqm || 70);
    if (ssbData) {
      console.log('✅ Using official SSB rental data');
      return ssbData;
    }
  } catch (error) {
    console.log('⚠️ SSB API failed, continuing with fallback:', error);
  }
  
  // Fall back to formula-based calculations
  console.log('📊 Using formula-based market estimates');
  
  let baseRent = 8000; // Realistic base rent for Norwegian market
  
  // Location multipliers (adjusted for realistic Norwegian market)
  const locationMultipliers: { [key: string]: number } = {
    'Oslo': 2.2,       // Oslo is significantly more expensive
    'Bergen': 1.6,     // Bergen is expensive but less than Oslo
    'Trondheim': 1.4,  // University town with high demand
    'Stavanger': 1.8,  // Oil city with higher prices
    'Svolvær': 1.0,    // Tourist area can have higher prices
    'Reine': 0.9,      // Remote but tourist area
    'Leknes': 0.8,     // Smaller town
  };

  // Property type multipliers
  const propertyTypeMultipliers: { [key: string]: number } = {
    'Leilighet': 1.0,
    'Enebolig': 1.4,     // Whole house is more expensive
    'Rekkehus': 1.2,     // Townhouse
    'Tomannsbolig': 1.1, // Duplex
  };

  // Size adjustments
  let sizeMultiplier = 1.0;
  if (request.size_sqm) {
    if (request.size_sqm < 40) sizeMultiplier = 0.7;
    else if (request.size_sqm < 60) sizeMultiplier = 0.85;
    else if (request.size_sqm < 80) sizeMultiplier = 1.0;
    else if (request.size_sqm < 100) sizeMultiplier = 1.15;
    else if (request.size_sqm < 130) sizeMultiplier = 1.3;
    else sizeMultiplier = 1.45;
  }

  const locationMultiplier = locationMultipliers[municipality] || 0.8;
  const propertyTypeMultiplier = propertyTypeMultipliers[propertyType] || 1.0;
  
  const calculatedRent = Math.round(baseRent * locationMultiplier * propertyTypeMultiplier * sizeMultiplier);
  
  console.log('Calculation breakdown:');
  console.log(`  - Base rent: ${baseRent} NOK`);
  console.log(`  - Location (${municipality}): x${locationMultiplier}`);
  console.log(`  - Property type (${propertyType}): x${propertyTypeMultiplier}`);  
  console.log(`  - Size (${request.size_sqm || 70}m²): x${sizeMultiplier}`);
  console.log(`  - Final average rent: ${calculatedRent} NOK`);

  return {
    averageRent: calculatedRent,
    medianRent: Math.round(calculatedRent * 0.95),
    rentRange: {
      min: Math.round(calculatedRent * 0.7),
      max: Math.round(calculatedRent * 1.3)
    },
    marketTrend: "stigende",
    dataSource: "Beregnet estimat basert på markedsdata (SSB API ikke tilgjengelig)",
    lastUpdated: new Date().toISOString(),
    municipality,
    propertyType
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Market analysis function called');
    
    const request: AnalysisRequest = await req.json();
    console.log('Analysis request received:', request);
    
    if (!request.address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calculating market data...');
    const marketData = await calculateMarketData(request);
    
    console.log('Market analysis completed for', request.address, request.city || '');
    
    return new Response(
      JSON.stringify({ marketData }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in market analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});