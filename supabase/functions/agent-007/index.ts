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
    console.log('=== Agent 007 Function Called ===');
    console.log('Request method:', req.method);
    
    const { message, conversationHistory, action } = await req.json();
    console.log('Received message:', message ? 'YES' : 'NO');
    console.log('Conversation history:', conversationHistory ? conversationHistory.length + ' messages' : 'NONE');

    if (!message) {
      console.error('No message provided');
      throw new Error('Message is required');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Authorization header required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get current user using the auth header directly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Authentication required');
    }

    console.log('Processing Agent 007 request for user:', user.id);

    // Check if user can use credits (this agent costs 1 credit per interaction)
    const { data: canUseResult, error: creditsError } = await supabaseClient.rpc('use_credits', {
      credits_to_use: 1,
      operation_type: 'agent_007_rental_management'
    });

    if (creditsError) {
      console.error('Credits check error:', creditsError);
      // For ambassadors/admins, continue anyway
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(r => r.role === 'admin');
      const isAmbassador = userRoles?.some(r => r.role === 'ambassador');
      
      if (!isAdmin && !isAmbassador) {
        throw new Error('Failed to verify credits');
      }
    }

    if (!canUseResult) {
      // Check if user is admin/ambassador
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(r => r.role === 'admin');
      const isAmbassador = userRoles?.some(r => r.role === 'ambassador');
      
      if (!isAdmin && !isAmbassador) {
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
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key configured:', openaiApiKey ? 'YES' : 'NO');
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    // Create the specialized rental management agent system prompt
    const systemPrompt = `Du er Agent 007 - en avansert utleieforvaltningsagent som spesialiserer seg på praktisk utleieforvaltning og automatisering.

🎯 DITT OPPDRAG:
- Hjelpe utleiere med konkrete utleieoppgaver
- Automatisere kommunikasjon med leietakere
- Administrere leieforhold og dokumentasjon
- Utføre spesifikke handlinger i utleiesystemet

🛠️ DINE HOVEDOMRÅDER:
📨 KOMMUNIKASJON:
- Generere og sende SMS/e-post til leietakere
- Opprettholde profesjonell og juridisk korrekt kommunikasjon
- Håndtere husleieinnkreving og påminnelser
- Administrere flyttemeldinger og oppsigelser

📋 DOKUMENTHÅNDTERING:
- Utarbeide leieavtaler og tillegg
- Generere inn- og utflyttingsprotokoller
- Administrere depositumkontoer og regnskaper
- Oppdatere eiendomsinformasjon

⚖️ JURIDISK COMPLIANCE:
- Sikre at alle handlinger følger norsk leielovgivning
- Advare om juridiske fallgruver
- Generere juridisk korrekte varsler og dokumenter

🤖 AUTOMATISKE HANDLINGER:
Når du får beskjed om å utføre handlinger, utfører du dem direkte i systemet:
- Send SMS/e-post til spesifikke leietakere
- Oppdater leieforhold-status
- Generer og lagre dokumenter
- Opprett påminnelser og oppfølging

Du er effektiv, presis og alltid profesjonell. Du spør om bekreftelse før du utfører kritiske handlinger som kan påvirke leieforhold.

VIKTIG: Du koster 1 credit per interaksjon fordi du utfører avanserte handlinger og automatisering.

Svar alltid på norsk og vær konkret og handlingsorientert.`;

    console.log('Calling OpenAI API for Agent 007');

    // Build messages array with conversation history
    const messages = [
      { 
        role: 'system', 
        content: systemPrompt
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({ 
      role: 'user', 
      content: message 
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
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
    console.log('OpenAI API response received for Agent 007');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    // Log successful interaction
    console.log('Successfully processed Agent 007 request for user:', user.id);

    // TODO: In the future, implement action execution based on the 'action' parameter
    // This could trigger SMS sending, email sending, document generation, etc.

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        creditsUsed: true,
        actionExecuted: action || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in Agent 007 function:', error);
    
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