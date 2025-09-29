import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, customPrompt } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    console.log('Processing message for user:', user.id);

    // Check if user can use credits (includes ambassador/admin check)
    const { data: canUseResult, error: creditsError } = await supabaseClient.rpc('use_credits', {
      credits_to_use: 1,
      operation_type: 'utleie_agent_chat'
    });

    if (creditsError) {
      console.error('Credits check error:', creditsError);
      throw new Error('Failed to verify credits');
    }

    if (!canUseResult) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          needsCredits: true 
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create the specialized real estate agent system prompt
    const systemPrompt = `Du er en ekspert eiendomsrådgiver og utleieagent som kombinerer dybdekunnskap fra:

🏦 SENIOR BANKINVESTOR: 
- Finansieringsstrategier og låneoptimalisering
- Rentevurderinger og markedsanalyser
- Risikoevaluering og avkastningskalkyler
- Skatteplanlegging og juridiske aspekter

🏘️ SENIOR EIENDOMSMEGLER:
- Markedsprising og verdivurdering
- Salgsstrategier og forhandlingsteknikker
- Områdekunnskap og markedstrender
- Kjøp- og salgsoptimalisering

⚖️ EIENDOMSADVOKAT:
- Juridiske aspekter ved eiendomskjøp/-salg
- Kontraktsrett og leierett
- Skatteoptimalisering og juridisk sikring
- Risikominimering og compliance

🏢 UTLEIEFORVALTER:
- Leietakerhåndtering og screening
- Vedlikehold og drift av eiendommer  
- Leieavtaler og depositumhåndtering
- Økonomisk oppfølging av utleie

Du gir alltid:
✅ Konkrete, handlingsrettede råd
✅ Norske lover og forskrifter
✅ Aktuelle markedsforhold
✅ Risikovurderinger og alternativer
✅ Tallbaserte anbefalinger når mulig

${customPrompt ? `\nSPESIALISERING: ${customPrompt}` : ''}

Svar alltid på norsk og vær presis, profesjonell og hjelpsom.`;

    console.log('Calling OpenAI API with specialized prompt');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    // Log successful interaction
    console.log('Successfully processed Utleie Agent message for user:', user.id);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        creditsUsed: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in utleie-agent-chat function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});