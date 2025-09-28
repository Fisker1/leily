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

// Use OpenAI to extract structured data from Finn.no HTML
async function extractFinnDataWithAI(finnCode: string, htmlContent: string): Promise<FinnPropertyData | null> {
  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Extract and focus on key sections of HTML that contain property data
    const keySelectors = [
      'script[type="application/ld+json"]', // Structured data
      '[data-testid*="price"]', '[class*="price"]', '[class*="Price"]',
      '[data-testid*="cost"]', '[class*="cost"]', '[class*="Cost"]', 
      '[data-testid*="municipal"]', '[class*="municipal"]',
      '[data-testid*="shared"]', '[class*="shared"]', '[class*="felles"]',
      '[data-testid*="area"]', '[class*="area"]', '[class*="Area"]',
      '[data-testid*="room"]', '[class*="room"]', '[class*="Room"]',
      '[data-testid*="year"]', '[class*="year"]', '[class*="bygge"]',
      'h1', 'h2', 'h3', // Titles and headers
      '[class*="address"]', '[class*="location"]', // Address info
      '[class*="description"]', '[class*="Description"]' // Description
    ];
    
    // Try to extract structured JSON-LD data first
    const jsonLdMatches = htmlContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    let structuredData = '';
    if (jsonLdMatches) {
      structuredData = jsonLdMatches.join('\n');
    }
    
    // Preprocess HTML to highlight price and area information
    const preprocessedHtml = preprocessHtmlForPricing(htmlContent);
    
    // Get first 20000 chars to capture more content but stay within limits
    const truncatedHtml = preprocessedHtml.length > 20000 ? preprocessedHtml.substring(0, 20000) + "..." : preprocessedHtml;

    console.log(`Using OpenAI GPT-4o to extract comprehensive data for Finn code: ${finnCode}`);
    console.log(`HTML length: ${htmlContent.length}, Preprocessed: ${preprocessedHtml.length}, Truncated: ${truncatedHtml.length}`);
    console.log(`Structured data found: ${structuredData.length > 0 ? 'Yes' : 'No'}`);
    
    if (structuredData) {
      console.log(`Structured data preview: ${structuredData.substring(0, 200)}...`);
    }

    const prompt = `Du er en EKSPERT på å ekstrahere EKSAKTE TALL fra Finn.no eiendomsannonser. 

KRITISK: Finn FAKTISKE tall fra HTML-en - ALDRI oppfinn data!

SØK ETTER DISSE EKSAKTE SEKSJONENE OG TEKSTENE I HTML:

1. PRISANTYDNING (hovedpris - VIKTIGST): 
   - Søk etter "===PRICE_SECTION=== prisantydning:" eller "===CURRENCY_VALUE===" 
   - Format: "3 990 000 kr", "4.500.000 kr", "3,5 mill kr"
   - Konverter mill til millioner: "3,5 mill" = 3500000
   - Dette er HOVEDPRISEN som skal brukes som "price"

2. ANDRE PRISER:
   - "===PRICE_SECTION=== totalpris:" → totalPrice
   - "===PRICE_SECTION=== omkostninger:" → additionalCosts
   - "===PRICE_SECTION=== formuesverdi:" → propertyValue
   - "===PRICE_SECTION=== felleskost:" → sharedCosts (månedlig)
   - "===PRICE_SECTION=== kommunale avg:" → municipalFees (del på 12 hvis årlig)

3. AREALER:
   - "===SPECIFIC_AREA=== intern bruksareal:" eller "===AREA_MEASUREMENT===" → livingArea
   - "===SPECIFIC_AREA=== bruksareal:" → totalArea
   - "===SPECIFIC_AREA=== ekstern bruksareal:" → balconyArea

4. ROM OG DETALJER:
   - "===ROOM_INFO=== soverom:" → bedrooms
   - "===YEAR_INFO=== byggeår:" → yearBuilt (4 siffer)
   - "===PROPERTY_TYPE=== boligtype:" → propertyType (leilighet/enebolig/etc)
   - "===PROPERTY_TYPE=== eieform:" → ownershipType (selveier/andel/etc)

5. SØK I TABELLER OG LISTER:
   - "===TABLE_ROW_START===" til "===TABLE_ROW_END===" inneholder ofte strukturert data
   - "===DEFINITION_LIST_START===" til "===DEFINITION_LIST_END===" kan ha nøkkelinfo
   - "===KEY_INFO_SECTION_START===" inneholder ofte de viktigste dataene

6. BILDER:
   - Søk etter <img> tags eller "images" i JSON-LD data

HTML INNHOLD MED FORSTERKEDE MARKØRER:
${truncatedHtml}

${structuredData ? `STRUKTURERT JSON-LD DATA (PRIORITER DETTE HØYEST):
${structuredData}` : ''}

KRITISKE INSTRUKSJONER:
- Les ALLE "===PRICE_SECTION===" og "===CURRENCY_VALUE===" markører nøye
- Konverter "3 990 000" til 3990000 (fjern mellomrom)
- Konverter "mill" til 000000: "3,5 mill" = 3500000
- Hvis du ikke finner eksakte tall, bruk null - IKKE gå glipp av tall som er der!
- Søk spesielt etter prisantydning som er hovedprisen

RETURNER EKSAKT DETTE JSON-FORMATET:
{
  "finnCode": "${finnCode}",
  "title": "EKSAKT_TITTEL_FRA_HTML",
  "address": "EKSAKT_ADRESSE", 
  "price": PRISANTYDNING_TALL_ELLER_NULL,
  "totalPrice": TOTALPRIS_TALL_ELLER_NULL,
  "additionalCosts": OMKOSTNINGER_TALL_ELLER_NULL,
  "propertyValue": FORMUESVERDI_TALL_ELLER_NULL,
  "propertyType": "leilighet/enebolig/rekkehus/tomannsbolig",
  "ownershipType": "selveier/eier/andel/aksje",
  "livingArea": INTERN_BRUKSAREAL_TALL_ELLER_NULL,
  "totalArea": BRUKSAREAL_TOTALT_ELLER_NULL,
  "balconyArea": EKSTERN_BRUKSAREAL_ELLER_NULL,
  "bedrooms": SOVEROM_TALL_ELLER_NULL,
  "totalRooms": TOTAL_ROM_ELLER_NULL,
  "floor": "ETASJE_TEKST_ELLER_NULL",
  "yearBuilt": BYGGEÅR_4_SIFFER_ELLER_NULL,
  "energyRating": "A/B/C/D/E/F/G_ELLER_NULL",
  "description": "FULL_BESKRIVELSE_TEKST",
  "municipalFees": KOMMUNALE_MÅNEDLIG_ELLER_NULL,
  "sharedCosts": FELLESKOST_MÅNEDLIG_ELLER_NULL,
  "sharedEquity": FELLESFORMUE_ELLER_NULL,
  "monthlyRent": NULL,
  "loanCostsFrom": LÅN_FRA_ELLER_NULL,
  "parkingSpaces": PARKERING_ANTALL_ELLER_NULL,
  "balcony": true/false_BASERT_PÅ_TEKST,
  "elevator": true/false_BASERT_PÅ_TEKST,
  "garage": true/false_BASERT_PÅ_TEKST,
  "garden": true/false_BASERT_PÅ_TEKST,
  "terrace": true/false_BASERT_PÅ_TEKST,
  "fireplace": true/false_BASERT_PÅ_TEKST,
  "basement": true/false_BASERT_PÅ_TEKST,
  "attic": true/false_BASERT_PÅ_TEKST,
  "petsAllowed": true/false_BASERT_PÅ_TEKST,
  "childFriendly": true/false_BASERT_PÅ_TEKST,
  "quietArea": true/false_BASERT_PÅ_TEKST,
  "centralLocation": true/false_BASERT_PÅ_TEKST,
  "publicWaterSewer": true/false_BASERT_PÅ_TEKST,
  "hiking": true/false_BASERT_PÅ_TEKST,
  "chargingStation": true/false_BASERT_PÅ_TEKST,
  "internet": true/false_BASERT_PÅ_TEKST,
  "agentName": "MEGLER_NAVN_ELLER_NULL",
  "agentPhone": "TELEFON_ELLER_NULL",
  "agentTitle": "TITTEL_ELLER_NULL",
  "agencyName": "FIRMA_NAVN_ELLER_NULL",
  "viewingDates": [{"date": "YYYY-MM-DD", "timeFrom": "HH:MM", "timeTo": "HH:MM"}],
  "referenceNumber": "REF_NUMMER_ELLER_NULL",
  "datePublished": "PUBLISERT_DATO_ELLER_NULL",
  "images": ["FAKTISKE_BILDE_URLS"],
  "coordinates": {"lat": null, "lng": null},
  "neighborhood": "OMRÅDE_ELLER_NULL",
  "pricePerSqm": BEREGNET_PRIS_PER_M2_ELLER_NULL,
  "floors": ETASJER_ANTALL_ELLER_NULL,
  "roomDescription": "ROM_BESKRIVELSE_ELLER_NULL",
  "buildingDescription": "BYGNING_BESKRIVELSE_ELLER_NULL",
  "locationDescription": "LOKASJON_BESKRIVELSE_ELLER_NULL"
}

RETURNER KUN VALID JSON - INGEN FORKLARING!`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Du er en ekspert på å ekstrahere eksakte data fra Finn.no HTML. Du MÅ finne faktiske tall, ikke oppfinne data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.05,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      
      // Handle specific OpenAI errors
      if (response.status === 429) {
        throw new Error('OpenAI API quota exceeded. Please try again later or contact support.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API authentication failed. Please check API key configuration.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }
    }

    const aiResult = await response.json();
    const extractedText = aiResult.choices[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error('No content returned from OpenAI');
    }

    console.log('OpenAI extracted text preview:', extractedText.substring(0, 500));
    console.log('Full OpenAI response length:', extractedText.length);

    // Parse JSON from the response
    try {
      // Clean the response to extract JSON
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in OpenAI response');
      }

      const propertyData = JSON.parse(jsonMatch[0]) as FinnPropertyData;
      
      // Validate and clean the data
      if (!propertyData.title || !propertyData.address) {
        console.log('Missing required fields, using fallback values');
        propertyData.title = propertyData.title || `Eiendom ${finnCode}`;
        propertyData.address = propertyData.address || 'Adresse ikke tilgjengelig';
      }

      // Ensure numeric fields are numbers and handle nulls properly
      propertyData.price = Number(propertyData.price) || 0;
      propertyData.totalPrice = propertyData.totalPrice ? Number(propertyData.totalPrice) : undefined;
      propertyData.additionalCosts = propertyData.additionalCosts ? Number(propertyData.additionalCosts) : undefined;
      propertyData.propertyValue = propertyData.propertyValue ? Number(propertyData.propertyValue) : undefined;
      propertyData.livingArea = Number(propertyData.livingArea) || 0;
      propertyData.totalArea = propertyData.totalArea ? Number(propertyData.totalArea) : undefined;
      propertyData.balconyArea = propertyData.balconyArea ? Number(propertyData.balconyArea) : undefined;
      propertyData.bedrooms = propertyData.bedrooms ? Number(propertyData.bedrooms) : undefined;
      propertyData.totalRooms = propertyData.totalRooms ? Number(propertyData.totalRooms) : undefined;
      propertyData.yearBuilt = propertyData.yearBuilt ? Number(propertyData.yearBuilt) : undefined;
      propertyData.municipalFees = propertyData.municipalFees ? Number(propertyData.municipalFees) : undefined;
      propertyData.sharedCosts = propertyData.sharedCosts ? Number(propertyData.sharedCosts) : undefined;
      propertyData.sharedEquity = propertyData.sharedEquity ? Number(propertyData.sharedEquity) : undefined;
      propertyData.monthlyRent = propertyData.monthlyRent ? Number(propertyData.monthlyRent) : undefined;
      propertyData.loanCostsFrom = propertyData.loanCostsFrom ? Number(propertyData.loanCostsFrom) : undefined;
      propertyData.parkingSpaces = propertyData.parkingSpaces ? Number(propertyData.parkingSpaces) : undefined;
      propertyData.pricePerSqm = propertyData.pricePerSqm ? Number(propertyData.pricePerSqm) : undefined;
      propertyData.depositAmount = propertyData.depositAmount ? Number(propertyData.depositAmount) : undefined;
      propertyData.minRentalPeriod = propertyData.minRentalPeriod ? Number(propertyData.minRentalPeriod) : undefined;
      propertyData.floors = propertyData.floors ? Number(propertyData.floors) : undefined;
      
      // Calculate pricePerSqm if not provided but we have both price and area
      if (!propertyData.pricePerSqm && propertyData.price > 0 && propertyData.livingArea > 0) {
        propertyData.pricePerSqm = Math.round(propertyData.price / propertyData.livingArea);
      }

      console.log('Successfully extracted property data:', {
        finnCode: propertyData.finnCode,
        title: propertyData.title,
        price: propertyData.price,
        address: propertyData.address
      });

      return propertyData;

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', extractedText);
      throw new Error('Failed to parse property data from AI response');
    }

  } catch (error) {
    console.error('Error extracting Finn property data with AI:', error);
    // Re-throw specific errors instead of returning null so they can be handled properly
    if (error instanceof Error && (
      error.message.includes('OpenAI API quota exceeded') ||
      error.message.includes('OpenAI API authentication failed') ||
      error.message.includes('OpenAI API error')
    )) {
      throw error; // Let the main error handler deal with OpenAI-specific errors
    }
    return null; // Only return null for other extraction errors
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