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
    
    console.log('=== STEP 1: Checking for Finn.no code ===');
    console.log('Original message:', message);
    
    // Match various Finn.no URL formats
    const finnUrlMatch = message.match(/finn\.no\/(?:realestate\/homes\/)?ad\.html\?finnkode=(\d+)/i) ||
                         message.match(/finn\.no\/.*?(\d{8,9})/);
    const finnCodeMatch = !finnUrlMatch ? message.match(/\b(\d{8,9})\b/) : null;
    
    if (finnUrlMatch || finnCodeMatch) {
      finnCode = finnUrlMatch?.[1] || finnCodeMatch?.[1];
      console.log('=== STEP 2: Finn.no code detected ===');
      console.log('Finnkode:', finnCode);
      
      try {
        console.log('=== STEP 3: Calling Perplexity API ===');
        
        const perplexityPayload = {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Du er en eiendomsdata-ekstraktor. Søk opp Finn.no annonsen og hent ut: adresse, pris, type, størrelse, felleskostnader, kommunale avgifter. Presenter som punktliste på norsk.'
            },
            {
              role: 'user',
              content: 'Finn.no finnkode ' + finnCode + ' - hent adresse, pris, type, størrelse, felleskostnader, kommunale avgifter'
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          search_domain_filter: ['finn.no']
        };
        
        console.log('Perplexity payload:', JSON.stringify(perplexityPayload, null, 2));
        
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + PERPLEXITY_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(perplexityPayload),
        });

        console.log('=== STEP 4: Perplexity response received ===');
        console.log('Status:', perplexityResponse.status);
        
        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          finnSearchResults = perplexityData.choices[0].message.content;
          console.log('=== STEP 5: Data extracted from Perplexity ===');
          console.log('Length:', finnSearchResults.length);
          console.log('Content:', finnSearchResults);
        } else {
          const errorText = await perplexityResponse.text();
          console.error('=== STEP 5: Perplexity ERROR ===');
          console.error('Status:', perplexityResponse.status);
          console.error('Error:', errorText);
        }
      } catch (error) {
        console.error('=== STEP 5: Exception in Perplexity call ===');
        console.error('Error:', error);
      }
    } else {
      console.log('=== STEP 2: No Finn.no code detected ===');
    }

    console.log('=== STEP 6: Building OpenAI prompt ===');
    console.log('Has Finn data?', !!finnSearchResults);
    
    // Build simple system prompt
    let systemPrompt = 'Du er en AI-assistent for boligfinansieringsrapporter.\n\n';
    
    if (finnSearchResults) {
      systemPrompt += '🔍 EIENDOMSDATA ER HENTET (finnkode ' + finnCode + '):\n\n';
      systemPrompt += finnSearchResults + '\n\n';
      systemPrompt += '📋 OPPGAVE: Ekstraher disse feltene og returner som JSON:\n';
      systemPrompt += '- address, totalPrice, propertyType, livingArea, commonCosts, municipalFees\n\n';
      systemPrompt += '⚠️ VIKTIG: Dataen er ALLEREDE hentet. Du skal bare lese den og ekstrahere.\n';
      systemPrompt += 'Presenter funnene vennlig, deretter avslutt med:\n';
      systemPrompt += 'EXTRACTED_DATA: {"address": "...", "totalPrice": "123456", ...}\n';
    } else {
      systemPrompt += 'Hjelp brukeren med å fylle ut rapporten.\n';
      systemPrompt += 'Still spørsmål for å få nødvendig informasjon.\n';
    }
    
    console.log('System prompt length:', systemPrompt.length);
    console.log('System prompt preview:', systemPrompt.substring(0, 200) + '...');

    // Build messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...(history || []),
    ];

    console.log('=== STEP 7: Adding user message ===');
    
    // Add user message - simplified if we have Finn data
    if (finnSearchResults && finnCode) {
      const simplifiedMessage = 'Analyser eiendomsdataen for finnkode ' + finnCode + ' som er gitt i system-prompten.';
      messages.push({ role: 'user', content: simplifiedMessage });
      console.log('Simplified user message (Finn data present):', simplifiedMessage);
    } else if (attachments && attachments.length > 0) {
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
      console.log('User message with', attachments.length, 'attachments');
    } else {
      messages.push({ role: 'user', content: message });
      console.log('Regular user message:', message.substring(0, 100));
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
