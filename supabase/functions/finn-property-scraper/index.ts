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
  price: number;
  propertyType: string;
  livingArea: number;
  totalArea?: number;
  bedrooms?: number;
  yearBuilt?: number;
  energyRating?: string;
  description: string;
  images: string[];
  municipalFees?: number;
  sharedCosts?: number;
  monthlyRent?: number;
  parkingSpaces?: number;
  balcony?: boolean;
  elevator?: boolean;
  garage?: boolean;
  garden?: boolean;
  viewType?: string;
  condition?: string;
  heatingType?: string;
  internetIncluded?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  furnished?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  neighborhood?: string;
  pricePerSqm?: number;
  availableFrom?: string;
  depositAmount?: number;
  minRentalPeriod?: number;
}

// Use OpenAI to extract structured data from Finn.no HTML
async function extractFinnDataWithAI(finnCode: string, htmlContent: string): Promise<FinnPropertyData | null> {
  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Using OpenAI to extract data for Finn code: ${finnCode}`);

    // Truncate HTML to avoid token limits (keep first 8000 chars which should contain main property info)
    const truncatedHtml = htmlContent.length > 8000 ? htmlContent.substring(0, 8000) + "..." : htmlContent;

    const prompt = `Du er en ekspert på å ekstrahere eiendomsinformasjon fra Finn.no HTML. Analyser denne HTML-koden og trekk ut ALL TILGJENGELIG eiendomsinformasjon for å kunne fylle ut en eiendomskalkulator automatisk.

HTML innhold:
${truncatedHtml}

Returner informasjonen som JSON i eksakt dette formatet (bruk null for manglende verdier):
{
  "finnCode": "${finnCode}",
  "title": "eiendomstittel fra HTML",
  "address": "full adresse fra HTML", 
  "price": 0,
  "propertyType": "leilighet",
  "livingArea": 0,
  "totalArea": 0,
  "bedrooms": 0,
  "yearBuilt": 0,
  "energyRating": "A",
  "description": "beskrivelse av eiendommen",
  "municipalFees": 0,
  "sharedCosts": 0,
  "monthlyRent": 0,
  "parkingSpaces": 0,
  "balcony": false,
  "elevator": false,
  "garage": false,
  "garden": false,
  "viewType": "gate/hav/skog",
  "condition": "god/dårlig/utmerket",
  "heatingType": "fjernvarme/elektrisk/ved",
  "internetIncluded": false,
  "petsAllowed": false,
  "smokingAllowed": false,
  "furnished": false,
  "images": ["url1", "url2"],
  "coordinates": {"lat": 0, "lng": 0},
  "neighborhood": "Grünerløkka/Majorstuen/etc",
  "pricePerSqm": 0,
  "availableFrom": "2025-01-15",
  "depositAmount": 0,
  "minRentalPeriod": 12
}

Viktige instruksjoner:
- Bruk kun faktiske verdier fra HTML-en - ikke gjett eller finn på verdier
- Pris skal være totalpris i NOK som et tall (ikke string)
- propertyType skal være: "leilighet", "enebolig", "rekkehus", eller "tomannsbolig" 
- livingArea og totalArea skal være tall i m²
- municipalFees og sharedCosts skal være månedlige beløp i NOK
- monthlyRent skal være månedlig leiepris hvis det er en utleiebolig
- balcony, elevator, garage, garden skal være true/false basert på om det nevnes
- Hvis en verdi ikke finnes, bruk null for tall og strings, false for booleans
- Returner KUN JSON, ingen annen tekst`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const extractedText = aiResult.choices[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error('No content returned from OpenAI');
    }

    console.log('OpenAI extracted text:', extractedText);

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
      propertyData.livingArea = Number(propertyData.livingArea) || 0;
      propertyData.totalArea = propertyData.totalArea ? Number(propertyData.totalArea) : undefined;
      propertyData.bedrooms = propertyData.bedrooms ? Number(propertyData.bedrooms) : undefined;
      propertyData.yearBuilt = propertyData.yearBuilt ? Number(propertyData.yearBuilt) : undefined;
      propertyData.municipalFees = propertyData.municipalFees ? Number(propertyData.municipalFees) : undefined;
      propertyData.sharedCosts = propertyData.sharedCosts ? Number(propertyData.sharedCosts) : undefined;
      propertyData.monthlyRent = propertyData.monthlyRent ? Number(propertyData.monthlyRent) : undefined;
      propertyData.parkingSpaces = propertyData.parkingSpaces ? Number(propertyData.parkingSpaces) : undefined;
      propertyData.pricePerSqm = propertyData.pricePerSqm ? Number(propertyData.pricePerSqm) : undefined;
      propertyData.depositAmount = propertyData.depositAmount ? Number(propertyData.depositAmount) : undefined;
      propertyData.minRentalPeriod = propertyData.minRentalPeriod ? Number(propertyData.minRentalPeriod) : undefined;
      
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
    return null;
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
    console.error('Finn scraper error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'An error occurred while fetching property data. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
