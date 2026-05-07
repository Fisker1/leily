import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Create client with user's auth token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { sessionId, message, calculatorData, attachments, estimatedMonthlyRent } = await req.json();
    
    // Get estimated rent from request body
    const estimatedRent = estimatedMonthlyRent;
    if (estimatedRent) {
      console.log('📊 Estimated rent received:', estimatedRent, 'kr/mnd');
    }
    
    // Check if user is ambassador or admin (unlimited access)
    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('credits, is_test_user')
      .eq('id', user.id)
      .single();

    const { data: roles } = await serviceSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAmbassador = roles?.some(r => r.role === 'ambassador' || r.role === 'admin');
    
    // Check credits for non-ambassadors
    if (!isAmbassador && !profile?.is_test_user) {
      if (!profile || profile.credits < 0.5) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. You need 0.5 credits per message.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('calculator_chat_sessions')
        .insert({
          user_id: user.id,
          calculator_data: calculatorData || {}
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      currentSessionId = newSession.id;
    } else {
      // Update calculator data if provided
      if (calculatorData) {
        await supabase
          .from('calculator_chat_sessions')
          .update({ calculator_data: calculatorData })
          .eq('id', currentSessionId);
      }
    }

    // Get chat history
    const { data: history } = await supabase
      .from('calculator_chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true });

    // Save user message
    await supabase
      .from('calculator_chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message,
        credits_used: 0
      });

    console.log('=== Processing message with OpenAI ===');
    
    // Field mapping from Finn.no to calculator
    const finnToCalculatorMapping: Record<string, string> = {
      'id': 'finnCode',
      'price': 'totalPrice',
      'primary_size': 'livingArea',
      'bedrooms': 'bedrooms',
      'rooms': 'rooms',
      'property_type': 'propertyType',
      'construction_year': 'buildYear',
      'plot_area': 'plotArea',
      'ownership_type': 'ownershipType',
      'municipality': 'municipality',
      'county': 'county',
      'energy_rating': 'energyRating',
      'facilities': 'facilities',
      'plot_owned': 'plotOwned',
      'shared_cost': 'sharedExpenses',
      'common_cost': 'commonCosts',
      'collective_debt': 'collectiveDebt',
      'municipal_fee': 'municipalFees',
      'property_tax': 'municipalFees'
    };
    
    // Check if message contains structured Finn.no data
    const isHtmlSource = message.includes('advertising') || 
                         message.includes('propertyData') ||
                         message.includes('"id":') && message.includes('"price":');
    
    // Build system prompt based on content type
    const systemPrompt = isHtmlSource 
      ? `Du er en ekspert på å ekstrahere eiendomsdata fra Finn.no HTML-kode.

VIKTIG: All informasjon står allerede i PLAINTEXT på norsk i HTML-koden. Du trenger IKKE oversette noe.

SE ETTER DISSE FELTENE I HTML (de står på norsk):
- Adresse (header eller "Beliggenhet")
- FINN-kode (i URL eller metadata)
- Prisantydning (tall i kroner)
- Primærrom/BRA (tall + m²)
- Soverom (antall)
- Rom (antall totalt)
- Boligtype (f.eks. "Enebolig", "Leilighet", "Rekkehus" - står på norsk!)
- Eierform (f.eks. "Selveier", "Borettslag", "Aksjeleilighet" - står på norsk!)
- Byggeår (årstall)
- Tomteareal (tall + m²)
- Energimerke (A-G)
- Fasiliteter (liste)
- Kommune (navn)
- Fylke (navn)
- Felleskostnader/Fellesutgifter (tall per måned)
- Kommunale avgifter (tall per måned)

EKSTRAHER verdiene NØYAKTIG som de står i HTML-koden. Ikke oversett eller konverter noe.

Returner BARE JSON med disse feltene:

Eksempel:
{
  "address": "Gofarnesvegen 3, 4250 Kopervik",
  "finnCode": "429564742",
  "totalPrice": 2900000,
  "livingArea": 126,
  "bedrooms": 3,
  "rooms": 4,
  "propertyType": "Enebolig",
  "buildYear": 1997,
  "plotArea": 544,
  "ownershipType": "Selveier",
  "energyRating": "C",
  "facilities": ["Balkong/Terrasse", "Garasje", "Hage"],
  "municipality": "Karmøy",
  "county": "Rogaland",
  "commonCosts": 3500,
  "municipalFees": 2100
}

BRUK TOOL CALLING for å returnere dataen strukturert.`
      : `Du er en hjelpsom AI-assistent for boligfinansieringsrapporter.

Din jobb er å hjelpe brukeren fylle ut en eiendomsrapport ved å:
1. Stille relevante spørsmål
2. Analysere dokumenter de laster opp
3. Be om Finn.no data hvis de vil analysere en eiendom

VIKTIG INSTRUKSJON TIL BRUKER:
Hvis brukeren vil analysere en eiendom fra Finn.no, BE DEM OM Å:
1. Åpne Finn.no annonsen i nettleseren
2. Trykke Ctrl+U (Windows) eller Cmd+Option+U (Mac)
3. Kopiere ALT (Ctrl+A, Ctrl+C)
4. Lime inn her i chatten

Jeg ekstraherer automatisk kun den relevante dataen!

Viktige felt: address, totalPrice, propertyType, livingArea, equity, interestRate, 
loanPeriod, monthlyRent, sharedExpenses, municipalFees, insurance, electricityMonthly.

BRUK TOOL CALLING når du har hentet ut data fra dokumenter eller HTML.`;

    // Build messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...(history || []),
    ];
    
    // Add user message with attachments if present
    if (attachments && attachments.length > 0) {
      const content: any[] = [{ 
        type: 'text', 
        text: message || 'Jeg har lastet opp dokumenter. Kan du analysere dem?' 
      }];
      
      for (const att of attachments) {
        if (att.type.startsWith('image/')) {
          content.push({
            type: 'image_url',
            image_url: { url: att.url }
          });
        }
      }
      
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // Define tool for structured data extraction
    const tools = [{
      type: "function",
      function: {
        name: "extract_property_data",
        description: "Extract structured property data from user input or HTML source",
        parameters: {
          type: "object",
          properties: {
            address: { type: "string", description: "Full property address" },
            finnCode: { type: "string", description: "FINN property code/ID" },
            totalPrice: { type: "number", description: "Total asking price (number only)" },
            propertyType: { type: "string", description: "Property type (Enebolig, Leilighet, etc)" },
            ownershipType: { type: "string", description: "Ownership type (Selveier, Borettslag, etc)" },
            livingArea: { type: "number", description: "Internal usable area (BRA/primærrom) in m²" },
            bedrooms: { type: "number", description: "Number of bedrooms" },
            rooms: { type: "number", description: "Total number of rooms" },
            buildYear: { type: "number", description: "Construction year" },
            energyRating: { type: "string", description: "Energy rating (A-G)" },
            plotArea: { type: "number", description: "Plot/land area in m²" },
            facilities: { 
              type: "array", 
              items: { type: "string" },
              description: "List of facilities/amenities" 
            },
            municipality: { type: "string", description: "Municipality name" },
            county: { type: "string", description: "County name" },
            commonCosts: { type: "number", description: "Monthly common costs / felleskostnader (shared building costs)" },
            municipalFees: { type: "number", description: "Monthly municipal fees (kommunale avgifter)" },
            monthlyRent: { type: "number", description: "Expected monthly rent income" }
          },
          required: []
        }
      }
    }];

    // Call OpenAI with tool calling
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: isHtmlSource ? { type: "function", function: { name: "extract_property_data" } } : "auto",
        temperature: 0.2,
        max_tokens: 1500
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', openaiResponse.status, errorText);
      
      // Handle rate limit / too large errors specifically
      if (openaiResponse.status === 429) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message?.includes('too large') || errorJson.error?.message?.includes('Requested')) {
            throw new Error('Meldingen er for lang. Hvis du limte inn HTML, kopier KUN <script id="__NEXT_DATA__"> seksjonen, ikke hele HTML-filen.');
          }
        } catch (e) {
          // If parsing fails, throw generic rate limit error
        }
        throw new Error('For mange tokens i meldingen. Prøv med kortere tekst eller kun relevante deler av HTML-koden.');
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await openaiResponse.json();
    const choice = data.choices[0];
    
    let assistantMessage = '';
    let extractedData = null;

    // Check if AI used tool calling
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function.name === 'extract_property_data') {
        extractedData = JSON.parse(toolCall.function.arguments);
        
        // Add estimated rent if we have it
        if (estimatedRent) {
          extractedData.monthlyRent = estimatedRent;
        }
        
        console.log('Extracted data via tool calling:', extractedData);
        
        // Build friendly response
        assistantMessage = 'Perfekt! Jeg har hentet ut følgende data:\n\n';
        if (extractedData.address) assistantMessage += `📍 **Adresse:** ${extractedData.address}\n\n`;
        if (extractedData.finnCode) assistantMessage += `🔢 **FINN-kode:** ${extractedData.finnCode}\n\n`;
        if (extractedData.totalPrice) assistantMessage += `💰 **Prisantydning:** ${extractedData.totalPrice.toLocaleString('nb-NO')} kr\n\n`;
        if (extractedData.propertyType) assistantMessage += `🏠 **Boligtype:** ${extractedData.propertyType}\n\n`;
        if (extractedData.ownershipType) assistantMessage += `📋 **Eierform:** ${extractedData.ownershipType}\n\n`;
        if (extractedData.livingArea) assistantMessage += `📐 **Primærrom (BRA):** ${extractedData.livingArea} m²\n\n`;
        if (extractedData.bedrooms) assistantMessage += `🛏️ **Soverom:** ${extractedData.bedrooms}\n\n`;
        if (extractedData.rooms) assistantMessage += `🚪 **Antall rom:** ${extractedData.rooms}\n\n`;
        if (extractedData.buildYear) assistantMessage += `🏗️ **Byggeår:** ${extractedData.buildYear}\n\n`;
        if (extractedData.energyRating) assistantMessage += `⚡ **Energimerke:** ${extractedData.energyRating}\n\n`;
        if (extractedData.plotArea) assistantMessage += `🌳 **Tomteareal:** ${extractedData.plotArea} m²\n\n`;
        if (extractedData.municipality) assistantMessage += `🏛️ **Kommune:** ${extractedData.municipality}\n\n`;
        if (extractedData.county) assistantMessage += `🗺️ **Fylke:** ${extractedData.county}\n\n`;
        if (extractedData.commonCosts) assistantMessage += `💵 **Felleskostnader:** ${extractedData.commonCosts.toLocaleString('nb-NO')} kr/mnd\n\n`;
        if (extractedData.municipalFees) assistantMessage += `🏛️ **Kommunale avgifter:** ${extractedData.municipalFees.toLocaleString('nb-NO')} kr/mnd\n\n`;
        if (extractedData.monthlyRent) assistantMessage += `💸 **Estimert leieinntekt:** ${extractedData.monthlyRent.toLocaleString('nb-NO')} kr/mnd\n\n`;
        
        if (extractedData.facilities && Array.isArray(extractedData.facilities) && extractedData.facilities.length > 0) {
          assistantMessage += `✨ **Fasiliteter:**\n`;
          extractedData.facilities.slice(0, 10).forEach((f: string) => {
            assistantMessage += `• ${f}\n`;
          });
          if (extractedData.facilities.length > 10) {
            assistantMessage += `• ... og ${extractedData.facilities.length - 10} flere\n`;
          }
          assistantMessage += `\n`;
        }
        
        assistantMessage += 'Dataen er nå fylt inn i rapporten! 🎉';
      }
    } else {
      // Regular text response
      assistantMessage = choice.message.content || 'Beklager, jeg kunne ikke generere et svar.';
    }

    const cleanMessage = assistantMessage.trim();

    // Deduct credits for non-ambassadors
    const creditsUsed = 0.5;
    if (!isAmbassador && !profile?.is_test_user) {
      const { error: creditError } = await serviceSupabase.rpc('use_credits', {
        credits_to_use: creditsUsed,
        operation_type: 'calculator_chat'
      });

      if (creditError) {
        console.error('Failed to deduct credits:', creditError);
      }
    }

    // Save assistant message
    await supabase
      .from('calculator_chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: cleanMessage,
        credits_used: isAmbassador || profile?.is_test_user ? 0 : creditsUsed
      });

    return new Response(
      JSON.stringify({
        message: cleanMessage,
        sessionId: currentSessionId,
        creditsUsed: isAmbassador || profile?.is_test_user ? 0 : creditsUsed,
        extractedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculator-ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
