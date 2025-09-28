import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

async function scrapeFinnPropertyWithOpenAI(finnCode: string): Promise<FinnPropertyData | null> {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const url = `https://www.finn.no/realestate/homes/ad/${finnCode}`;
    console.log(`Using OpenAI to scrape Finn property: ${url}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Du er en ekspert på å analysere norske eiendomsannonser. Din oppgave er å besøke en Finn.no URL og ekstrahere strukturert eiendomsdata.

Returner alltid data i dette eksakte JSON-formatet:
{
  "finnCode": "string",
  "title": "string", 
  "address": "string",
  "price": number,
  "propertyType": "leilighet|enebolig|rekkehus|tomannsbolig",
  "livingArea": number,
  "totalArea": number,
  "bedrooms": number,
  "yearBuilt": number,
  "energyRating": "string",
  "description": "string (max 500 chars)",
  "images": ["array of image URLs"],
  "municipalFees": number,
  "sharedCosts": number,
  "coordinates": {"lat": number, "lng": number}
}

Viktige instrukser:
- Pris skal være totalpris uten mellomrom (f.eks 4500000, ikke "4 500 000")
- Areal skal være kun tall (f.eks 85, ikke "85 m²")
- Hvis noe ikke finnes, bruk null eller tom streng
- Description maksimum 500 tegn
- propertyType må være en av de fire verdiene
- Finn geografiske koordinater hvis mulig`
          },
          {
            role: 'user',
            content: `Vennligst besøk denne Finn.no URL og ekstraher eiendomsdata: ${url}

Returner kun gyldig JSON uten ekstra tekst eller forklaring.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response:', content);

    // Parse the JSON response
    try {
      const propertyData = JSON.parse(content);
      
      // Validate and clean the data
      return {
        finnCode: finnCode,
        title: propertyData.title || 'Ukjent eiendom',
        address: propertyData.address || 'Ukjent adresse',
        price: parseInt(propertyData.price) || 0,
        propertyType: propertyData.propertyType || 'leilighet',
        livingArea: parseInt(propertyData.livingArea) || 0,
        totalArea: parseInt(propertyData.totalArea) || parseInt(propertyData.livingArea) || 0,
        bedrooms: parseInt(propertyData.bedrooms) || undefined,
        yearBuilt: parseInt(propertyData.yearBuilt) || undefined,
        energyRating: propertyData.energyRating || undefined,
        description: propertyData.description ? propertyData.description.substring(0, 500) : '',
        images: Array.isArray(propertyData.images) ? propertyData.images.slice(0, 5) : [],
        municipalFees: parseInt(propertyData.municipalFees) || undefined,
        sharedCosts: parseInt(propertyData.sharedCosts) || undefined,
        coordinates: propertyData.coordinates || undefined
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.error('Raw response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

  } catch (error) {
    console.error('Error scraping with OpenAI:', error);
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
      // Scrape fresh data using OpenAI
      propertyData = await scrapeFinnPropertyWithOpenAI(finnCode);
      
      if (propertyData) {
        // Cache the result
        await supabase
          .from('finn_property_cache')
          .upsert({
            finn_code: finnCode,
            property_data: propertyData,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
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