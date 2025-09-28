import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinnPropertyData {
  finnCode: string;
  title: string;
  address: string;
  price: number; // Prisantydning
  totalPrice?: number; // Totalpris
  additionalCosts?: number; // Omkostninger
  propertyValue?: number; // Formuesverdi
  propertyType: string;
  livingArea: number;
  totalArea?: number;
  balconyArea?: number; // Balkong/Terrasse area
  bedrooms?: number;
  totalRooms?: number; // Total number of rooms
  floor?: string; // Which floor
  yearBuilt?: number;
  energyRating?: string;
  description: string;
  images: string[];
  municipalFees?: number; // Monthly amount
  sharedCosts?: number;
  sharedEquity?: number; // Fellesformue
  monthlyRent?: number;
  loanCostsFrom?: number; // Pris på lån fra X kr/mnd
  
  // Ownership and legal
  ownershipType?: string; // Eier, Selveier, Andel, etc.
  
  // Property features and facilities
  parkingSpaces?: number;
  balcony?: boolean;
  elevator?: boolean;
  garage?: boolean;
  garden?: boolean; // Hage
  terrace?: boolean; // Balkong/Terrasse
  fireplace?: boolean; // Peis/Ildsted
  basement?: boolean; // Kjeller
  attic?: boolean; // Loft
  viewType?: string;
  condition?: string;
  heatingType?: string;
  internetIncluded?: boolean;
  petsAllowed?: boolean; // Kjæledyr tillatt
  smokingAllowed?: boolean;
  furnished?: boolean;
  childFriendly?: boolean; // Barnevennlig
  quietArea?: boolean; // Rolig
  centralLocation?: boolean; // Sentralt
  publicWaterSewer?: boolean; // Offentlig vann/kloakk
  hiking?: boolean; // Turterreng
  chargingStation?: boolean; // Ladestasjon
  internet?: boolean; // Internett/Fiber
  
  // Location and coordinates
  coordinates?: {
    lat: number;
    lng: number;
  };
  neighborhood?: string;
  pricePerSqm?: number;
  
  // Rental specific
  availableFrom?: string;
  depositAmount?: number;
  minRentalPeriod?: number;
  
  // Agent and viewing information
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentTitle?: string; // Partner, Eiendomsmegler, etc.
  agencyName?: string;
  
  // Viewing information
  viewingDates?: Array<{
    date: string;
    timeFrom: string;
    timeTo: string;
    description?: string;
  }>;
  
  // Administrative
  referenceNumber?: string;
  datePublished?: string;
  dateModified?: string;
  
  // Additional building details
  floors?: number; // Antall etasjer
  roomDescription?: string; // Detailed room breakdown
  buildingDescription?: string;
  locationDescription?: string;
  
  // Energy and technical
  energyCertificate?: string;
  waterHeating?: string;
  sewageSystem?: string;
  
  // Calculated fields
  totalMonthlyCosts?: number; // Sum of all monthly costs
}

// Use OpenAI to extract structured data from Finn.no HTML - WITH ENHANCED STRUCTURED DATA PARSING
async function extractFinnDataWithAI(finnCode: string, htmlContent: string): Promise<FinnPropertyData | null> {
  try {
    console.log(`Attempting to extract Finn property data for code: ${finnCode}`);
    
    // FIRST: Try to extract structured data from advertising config (most reliable)
    const advertisingConfigMatch = htmlContent.match(/<script id="advertising-initial-state" type="application\/json">(.*?)<\/script>/s);
    if (advertisingConfigMatch) {
      try {
        const advertisingConfig = JSON.parse(advertisingConfigMatch[1]);
        const targeting = advertisingConfig?.config?.adServer?.gam?.targeting || [];
        
        console.log('Found structured advertising data, extracting property info...');
        
        // Extract data from targeting array
        const getTargetValue = (key: string) => {
          const item = targeting.find((t: any) => t.key === key);
          return item?.value?.[0] || null;
        };
        
        const getTargetValues = (key: string) => {
          const item = targeting.find((t: any) => t.key === key);
          return item?.value || [];
        };
        
        // Extract images from targeting
        const imageIds = getTargetValues('images');
        const images = imageIds.map((id: string) => `https://images.finncdn.no/dynamic/1280w/${id}`);
        
        // Map property type from English to Norwegian
        const mapPropertyType = (type: string) => {
          const typeMap: Record<string, string> = {
            'SEMIDETACHED': 'tomannsbolig',
            'DETACHED': 'enebolig',
            'TERRACED': 'rekkehus',
            'APARTMENT': 'leilighet'
          };
          return typeMap[type] || type.toLowerCase();
        };
        
        // Map ownership type
        const mapOwnershipType = (type: string) => {
          const ownershipMap: Record<string, string> = {
            'FREEHOLD': 'selveier',
            'COOPERATIVE': 'andel',
            'SHARE': 'aksje'
          };
          return ownershipMap[type] || type.toLowerCase();
        };
        
        // Parse facilities into boolean flags
        const facilities = getTargetValues('facilities');
        
        const propertyData: FinnPropertyData = {
          finnCode: finnCode,
          title: advertisingConfig?.config?.pageTitle || `Eiendom ${finnCode}`,
          address: getTargetValue('local_area_name') || 'Adresse ikke tilgjengelig',
          price: parseInt(getTargetValue('price')) || 0,
          propertyType: mapPropertyType(getTargetValue('property_type') || ''),
          ownershipType: mapOwnershipType(getTargetValue('ownership_type') || ''),
          livingArea: parseInt(getTargetValue('primary_size')) || 0,
          totalArea: parseInt(getTargetValue('plot_area')) || undefined,
          bedrooms: parseInt(getTargetValue('bedrooms')) || undefined,
          totalRooms: parseInt(getTargetValue('rooms')) || undefined,
          floor: getTargetValue('floor') || undefined,
          yearBuilt: parseInt(getTargetValue('construction_year')) || undefined,
          description: `Eiendom i ${getTargetValue('local_area_name') || 'Norge'}`,
          images: images,
          
          // Parse facilities into boolean features
          balcony: facilities.some((f: string) => f.includes('Balkong') || f.includes('Terrasse')),
          elevator: facilities.some((f: string) => f.includes('Heis')),
          garage: facilities.some((f: string) => f.includes('Garasje')),
          garden: facilities.some((f: string) => f.includes('Hage')),
          terrace: facilities.some((f: string) => f.includes('Terrasse')),
          fireplace: facilities.some((f: string) => f.includes('Peis') || f.includes('Ildsted')),
          basement: facilities.some((f: string) => f.includes('Kjeller')),
          attic: facilities.some((f: string) => f.includes('Loft')),
          petsAllowed: facilities.some((f: string) => f.includes('Kjæledyr')),
          childFriendly: facilities.some((f: string) => f.includes('Barnevennlig')),
          quietArea: facilities.some((f: string) => f.includes('Rolig')),
          centralLocation: facilities.some((f: string) => f.includes('Sentralt')),
          publicWaterSewer: facilities.some((f: string) => f.includes('Offentlig vann') || f.includes('kloakk')),
          hiking: facilities.some((f: string) => f.includes('Turterreng')),
          chargingStation: facilities.some((f: string) => f.includes('Ladestasjon')),
          internet: facilities.some((f: string) => f.includes('Bredbånd') || f.includes('Fiber')),
          
          coordinates: undefined,
          neighborhood: getTargetValue('local_area_name'),
          pricePerSqm: undefined
        };
        
        // Calculate price per sqm if we have both values
        if (propertyData.price > 0 && propertyData.livingArea > 0) {
          propertyData.pricePerSqm = Math.round(propertyData.price / propertyData.livingArea);
        }
        
        console.log('Successfully extracted property data from structured advertising config:', {
          finnCode: propertyData.finnCode,
          title: propertyData.title,
          price: propertyData.price,
          address: propertyData.address,
          propertyType: propertyData.propertyType,
          livingArea: propertyData.livingArea,
          facilities: facilities
        });
        
        return propertyData;
        
      } catch (error) {
        console.error('Error parsing structured advertising data:', error);
        // Fall through to HTML parsing
      }
    }
    
    // FALLBACK: Try to extract from JSON-LD structured data
    const jsonLdMatches = htmlContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatches) {
      try {
        for (const match of jsonLdMatches) {
          const jsonContent = match.replace(/<script[^>]*type="application\/ld\+json"[^>]*>/, '').replace(/<\/script>/, '');
          const structuredData = JSON.parse(jsonContent);
          
          if (structuredData['@type'] === 'Product' || structuredData['@type'] === 'RealEstate') {
            console.log('Found JSON-LD structured data for property');
            
            const propertyData: FinnPropertyData = {
              finnCode: finnCode,
              title: structuredData.name || `Eiendom ${finnCode}`,
              address: structuredData.address?.streetAddress || 'Adresse ikke tilgjengelig',
              price: structuredData.offers?.price ? parseInt(structuredData.offers.price) : 0,
              propertyType: 'leilighet', // Default, will be refined by AI if needed
              livingArea: 0, // Will be refined by AI
              description: structuredData.description || '',
              images: Array.isArray(structuredData.image) ? structuredData.image : (structuredData.image ? [structuredData.image] : []),
              coordinates: undefined,
              balcony: false,
              elevator: false,
              garage: false,
              garden: false,
              terrace: false,
              fireplace: false,
              basement: false,
              attic: false,
              petsAllowed: false,
              childFriendly: false,
              quietArea: false,
              centralLocation: false,
              publicWaterSewer: false,
              hiking: false,
              chargingStation: false,
              internet: false
            };
            
            console.log('Successfully extracted property data from JSON-LD:', {
              finnCode: propertyData.finnCode,
              title: propertyData.title,
              price: propertyData.price,
              address: propertyData.address
            });
            
            return propertyData;
          }
        }
      } catch (error) {
        console.error('Error parsing JSON-LD data:', error);
      }
    }
    
    // If no structured data found, return a basic fallback
    console.log('No structured data found, creating fallback data');
    return {
      finnCode: finnCode,
      title: `Eiendom ${finnCode}`,
      address: 'Adresse ikke tilgjengelig',
      price: 0,
      propertyType: 'leilighet',
      livingArea: 0,
      description: 'Ingen detaljert beskrivelse tilgjengelig',
      images: [],
      coordinates: undefined,
      balcony: false,
      elevator: false,
      garage: false,
      garden: false,
      terrace: false,
      fireplace: false,
      basement: false,
      attic: false,
      petsAllowed: false,
      childFriendly: false,
      quietArea: false,
      centralLocation: false,
      publicWaterSewer: false,
      hiking: false,
      chargingStation: false,
      internet: false
    };

  } catch (error) {
    console.error('Error extracting Finn property data:', error);
    return null;
  }
}

// Enhanced HTML preprocessing to highlight key data sections with better pattern matching
function preprocessHtmlForPricing(html: string): string {
  console.log('Preprocessing HTML for better AI extraction...');
  
  let processedHtml = html;
  
  // 1. Mark ALL numeric values followed by "kr" with special markers
  processedHtml = processedHtml.replace(
    /(\d{1,3}(?:\s\d{3})*)\s*kr(?!\w)/gi, 
    '\n===CURRENCY_VALUE=== $1 kr ===CURRENCY_VALUE===\n'
  );
  
  // 2. Mark specific price-related terms with their contexts
  processedHtml = processedHtml.replace(
    /(prisantydning|totalpris|omkostninger|formuesverdi|felleskost|kommunale\s+avg)[^<>]*?(\d[\d\s]*)\s*kr/gi,
    '\n===PRICE_SECTION=== $1: $2 kr ===PRICE_SECTION===\n'
  );
  
  // 3. Mark area measurements with enhanced detection
  processedHtml = processedHtml.replace(
    /(\d+)\s*m²(?:\s*\([^)]*\))?/gi,
    '\n===AREA_MEASUREMENT=== $1 m² ===AREA_MEASUREMENT===\n'
  );
  
  // 4. Mark specific area types from Nøkkelinfo section
  processedHtml = processedHtml.replace(
    /(intern\s+bruksareal|bruksareal|boligareal|ekstern\s+bruksareal|tomteareal)[^<>]*?(\d+)\s*m²/gi,
    '\n===SPECIFIC_AREA=== $1: $2 m² ===SPECIFIC_AREA===\n'
  );
  
  // 5. Mark room count information
  processedHtml = processedHtml.replace(
    /(soverom|antall\s+rom)[^<>]*?(\d+)/gi,
    '\n===ROOM_INFO=== $1: $2 ===ROOM_INFO===\n'
  );
  
  // 6. Mark building year information
  processedHtml = processedHtml.replace(
    /(byggeår|bygget)[^<>]*?(19\d{2}|20\d{2})/gi,
    '\n===YEAR_INFO=== $1: $2 ===YEAR_INFO===\n'
  );
  
  // 7. Mark property type information
  processedHtml = processedHtml.replace(
    /(boligtype|eieform)[^<>]*?(leilighet|enebolig|rekkehus|tomannsbolig|eier|selveier|andel|aksje)/gi,
    '\n===PROPERTY_TYPE=== $1: $2 ===PROPERTY_TYPE===\n'
  );
  
  // 8. Highlight table rows and data structures that might contain key info
  processedHtml = processedHtml.replace(
    /<tr[^>]*>[\s\S]*?<\/tr>/gi,
    '\n===TABLE_ROW_START===\n$&\n===TABLE_ROW_END===\n'
  );
  
  // 9. Highlight definition lists which are common in property descriptions
  processedHtml = processedHtml.replace(
    /<dl[^>]*>[\s\S]*?<\/dl>/gi,
    '\n===DEFINITION_LIST_START===\n$&\n===DEFINITION_LIST_END===\n'
  );
  
  // 10. Mark structured sections that might contain nøkkelinfo
  processedHtml = processedHtml.replace(
    /(nøkkelinfo|key\s*info|property\s*details)[\s\S]{0,100}?/gi,
    '\n===KEY_INFO_SECTION_START===\n$&\n===KEY_INFO_SECTION_END===\n'
  );
  
  return processedHtml;
}

// Improved scraping with better headers and error handling
async function scrapeFinnPropertyHTML(finnCode: string): Promise<string | null> {
  try {
    const url = `https://www.finn.no/realestate/homes/ad.html?finnkode=${finnCode}`;
    console.log(`Scraping Finn property HTML: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'no-NO,no;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Successfully fetched HTML, length: ${html.length} characters`);
    
    return html;

  } catch (error) {
    console.error('Error scraping Finn property HTML:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and has Pro subscription
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has Pro subscription or is admin/ambassador
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'ambassador']);

    const isAdmin = userRoles && userRoles.length > 0;
    const isPro = profile?.subscription_tier === 'pro';

    if (!isPro && !isAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Pro subscription or admin/ambassador role required for Finn.no data fetching' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { finnCode } = await req.json();

    if (!finnCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Finn code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing request for Finn code: ${finnCode}`);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('finn_property_cache')
      .select('*')
      .eq('finn_code', finnCode)
      .gte('updated_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // 6 hours cache
      .single();

    if (cachedData) {
      console.log(`Using cached data for Finn code: ${finnCode}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: cachedData.property_data,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching fresh data for Finn code: ${finnCode}`);

    // Scrape the HTML from Finn.no
    const html = await scrapeFinnPropertyHTML(finnCode);
    if (!html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch property page from Finn.no' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract property data using AI
    const propertyData = await extractFinnDataWithAI(finnCode, html);
    if (!propertyData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to extract property data from page' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache the data
    console.log(`Caching property data for Finn code: ${finnCode}`);
    const { error: cacheError } = await supabase
      .from('finn_property_cache')
      .upsert({
        finn_code: finnCode,
        property_data: propertyData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      });

    if (cacheError) {
      console.error('Error caching property data:', cacheError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: propertyData,
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in finn-property-scraper:', error);
    
    // Handle specific error types with appropriate messages
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API quota exceeded')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API quota exceeded. Please try again later or contact support.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.message.includes('OpenAI API authentication failed')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API authentication failed. Please contact support.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.message.includes('OpenAI API error')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API error. Please try again later.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.message.includes('Unauthorized')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized access' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Property not found or could not be processed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});