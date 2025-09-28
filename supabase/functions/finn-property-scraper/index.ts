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
    
    // Get first 15000 chars to capture more content but stay within limits
    const truncatedHtml = htmlContent.length > 15000 ? htmlContent.substring(0, 15000) + "..." : htmlContent;

    console.log(`Using OpenAI GPT-4o to extract comprehensive data for Finn code: ${finnCode}`);
    console.log(`HTML length: ${htmlContent.length}, Truncated: ${truncatedHtml.length}`);
    console.log(`Structured data found: ${structuredData.length > 0 ? 'Yes' : 'No'}`);
    
    if (structuredData) {
      console.log(`Structured data preview: ${structuredData.substring(0, 200)}...`);
    }

    const prompt = `Du er en EKSPERT på å ekstrahere KOMPLETT eiendomsinformasjon fra Finn.no HTML. 

KRITISK: SØK GRUNDIG etter ALL INFORMASJON i HTML-en - ikke bare overfladisk!

PRIS-INFORMASJON (SØK ETTER DISSE EKSAKTE ORDENE):
- "Prisantydning" (hovedpris - ofte stor tekst øverst)
- "Totalpris" (total sum inkl omkostninger)
- "Omkostninger" (tilleggskostnader)
- "Formuesverdi" (ofte mindre tekst)
- "Felleskost" / "Fellesutgifter" (månedlig)
- "Fellesformue" (andel av felleseie)
- "Kommunale" (avgifter per år eller måned)
- "Pris på lån" / "Lånekostnader" (fra X kr/mnd)
- "kr/mnd" (månedlige kostnader)

NØKKELINFO SEKSJON (SØK SYSTEMATISK):
- "Boligtype": Leilighet, Enebolig, Rekkehus, Tomannsbolig
- "Eieform": Eier, Selveier, Andel, Aksje
- "Soverom" eller "Rom" (totalt antall rom)
- "Intern bruksareal", "Primærareal", "BRA-i" (m²)
- "Bruksareal", "Totalareal", "BRA-e" (m²)
- "Balkong", "Terrasse", "TBA" (m²)
- "Etasje" (hvilken etasje)
- "Byggeår" (årstall)
- "Energimerking" (bokstav A-G, ofte fargekodet)

DETALJERT FASILITETER (SØK I HTML ETTER DISSE):
- "Balkong/Terrasse", "Balkong", "Terrasse"
- "Heis", "Elevator" 
- "Garasje", "Garasje/P-plass", "Parkering"
- "Hage", "Have", "Uteområde"
- "Peis", "Ildsted", "Peisovn", "Vedovn"
- "Kjeller", "Basement"
- "Loft", "Attic"
- "Barnevennlig", "Barnehage", "Skole"
- "Kjæledyr tillatt", "Pets"
- "Rolig", "Stille"
- "Sentralt", "Sentrum"
- "Ladestasjon", "El-bil"
- "Turterreng", "Hiking", "Natur"
- "Offentlig vann/kloakk"
- "Bademulighet", "Badeland"
- "Internett", "Fiber"

MEGLER OG VISNING (SØK GRUNDIG):
- Meglers fulle navn (f.eks "Lillian Tunge")
- Telefonnummer (format: XX XX XX XX eller +47 XX XX XX XX)
- Eiendomsmeglerfirma (DNB Eiendom, Privatmegleren, MNEF, etc.)
- "Partner", "Eiendomsmegler", tittel
- Visningsdato (dag, dato, måned)
- Visningstidspunkt (klokkeslett format XX:XX - XX:XX)
- "Neste visning", "Visning", "Åpen visning"

BESKRIVELSE OG BILDER:
- Finn den KOMPLETTE beskrivelsen av eiendommen (lang tekst)
- Alle bildeURLer (https://images.finncdn.no/...)
- Spesiell informasjon om lokasjon og omgivelser

ADMINISTRATIVT:
- "FINN-kode" (8-9 siffer)
- "Referanse" nummer (ofte kortere)
- "Sist endret", "Publisert", datoer
- Komplett adresse med gate, nummer, postnummer og by

${structuredData ? `STRUKTURERT DATA (JSON-LD) - BRUK DETTE FØRST:
${structuredData}

` : ''}HTML INNHOLD:
${truncatedHtml}

Returner informasjonen som JSON i eksakt dette formatet (bruk null for manglende verdier):
{
  "finnCode": "${finnCode}",
  "title": "eiendomstittel fra HTML",
  "address": "gate, postnummer by", 
  "price": 0,
  "totalPrice": 0,
  "additionalCosts": 0,
  "propertyValue": 0,
  "propertyType": "tomannsbolig",
  "ownershipType": "selveier",
  "livingArea": 0,
  "totalArea": 0,
  "bedrooms": 0,
  "yearBuilt": 0,
  "energyRating": "A",
  "description": "beskrivelse av eiendommen",
  "municipalFees": 0,
  "sharedCosts": 0,
  "monthlyRent": 0,
  "loanCostsFrom": 0,
  "parkingSpaces": 0,
  "balcony": false,
  "elevator": false,
  "garage": false,
  "garden": false,
  "terrace": false,
  "fireplace": false,
  "basement": false,
  "attic": false,
  "petsAllowed": false,
  "childFriendly": false,
  "quietArea": false,
  "centralLocation": false,
  "publicWaterSewer": false,
  "hiking": false,
  "agentName": "Geir Audun Vikse",
  "agentPhone": "46 85 03 90",
  "agencyName": "DNB Eiendom AS",
  "viewingDates": [{"date": "2025-10-02", "timeFrom": "15:30", "timeTo": "16:15"}],
  "referenceNumber": "704250214",
  "datePublished": "2025-09-26",
  "images": ["url1", "url2"],
  "coordinates": {"lat": 0, "lng": 0},
  "neighborhood": "Haugesund",
  "pricePerSqm": 0,
  "floors": 2,
  "roomDescription": "detaljert rombeskrivelse"
}

KRITISKE INSTRUKSJONER:
- SØK GRUNDIG etter ALLE tall, priser og detaljer i HTML-en
- "Totalpris" er hovedprisen hvis tilgjengelig, ellers "Prisantydning"
- Hvis "Kommunale avgifter" sier "per år" - del på 12 for månedlig
- Meglerinfo står ofte i høyre sidebar eller under eiendomsselskap
- Visningsdato er ofte i format "Torsdag, 02. oktober" + klokkeslett
- FINN-kode er 8-9 siffer, referanse er kortere
- Fasiliteter kan stå som punktliste eller i tekst
- For boolean verdier: true hvis nevnt/funnet, false hvis ikke nevnt
- Bruk kun faktiske verdier - IKKE gjett eller oppfinn data
- Returner KUN valid JSON, ingen annen tekst eller forklaring`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use more powerful model for better extraction
        messages: [
          {
            role: 'system',
            content: 'Du er en AI som er ekspert på å ekstrahere strukturert eiendomsdata fra Finn.no HTML. Du returnerer alltid valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.05, // Very low for consistent extraction
        max_tokens: 4000 // Much more tokens for comprehensive data extraction
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

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'ambassador']);

    const isAdmin = roles?.some(r => r.role === 'admin');
    const isAmbassador = roles?.some(r => r.role === 'ambassador');
    const hasPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium';

    if (!hasPro && !isAdmin && !isAmbassador) {
      return new Response(
        JSON.stringify({ 
          error: 'Pro subscription required',
          message: 'This feature requires a Pro subscription to access Finn.no data automatically.' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { finnCode } = await req.json();

    if (!finnCode) {
      throw new Error('Finn code is required');
    }

    // Validate Finn code format (should be numeric)
    if (!/^\d+$/.test(finnCode.toString())) {
      throw new Error('Invalid Finn code format');
    }

    console.log(`Processing request for Finn code: ${finnCode}`);

    // Rate limiting - check if user has made too many requests recently
    const { data: rateLimitResult } = await supabase.rpc('enhanced_rate_limit_check', {
      endpoint_name: 'finn_scraper',
      identifier_key: user.id,
      max_requests: 10, // 10 requests per window
      window_minutes: 60 // per hour
    });

    if (rateLimitResult && !(rateLimitResult as any).allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait before trying again.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check cache first
    const { data: cachedData } = await supabase
      .from('finn_property_cache')
      .select('*')
      .eq('finn_code', finnCode)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()) // 6 months cache
      .single();

    let propertyData: FinnPropertyData | null = null;

    if (cachedData) {
      console.log('Using cached data for Finn code:', finnCode);
      propertyData = cachedData.property_data as FinnPropertyData;
    } else {
      console.log('Fetching fresh data for Finn code:', finnCode);
      
      // First, scrape the HTML content
      const htmlContent = await scrapeFinnPropertyHTML(finnCode);
      
      if (!htmlContent) {
        throw new Error('Failed to fetch property page');
      }

      // Then use OpenAI to extract structured data from the HTML
      propertyData = await extractFinnDataWithAI(finnCode, htmlContent);
      
      if (propertyData) {
        // Cache the result
        console.log('Caching property data for Finn code:', finnCode);
        await supabase
          .from('finn_property_cache')
          .upsert({
            finn_code: finnCode,
            property_data: propertyData,
            extracted_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months (180 days)
          });
      }
    }

    if (!propertyData) {
      return new Response(
        JSON.stringify({ 
          error: 'Property not found',
          message: 'Could not extract property data. The property may not exist or be temporarily unavailable.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log successful fetch for analytics
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'finn_property_fetch',
        action: 'fetch_success',
        user_id: user.id,
        details: {
          finn_code: finnCode,
          cached: !!cachedData,
          method: 'openai_extraction',
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        data: propertyData,
        cached: !!cachedData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Finn scraper error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle specific error types with user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('🔍 Error message:', errorMessage);
    
    let statusCode = 500;
    let userMessage = 'An error occurred while fetching property data. Please try again.';
    let errorType = 'extraction_failed';
    
    if (errorMessage.includes('OpenAI API quota exceeded')) {
      console.log('🚫 OpenAI quota exceeded detected');
      statusCode = 429;
      userMessage = 'OpenAI API quota exceeded. Property extraction is temporarily unavailable. Please try again later.';
      errorType = 'quota_exceeded';
    } else if (errorMessage.includes('Property not found') || errorMessage.includes('Failed to fetch property page')) {
      console.log('🏠 Property not found detected');
      statusCode = 404;
      userMessage = 'Property not found. Please check the Finn code and try again.';
      errorType = 'property_not_found';
    } else if (errorMessage.includes('OpenAI API authentication failed')) {
      console.log('🔐 OpenAI auth failed detected');
      statusCode = 500;
      userMessage = 'Service configuration error. Please contact support.';
      errorType = 'auth_failed';
    }
    
    console.log('📤 Returning error response:', { errorType, userMessage, statusCode });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorType,
        message: userMessage,
        details: errorMessage  // Include technical details for debugging
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
