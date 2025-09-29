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

    // Fetch user's rental data to provide context to Agent 007
    console.log('Fetching rental data for user:', user.id);
    
    // Get properties with lease agreements and tenants
    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select(`
        *,
        lease_agreements!lease_agreements_property_id_fkey (
          *,
          tenants!lease_agreements_tenant_id_fkey (
            id,
            first_name,
            last_name,
            property_owner_id
          )
        )
      `)
      .eq('owner_id', user.id);

    console.log('Properties query result:', { 
      data: properties, 
      error: propertiesError,
      userId: user.id,
      propertyCount: properties?.length || 0
    });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      // Still continue to provide meaningful context even if properties fetch fails
    }

    // Get recent chat messages for context - simplified approach
    let recentChats = null;
    try {
      // First get all lease agreements for this user
      const { data: userLeases, error: leasesError } = await supabaseClient
        .from('lease_agreements')
        .select('id')
        .eq('property_owner_id', user.id);

      if (leasesError) {
        console.error('Error fetching user leases:', leasesError);
      } else if (userLeases && userLeases.length > 0) {
        const leaseIds = userLeases.map(lease => lease.id);
        
        // Then get chat messages for these leases
        const { data: chats, error: chatsError } = await supabaseClient
          .from('chat_messages')
          .select(`
            id,
            message_content,
            sender_type,
            sender_id,
            lease_id,
            created_at
          `)
          .in('lease_id', leaseIds)
          .order('created_at', { ascending: false })
          .limit(20);

        if (chatsError) {
          console.error('Error fetching chat messages:', chatsError);
        } else {
          recentChats = chats;
        }
      }
    } catch (error) {
      console.error('Error in chat messages fetch:', error);
    }

    // Build context string with rental information
    let rentalContext = '\n\n📊 TILGJENGELIG UTLEIEDATA:\n';
    
    if (properties && properties.length > 0) {
      rentalContext += '\n🏠 EIENDOMMER OG LEIEFORHOLD:\n';
      properties.forEach((property: any) => {
        rentalContext += `\nEiendom: ${property.address}`;
        if (property.lease_agreements && property.lease_agreements.length > 0) {
          property.lease_agreements.forEach((lease: any) => {
            if (lease.tenants) {
              rentalContext += `\n- Leietaker: ${lease.tenants.first_name} ${lease.tenants.last_name}`;
              rentalContext += `\n- Status: ${lease.status}`;
              rentalContext += `\n- Leie: ${lease.monthly_rent || 'Ikke oppgitt'} kr/mnd`;
              if (lease.start_date) rentalContext += `\n- Start: ${lease.start_date}`;
              if (lease.end_date) rentalContext += `\n- Slutt: ${lease.end_date}`;
            }
          });
        } else {
          rentalContext += '\n- Ingen aktive leieforhold';
        }
        rentalContext += '\n';
      });
    }

    if (recentChats && recentChats.length > 0) {
      rentalContext += '\n💬 NYLIGE SAMTALER:\n';
      
      // Get additional info for each chat message
      for (const chat of recentChats) {
        try {
          // Get lease agreement info for this message
          const { data: leaseInfo } = await supabaseClient
            .from('lease_agreements')
            .select(`
              id,
              monthly_rent,
              status,
               properties!lease_agreements_property_id_fkey (
                 address
               ),
               tenants!lease_agreements_tenant_id_fkey (
                 first_name,
                 last_name
               )
            `)
            .eq('id', chat.lease_id)
            .single();

          if (leaseInfo && leaseInfo.tenants && leaseInfo.properties) {
            const sender = chat.sender_type === 'landlord' ? 'Utleier' : 'Leietaker';
            const date = new Date(chat.created_at).toLocaleDateString('no-NO');
            const tenantName = `${leaseInfo.tenants.first_name} ${leaseInfo.tenants.last_name}`;
            const address = leaseInfo.properties.address;
            
            rentalContext += `\n${tenantName} - ${address}:\n`;
            rentalContext += `- ${sender} (${date}): ${chat.message_content.substring(0, 100)}${chat.message_content.length > 100 ? '...' : ''}\n`;
          }
        } catch (error) {
          console.error('Error getting chat context:', error);
        }
      }
    }

    if (!properties?.length && !recentChats?.length) {
      rentalContext += `\nIngen utleiedata funnet for bruker ${user.id}. Brukeren har ingen registrerte eiendommer eller leieforhold i systemet.`;
      console.log('No rental data found for user:', user.id);
    } else {
      console.log(`Found ${properties?.length || 0} properties and ${recentChats?.length || 0} recent chats for user:`, user.id);
    }

    // Create the specialized rental management agent system prompt with enhanced search capabilities
    const systemPrompt = `Du er Agent 007 - en avansert utleieforvaltningsagent som spesialiserer seg på praktisk utleieforvaltning og automatisering.

🎯 DITT OPPDRAG:
- Hjelpe utleiere med konkrete utleieoppgaver
- Automatisere kommunikasjon med leietakere
- Administrere leieforhold og dokumentasjon
- Analysere chat-historikk mellom utleier og leietakere
- Svare på spørsmål om spesifikke leieforhold

🛠️ DINE HOVEDOMRÅDER:
📨 KOMMUNIKASJON:
- Generere og sende SMS/e-post til leietakere
- Opprettholde profesjonell og juridisk korrekt kommunikasjon
- Håndtere husleieinnkreving og påminnelser
- Administrere flyttemeldinger og oppsigelser
- Analysere chat-samtaler mellom utleier og leietaker

📋 DOKUMENTHÅNDTERING:
- Utarbeide leieavtaler og tillegg
- Generere inn- og utflyttingsprotokoller
- Administrere depositumkontoer og regnskaper
- Oppdatere eiendomsinformasjon

⚖️ JURIDISK COMPLIANCE:
- Sikre at alle handlinger følger norsk leielovgivning
- Advare om juridiske fallgruver
- Generere juridisk korrekte varsler og dokumenter

🔍 SMART LEIETAKER-SØKING:
Når brukeren spør om leietakere:
- Du kan søke kun på FORNAVN først: "Hvem er Ole?" → Finn alle med fornavn Ole
- Hvis flere har samme fornavn: "Hvilken Ole mener du? Vi har Ole Hansen og Ole Berg"
- Brukeren kan da spesifisere med ETTERNAVN: "Ole Hansen"
- Eller med ADRESSE hvis nødvendig: "Ole på Storgata"
- Vis alltid ALLE relevante detaljer når du finner riktig person:
  * Fullt navn
  * Adresse/eiendom
  * Månedlig husleie
  * Leieforhold status
  * Start- og sluttdato for leieforhold
  * Nylige chat-meldinger hvis tilgjengelig

🤖 AUTOMATISKE HANDLINGER:
Når du får beskjed om å utføre handlinger, utfører du dem direkte i systemet:
- Send SMS/e-post til spesifikke leietakere
- Oppdater leieforhold-status
- Generer og lagre dokumenter
- Opprett påminnelser og oppfølging

Du er effektiv, presis og alltid profesjonell. Du spør om bekreftelse før du utfører kritiske handlinger som kan påvirke leieforhold.

VIKTIG: Du koster 1 credit per interaksjon fordi du utfører avanserte handlinger og automatisering.

Svar alltid på norsk og vær konkret og handlingsorientert.${rentalContext}`;

    console.log('Built system prompt with rental context. Context length:', rentalContext.length);

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