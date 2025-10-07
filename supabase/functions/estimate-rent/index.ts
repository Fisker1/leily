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
    // Updated with realistic Norwegian rental market prices (2025)
    let basePricePerSqm = 200; // Base NOK per sqm for average location

    // Adjust based on property type
    const propertyTypeMultipliers: Record<string, number> = {
      'Leilighet': 1.1,          // Leiligheter er populære og dyre
      'Enebolig': 1.0,           // God baseline
      'Rekkehus': 1.05,          // Mellomting
      'Tomannsbolig': 0.95,      // Litt lavere
      'Leilighet - Blokkleilighet': 1.1,
      'Hybel': 1.4,              // Høyere per kvm, men mindre areal
      'FLAT': 1.1,               // English version
      'DETACHED': 1.0,           // English version
      'TERRACED': 1.05,          // English version
      'SEMI_DETACHED': 0.95,     // English version
    };

    const typeKey = Object.keys(propertyTypeMultipliers).find(key => 
      propertyType?.toLowerCase().includes(key.toLowerCase()) ||
      propertyType?.toUpperCase() === key
    );
    const typeMultiplier = typeKey ? propertyTypeMultipliers[typeKey] : 1.0;
    basePricePerSqm *= typeMultiplier;

    // Location-based adjustment - Norwegian rental market premiums
    if (postalCode) {
      const firstDigit = postalCode.charAt(0);
      // Oslo and Akershus (0xxx, 1xxx, 2xxx, 3xxx)
      if (['0', '1', '2', '3'].includes(firstDigit)) {
        basePricePerSqm *= 1.6; // Oslo region has significant premium
      }
      // Bergen area (5xxx)
      else if (firstDigit === '5' && (postalCode.startsWith('50') || postalCode.startsWith('51'))) {
        basePricePerSqm *= 1.4;
      }
      // Stavanger area (4xxx)
      else if (firstDigit === '4' && (postalCode.startsWith('40') || postalCode.startsWith('41'))) {
        basePricePerSqm *= 1.35;
      }
      // Trondheim area (7xxx)
      else if (firstDigit === '7' && postalCode.startsWith('70')) {
        basePricePerSqm *= 1.3;
      }
      // Kristiansand (4xxx)
      else if (postalCode.startsWith('46') || postalCode.startsWith('47')) {
        basePricePerSqm *= 1.25;
      }
      // Other cities
      else {
        basePricePerSqm *= 1.1; // Moderate premium for other areas
      }
    }

    // Size adjustment - larger properties have slightly lower per sqm price
    let sizeAdjustment = 1.0;
    if (primarySize) {
      if (primarySize < 40) sizeAdjustment = 1.25;        // Small = premium per sqm
      else if (primarySize < 60) sizeAdjustment = 1.15;   // Medium-small
      else if (primarySize > 120) sizeAdjustment = 0.95;  // Large = discount per sqm
      else if (primarySize > 150) sizeAdjustment = 0.90;  // Very large
    }
    basePricePerSqm *= sizeAdjustment;

    // Bedroom premium - more bedrooms = more value
    if (bedrooms && primarySize) {
      const bedroomBonus = Math.max(0, bedrooms - 1) * 1500; // 1500 kr per extra bedroom
      basePricePerSqm += bedroomBonus / primarySize;
    }

    // Calculate base rent
    let estimatedRent = Math.round(basePricePerSqm * (primarySize || 50));

    // Add-ons
    if (furnished) estimatedRent += Math.round(estimatedRent * 0.15); // +15% for furnished
    if (parking) estimatedRent += 2000; // Parking premium (increased from 1500)
    if (utilities) estimatedRent += 1500; // Utilities premium (increased from 1000)

    // Round to nearest 500 for cleaner numbers
    estimatedRent = Math.round(estimatedRent / 500) * 500;

    // Ensure minimum rent based on size
    const minimumRent = primarySize ? Math.max(8000, primarySize * 150) : 8000;
    estimatedRent = Math.max(estimatedRent, minimumRent);

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
