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
    console.log('=== Utleie Agent Chat Function Called ===');
    console.log('Request method:', req.method);
    
    const { message, customPrompt } = await req.json();
    console.log('Received message:', message ? 'YES' : 'NO');
    console.log('Custom prompt:', customPrompt ? 'YES' : 'NO');

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

    console.log('Processing message for user:', user.id);

    // Check if user has credits or rental subscription (no credits consumed for general agent)
    let userProfile: any;
    
    try {
      const { data, error: profileError } = await supabaseClient
        .from('profiles')
        .select('credits, subscription_tier, subscription_end')
        .eq('id', user.id)
        .single();
      
      if (profileError || !data) {
        console.log('Profile not found, creating one...');
        // If profile doesn't exist, create a basic one
        const { error: insertError } = await supabaseClient
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            credits: 0,
            subscription_tier: 'free'
          });
        
        if (insertError) {
          console.error('Failed to create profile:', insertError);
        }
        
        // Set default values for new profile
        userProfile = { credits: 0, subscription_tier: 'free', subscription_end: null };
      } else {
        userProfile = data;
      }
    } catch (error) {
      console.error('Profile operation failed:', error);
      // Continue with default values for ambassadors/admins
      userProfile = { credits: 0, subscription_tier: 'free', subscription_end: null };
    }

    // Check if user is admin or ambassador (free access)
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isAmbassador = userRoles?.some(r => r.role === 'ambassador');

    // Check access: admin/ambassador OR has credits OR has active rental subscription
    const hasCredits = (userProfile.credits || 0) > 0;
    const hasRentalSub = userProfile.subscription_tier === 'rental' && 
      (!userProfile.subscription_end || new Date(userProfile.subscription_end) > new Date());
    
    if (!isAdmin && !isAmbassador && !hasCredits && !hasRentalSub) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied. You need credits or an active rental subscription to use Utleie Agent.',
          needsAccess: true 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key configured:', openaiApiKey ? 'YES' : 'NO');
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
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
        creditsUsed: false // General Utleie Agent is now free
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