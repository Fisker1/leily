import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      postalCode,
      municipality,
      propertyType, // 'Leilighet', 'Enebolig', 'Rekkehus', 'Hybel'
      bedrooms,
      primarySize,
      furnished = false,
      parking = false,
      utilities = false, // strøm og vann inkludert
    } = await req.json();

    console.log('Estimating rent for:', { 
      postalCode, 
      municipality, 
      propertyType, 
      bedrooms, 
      primarySize 
    });

    // Base price per sqm based on property type and location
    let basePricePerSqm = 150; // Default NOK per sqm

    // Adjust based on property type
    const propertyTypeMultipliers: Record<string, number> = {
      'Leilighet': 1.0,
      'Enebolig': 0.85,
      'Rekkehus': 0.9,
      'Tomannsbolig': 0.85,
      'Leilighet - Blokkleilighet': 1.0,
      'Hybel': 1.3, // Higher per sqm but smaller size
    };

    const typeKey = Object.keys(propertyTypeMultipliers).find(key => 
      propertyType?.toLowerCase().includes(key.toLowerCase())
    );
    const typeMultiplier = typeKey ? propertyTypeMultipliers[typeKey] : 1.0;
    basePricePerSqm *= typeMultiplier;

    // Location-based adjustment (simplified - in reality you'd use a proper API)
    // Oslo and surrounding areas are more expensive
    const osloPostalCodes = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bergenPostalCodes = ['5'];
    const trondheimPostalCodes = ['7'];
    const stavangerPostalCodes = ['4'];

    if (postalCode) {
      const firstDigit = postalCode.charAt(0);
      if (osloPostalCodes.includes(firstDigit) && postalCode.startsWith('0')) {
        basePricePerSqm *= 1.5; // Oslo premium
      } else if (bergenPostalCodes.includes(firstDigit) && postalCode.startsWith('5')) {
        basePricePerSqm *= 1.3; // Bergen
      } else if (trondheimPostalCodes.includes(firstDigit) && postalCode.startsWith('7')) {
        basePricePerSqm *= 1.25; // Trondheim
      } else if (stavangerPostalCodes.includes(firstDigit) && postalCode.startsWith('4')) {
        basePricePerSqm *= 1.3; // Stavanger
      }
    }

    // Size adjustment (larger apartments have lower price per sqm)
    let sizeAdjustment = 1.0;
    if (primarySize) {
      if (primarySize < 40) sizeAdjustment = 1.2;
      else if (primarySize > 100) sizeAdjustment = 0.9;
    }
    basePricePerSqm *= sizeAdjustment;

    // Bedroom adjustment
    if (bedrooms) {
      const bedroomBonus = Math.max(0, bedrooms - 1) * 1000; // Extra bonus per bedroom
      basePricePerSqm += bedroomBonus / (primarySize || 50);
    }

    // Calculate base rent
    let estimatedRent = Math.round(basePricePerSqm * (primarySize || 50));

    // Add-ons
    if (furnished) estimatedRent += Math.round(estimatedRent * 0.15); // +15% for furnished
    if (parking) estimatedRent += 1500; // Fixed parking premium
    if (utilities) estimatedRent += 1000; // Fixed utilities premium

    // Round to nearest 100
    estimatedRent = Math.round(estimatedRent / 100) * 100;

    // Ensure minimum rent
    estimatedRent = Math.max(estimatedRent, 5000);

    console.log('Estimated rent:', estimatedRent, 'NOK/month');
    console.log('Calculation breakdown:', {
      basePricePerSqm: basePricePerSqm.toFixed(2),
      primarySize,
      typeMultiplier,
      sizeAdjustment,
      furnished,
      parking,
      utilities
    });

    return new Response(
      JSON.stringify({ 
        estimatedRent,
        confidence: 'medium', // low, medium, high
        methodology: 'simplified',
        breakdown: {
          basePricePerSqm: Math.round(basePricePerSqm),
          size: primarySize,
          baseRent: Math.round(basePricePerSqm * (primarySize || 50)),
          addons: {
            furnished: furnished ? Math.round(estimatedRent * 0.15) : 0,
            parking: parking ? 1500 : 0,
            utilities: utilities ? 1000 : 0
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in estimate-rent function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        estimatedRent: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
