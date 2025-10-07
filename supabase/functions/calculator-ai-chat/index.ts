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

    const { sessionId, message, calculatorData, attachments } = await req.json();

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

    // Check if message contains Finn.no URL or code
    let finnPropertyData = null;
    // Match various Finn.no URL formats
    const finnUrlMatch = message.match(/finn\.no\/(?:realestate\/homes\/)?ad\.html\?finnkode=(\d+)/i) ||
                         message.match(/finn\.no\/.*?(\d{8,9})/);
    const finnCodeMatch = !finnUrlMatch ? message.match(/\b(\d{8,9})\b/) : null;
    
    if (finnUrlMatch || finnCodeMatch) {
      const finnCode = finnUrlMatch?.[1] || finnCodeMatch?.[1];
      console.log(`Detected Finn.no code: ${finnCode}, fetching property data...`);
      
      try {
        // Call finn-property-scraper using supabase.functions.invoke
        const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: finnData, error: finnError } = await serviceSupabase.functions.invoke('finn-property-scraper', {
          body: { finnCode }
        });
        
        if (!finnError && finnData?.success && finnData?.data) {
          finnPropertyData = finnData.data;
          console.log('Successfully fetched Finn.no data:', {
            address: finnPropertyData.address,
            price: finnPropertyData.price,
            type: finnPropertyData.propertyType
          });
        } else {
          console.error('Failed to fetch Finn.no data:', finnError || 'No data returned');
        }
      } catch (error) {
        console.error('Error fetching Finn.no data:', error);
      }
    }

    // Build messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: `Du er en hjelpsom AI-assistent for eiendomskalkulator. Du hjelper brukere med å fylle ut boligfinansieringsrapporter ved å stille relevante spørsmål og fylle inn data proaktivt.

VIKTIG: Når du oppdager en Finn.no link eller kode i brukerens melding:
${finnPropertyData ? `
EIENDOMSDATA ER AUTOMATISK HENTET:
- Adresse: ${finnPropertyData.address}
- Pris: ${finnPropertyData.price} kr
- Type: ${finnPropertyData.propertyType}
- Størrelse: ${finnPropertyData.livingArea} kvm
- Felleskostnader: ${finnPropertyData.sharedCosts || 'Ikke oppgitt'} kr/mnd
- Kommunale avgifter: ${finnPropertyData.municipalFees || 'Ikke oppgitt'} kr/mnd

Du MÅ nå fylle ut rapporten med denne dataen automatisk og informere brukeren om hva du har fylt inn.
Foreslå også estimert leiepris basert på beliggenhet og størrelse.
` : 'Jeg har ikke klart å hente eiendomsdata automatisk. Spør brukeren om å oppgi nødvendig informasjon manuelt.'}

Når brukeren laster opp bilder eller dokumenter:
- Analyser bildene nøye og hent ut relevant informasjon
- Se etter tall, adresser, beløp, og andre relevante detaljer
- For forsikringsdokumenter: Hent ut forsikringsbeløp
- For bankdokumenter: Hent ut saldo, lånebeløp, renter
- For skjermbilder av eiendomsannonser: Hent ut pris, adresse, størrelse
- Presenter funnene tydelig og spør om brukeren vil at du skal fylle inn dataene automatisk

Viktige felt som må fylles ut:
- Eiendomsinformasjon: address, totalPrice, propertyType, livingArea
- Låneinformasasjon: equity, interestRate, loanPeriod
- Månedlige kostnader: commonCosts, municipalFees, insurance, electricityMonthly
- Forventet leieinntekt: monthlyRent

Vær proaktiv: Still ett spørsmål om gangen for å få all nødvendig informasjon.

VIKTIG: Når du har hentet ut data fra dokumenter eller Finn.no, avslutt meldingen din med en JSON-struktur på følgende format (på egen linje):
EXTRACTED_DATA: {"field1": "value1", "field2": "value2"}

Eksempel på gyldige felt:
- address, totalPrice, equity, interestRate, loanPeriod, monthlyRent, commonCosts, municipalFees, insurance, electricityMonthly, propertyType, livingArea`
      },
      ...(history || []),
    ];

    // Add user message with attachments or Finn data context
    if (finnPropertyData) {
      const finnMessage = message + `\n\n[System: Eiendomsdata automatisk hentet fra Finn.no]`;
      messages.push({ role: 'user', content: finnMessage });
    } else if (attachments && attachments.length > 0) {
      const content: any[] = [{ type: 'text', text: message || 'Jeg har lastet opp noen dokumenter. Kan du hjelpe meg med å hente ut relevant informasjon?' }];
      
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

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', openaiResponse.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message.content;

    // Extract structured data if present
    let extractedData = null;
    const extractedMatch = assistantMessage.match(/EXTRACTED_DATA:\s*(\{[^}]+\})/);
    if (extractedMatch) {
      try {
        extractedData = JSON.parse(extractedMatch[1]);
      } catch (e) {
        console.error('Failed to parse extracted data:', e);
      }
    }
    
    // If we fetched Finn data, add it to extracted data
    if (finnPropertyData && !extractedData) {
      extractedData = {
        address: finnPropertyData.address,
        totalPrice: finnPropertyData.price?.toString(),
        propertyType: finnPropertyData.propertyType,
        livingArea: finnPropertyData.livingArea?.toString(),
        commonCosts: finnPropertyData.sharedCosts?.toString(),
        municipalFees: finnPropertyData.municipalFees?.toString(),
      };
    } else if (finnPropertyData && extractedData) {
      // Merge Finn data with extracted data
      extractedData = {
        address: extractedData.address || finnPropertyData.address,
        totalPrice: extractedData.totalPrice || finnPropertyData.price?.toString(),
        propertyType: extractedData.propertyType || finnPropertyData.propertyType,
        livingArea: extractedData.livingArea || finnPropertyData.livingArea?.toString(),
        commonCosts: extractedData.commonCosts || finnPropertyData.sharedCosts?.toString(),
        municipalFees: extractedData.municipalFees || finnPropertyData.municipalFees?.toString(),
        ...extractedData
      };
    }

    // Remove the EXTRACTED_DATA tag from the message
    const cleanMessage = assistantMessage.replace(/EXTRACTED_DATA:\s*\{[^}]+\}/, '').trim();

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
