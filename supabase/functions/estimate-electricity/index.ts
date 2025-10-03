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
    const { size_sqm, bedrooms, property_type, location } = await req.json();
    console.log('Estimating electricity for:', { size_sqm, bedrooms, property_type, location });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create prompt for AI
    const prompt = `Du er en ekspert på norske strømpriser og energiforbruk. 

Estimer månedlig strømkostnad for følgende bolig i Norge:
- Størrelse: ${size_sqm} m²
- Antall soverom: ${bedrooms}
- Boligtype: ${property_type}
- Lokasjon: ${location || 'Norge generelt'}

Basert på gjennomsnittlige norske strømpriser i 2025 (ca 1,20-1,50 kr/kWh) og typisk forbruk for denne typen bolig.

Ta hensyn til:
- Oppvarming (størst faktor)
- Varmtvann
- Hvitevarer og elektronikk
- Belysning
- Sesongvariasjoner (gi et årlig gjennomsnitt)

Returner BARE et tall (månedlig kostnad i NOK) uten tekst eller forklaring. Avrund til nærmeste 100.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Du er en ekspert på norske strømpriser og energiforbruk. Returner alltid BARE et tall i NOK uten annen tekst." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "For mange forespørsler. Prøv igjen om litt." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betalingspåkrevd. Legg til midler i workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const estimateText = data.choices[0].message.content.trim();
    console.log('AI response:', estimateText);

    // Extract number from response
    const estimatedCost = parseInt(estimateText.replace(/[^\d]/g, ''));
    
    if (isNaN(estimatedCost) || estimatedCost <= 0) {
      console.error('Invalid estimate from AI:', estimateText);
      // Fallback to simple formula if AI fails
      const fallbackEstimate = Math.round((size_sqm * 15 + bedrooms * 200) / 100) * 100;
      
      return new Response(
        JSON.stringify({ 
          estimated_monthly_cost: fallbackEstimate,
          method: 'fallback',
          note: 'Basert på forenklet formel'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        estimated_monthly_cost: estimatedCost,
        method: 'ai',
        note: 'Estimert med AI basert på norske strømpriser 2025'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in estimate-electricity function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Ukjent feil' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
