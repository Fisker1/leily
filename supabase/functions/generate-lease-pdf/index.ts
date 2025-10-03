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
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          margin: 40px;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #0EA5E9;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0EA5E9;
          margin: 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          color: #0EA5E9;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          width: 180px;
        }
        .signature-box {
          margin-top: 50px;
          border: 1px solid #ddd;
          padding: 20px;
          background: #f9f9f9;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LEIEAVTALE</h1>
        <p>Utleie av bolig</p>
      </div>

      <div class="section">
        <h2>1. PARTENE</h2>
        <div class="info-row">
          <div class="info-label">Utleier:</div>
          <div>[Navn vil bli fylt ut ved signering]</div>
        </div>
        <div class="info-row">
          <div class="info-label">Leietaker:</div>
          <div>${tenant.first_name} ${tenant.last_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">E-post:</div>
          <div>${tenant.email || 'Ikke oppgitt'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Telefon:</div>
          <div>${tenant.phone || 'Ikke oppgitt'}</div>
        </div>
      </div>

      <div class="section">
        <h2>2. LEIEOBJEKTET</h2>
        <div class="info-row">
          <div class="info-label">Adresse:</div>
          <div>${property.address}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Postnummer:</div>
          <div>${property.postal_code} ${property.city}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Type:</div>
          <div>${property.property_type || 'Leilighet'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Størrelse:</div>
          <div>${property.size_sqm} m²</div>
        </div>
        <div class="info-row">
          <div class="info-label">Soverom:</div>
          <div>${property.bedrooms || 'Ikke spesifisert'}</div>
        </div>
      </div>

      <div class="section">
        <h2>3. LEIEFORHOLD</h2>
        <div class="info-row">
          <div class="info-label">Leieperiode fra:</div>
          <div>${new Date(lease.start_date).toLocaleDateString('no-NO')}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Leieperiode til:</div>
          <div>${lease.end_date ? new Date(lease.end_date).toLocaleDateString('no-NO') : 'Tidsubestemt'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Månedlig leie:</div>
          <div>${Number(lease.monthly_rent).toLocaleString('no-NO')} kr</div>
        </div>
        <div class="info-row">
          <div class="info-label">Depositum:</div>
          <div>${lease.deposit_amount ? Number(lease.deposit_amount).toLocaleString('no-NO') + ' kr' : 'Ikke avtalt'}</div>
        </div>
      </div>

      <div class="section">
        <h2>4. AVTALEVILKÅR</h2>
        <div class="info-row">
          <div class="info-label">Inkluderer strøm:</div>
          <div>${lease.utilities_included ? 'Ja' : 'Nei'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Parkering:</div>
          <div>${lease.parking_included ? 'Inkludert' : 'Ikke inkludert'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Husdyr tillatt:</div>
          <div>${lease.pets_allowed ? 'Ja' : 'Nei'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Røyking tillatt:</div>
          <div>${lease.smoking_allowed ? 'Ja' : 'Nei'}</div>
        </div>
      </div>

      ${lease.lease_terms ? `
      <div class="section">
        <h2>5. SPESIELLE VILKÅR</h2>
        <p>${lease.lease_terms}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2>6. SIGNERING</h2>
        <p>
          Denne leieavtalen er juridisk bindende når begge parter har signert med BankID.
          Ved signering bekrefter partene at de har lest og akseptert alle vilkår i avtalen.
        </p>
      </div>

      <div class="signature-box">
        <p><strong>BankID-signering</strong></p>
        <p>Dette dokumentet vil bli signert digitalt av begge parter med BankID.</p>
        <p>Signert dokument vil inneholde elektronisk signaturbevis med tidsstempel.</p>
      </div>

      <div class="footer">
        <p>Leieavtale generert via Leily.no</p>
        <p>Dato: ${new Date().toLocaleDateString('no-NO')}</p>
      </div>
    </body>
    </html>
  `;
}
