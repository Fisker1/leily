import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
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
    let finnSearchResults = null;
    let finnCode = null;
    
    // Match various Finn.no URL formats
    const finnUrlMatch = message.match(/finn\.no\/(?:realestate\/homes\/)?ad\.html\?finnkode=(\d+)/i) ||
                         message.match(/finn\.no\/.*?(\d{8,9})/);
    const finnCodeMatch = !finnUrlMatch ? message.match(/\b(\d{8,9})\b/) : null;
    
    if (finnUrlMatch || finnCodeMatch) {
      finnCode = finnUrlMatch?.[1] || finnCodeMatch?.[1];
      console.log(`Detected Finn.no code: ${finnCode}, searching web for property data...`);
      
      try {
        // Improved Perplexity query with specific instructions
        const searchQuery = `Hent detaljert informasjon om eiendomsannonsen på Finn.no med finnkode ${finnCode}. 
        
Jeg trenger følgende informasjon presentert i en strukturert liste:
- Fullstendig adresse (gate, postnummer, poststed)
- Totalpris / Prisantydning (i kr)
- Eiendomstype (leilighet, enebolig, rekkehus, osv.)
- Primærrom / Bruksareal (i kvm)
- Felleskostnader per måned (i kr)
- Kommunale avgifter per år (i kr)
- Tomteareal (hvis relevant, i kvm)
- Byggeår
- Antall soverom

Vennligst søk opp denne finnkoden på Finn.no og gi meg faktisk informasjon fra annonsen.`;
        
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
              {
                role: 'system',
                content: `Du er en nøyaktig eiendomsdata-ekstraktor. Din oppgave er å søke opp spesifikke Finn.no annonser og hente ut nøyaktig informasjon.

VIKTIG: Du må aktivt søke på nettet etter den spesifikke finnkoden og finne den faktiske annonsen.

Strukturer svaret ditt som en punktliste med disse feltene (bruk "Ikke oppgitt" hvis informasjon mangler):
- Adresse: [fullstendig adresse]
- Totalpris: [beløp i kr]
- Eiendomstype: [type]
- Primærrom: [størrelse i kvm]
- Felleskostnader: [beløp per måned]
- Kommunale avgifter: [beløp per år]
- Tomteareal: [størrelse eller "Ikke relevant"]
- Byggeår: [år]
- Soverom: [antall]

Svar kun på norsk.`
              },
              {
                role: 'user',
                content: searchQuery
              }
            ],
            temperature: 0.1,
            max_tokens: 1500,
            return_images: false,
            return_related_questions: false,
            search_recency_filter: 'month',
            search_domain_filter: ['finn.no']
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          finnSearchResults = perplexityData.choices[0].message.content;
          console.log('Perplexity search results:', finnSearchResults);
        } else {
          const errorText = await perplexityResponse.text();
          console.error('Perplexity API error:', perplexityResponse.status, errorText);
        }
      } catch (error) {
        console.error('Error searching for Finn.no data:', error);
      }
    }

    // Build system prompt based on context
    let systemPrompt = 'Du er en hjelpsom AI-assistent for boligfinansieringsrapporter. Du hjelper brukere med å analysere og fylle ut rapporter basert på eiendomsinformasjon.\n\n';
    
    if (finnSearchResults) {
      systemPrompt += '⚠️ VIKTIG: Du har IKKE tilgang til internett, og du trenger det IKKE heller!\n\n';
      systemPrompt += '=== EIENDOMSINFORMASJON ER ALLEREDE HENTET FRA FINN.NO ===\n';
      systemPrompt += 'Finnkode: ' + finnCode + '\n\n';
      systemPrompt += 'Følgende informasjon er allerede hentet via websøk:\n';
      systemPrompt += '---BEGIN DATA---\n';
      systemPrompt += finnSearchResults + '\n';
      systemPrompt += '---END DATA---\n\n';
      systemPrompt += '=== DIN OPPGAVE ===\n\n';
      systemPrompt += 'Analyser dataen ovenfor (mellom BEGIN DATA og END DATA) og EKSTRAHER følgende felt:\n\n';
      systemPrompt += '1. address - Full adresse (gate, postnummer, sted)\n';
      systemPrompt += '2. totalPrice - Totalpris/prisantydning (kun tall uten "kr", f.eks. 5500000)\n';
      systemPrompt += '3. propertyType - Eiendomstype (leilighet/enebolig/rekkehus/osv)\n';
      systemPrompt += '4. livingArea - Primærrom/bruksareal i kvm (kun tall, f.eks. 85)\n';
      systemPrompt += '5. commonCosts - Felleskostnader per måned (kun tall, f.eks. 3500)\n';
      systemPrompt += '6. municipalFees - Kommunale avgifter per år (kun tall, f.eks. 8000)\n\n';
      systemPrompt += 'INSTRUKSJONER:\n';
      systemPrompt += '✅ Dataen er ALLEREDE hentet - du skal bare analysere den\n';
      systemPrompt += '✅ Presenter funnene dine på en vennlig måte\n';
      systemPrompt += '✅ Avslutt ALLTID med: EXTRACTED_DATA: {"address": "...", "totalPrice": "...", osv}\n';
      systemPrompt += '✅ Bruk kun tall i tallfelter (ingen "kr", "kvm", etc)\n';
      systemPrompt += '❌ IKKE si at du ikke har tilgang til lenker\n';
      systemPrompt += '❌ IKKE be brukeren om å oppgi informasjonen manuelt\n\n';
      systemPrompt += 'Eksempel på riktig svar:\n';
      systemPrompt += '"Flott! Jeg har analysert eiendomsdataen. Her er det jeg fant:\n\n';
      systemPrompt += '📍 Adresse: Eksempelveien 123, 0123 Oslo\n';
      systemPrompt += '💰 Prisantydning: 5 500 000 kr\n';
      systemPrompt += '🏠 Type: Leilighet\n';
      systemPrompt += '📐 Primærrom: 85 kvm\n\n';
      systemPrompt += 'Jeg fyller nå automatisk ut rapporten."\n\n';
      systemPrompt += 'EXTRACTED_DATA: {"address": "Eksempelveien 123, 0123 Oslo", "totalPrice": "5500000", "propertyType": "leilighet", "livingArea": "85", "commonCosts": "3500", "municipalFees": "8000"}';
    } else {
      systemPrompt += 'Du hjelper brukere med å fylle ut boligfinansieringsrapporter.\n\n';
      systemPrompt += 'Når brukeren laster opp bilder eller dokumenter:\n';
      systemPrompt += '- Analyser bildene nøye og hent ut relevant informasjon\n';
      systemPrompt += '- Se etter tall, adresser, beløp, og andre relevante detaljer\n';
      systemPrompt += '- Presenter funnene tydelig og spør om brukeren vil at du skal fylle inn dataene automatisk\n\n';
      systemPrompt += 'Viktige felt:\n';
      systemPrompt += '- Eiendomsinformasjon: address, totalPrice, propertyType, livingArea\n';
      systemPrompt += '- Låneinformasjon: equity, interestRate, loanPeriod\n';
      systemPrompt += '- Månedlige kostnader: commonCosts, municipalFees, insurance, electricityMonthly\n';
      systemPrompt += '- Forventet leieinntekt: monthlyRent\n\n';
      systemPrompt += 'Vær proaktiv: Still ett spørsmål om gangen.\n\n';
      systemPrompt += 'VIKTIG: Når du har hentet ut data, avslutt meldingen din med:\n';
      systemPrompt += 'EXTRACTED_DATA: {"field1": "value1", "field2": "value2"}\n\n';
      systemPrompt += 'Gyldige felt: address, totalPrice, equity, interestRate, loanPeriod, monthlyRent, commonCosts, municipalFees, insurance, electricityMonthly, propertyType, livingArea';
    }

    // Build messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...(history || []),
    ];

    // Add user message with context
    if (finnSearchResults) {
      // When we have Finn.no results, remove the URL from message and make it clear data is already fetched
      const messageWithoutUrl = message.replace(/https?:\/\/[^\s]+/g, '[Finn.no lenke fjernet - data allerede hentet]');
      const contextMessage = messageWithoutUrl + '\n\n[VIKTIG SYSTEM-MELDING: Eiendomsinformasjonen for finnkode ' + finnCode + ' er ALLEREDE hentet via websøk og finnes i system-prompten over. Du trenger IKKE å åpne noen lenker. Analyser dataen som allerede er gitt til deg og fyll ut rapporten.]';
      messages.push({ role: 'user', content: contextMessage });
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

    // Call OpenAI with improved model
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.3,
        max_tokens: 800
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
