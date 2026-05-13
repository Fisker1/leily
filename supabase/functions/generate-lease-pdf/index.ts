import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaseData {
  leaseId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { leaseId }: LeaseData = await req.json();
    
    if (!leaseId) {
      throw new Error('leaseId is required');
    }

    console.log(`Generating PDF for lease ${leaseId}`);

    // Fetch lease data with related information
    const { data: lease, error: leaseError } = await supabaseClient
      .from('lease_agreements')
      .select(`
        *,
        property:properties(*),
        tenant:tenants(*)
      `)
      .eq('id', leaseId)
      .eq('property_owner_id', user.id)
      .single();

    if (leaseError || !lease) {
      throw new Error(`Lease not found: ${leaseError?.message}`);
    }

    // Generate HTML template for PDF
    const html = generateLeaseHTML(lease);

    // Return HTML that can be converted to PDF on client
    // (jsPDF works client-side, so we return the data needed)
    return new Response(
      JSON.stringify({
        success: true,
        leaseData: lease,
        htmlTemplate: html,
        fileName: `leieavtale_${lease.property.address.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateLeaseHTML(lease: any): string {
  const property = lease.property;
  const tenant = lease.tenant;
  const today = new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <title>Leieavtale - ${property.address}</title>
      <style>
        @page {
          margin: 2cm;
          size: A4;
        }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          max-width: 21cm;
          margin: 0 auto;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #0EA5E9;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0EA5E9;
          margin: 0 0 10px 0;
          font-size: 24pt;
          font-weight: bold;
        }
        .header .subtitle {
          font-size: 12pt;
          color: #666;
          margin: 5px 0;
        }
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #0EA5E9;
          font-size: 14pt;
          border-bottom: 2px solid #0EA5E9;
          padding-bottom: 5px;
          margin-top: 20px;
          margin-bottom: 15px;
        }
        .section h3 {
          color: #333;
          font-size: 12pt;
          margin-top: 15px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #0EA5E9;
          padding: 15px;
          margin: 15px 0;
        }
        .info-row {
          margin-bottom: 8px;
          display: flex;
        }
        .info-label {
          font-weight: bold;
          min-width: 180px;
          color: #333;
        }
        .info-value {
          color: #000;
          flex: 1;
        }
        .checkbox-line {
          margin: 8px 0;
        }
        .checkbox {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #333;
          margin-right: 8px;
          vertical-align: middle;
        }
        .checkbox.checked {
          background: #0EA5E9;
          position: relative;
        }
        .checkbox.checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-weight: bold;
          font-size: 12px;
          top: -2px;
          left: 2px;
        }
        .terms-list {
          margin: 10px 0;
          padding-left: 20px;
        }
        .terms-list li {
          margin-bottom: 8px;
        }
        .important-box {
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
        .important-box h3 {
          color: #856404;
          margin-top: 0;
        }
        .signature-section {
          margin-top: 40px;
          border: 2px solid #0EA5E9;
          padding: 20px;
          background: #f0f9ff;
          page-break-inside: avoid;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 20px;
        }
        .signature-box {
          border: 1px solid #ddd;
          padding: 15px;
          background: white;
          min-height: 120px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 60px;
          padding-top: 5px;
          text-align: center;
          font-size: 10pt;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
        .page-break {
          page-break-after: always;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        table th,
        table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .legal-reference {
          font-size: 9pt;
          color: #666;
          font-style: italic;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LEIEAVTALE FOR BOLIG</h1>
        <div class="subtitle">I henhold til lov om husleie (husleieloven)</div>
        <div class="subtitle">Dato: ${today}</div>
      </div>

      <!-- SEKSJON 1: PARTENE -->
      <div class="section">
        <h2>§1. PARTENE</h2>
        <div class="info-box">
          <h3>Utleier:</h3>
          <div class="info-row">
            <div class="info-label">Navn:</div>
            <div class="info-value">[Fylles ut ved BankID-signering]</div>
          </div>
          <div class="info-row">
            <div class="info-label">Adresse:</div>
            <div class="info-value">[Fylles ut ved signering]</div>
          </div>
          <div class="info-row">
            <div class="info-label">E-post:</div>
            <div class="info-value">[Fylles ut ved signering]</div>
          </div>
        </div>

        <div class="info-box">
          <h3>Leietaker:</h3>
          <div class="info-row">
            <div class="info-label">Navn:</div>
            <div class="info-value">${tenant.first_name} ${tenant.last_name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">E-post:</div>
            <div class="info-value">${tenant.email || 'Ikke oppgitt'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Telefon:</div>
            <div class="info-value">${tenant.phone || 'Ikke oppgitt'}</div>
          </div>
          ${tenant.national_id ? `
          <div class="info-row">
            <div class="info-label">Fødselsnummer:</div>
            <div class="info-value">${tenant.national_id}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- SEKSJON 2: LEIEOBJEKTET -->
      <div class="section">
        <h2>§2. LEIEOBJEKTET</h2>
        <div class="info-box">
          <div class="info-row">
            <div class="info-label">Adresse:</div>
            <div class="info-value">${property.address}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Postnummer og sted:</div>
            <div class="info-value">${property.postal_code} ${property.city}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Boligtype:</div>
            <div class="info-value">${property.property_type || 'Leilighet'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Bruksareal (BRA):</div>
            <div class="info-value">${property.size_sqm} m²</div>
          </div>
          <div class="info-row">
            <div class="info-label">Antall soverom:</div>
            <div class="info-value">${property.bedrooms || 'Ikke spesifisert'}</div>
          </div>
        </div>

        <p><strong>Leieobjektet omfatter:</strong> Hele boenheten med tilhørende rom og fasiliteter som beskrevet ovenfor.</p>
        
        ${lease.parking_included ? '<p>Leieobjektet inkluderer også parkeringsplass.</p>' : ''}

        <div class="legal-reference">Jf. husleieloven § 2-1 om leieforholdets gjenstand</div>
      </div>

      <!-- SEKSJON 3: LEIEFORHOLD -->
      <div class="section">
        <h2>§3. LEIEFORHOLD</h2>
        
        <h3>3.1 Leieperiode</h3>
        <div class="info-row">
          <div class="info-label">Leieforhold fra:</div>
          <div class="info-value">${new Date(lease.start_date).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Leieforhold til:</div>
          <div class="info-value">${lease.end_date ? new Date(lease.end_date).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidsubestemt'}</div>
        </div>

        ${!lease.end_date ? `
        <p>Leieforholdet er inngått for ubestemt tid og kan sies opp av begge parter i henhold til husleielovens bestemmelser.</p>
        ` : `
        <p>Leieforholdet er tidsbestemt og løper til angitt sluttdato. Avtalen opphører automatisk ved leietidens utløp uten oppsigelse, jf. husleieloven § 9-6.</p>
        `}

        <h3>3.2 Overtakelse og tilbakelevering</h3>
        <p>Overtakelse av leieobjektet skal skje ${new Date(lease.start_date).toLocaleDateString('no-NO')}. Det skal da foretas befaring og undertegnes protokoll som beskriver tilstanden ved overtakelse.</p>
        <p>Ved fraflytting skal det foretas tilsvarende befaring og undertegnes protokoll for tilbakelevering.</p>
        
        <div class="legal-reference">Jf. husleieloven § 2-11 om tilstandsrapport</div>
      </div>

      <!-- SEKSJON 4: LEIE OG KOSTNADER -->
      <div class="section">
        <h2>§4. LEIE OG KOSTNADER</h2>
        
        <h3>4.1 Husleie</h3>
        <div class="info-row">
          <div class="info-label">Månedlig husleie:</div>
          <div class="info-value"><strong>${Number(lease.monthly_rent).toLocaleString('no-NO')} kr</strong></div>
        </div>
        
        <p>Husleien forfaller til betaling senest den 1. i hver måned. Første betalingsfrist er ${new Date(lease.start_date).toLocaleDateString('no-NO')}.</p>
        
        <p><strong>Betalingsmåte:</strong> Betaling skjer via bankoverføring til konto som oppgis av utleier.</p>

        <h3>4.2 Kostnader inkludert i husleien</h3>
        <div class="checkbox-line">
          <span class="checkbox ${lease.utilities_included ? 'checked' : ''}"></span>
          <span>Strøm, oppvarming og varmtvann</span>
        </div>
        <div class="checkbox-line">
          <span class="checkbox checked"></span>
          <span>Kommunale avgifter (vann, avløp, renovasjon)</span>
        </div>
        <div class="checkbox-line">
          <span class="checkbox ${lease.parking_included ? 'checked' : ''}"></span>
          <span>Parkering</span>
        </div>
        <div class="checkbox-line">
          <span class="checkbox checked"></span>
          <span>Internett og TV-signal</span>
        </div>

        ${!lease.utilities_included ? `
        <p><strong>Viktig:</strong> Leietaker betaler strøm, oppvarming og varmtvann direkte til leverandør. Leietaker skal ved leieforholdets start melde adresseendring til kraftleverandør.</p>
        ` : ''}

        <h3>4.3 Regulering av husleien</h3>
        <p>Husleien kan reguleres årlig i samsvar med endringer i konsumprisindeksen (KPI), jf. husleieloven § 4-3. Utleier skal varsle leietaker skriftlig om leieregulering minimum én måned før ikrafttredelse.</p>

        <h3>4.4 Forsinket betaling</h3>
        <p>Ved forsinket betaling kan utleier kreve forsinkelsesrenter etter forsinkelsesrenteloven. Ved vesentlig mislighold av leien, kan utleier heve leieforholdet etter reglene i husleieloven § 9-9.</p>
        
        <div class="legal-reference">Jf. husleieloven kapittel 4 om husleie</div>
      </div>

      <div class="page-break"></div>

      <!-- SEKSJON 5: DEPOSITUM -->
      <div class="section">
        <h2>§5. DEPOSITUM</h2>
        
        ${lease.deposit_amount ? `
        <div class="info-row">
          <div class="info-label">Depositum:</div>
          <div class="info-value"><strong>${Number(lease.deposit_amount).toLocaleString('no-NO')} kr</strong></div>
        </div>

        <p>Depositum skal betales senest ved leieforholdets start og skal settes inn på egen bankkonto (depositumskonto) i leietakers navn. Renter tilfaller leietaker.</p>

        <p><strong>Formål:</strong> Depositumet skal sikre utleiers krav som følge av leieforholdet, herunder manglende oppfyllelse av leietakers plikter til å betale husleie og andre kostnader, samt dekning av skader på leieobjektet utover alminnelig slitasje.</p>

        <h3>5.1 Tilbakebetaling av depositum</h3>
        <p>Depositumet skal tilbakebetales til leietaker senest én måned etter fraflytting, fratrukket eventuelle krav utleier måtte ha mot leietaker. Dersom utleier har krav mot leietaker, må dette fremsettes skriftlig innen 14 dager etter fraflytting.</p>

        <div class="important-box">
          <h3>⚠️ Viktig informasjon om depositum</h3>
          <p>I henhold til husleieloven § 3-5 skal depositum plasseres på egen bankkonto i leietakers navn. Utleier kan ikke disponere beløpet fritt, men har panterett i depositumet for sine krav.</p>
        </div>

        <div class="legal-reference">Jf. husleieloven § 3-5 om depositum</div>
        ` : `
        <p><strong>Det er ikke avtalt depositum for dette leieforholdet.</strong></p>
        `}
      </div>

      <!-- SEKSJON 6: BRUK AV LEIEOBJEKTET -->
      <div class="section">
        <h2>§6. BRUK AV LEIEOBJEKTET</h2>
        
        <h3>6.1 Formål</h3>
        <p>Leieobjektet skal kun brukes til boligformål for leietaker. Leietaker kan ikke uten utleiers skriftlige samtykke la andre bo i leieobjektet eller fremleie det helt eller delvis.</p>

        <h3>6.2 Særskilte vilkår for bruk</h3>
        <div class="checkbox-line">
          <span class="checkbox ${lease.pets_allowed ? 'checked' : ''}"></span>
          <span><strong>Husdyr:</strong> ${lease.pets_allowed ? 'Tillatt etter avtale med utleier' : 'Ikke tillatt'}</span>
        </div>
        <div class="checkbox-line">
          <span class="checkbox ${lease.smoking_allowed ? 'checked' : ''}"></span>
          <span><strong>Røyking:</strong> ${lease.smoking_allowed ? 'Tillatt' : 'Ikke tillatt innendørs'}</span>
        </div>

        <h3>6.3 Aktsomhetsplikt</h3>
        <p>Leietaker skal behandle leieobjektet med tilbørlig aktsomhet. Leietaker skal sørge for forsvarlig oppvarming og lufting, og skal straks melde fra til utleier om skader eller mangler ved leieobjektet.</p>

        <h3>6.4 Endringer og påkostninger</h3>
        <p>Leietaker kan ikke uten utleiers skriftlige samtykke foreta vesentlige endringer eller påkostninger i leieobjektet. Mindre endringer som ikke påvirker konstruksjon eller annen leietaker, kan gjennomføres etter melding til utleier.</p>

        <p>Ved opphør av leieforholdet har leietaker rett til å fjerne det leietaker har montert, forutsatt at leieobjektet settes tilbake i samme stand. Utleier kan kreve at det blir satt tilbake.</p>

        <div class="legal-reference">Jf. husleieloven § 5-1 og § 10-3 om bruk og endringer av leieobjektet</div>
      </div>

      <!-- SEKSJON 7: VEDLIKEHOLD -->
      <div class="section">
        <h2>§7. VEDLIKEHOLD</h2>
        
        <h3>7.1 Utleiers vedlikeholdsplikt</h3>
        <p>Utleier skal sørge for at leieobjektet er i forskriftsmessig og god stand ved leieforholdets start og holde det slik i leietiden. Dette omfatter:</p>
        <ul class="terms-list">
          <li>Vedlikehold av bygningskonstruksjon, tak, vinduer og ytterdører</li>
          <li>Vedlikehold av sanitæranlegg, el-anlegg og oppvarmingssystem</li>
          <li>Større reparasjoner og utskifting av hvitevarer ved normal slitasje</li>
        </ul>

        <h3>7.2 Leietakers vedlikeholdsplikt</h3>
        <p>Leietaker skal holde leieobjektet i samme stand som ved overtakelse, bortsett fra den forringelse som skyldes normal slitasje og elde. Dette omfatter:</p>
        <ul class="terms-list">
          <li>Daglig renhold og alminnelig vedlikehold</li>
          <li>Utskifting av lyspærer og sikringer</li>
          <li>Mindre reparasjoner som følge av leietakers bruk</li>
          <li>Skader forårsaket av leietaker, dennes husstand eller gjester</li>
        </ul>

        <h3>7.3 Melding om mangler</h3>
        <p>Leietaker plikter å melde fra til utleier uten ugrunnet opphold dersom det oppstår skade eller mangel ved leieobjektet. Dette gjelder spesielt vannlekkasje, fuktskader og andre forhold som kan føre til forverring.</p>

        <div class="legal-reference">Jf. husleieloven § 2-2 om utleiers vedlikeholdsplikt og § 2-7 om leietakers vedlikeholdsplikt</div>
      </div>

      <div class="page-break"></div>

      <!-- SEKSJON 8: FORSIKRING -->
      <div class="section">
        <h2>§8. FORSIKRING</h2>
        
        <h3>8.1 Utleiers forsikringsansvar</h3>
        <p>Utleier skal ha bygningsforsikring som dekker skader på bygningen og fast inventar.</p>

        <h3>8.2 Leietakers forsikringsansvar</h3>
        <p><strong>Leietaker plikter å ha innboforsikring</strong> som dekker leietakers løsøre og ansvar. Forsikringen skal minimum dekke:</p>
        <ul class="terms-list">
          <li>Innbo og løsøre</li>
          <li>Ansvar for skader leietaker påfører utleier eller andre</li>
          <li>Ansvar for skader på leieobjektet</li>
        </ul>

        <div class="important-box">
          <h3>⚠️ Forsikring er obligatorisk</h3>
          <p>Manglende innboforsikring kan medføre at leietaker blir holdt personlig ansvarlig for alle skader som oppstår i leieforholdet, også de som normalt ville vært dekket av forsikring.</p>
        </div>
      </div>

      <!-- SEKSJON 9: OPPSIGELSE OG FRAFLYTTING -->
      <div class="section">
        <h2>§9. OPPSIGELSE OG FRAFLYTTING</h2>
        
        ${!lease.end_date ? `
        <h3>9.1 Oppsigelse fra leietakers side</h3>
        <p>Leietaker kan si opp leieforholdet med <strong>tre måneders skriftlig varsel</strong>. Oppsigelsestiden regnes fra den første i måneden etter at oppsigelsen er kommet frem til utleier.</p>

        <h3>9.2 Oppsigelse fra utleiers side</h3>
        <p>Utleier kan si opp leieforholdet med <strong>tre måneders skriftlig varsel</strong>. Oppsigelsen skal være skriftlig, begrunnet og oppfylle kravene i husleieloven § 9-7.</p>
        
        <p><strong>Gyldige grunner for oppsigelse fra utleier:</strong></p>
        <ul class="terms-list">
          <li>Utleier eller dennes nærmeste familie selv skal bruke leieobjektet</li>
          <li>Vesentlig mislighold av leieforholdet fra leietakers side</li>
          <li>Andre særlige grunner som angitt i husleieloven</li>
        </ul>
        ` : `
        <h3>9.1 Tidsbegrenset leieforhold</h3>
        <p>Dette leieforholdet er tidsbestemt og løper til ${new Date(lease.end_date).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}. Leieforholdet opphører automatisk på denne datoen uten at oppsigelse er nødvendig.</p>
        
        <p>Dersom leietaker fortsetter å bruke leieobjektet etter utløpet av leietiden uten at utleier protesterer, anses leieforholdet å være forlenget på ubestemt tid, jf. husleieloven § 9-6.</p>
        `}

        <h3>9.${!lease.end_date ? '3' : '2'} Fraflytting</h3>
        <p>Ved fraflytting skal:</p>
        <ul class="terms-list">
          <li>Leieobjektet være rengjort og ryddet</li>
          <li>Alle nøkler leveres tilbake til utleier</li>
          <li>Det foretas befaring og undertegnes tilbakeleverings-protokoll</li>
          <li>Leietaker må ha flyttemeldt seg til Folkeregisteret</li>
          <li>Strømavtale og andre abonnementer må overføres eller avsluttes</li>
        </ul>

        <div class="legal-reference">Jf. husleieloven § 9-6 og § 9-7 om oppsigelse</div>
      </div>

      <!-- SEKSJON 10: MISLIGHOLD OG HEVING -->
      <div class="section">
        <h2>§10. MISLIGHOLD OG HEVING</h2>
        
        <h3>10.1 Vesentlig mislighold</h3>
        <p>Ved vesentlig mislighold av leieforholdet har den annen part rett til å heve avtalen. Som vesentlig mislighold regnes blant annet:</p>
        <ul class="terms-list">
          <li>Manglende betaling av husleie i minst to måneder</li>
          <li>Bruk av leieobjektet i strid med avtalen</li>
          <li>Uaktsom eller forsettlig skade på leieobjektet</li>
          <li>Fremleie eller overlate leieobjektet uten samtykke</li>
          <li>Vesentlig pliktbrudd etter husleieloven</li>
        </ul>

        <h3>10.2 Varsel og rettelse</h3>
        <p>Før heving kan kreves, skal det gis skriftlig varsel med rimelig frist til å rette misligholdet, med mindre misligholdet er så vesentlig at umiddelbar heving er berettiget.</p>

        <div class="legal-reference">Jf. husleieloven § 9-9 om heving</div>
      </div>

      <!-- SEKSJON 11: TVISTER -->
      <div class="section">
        <h2>§11. TVISTELØSNING</h2>
        
        <p>Tvister mellom partene skal primært søkes løst i minnelighet. Dersom dette ikke lykkes, kan tvisten bringes inn for <strong>Husleietvistutvalget</strong> som behandler tvister etter husleieloven.</p>

        <h3>11.1 Husleietvistutvalget</h3>
        <p>Husleietvistutvalget er et offentlig tvisteløsningsorgan som behandler tvister mellom utleier og leietaker. Saksbehandlingen er enkel, rask og rimelig. Vedtak fra Husleietvistutvalget kan bringes inn for tingretten.</p>

        <p><strong>Kontaktinformasjon:</strong></p>
        <ul class="terms-list">
          <li>Nettside: www.husleietvistutvalget.no</li>
          <li>E-post: husleietvistutvalget@husleietvistutvalget.no</li>
          <li>Telefon: 22 40 16 16</li>
        </ul>

        <div class="legal-reference">Jf. husleietvistloven om Husleietvistutvalget</div>
      </div>

      ${lease.lease_terms ? `
      <div class="section">
        <h2>§12. SÆRSKILTE VILKÅR</h2>
        <p>${lease.lease_terms}</p>
      </div>
      ` : ''}

      <!-- SEKSJON: SLUTTBESTEMMELSER -->
      <div class="section">
        <h2>§${lease.lease_terms ? '13' : '12'}. SLUTTBESTEMMELSER</h2>
        
        <h3>${lease.lease_terms ? '13.1' : '12.1'} Husleielovens anvendelse</h3>
        <p>For øvrig gjelder bestemmelsene i lov om husleie (husleieloven) av 26. mars 1999 nr. 17.</p>

        <h3>${lease.lease_terms ? '13.2' : '12.2'} Gyldighet</h3>
        <p>Dersom noen av bestemmelsene i denne avtalen skulle vise seg ugyldige eller uten virkning, skal dette ikke påvirke gyldigheten av avtalens øvrige bestemmelser. De ugyldige bestemmelsene skal i så fall erstattes av gyldige bestemmelser som kommer partenes forutsetninger nærmest mulig.</p>

        <h3>${lease.lease_terms ? '13.3' : '12.3'} Endringer</h3>
        <p>Endringer i denne leieavtalen skal for å være gyldig være skriftlig og undertegnet av begge parter.</p>

        <h3>${lease.lease_terms ? '13.4' : '12.4'} Antall eksemplarer</h3>
        <p>Denne avtalen er utferdiget i to eksemplarer, ett til hver av partene.</p>
      </div>

      <div class="page-break"></div>

      <!-- SIGNERING -->
      <div class="signature-section">
        <h2 style="margin-top: 0; text-align: center;">SIGNERING MED BANKID</h2>
        
        <div class="important-box">
          <p style="margin: 0;"><strong>Juridisk bindende elektronisk signatur:</strong></p>
          <p style="margin: 10px 0 0 0;">Denne leieavtalen signeres elektronisk med norsk BankID. Elektronisk signatur med BankID har samme juridiske gyldighet som håndskrevet signatur i henhold til norsk lov.</p>
        </div>

        <p style="margin: 20px 0;">Ved å signere denne avtalen med BankID bekrefter begge parter at:</p>
        <ul class="terms-list">
          <li>De har lest og forstått alle vilkår i leieavtalen</li>
          <li>De aksepterer alle vilkår som bindende</li>
          <li>De har mottatt et eksemplar av avtalen</li>
          <li>Opplysningene som er gitt er korrekte</li>
        </ul>

        <div class="signature-grid">
          <div class="signature-box">
            <h3 style="margin-top: 0;">Utleier</h3>
            <p style="font-size: 10pt; color: #666;">Signeres med BankID</p>
            <div style="min-height: 60px; margin: 20px 0;">
              <p style="font-size: 9pt; color: #666;">[Signaturdata og tidsstempel fylles inn automatisk ved BankID-signering]</p>
            </div>
            <div class="signature-line">
              Navn (fra BankID)
            </div>
            <div style="margin-top: 10px; font-size: 9pt; color: #666; text-align: center;">
              Dato og tid for signering
            </div>
          </div>

          <div class="signature-box">
            <h3 style="margin-top: 0;">Leietaker</h3>
            <p style="font-size: 10pt; color: #666;">Signeres med BankID</p>
            <div style="min-height: 60px; margin: 20px 0;">
              <p style="font-size: 9pt; color: #666;">[Signaturdata og tidsstempel fylles inn automatisk ved BankID-signering]</p>
            </div>
            <div class="signature-line">
              ${tenant.first_name} ${tenant.last_name}
            </div>
            <div style="margin-top: 10px; font-size: 9pt; color: #666; text-align: center;">
              Dato og tid for signering
            </div>
          </div>
        </div>

        <p style="margin-top: 30px; font-size: 9pt; color: #666; text-align: center;">
          Signert leieavtale vil inneholde komplett elektronisk signaturbevis fra Signicat med tidsstempel og sertifikatinformasjon.
        </p>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p><strong>Leieavtale generert via Leily.no</strong></p>
        <p>Norges moderne plattform for utleie og eiendomsforvaltning</p>
        <p style="margin-top: 10px;">Dokumentet er utarbeidet ${today}</p>
        <p style="margin-top: 10px; font-size: 8pt;">
          Denne leieavtalen er basert på husleieloven (lov av 26. mars 1999 nr. 17) og standardiserte vilkår for utleie av bolig i Norge.
        </p>
      </div>
    </body>
    </html>
  `;
}
