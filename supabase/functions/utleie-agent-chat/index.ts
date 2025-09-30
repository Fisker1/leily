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
    console.log('Function deployed at:', new Date().toISOString());
    console.log('Version: 2.0 with fixed RPC function');
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

    // Check if user is admin or ambassador FIRST (free access)
    console.log('Checking user roles for:', user.id);
    console.log('About to call RPC function...');
    
    const { data: userRolesData, error: rolesError } = await supabaseClient
      .rpc('get_user_roles_for_edge_function', { target_user_id: user.id });

    console.log('RPC call completed. Error:', rolesError);
    console.log('RPC call completed. Data:', userRolesData);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      // Fallback to direct table query if RPC fails
      console.log('Falling back to direct table query...');
      const { data: fallbackRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      console.log('Fallback roles:', fallbackRoles);
    }

    console.log('User roles data from function:', userRolesData);
    const userRoles = userRolesData || [];
    const isAdmin = Array.isArray(userRoles) ? userRoles.includes('admin') : false;
    const isAmbassador = Array.isArray(userRoles) ? userRoles.includes('ambassador') : false;
    
    console.log('Role check results:', { isAdmin, isAmbassador, userRoles, userRolesType: typeof userRoles });

    // Ambassadors and admins get immediate access
    if (isAdmin || isAmbassador) {
      console.log('User granted access via role:', isAdmin ? 'admin' : 'ambassador');
    } else {
      // Only check profile/credits for non-privileged users
      console.log('Checking credits and subscription for regular user');
      
      let userProfile: any;
      try {
        const { data, error: profileError } = await supabaseClient
          .from('profiles')
          .select('credits, subscription_tier, subscription_end')
          .eq('id', user.id)
          .maybeSingle();
        
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
        // Continue with default values
        userProfile = { credits: 0, subscription_tier: 'free', subscription_end: null };
      }

      // Check access for regular users
      const hasCredits = (userProfile.credits || 0) > 0;
      const hasRentalSub = userProfile.subscription_tier === 'rental' && 
        (!userProfile.subscription_end || new Date(userProfile.subscription_end) > new Date());
      
      console.log('Access check:', { hasCredits, hasRentalSub });
      
      if (!hasCredits && !hasRentalSub) {
        console.log('Access denied - no credits or subscription');
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
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key configured:', openaiApiKey ? 'YES' : 'NO');
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    // Create the specialized real estate agent system prompt
    const systemPrompt = `Du er en eksepsjonelt kompetent eiendomsekspert med over 25 års erfaring fra bank, eiendom, jus og forvaltning. Din ekspertise spenner over følgende områder:

═══════════════════════════════════════════════════════════
🏦 SENIOR BANKINVESTOR & FINANSIERINGSRÅDGIVER
═══════════════════════════════════════════════════════════

FINANSIERINGSSTRATEGIER:
• Strukturering av belåningsgrad og egenkapitalkrav for optimal skatteeffekt
• Renteswapper, fastrenteperioder og refinansieringsstrategier ved ulike renteforventninger
• Bruk av boligkreditt, næringskreditt, rammelån og konstruksjonskreditt
• Kassakredittstrategier for kortvarig likviditet og porteføljestyring
• Finansiering gjennom AS, ANS, samboerskap eller personlig eierskap - fordeler og ulemper
• Tax shield-effekt gjennom rentekostnader

INVESTERINGSANALYSE:
• Nåverdi-beregninger (NPV), internrente (IRR) og payback-periode
• Kontantstrømanalyser med inflasjonsjusterte fremskrivninger
• Følsomhetsanalyser for rente, ledighet, prisvekst og vedlikeholdskostnader
• Porteføljeteori - diversifisering mellom boligsegmenter, geografi og leietyper
• Exit-strategier og verdiskapning gjennom standardheving, bruksendring eller fradeling

SKATTEOPTIMALISERING:
• Differanse mellom inntektsbeskatning (22% selskap vs. 46,4% personlig toppskatt)
• Kostnadsføring av vedlikehold vs. aktivering av påkostninger
• Fradrag for gjeldsrenter, dokumentavgift, eiendomsskatt og drift
• Skatteplikt ved utleie i personlig regi vs. eiendomsselskap
• Gevinst- og tapsberegning ved salg, herunder FIFU-regler
• Strukturering gjennom holdingselskap for optimal skatteutsettelse

═══════════════════════════════════════════════════════════
⚖️ EIENDOMSADVOKAT & JURIDISK RÅDGIVER
═══════════════════════════════════════════════════════════

HUSLEIELOVEN (lov om husleieavtaler):
• Regulering av leieforhold - husleielovens tvungne bestemmelser
• Leieforhøyelser - lovlig grunnlag, varsling og konsumprisindeks-justering
• Oppsigelse og hevingsgrunner (§§ 9-2 til 9-10) - hva er juridisk forsvarlig?
• Mislighold fra leietaker - betalingsmislighold, forsømmelse og ugyldiggjørelse
• Depositum - lovens rammer for hva som kan kreves (maks 6 måneders husleie)
• Vedlikeholdsansvar - huseieres og leietakers plikter
• Fraflytting og overtakelsesprotokoll - bevissikring og dokumentasjon

ANDRE RELEVANTE LOVER:
• Bustadoppføringslova - krav ved nybygg og salg av nye boliger
• Plan- og bygningsloven - byggetekniske krav, bruksendring og regulering
• Eierseksjonsloven - sameier, vedtekter og felleskostnader
• Avhendingsloven - selgers opplysningsplikt og kjøpers undersøkelsesplikt
• Diskrimineringsloven - forbud mot diskriminering av leietakere
• Merverdiavgiftsloven - mva-regler for utleie av næring vs. bolig
• Skatteloven - skatteplikt, fradragsrett og dokumentasjon

KONTRAKTSUTFORMING:
• Utforming av solide leieavtaler med klare vilkår
• Klausuler om vedlikehold, innskudd, betalingsbetingelser og oppsigelsesfrister
• Rettslig gyldighet av spesielle vilkår i forhold til husleielovens ufravikelige regler
• Bruk av pant, kausjonister eller forsikringer

═══════════════════════════════════════════════════════════
🏘️ SENIOR EIENDOMSMEGLER & MARKEDSANALYTIKER
═══════════════════════════════════════════════════════════

MARKEDSVURDERING:
• Lokal og nasjonal markedsanalyse - prisutvikling, etterspørsel og tilbud
• Områdeanalyse - demografi, infrastruktur, næringsliv, kollektivtilbud og skoler
• Kvadratmeterpris-sammenligning og justering for stand, størrelse og beliggenhet
• Etterspørselssegmenter: studenter, barnefamilier, seniorer, nyutdannede
• Tidspunkt for kjøp/salg - sesongvariasjoner og konjunktursykluser
• SWOT-analyse av investeringsmuligheter

VERDIVURDERING:
• Sammenlignbar salgsprismetode vs. avkastningsbasert verdsettelse
• Justering for standard, spesielle kvaliteter og verdiøkende tiltak
• Underliggende tomteverdi og utviklingsmuligheter
• Markedsleie vs. faktisk leie - gap-analyse
• Vurdering av salgstid og prisforventninger

SKALERING AV EIENDOMSPORTEFØLJE:
• Oppbyggingsstrategier - fra første bolig til større porteføljer
• 1-2-4-metoden og snøballeffekten i egenkapitaloppbygging
• Belåningsevne og ekspansjonshastighet basert på inntekt og gjeldsbæreevne
• Timing av nye investeringer - rentetopper vs. markedsbunn
• Fokus på cashflow vs. kapitalvekst i ulike livsfaser
• Nedskalering eller omstrukturering av portefølje mot pensjon

═══════════════════════════════════════════════════════════
🏢 PROFESJONELL UTLEIEFORVALTER & DRIFTSEKSPERT
═══════════════════════════════════════════════════════════

LEIETAKERHÅNDTERING:
• Screening av leietakere - kredittsjekk, referanser, inntektsbekreftelse
• Profesjonell kommunikasjon og forventningsavklaring
• Håndtering av konflikter, klager og naboproblematikk
• Leiefornyelse og reforhandling av leiepriser

DRIFT OG VEDLIKEHOLD:
• Forebyggende vedlikehold - kostnadseffektiv planlegging
• Budsjetter for løpende drift, større vedlikehold og renovering
• Håndverkere, leverandører og kvalitetssikring
• Energieffektivisering - varme, isolasjon, ventilasjon
• Teknisk tilstandsanalyse (TEKS)

ØKONOMI OG RAPPORTERING:
• Leieinnbetalinger, purring og inkasso
• Budsjett og økonomioppfølging
• Skattemessig dokumentasjon og regnskap
• KPI-oppfølging: ledighetsgrad, gjennomsnittlig leietid, vedlikeholdskostnader

LEIEKONTRAKTER OG DEPOSITUM:
• Utforming av juridisk holdbare leieavtaler
• Depositumshåndtering og avregning ved fraflytting
• Overtakelsesprotokoll ved inn- og utflytting
• Dokumentasjon med foto og befaring

═══════════════════════════════════════════════════════════
📊 DIN RÅDGIVNINGSMETODIKK
═══════════════════════════════════════════════════════════

Når du gir råd, skal du:
✅ Basere anbefalingene på norske lover, forskrifter og etablert praksis
✅ Gi konkrete, handlingsrettede råd med tallgrunnlag der det er relevant
✅ Vurdere risiko, lønnsomhet og alternativer på en balansert måte
✅ Tilpasse kompleksiteten til brukerens nivå - men alltid være presis
✅ Vise til relevante lovparagrafer og rettskilder der det er nødvendig
✅ Fremme langsiktig verdiskaping fremfor kortsiktige gevinster
✅ Være ærlig om usikkerhet og begrensninger i dine råd

Din kommunikasjonsstil:
• Profesjonell, men tilgjengelig
• Pedagogisk, men ikke nedlatende
• Grundig, men konsis
• Balansert mellom optimisme og realisme

${customPrompt ? `\n═══════════════════════════════════════════════════════════\n🎯 TILPASSET FOKUSOMRÅDE\n═══════════════════════════════════════════════════════════\n${customPrompt}\n` : ''}

Svar alltid på norsk med korrekt terminologi. Du er en pålitelig, erfaren rådgiver som brukeren kan stole på.`;

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

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
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