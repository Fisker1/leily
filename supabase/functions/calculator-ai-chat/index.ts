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

    console.log('=== Processing message with OpenAI ===');
    
    // Check if user pasted HTML source code (Ctrl+U from Finn.no)
    const isHtmlSource = message.includes('<html') || message.includes('<!DOCTYPE') || 
                         message.includes('<head>') || message.includes('<body>');
    
    // Build system prompt based on content type
    const systemPrompt = isHtmlSource 
      ? `Du er en ekspert på å ekstrahere eiendomsdata fra HTML kildekode.

VIKTIG: Brukeren har limt inn HTML kildekode fra en Finn.no annonse. 
Din jobb er å parse HTML-en og ekstrahere ALL relevant eiendomsinformasjon.

Ekstraher følgende felt (bruk null hvis data mangler):
- address: Full adresse
- totalPrice: Totalpris (kun tall, uten "kr")
- propertyType: Type bolig (leilighet, enebolig, etc)
- livingArea: Primærrom/BRA i kvm (kun tall)
- commonCosts: Felleskostnader per måned (kun tall)
- municipalFees: Kommunale avgifter per år (kun tall)
- buildYear: Byggeår (kun årstall)
- bedrooms: Antall soverom (kun tall)
- monthlyRent: Forventet leieinntekt per måned hvis relevant

BRUK TOOL CALLING for å returnere dataen strukturert.`
      : `Du er en hjelpsom AI-assistent for boligfinansieringsrapporter.

Din jobb er å hjelpe brukeren fylle ut en eiendomsrapport ved å:
1. Stille relevante spørsmål
2. Analysere dokumenter de laster opp
3. Be om Finn.no HTML kildekode hvis de vil analysere en eiendom

VIKTIG INSTRUKSJON TIL BRUKER:
Hvis brukeren vil analysere en eiendom fra Finn.no, BE DEM OM Å:
1. Åpne Finn.no annonsen i nettleseren
2. Trykk Ctrl+U (Windows) eller Cmd+Option+U (Mac) for å se kildekoden
3. Kopiere ALT (Ctrl+A, Ctrl+C)
4. Lime inn her i chatten

Da kan jeg ekstrahere all data automatisk!

Viktige felt: address, totalPrice, propertyType, livingArea, equity, interestRate, 
loanPeriod, monthlyRent, commonCosts, municipalFees, insurance, electricityMonthly.

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
            totalPrice: { type: "number", description: "Total price (number only, no currency)" },
            propertyType: { type: "string", description: "Property type (apartment, house, etc)" },
            livingArea: { type: "number", description: "Living area in square meters" },
            commonCosts: { type: "number", description: "Monthly common costs" },
            municipalFees: { type: "number", description: "Annual municipal fees" },
            buildYear: { type: "number", description: "Year built" },
            bedrooms: { type: "number", description: "Number of bedrooms" },
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
        console.log('Extracted data via tool calling:', extractedData);
        
        // Build friendly response
        assistantMessage = 'Perfekt! Jeg har hentet ut følgende data:\n\n';
        if (extractedData.address) assistantMessage += `📍 Adresse: ${extractedData.address}\n`;
        if (extractedData.totalPrice) assistantMessage += `💰 Pris: ${extractedData.totalPrice.toLocaleString('nb-NO')} kr\n`;
        if (extractedData.propertyType) assistantMessage += `🏠 Type: ${extractedData.propertyType}\n`;
        if (extractedData.livingArea) assistantMessage += `📐 Størrelse: ${extractedData.livingArea} kvm\n`;
        if (extractedData.commonCosts) assistantMessage += `💵 Felleskostnader: ${extractedData.commonCosts.toLocaleString('nb-NO')} kr/mnd\n`;
        if (extractedData.municipalFees) assistantMessage += `🏛️ Kommunale avgifter: ${extractedData.municipalFees.toLocaleString('nb-NO')} kr/år\n`;
        if (extractedData.buildYear) assistantMessage += `🏗️ Byggeår: ${extractedData.buildYear}\n`;
        if (extractedData.bedrooms) assistantMessage += `🛏️ Soverom: ${extractedData.bedrooms}\n`;
        if (extractedData.monthlyRent) assistantMessage += `💸 Forventet leieinntekt: ${extractedData.monthlyRent.toLocaleString('nb-NO')} kr/mnd\n`;
        assistantMessage += '\nDataen er nå fylt inn i rapporten! 🎉';
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
