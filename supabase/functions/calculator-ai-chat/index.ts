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
    let finnCode = null;
    let extractedData = null;
    
    console.log('=== Starting Finn.no detection ===');
    
    // Match various Finn.no URL formats
    const finnUrlMatch = message.match(/finn\.no\/(?:realestate\/homes\/)?ad\.html\?finnkode=(\d+)/i) ||
                         message.match(/finn\.no\/.*?(\d{8,9})/);
    const finnCodeMatch = !finnUrlMatch ? message.match(/\b(\d{8,9})\b/) : null;
    
    if (finnUrlMatch || finnCodeMatch) {
      finnCode = finnUrlMatch?.[1] || finnCodeMatch?.[1];
      console.log('Finnkode detected:', finnCode);
      
      // Check cache first
      const { data: cachedData } = await supabase
        .from('finn_property_cache')
        .select('property_data, extracted_at')
        .eq('finn_code', finnCode)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (cachedData) {
        console.log('Using cached data from:', cachedData.extracted_at);
        extractedData = cachedData.property_data;
      } else {
        console.log('Fetching fresh data from Perplexity...');
        
        try {
          // Use Perplexity to extract structured data directly
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + PERPLEXITY_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                {
                  role: 'system',
                  content: 'Du er en eiendomsdata-ekstraktor. Søk opp Finn.no annonsen og returner BARE et JSON-objekt med følgende felt (bruk null hvis data mangler): {"address": "full adresse", "totalPrice": tall uten kr, "propertyType": "type", "livingArea": tall i kvm, "commonCosts": tall per måned, "municipalFees": tall per år, "buildYear": år, "bedrooms": antall}. VIKTIG: Returner KUN JSON, ingen annen tekst.'
                },
                {
                  role: 'user',
                  content: 'Finn.no finnkode ' + finnCode
                }
              ],
              temperature: 0.1,
              max_tokens: 500,
              search_domain_filter: ['finn.no']
            }),
          });

          if (perplexityResponse.ok) {
            const perplexityData = await perplexityResponse.json();
            const content = perplexityData.choices[0].message.content;
            console.log('Perplexity raw response:', content);
            
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (jsonMatch) {
              extractedData = JSON.parse(jsonMatch[0]);
              console.log('Extracted data:', extractedData);
              
              // Cache the result
              await serviceSupabase
                .from('finn_property_cache')
                .upsert({
                  finn_code: finnCode,
                  property_data: extractedData,
                  extracted_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }, { onConflict: 'finn_code' });
              
              console.log('Data cached successfully');
            } else {
              console.error('Could not extract JSON from Perplexity response');
            }
          } else {
            const errorText = await perplexityResponse.text();
            console.error('Perplexity error:', perplexityResponse.status, errorText);
          }
        } catch (error) {
          console.error('Error in Perplexity call:', error);
        }
      }
    }

    // If we have extracted Finn.no data, return it directly without using OpenAI
    if (extractedData) {
      console.log('Returning extracted Finn.no data directly');
      
      // Build friendly response message
      let responseMessage = 'Perfekt! Jeg har hentet informasjonen fra Finn.no:\n\n';
      if (extractedData.address) responseMessage += '📍 Adresse: ' + extractedData.address + '\n';
      if (extractedData.totalPrice) responseMessage += '💰 Pris: ' + extractedData.totalPrice.toLocaleString('nb-NO') + ' kr\n';
      if (extractedData.propertyType) responseMessage += '🏠 Type: ' + extractedData.propertyType + '\n';
      if (extractedData.livingArea) responseMessage += '📐 Størrelse: ' + extractedData.livingArea + ' kvm\n';
      if (extractedData.commonCosts) responseMessage += '💵 Felleskostnader: ' + extractedData.commonCosts.toLocaleString('nb-NO') + ' kr/mnd\n';
      if (extractedData.municipalFees) responseMessage += '🏛️ Kommunale avgifter: ' + extractedData.municipalFees.toLocaleString('nb-NO') + ' kr/år\n';
      responseMessage += '\nJeg fyller nå ut rapporten automatisk med denne informasjonen!';
      
      // Save messages
      await supabase
        .from('calculator_chat_messages')
        .insert([
          {
            session_id: currentSessionId,
            role: 'user',
            content: message,
            credits_used: 0
          },
          {
            session_id: currentSessionId,
            role: 'assistant',
            content: responseMessage,
            credits_used: isAmbassador || profile?.is_test_user ? 0 : 0.5
          }
        ]);
      
      // Deduct credits
      if (!isAmbassador && !profile?.is_test_user) {
        await serviceSupabase.rpc('use_credits', {
          credits_to_use: 0.5,
          operation_type: 'calculator_chat'
        });
      }
      
      return new Response(
        JSON.stringify({
          message: responseMessage,
          sessionId: currentSessionId,
          creditsUsed: isAmbassador || profile?.is_test_user ? 0 : 0.5,
          extractedData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For non-Finn.no messages, use OpenAI as before
    console.log('=== Using OpenAI for regular chat ===');
    
    // Reuse chat history already fetched earlier
    
    // Build simple system prompt for regular chat
    const systemPrompt = 'Du er en hjelpsom AI-assistent for boligfinansieringsrapporter. ' +
      'Du hjelper brukere med å fylle ut rapporter ved å stille spørsmål og analysere dokumenter de laster opp.\n\n' +
      'Viktige felt: address, totalPrice, propertyType, livingArea, equity, interestRate, loanPeriod, ' +
      'monthlyRent, commonCosts, municipalFees, insurance, electricityMonthly.\n\n' +
      'Når du har hentet ut data, avslutt med:\n' +
      'EXTRACTED_DATA: {"field1": "value1", "field2": "value2"}';

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
