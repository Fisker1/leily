import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Helper function to extract numeric value from text
function extractNumber(text: string): number {
  const match = text.replace(/\s/g, '').match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// Helper function to clean and extract price
function extractPrice(text: string): number {
  const cleanText = text.replace(/[^\d]/g, '');
  return parseInt(cleanText) || 0;
}

// Helper function to determine property type from Finn categories
function mapPropertyType(finnType: string): string {
  const type = finnType.toLowerCase();
  if (type.includes('leilighet')) return 'leilighet';
  if (type.includes('enebolig')) return 'enebolig';
  if (type.includes('rekkehus') || type.includes('radhus')) return 'rekkehus';
  if (type.includes('tomannsbolig')) return 'tomannsbolig';
  return 'leilighet'; // default
}

async function scrapeFinnProperty(finnCode: string): Promise<FinnPropertyData | null> {
  try {
    const url = `https://www.finn.no/realestate/homes/ad/${finnCode}`;
    
    // Use a web scraping service or headless browser
    // For now, we'll simulate the data structure that would be scraped
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML to extract property data
    // This is a simplified version - in production you'd use a proper HTML parser
    const data: Partial<FinnPropertyData> = {
      finnCode: finnCode
    };

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*"[^>]*>([^<]+)<\/h1>/);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Extract price
    const priceMatch = html.match(/Prisantydning[^>]*>.*?(\d[\d\s]+)\s*kr/i) || 
                      html.match(/Totalpris[^>]*>.*?(\d[\d\s]+)\s*kr/i);
    if (priceMatch) {
      data.price = extractPrice(priceMatch[1]);
    }

    // Extract address
    const addressMatch = html.match(/address[^>]*>([^<]+)</i) ||
                        html.match(/"address"[^>]*>([^<]+)</i);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

    // Extract living area
    const areaMatch = html.match(/(\d+)\s*m²/i);
    if (areaMatch) {
      data.livingArea = parseInt(areaMatch[1]);
    }

    // Extract bedrooms
    const bedroomMatch = html.match(/(\d+)\s*soverom/i);
    if (bedroomMatch) {
      data.bedrooms = parseInt(bedroomMatch[1]);
    }

    // Extract year built
    const yearMatch = html.match(/byggeår[^>]*>.*?(\d{4})/i);
    if (yearMatch) {
      data.yearBuilt = parseInt(yearMatch[1]);
    }

    // Extract municipal fees
    const municipalMatch = html.match(/kommunale\s+avgifter[^>]*>.*?(\d[\d\s]+)/i);
    if (municipalMatch) {
      data.municipalFees = extractNumber(municipalMatch[1]);
    }

    // Extract shared costs
    const sharedMatch = html.match(/fellesutgifter[^>]*>.*?(\d[\d\s]+)/i);
    if (sharedMatch) {
      data.sharedCosts = extractNumber(sharedMatch[1]);
    }

    // Extract property type (simplified)
    if (html.toLowerCase().includes('leilighet')) {
      data.propertyType = 'leilighet';
    } else if (html.toLowerCase().includes('enebolig')) {
      data.propertyType = 'enebolig';
    } else if (html.toLowerCase().includes('rekkehus')) {
      data.propertyType = 'rekkehus';
    } else if (html.toLowerCase().includes('tomannsbolig')) {
      data.propertyType = 'tomannsbolig';
    } else {
      data.propertyType = 'leilighet';
    }

    // Extract description (simplified)
    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)</i);
    if (descMatch) {
      data.description = descMatch[1].trim().substring(0, 500); // Limit description length
    }

    // Extract images (simplified)
    const imageMatches = html.matchAll(/https:\/\/images\.finncdn\.no[^"'\s]+/g);
    data.images = Array.from(imageMatches).slice(0, 5).map(match => match[0]); // Limit to 5 images

    return data as FinnPropertyData;

  } catch (error) {
    console.error('Error scraping Finn property:', error);
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

    // Check if user has Pro subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.subscription_tier !== 'pro' && profile.subscription_tier !== 'premium')) {
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
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours cache
      .single();

    let propertyData: FinnPropertyData | null = null;

    if (cachedData) {
      propertyData = cachedData.property_data as FinnPropertyData;
    } else {
      // Scrape fresh data
      propertyData = await scrapeFinnProperty(finnCode);
      
      if (propertyData) {
        // Cache the result
        await supabase
          .from('finn_property_cache')
          .upsert({
            finn_code: finnCode,
            property_data: propertyData,
            user_id: user.id
          });
      }
    }

    if (!propertyData) {
      return new Response(
        JSON.stringify({ 
          error: 'Property not found',
          message: 'Could not find property with the provided Finn code. Please check the code and try again.' 
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